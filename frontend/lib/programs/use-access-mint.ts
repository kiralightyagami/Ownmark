"use client";

import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useConnection, useWallet, type AnchorWallet } from "@solana/wallet-adapter-react";
import { ACCESS_MINT_PROGRAM_ID } from "./constants";

// Type definitions for Access Mint program
// These will be replaced with actual IDL types when IDL is generated
export interface AccessMintIdl extends Idl {
  metadata: {
    name: string;
    version: string;
    address: string;
  };
}

/**
 * Hook to get Access Mint program instance
 */
export function useAccessMintProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet || !wallet.publicKey || typeof wallet.signTransaction !== "function" || typeof wallet.signAllTransactions !== "function") {
      return null;
    }

    return new AnchorProvider(connection, wallet as AnchorWallet, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;

    try {
      // Import IDL dynamically - adjust path based on your project structure
      const idl = require("../../../access-mint/target/idl/access_mint.json");
      return new Program(idl as Idl, provider);
    } catch (error) {
      console.warn("Failed to load Access Mint IDL:", error);
      return null;
    }
  }, [provider]);

  return { program, provider, programId: ACCESS_MINT_PROGRAM_ID };
}
