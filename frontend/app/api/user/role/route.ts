import prisma from "@/lib/db";
import { NextResponse } from "next/server";

// Valid role types
const VALID_ROLES = ["BUYER", "CREATOR", "ADMIN"] as const;

export async function POST(req: Request) {
  try {
    const { email, role, walletAddress } = await req.json();

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be BUYER, CREATOR, or ADMIN" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate wallet address for creators
    if (role === "CREATOR" && walletAddress) {
      // Basic Solana address validation (44 characters, base58)
      if (walletAddress.length < 32 || walletAddress.length > 44) {
        return NextResponse.json(
          { error: "Invalid Solana wallet address" },
          { status: 400 }
        );
      }
    }

    // Update user role and wallet address
    const result = await prisma.user.updateMany({
      where: { email },
      data: { 
        role,
        ...(walletAddress && { walletAddress })
      },
    });

    // Check if user was found and updated
    if (result.count === 0) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `Role updated to ${role}${walletAddress ? ' with wallet connected' : ''}` 
    });
  } catch (error) {
    console.error("Failed to update role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
