"use client";

import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useConnection, useWallet, type AnchorWallet } from "@solana/wallet-adapter-react";
import { DISTRIBUTION_PROGRAM_ID } from "./constants";

/**
 * Hook to get Distribution program instance
 */
export function useDistributionProgram() {
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
      const idl = require("../../../distribution/target/idl/distribution.json");
      return new Program(idl as Idl, provider);
    } catch (error) {
      console.warn("Failed to load Distribution IDL:", error);
      return null;
    }
  }, [provider]);

  return { program, provider, programId: DISTRIBUTION_PROGRAM_ID };
}
