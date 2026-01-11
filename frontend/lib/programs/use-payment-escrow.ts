"use client";

import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useConnection, useWallet, type AnchorWallet } from "@solana/wallet-adapter-react";
import { PAYMENT_ESCROW_PROGRAM_ID } from "./constants";

/**
 * Hook to get Payment Escrow program instance
 */
export function usePaymentEscrowProgram() {
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

    // TODO: Replace with actual IDL import when generated
    // const idl = require("../../payment-escrow/target/idl/payment_escrow.json");
    // return new Program(idl as Idl, provider);

    return null;
  }, [provider]);

  return { program, provider, programId: PAYMENT_ESCROW_PROGRAM_ID };
}
