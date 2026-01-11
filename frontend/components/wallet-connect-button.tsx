"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function WalletConnectButton() {
  return (
    <div className="wallet-adapter-button-trigger">
      <WalletMultiButton />
    </div>
  );
}
