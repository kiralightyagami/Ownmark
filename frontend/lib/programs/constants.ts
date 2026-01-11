import { PublicKey } from "@solana/web3.js";

// Program IDs from Anchor.toml files
export const ACCESS_MINT_PROGRAM_ID = new PublicKey("FmqUGBhdGHK9iPWbweoBXFBU2BY9g6C5ncfQstbXpDf6");
export const PAYMENT_ESCROW_PROGRAM_ID = new PublicKey("2T3AsDRbQdpLWaxEU5vbFXuzRHQnq7JT3wCQCmvdiKmJ");
export const DISTRIBUTION_PROGRAM_ID = new PublicKey("Czw384wkAHcNT7QpJC4y1DZ7LrKjyqsgTu8gHhsXtUpK");

// Platform treasury address (can be set via environment variable)
export const PLATFORM_TREASURY = new PublicKey(
  process.env.NEXT_PUBLIC_PLATFORM_TREASURY || "11111111111111111111111111111111"
);

// Platform fee in basis points (default 2% = 200 bps)
export const DEFAULT_PLATFORM_FEE_BPS = 200;
