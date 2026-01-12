"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Loader2, Link as LinkIcon, DollarSign, FileText, Image as ImageIcon, Package, ChevronUp, ChevronDown, Zap } from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAccessMintProgram } from "@/lib/programs/use-access-mint";
import { useDistributionProgram } from "@/lib/programs/use-distribution";
import { PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

interface CreateProductFormProps {
  onSuccess?: () => void;
}

export function CreateProductForm({ onSuccess }: CreateProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [initializeOnChain, setInitializeOnChain] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const { publicKey, connected } = useWallet();
  const { program: accessMintProgram, provider: accessMintProvider } = useAccessMintProgram();
  const { program: distributionProgram, provider: distributionProvider } = useDistributionProgram();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    gdriveLink: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handlePriceChange = (increment: number) => {
    setFormData(prev => {
      const current = parseFloat(prev.amount) || 0;
      
      const newValue = Math.max(0, current + increment);
      return { ...prev, amount: newValue.toFixed(2) };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // todo, upload to storage (S3/R2) here
      // For now, create a local preview URL
      const url = URL.createObjectURL(file);
      setCoverImage(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create product in database
      const response = await axios.post("/api/product", {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.amount),
        coverImage: coverImage,
        gdriveLink: formData.gdriveLink,
      });

      const productId = response.data.product.id;

      // 2. Initialize on blockchain if requested and wallet is connected
      if (initializeOnChain && connected && publicKey && accessMintProgram && distributionProgram) {
        setInitLoading(true);
        try {
          // Get initialization parameters from backend API
          const initResponse = await axios.post("/api/product/initialize", {
            productId,
          });
          const { accessMint, distribution } = initResponse.data.params;

          // Ensure we use the creator from backend (must match wallet address in database)
          const creatorPublicKey = new PublicKey(accessMint.creator);
          
          // Verify connected wallet matches the creator
          if (!publicKey!.equals(creatorPublicKey)) {
            throw new Error("Connected wallet does not match the product creator. Please connect the correct wallet.");
          }

          // Ensure contentId is exactly 32 bytes
          const contentIdBuffer = Buffer.from(accessMint.contentId);
          if (contentIdBuffer.length !== 32) {
            throw new Error(`Content ID must be exactly 32 bytes, got ${contentIdBuffer.length}`);
          }

          // Create mint keypair - Anchor will create the account automatically
          const mintKeypair = Keypair.generate();
          const mintAuthorityPda = new PublicKey(accessMint.mintAuthority || "");

          // Initialize Access Mint - Anchor's init constraint will handle mint account creation
          const accessMintTx = await accessMintProgram.methods
            .initializeMint(
              Array.from(contentIdBuffer), // Convert to array for Anchor
              new anchor.BN(accessMint.seed)
            )
            .accounts({
              creator: creatorPublicKey,
              accessMintState: new PublicKey(accessMint.accessMintState),
              mint: mintKeypair.publicKey,
              mintAuthority: mintAuthorityPda,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([mintKeypair])
            .rpc();

          // Initialize Distribution - use same contentId and creator
          const distributionContentId = Buffer.from(distribution.contentId);
          if (distributionContentId.length !== 32) {
            throw new Error(`Distribution content ID must be exactly 32 bytes, got ${distributionContentId.length}`);
          }

          const distributionTx = await distributionProgram.methods
            .initializeSplit(
              Array.from(distributionContentId), // Convert to array for Anchor
              distribution.platformFeeBps,
              [], // No collaborators for now
              new anchor.BN(distribution.seed)
            )
            .accounts({
              creator: creatorPublicKey, // Use same creator as Access Mint
              platformTreasury: new PublicKey(distribution.platformTreasury),
              splitState: new PublicKey(distribution.splitState),
              systemProgram: SystemProgram.programId,
            })
            .rpc();

          // Confirm initialization in database
          await axios.post("/api/product/confirm-initialization", {
            productId,
            accessMintAddress: mintKeypair.publicKey.toString(),
            splitStateAddress: distribution.splitState,
            txSignature: accessMintTx,
          });

          alert("Product created and initialized on blockchain successfully!");
          } catch (initError: unknown) {
          console.error("Failed to initialize on blockchain:", initError);
          alert(
            `Product created but blockchain initialization failed: ${initError instanceof Error ? initError.message : String(initError)}. You can initialize it later from the dashboard.`
          );
        } finally {
          setInitLoading(false);
        }
      } else if (initializeOnChain && (!connected || !publicKey)) {
        alert("Please connect your wallet to initialize on blockchain.");
      } else if (initializeOnChain && (!accessMintProgram || !distributionProgram)) {
        alert("Blockchain programs not available. Please try again later.");
      }

      // Success - reset form
      setFormData({ name: "", description: "", amount: "", gdriveLink: "" });
      setCoverImage(null);
      setInitializeOnChain(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback to reload if no callback provided
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to create product", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || "Failed to create product");
      } else {
        alert(error instanceof Error ? error.message : "Failed to create product");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-800 text-white">
      <CardHeader className="cursor-move drag-handle">
        <CardTitle className="text-xl font-bold">Create New Product</CardTitle>
        <CardDescription className="text-zinc-400">
          List your digital asset for sale.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="cover" className="text-zinc-200 font-medium">Cover Image</Label>
            <div className="border-2 border-dashed border-zinc-800 rounded-xl p-4 transition-colors hover:border-[#007DFC]/50 bg-zinc-900/50 text-center">
              <input 
                type="file" 
                id="cover" 
                accept="image/*"
                className="hidden" 
                onChange={handleImageUpload}
              />
              <label htmlFor="cover" className="cursor-pointer block w-full h-full">
                {coverImage ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image 
                      src={coverImage} 
                      alt="Cover preview" 
                      fill 
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium flex items-center">
                        <Upload className="mr-2 h-4 w-4" /> Change Image
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-zinc-400">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                      <ImageIcon className="h-6 w-6 text-zinc-500" />
                    </div>
                    <span className="text-sm font-medium text-white">Click to upload cover</span>
                    <span className="text-xs text-zinc-500 mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-200 font-medium">Product Name</Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="name"
                placeholder="e.g. Ultimate 3D Asset Pack"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-zinc-900 border-zinc-800 pl-10 text-white placeholder:text-zinc-600 focus:border-[#007DFC] focus:ring-[#007DFC]/20"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-200 font-medium">Description</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Textarea
                id="description"
                placeholder="Describe your product..."
                value={formData.description}
                onChange={handleChange}
                required
                className="bg-zinc-900 border-zinc-800 pl-10 min-h-[100px] text-white placeholder:text-zinc-600 focus:border-[#007DFC] focus:ring-[#007DFC]/20 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-zinc-200 font-medium">Price (SOL)</Label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">◎</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.5"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="bg-zinc-900 border-zinc-800 pl-8 pr-12 text-white placeholder:text-zinc-600 focus:border-[#007DFC] focus:ring-[#007DFC]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute right-1 top-1 bottom-1 flex flex-col w-6 gap-0.5 my-0.5">
                  <button 
                    type="button"
                    onClick={() => handlePriceChange(0.1)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-sm flex items-center justify-center transition-colors"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handlePriceChange(-0.1)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-sm flex items-center justify-center transition-colors"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Google Drive Link */}
            <div className="space-y-2">
              <Label htmlFor="gdriveLink" className="text-zinc-200 font-medium">Google Drive Link</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  id="gdriveLink"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formData.gdriveLink}
                  onChange={handleChange}
                  required
                  className="bg-zinc-900 border-zinc-800 pl-10 text-white placeholder:text-zinc-600 focus:border-[#007DFC] focus:ring-[#007DFC]/20"
                />
              </div>
            </div>
          </div>

          {/* Initialize on blockchain checkbox */}
          <div className="px-6 pb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="initialize"
                checked={initializeOnChain}
                onCheckedChange={(checked) => setInitializeOnChain(checked === true)}
                disabled={!connected}
              />
              <Label htmlFor="initialize" className="text-sm text-zinc-300 cursor-pointer">
                <Zap className="inline h-4 w-4 mr-1" />
                Initialize on blockchain {!connected && "(Connect wallet first)"}
              </Label>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end pt-2">
           <Button 
            type="submit" 
            disabled={loading || initLoading || (!connected && initializeOnChain)}
            className="bg-[#007DFC] hover:bg-[#0063ca] text-white font-semibold shadow-[0_0_20px_-5px_#007DFC]"
          >
            {loading || initLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initLoading ? "Initializing..." : "Creating..."}
              </>
            ) : (
              "Create Product"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
