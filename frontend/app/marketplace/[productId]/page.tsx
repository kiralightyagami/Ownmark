"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Image as ImageIcon, Loader2, Star } from "lucide-react";
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
import { usePaymentEscrowProgram } from "@/lib/programs/use-payment-escrow";
import * as anchor from "@coral-xyz/anchor";

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
  const { program: paymentEscrowProgram, provider: paymentEscrowProvider } = usePaymentEscrowProgram();
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
      // Fetch all products and find the one matching the ID
      const response = await axios.get("/api/product");
      const products = response.data.products || [];
      const found = products.find((p: Product) => p.id === params.productId);
      if (found) {
        setProduct(found);
      } else {
        console.error("Product not found");
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

    if (!paymentEscrowProgram || !paymentEscrowProvider) {
      alert("Payment program not available. Please try again later.");
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
      const contentId = Buffer.from(buyParams.accounts.contentId);

      // Get buyer's associated token account for the access mint
      const accessMint = new PublicKey(buyParams.accounts.accessMint);
      const buyerAccessTokenAccount = await getAssociatedTokenAddress(
        accessMint,
        publicKey
      );

      // Check if escrow already exists and its status
      const escrowState = new PublicKey(buyParams.accounts.escrowState);
      let escrowAccount = null;
      
      try {
        escrowAccount = await paymentEscrowProgram.account.escrowState.fetch(escrowState);
      } catch (error) {
        // Escrow doesn't exist, which is fine - we'll initialize it
        escrowAccount = null;
      }

      const tx = new Transaction();

      // Initialize escrow only if it doesn't exist
      // If it exists, check its status
      if (!escrowAccount) {
        // Escrow doesn't exist, initialize it
        const priceInLamports = buyParams.paymentAmount || buyParams.accounts.price;
        if (!priceInLamports || priceInLamports <= 0) {
          throw new Error("Invalid product price");
        }

        const initializeEscrowIx = await paymentEscrowProgram.methods
          .initializeEscrow(
            Array.from(contentId),
            new anchor.BN(priceInLamports),
            null, // No SPL token payment, use SOL
            new anchor.BN(buyParams.seed)
          )
          .accounts({
            buyer: publicKey,
            creator: new PublicKey(buyParams.accounts.creator),
            escrowState: escrowState,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        
        tx.add(initializeEscrowIx);
      } else {
        // Escrow exists - check if it's in a valid state
        const status = escrowAccount.status;
        if (status && typeof status === 'object') {
          if ('completed' in status) {
            throw new Error("This purchase has already been completed. Please refresh the page.");
          } else if ('cancelled' in status) {
            throw new Error("This escrow was cancelled. Please refresh the page to create a new purchase.");
          }
          // If status is 'initialized', we can proceed with buyAndMint
        }
      }

      // Get accounts for SOL payment
      const creatorPublicKey = new PublicKey(buyParams.accounts.creator);
      const platformTreasury = new PublicKey(buyParams.accounts.platformTreasury);
      const escrowVaultPda = new PublicKey(buyParams.accounts.vault);
      const distributionVaultPda = new PublicKey(buyParams.accounts.distributionVault);

      const buyAndMintIx = await paymentEscrowProgram.methods
        .buyAndMint(new anchor.BN(buyParams.paymentAmount))
        .accounts({
          buyer: publicKey,
          escrowState: escrowState,
          vault: escrowVaultPda, // Escrow vault (derived from escrow_state) - required by constraint
          // For SOL payments, these need to be the actual mutable accounts
          // The program will check if payment_token_mint is None to determine SOL vs SPL
          buyerTokenAccount: publicKey, // Buyer's wallet (mutable for SOL transfer)
          vaultTokenAccount: escrowVaultPda, // Escrow vault PDA (mutable for SOL transfer)
          tokenProgram: SystemProgram.programId, // Not used for SOL, but required
          // Access mint accounts
          accessMintProgram: new PublicKey(buyParams.accounts.accessMintProgram),
          accessMintState: new PublicKey(buyParams.accounts.accessMintState),
          accessMint: accessMint,
          mintAuthority: new PublicKey(buyParams.accounts.mintAuthority),
          buyerAccessTokenAccount: buyerAccessTokenAccount,
          accessTokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          // Distribution accounts
          distributionProgram: new PublicKey(buyParams.accounts.distributionProgram),
          splitState: new PublicKey(buyParams.accounts.splitState),
          distributionVault: distributionVaultPda, // Distribution vault (derived from split_state)
          distributionVaultTokenAccount: distributionVaultPda, // For SOL, same as distribution vault
          platformTreasury: platformTreasury,
          // Additional accounts needed for distribution CPI
          creator: creatorPublicKey,
          paymentTokenMint: SystemProgram.programId, // SOL payment (System::id())
          // For SOL payments, these are the actual wallet accounts (mutable)
          creatorTokenAccount: creatorPublicKey, // Creator's wallet (mutable for SOL transfer)
          platformTreasuryTokenAccount: platformTreasury, // Platform treasury (mutable for SOL transfer)
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts([]) // No collaborators for now
        .instruction();

      tx.add(buyAndMintIx);

      // Send and confirm transaction
      const signature = await paymentEscrowProvider.sendAndConfirm(tx);

      alert(`Purchase successful! Transaction: ${signature}`);
      
      // Refresh the page or redirect to library
      router.push("/dashboard/library");
    } catch (error) {
      console.error("Purchase error:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || "Failed to purchase product");
      } else if (error instanceof Error) {
        alert(`Purchase failed: ${error.message}`);
      } else {
        alert("Failed to purchase product. Please try again.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  // Determine if the connected wallet is the product creator
  const isCreator =
    connected &&
    product?.creator.walletAddress &&
    publicKey &&
    product.creator.walletAddress.toLowerCase() === publicKey.toBase58().toLowerCase();

  if (loading) {
    return (
      <div className="container mx-auto py-12 bg-black min-h-screen">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#007DFC]" />
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-12 px-4 bg-black min-h-screen">
        <div className="text-center text-white space-y-4">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <p className="text-gray-400">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/marketplace">
            <Button className="bg-[#007DFC] hover:bg-[#0063ca] text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Parse description into structured format
  const descriptionText = product.description || '';
  const descriptionLines = descriptionText.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Find intro line (usually contains "contains", "zip", or is the first sentence)
  const introLine = descriptionLines.find(line => 
    line.toLowerCase().includes('contains') || 
    line.toLowerCase().includes('zip file') ||
    line.toLowerCase().includes('this')
  ) || (descriptionLines[0] && descriptionLines[0].length > 20 ? descriptionLines[0] : '');
  
  // Extract list items (lines that are short and don't contain common phrases)
  const listItems = descriptionLines.filter(line => {
    const lower = line.toLowerCase();
    return line.length < 50 && 
           !lower.includes('hello') && 
           !lower.includes('contains') &&
           !lower.includes('p.s.') &&
           !lower.includes('don\'t forget') &&
           !lower.includes('rate') &&
           !lower.includes('follow') &&
           !lower.includes('free') &&
           !lower.includes('type') &&
           !lower.includes('zero') &&
           !lower.includes('price') &&
           !lower.includes('enjoy') &&
           !lower.includes('package') &&
           !lower.includes('and this');
  }).slice(0, 10);
  
  // If no list items found, try splitting by periods or commas
  const fallbackItems = descriptionText.split(/[.,;]/)
    .map(item => item.trim())
    .filter(item => item.length > 0 && item.length < 50 && !item.toLowerCase().includes('hello'))
    .slice(0, 5);

  return (
    <div className="bg-black min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href={isCreator ? "/dashboard/creator" : "/marketplace"}>
          <Button variant="ghost" className="mb-6 text-white hover:text-white hover:bg-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {isCreator ? "Creator Dashboard" : "Marketplace"}
          </Button>
        </Link>

        {/* Product Image */}
        <div className="relative w-full h-64 md:h-96 mb-6 rounded-lg overflow-hidden bg-black border-2 border-white">
          {product.coverImage ? (
            <Image
              src={product.coverImage}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-24 w-24 text-gray-600" />
            </div>
          )}
        </div>

        {/* Main Product Container with Border */}
        <div className="border border-gray-400 bg-white rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
            {/* Left Column - Product Content */}
            <div className="lg:col-span-3 p-6 space-y-4">
              {/* Product Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-black">
                {product.name}
              </h1>

              {/* Horizontal Line */}
              <div className="border-t border-black"></div>

              {/* Metadata Bar */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Price Tag */}
                <div 
                  className="relative bg-[#007DFC] text-white font-bold text-sm px-3 py-1.5 pr-5 inline-block"
                  style={{
                    clipPath: 'polygon(0% 0%, 100% 0%, 85% 50%, 100% 100%, 0% 100%)'
                  }}
                >
                  ${product.price}+
                </div>

                {/* Ratings */}
                <div className="flex items-center gap-1 ml-auto">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-black text-black" />
                    ))}
                  </div>
                  <span className="text-black font-bold ml-1">232 ratings</span>
                </div>
              </div>

              {/* Horizontal Line */}
              <div className="border-t border-black"></div>

              {/* Description Section */}
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-bold text-black">Hello there!</h2>
                {introLine && (
                  <p className="text-black italic">
                    {introLine}
                  </p>
                )}
                <div className="space-y-1 pl-4">
                  {(listItems.length > 0 ? listItems : fallbackItems).map((item, idx) => (
                    <div key={idx} className="text-black font-bold">
                      {item.trim()}
                    </div>
                  ))}
                </div>
                <p className="text-black font-bold">
                  P.S.: Don't forget to rate and follow for more value.
                </p>
                <p className="text-black">
                  And this pack is free. Just type the 0 (zero number) on the price. After you can enjoy yourself with the package).
                </p>
              </div>
            </div>

            {/* Right Column - Buy Button */}
            <div className="lg:col-span-1 border-l border-black p-6">
              {isCreator ? (
                <div className="w-full text-center text-black font-semibold">
                  You are the creator of this product.
                </div>
              ) : !connected ? (
                <div className="w-full">
                  <WalletConnectButton />
                </div>
              ) : product.accessMintAddress && product.splitStateAddress ? (
                <Button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full bg-white hover:bg-gray-100 text-black text-lg py-6 font-bold border-2 border-black"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Buy
                    </>
                  )}
                </Button>
              ) : (
                <Button disabled className="w-full bg-gray-200 text-gray-500 text-lg py-6 border-2 border-gray-400">
                  Product Not Available
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
