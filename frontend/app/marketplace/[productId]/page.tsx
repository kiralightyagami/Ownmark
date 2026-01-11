"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { PAYMENT_ESCROW_PROGRAM_ID, ACCESS_MINT_PROGRAM_ID, DISTRIBUTION_PROGRAM_ID } from "@/lib/programs/constants";
import { deriveEscrowVault } from "@/lib/programs/pdas";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  coverImage: string | null;
  gdriveLink: string;
  creator: {
    id: string;
    name: string;
    image: string | null;
    walletAddress: string | null;
  };
  accessMintAddress: string | null;
  splitStateAddress: string | null;
  contentId: string | null;
  seed: bigint | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (params.productId) {
      fetchProduct();
    }
  }, [params.productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get("/api/product");
      const products = response.data.products || [];
      const found = products.find((p: Product) => p.id === params.productId);
      if (found) {
        setProduct(found);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!connected || !publicKey || !product) {
      return;
    }

    if (!product.accessMintAddress || !product.splitStateAddress || !product.contentId) {
      alert("Product not fully initialized on blockchain");
      return;
    }

    setPurchasing(true);

    try {
      // Get buy parameters from API
      const response = await axios.post("/api/product/buy", {
        productId: product.id,
        buyerWalletAddress: publicKey.toString(),
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to prepare purchase");
      }

      const { params: buyParams } = response.data;

      // TODO: Call blockchain program here
      // For now, show a message that this requires IDL files to be generated
      alert(
        "Purchase functionality requires program IDL files to be generated.\n" +
        "Please build the Anchor programs first:\n" +
        "cd access-mint && anchor build\n" +
        "cd ../payment-escrow && anchor build\n" +
        "cd ../distribution && anchor build\n" +
        "\nThen import the IDL files in the program hooks."
      );

      // Once IDL files are available, uncomment and implement:
      /*
      const program = new Program(IDL, new PublicKey(buyParams.programId), provider);
      const tx = await program.methods
        .buyAndMint(new BN(buyParams.paymentAmount))
        .accounts({
          buyer: publicKey,
          escrowState: new PublicKey(buyParams.accounts.escrowState),
          // ... other accounts
        })
        .rpc();
      */

    } catch (error) {
      console.error("Purchase error:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || "Failed to purchase product");
      } else {
        alert(error instanceof Error ? error.message : "Failed to purchase product");
      }
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center text-white">Product not found</div>
        <Link href="/marketplace">
          <Button className="mt-4">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <Link href="/marketplace">
        <Button variant="ghost" className="mb-6 text-white hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative aspect-square w-full bg-zinc-900 rounded-lg overflow-hidden">
          {product.coverImage ? (
            <Image
              src={product.coverImage}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-24 w-24 text-zinc-600" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
            <p className="text-2xl font-bold text-[#007DFC] mb-4">
              {product.price} SOL
            </p>
            <p className="text-zinc-400 mb-4">
              by {product.creator.name}
            </p>
          </div>

          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 whitespace-pre-wrap">
                {product.description}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {!connected ? (
              <div className="space-y-2">
                <p className="text-zinc-400 text-sm">Connect your wallet to purchase</p>
                <WalletConnectButton />
              </div>
            ) : product.accessMintAddress && product.splitStateAddress ? (
              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full bg-[#007DFC] hover:bg-[#0063ca] text-white text-lg py-6"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Purchase for {product.price} SOL
                  </>
                )}
              </Button>
            ) : (
              <Button disabled className="w-full bg-zinc-800 text-zinc-500">
                Product Not Available
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
