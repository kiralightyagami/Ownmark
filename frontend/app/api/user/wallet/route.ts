import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { PublicKey } from "@solana/web3.js";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate Solana address
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid Solana wallet address" },
        { status: 400 }
      );
    }

    // Update user wallet address
    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletAddress },
    });

    return NextResponse.json({
      success: true,
      message: "Wallet address updated successfully",
    });
  } catch (error) {
    console.error("Failed to update wallet address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
