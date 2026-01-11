import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

/**
 * API route to confirm product initialization after blockchain transaction
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, accessMintAddress, splitStateAddress, txSignature } = await req.json();

    if (!productId || !accessMintAddress || !splitStateAddress) {
      return NextResponse.json(
        { error: "Product ID, access mint address, and split state address are required" },
        { status: 400 }
      );
    }

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Update product with blockchain addresses
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        accessMintAddress,
        splitStateAddress,
      },
    });

    // Convert BigInt to string for JSON serialization
    const productResponse = {
      ...updated,
      seed: updated.seed?.toString() ?? null,
    };

    return NextResponse.json({
      success: true,
      product: productResponse,
      txSignature,
    });
  } catch (error) {
    console.error("Failed to confirm initialization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
