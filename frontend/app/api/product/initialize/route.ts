import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { PublicKey } from "@solana/web3.js";
import { ACCESS_MINT_PROGRAM_ID, DISTRIBUTION_PROGRAM_ID, DEFAULT_PLATFORM_FEE_BPS, PLATFORM_TREASURY } from "@/lib/programs/constants";
import { deriveAccessMintState, deriveAccessMintAuthority, deriveSplitState, hexToContentId } from "@/lib/programs/pdas";

/**
 * API route to prepare blockchain initialization parameters for a product
 * This is called after product creation to initialize access-mint and distribution programs
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, platformFeeBps } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { creator: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if already initialized
    if (product.accessMintAddress && product.splitStateAddress) {
      return NextResponse.json(
        { error: "Product already initialized on blockchain" },
        { status: 400 }
      );
    }

    // Get creator wallet address
    if (!product.creator.walletAddress) {
      return NextResponse.json(
        { error: "Creator wallet address not set. Please connect your wallet first." },
        { status: 400 }
      );
    }

    const creatorPublicKey = new PublicKey(product.creator.walletAddress);
    const seed = product.seed ? Number(product.seed) : 1;

    // Generate content ID if not exists
    let contentId: Buffer;
    if (product.contentId) {
      contentId = hexToContentId(product.contentId);
    } else {
      // Generate content ID from product ID
      const hash = Buffer.from(product.id);
      contentId = Buffer.alloc(32);
      hash.copy(contentId);
      // Store content ID
      await prisma.product.update({
        where: { id: productId },
        data: { contentId: contentId.toString("hex") },
      });
    }

    // Derive PDAs
    const [accessMintStatePda] = deriveAccessMintState(creatorPublicKey, contentId, seed);
    const [accessMintAuthorityPda] = deriveAccessMintAuthority(creatorPublicKey, contentId, seed);
    const [splitStatePda] = deriveSplitState(creatorPublicKey, contentId, seed);

    const feeBps = platformFeeBps || product.platformFeeBps || DEFAULT_PLATFORM_FEE_BPS;

    // Return initialization parameters
    return NextResponse.json({
      success: true,
      params: {
        // Access Mint initialization params
        accessMint: {
          programId: ACCESS_MINT_PROGRAM_ID.toString(),
          contentId: Array.from(contentId),
          seed: seed,
          accessMintState: accessMintStatePda.toString(),
          creator: creatorPublicKey.toString(),
        },
        // Distribution initialization params
        distribution: {
          programId: DISTRIBUTION_PROGRAM_ID.toString(),
          contentId: Array.from(contentId),
          seed: seed,
          platformFeeBps: feeBps,
          platformTreasury: PLATFORM_TREASURY.toString(),
          splitState: splitStatePda.toString(),
          creator: creatorPublicKey.toString(),
        },
        productId,
        contentId: contentId.toString("hex"),
      },
    });
  } catch (error) {
    console.error("Failed to prepare product initialization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
