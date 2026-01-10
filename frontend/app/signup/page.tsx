"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthWrapper } from "@/components/auth-wrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, User, ShoppingBag, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signUp, signIn } from "@/lib/auth-client";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

type RoleOption = "BUYER" | "CREATOR";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleOption>("BUYER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    walletAddress: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleWalletConnect = () => {
    setVisible(true);
  };

  const handleWalletDisconnect = async () => {
    try {
      await disconnect();
      setFormData((prev) => ({ ...prev, walletAddress: "" }));
    } catch (err) {
      console.error("Wallet disconnection failed:", err);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate Creator has wallet
      if (role === "CREATOR" && !publicKey && !formData.walletAddress) {
        throw new Error("Creators must connect a wallet or provide wallet address");
      }

      const walletToUse = connected && publicKey ? publicKey.toBase58() : formData.walletAddress;

      // 1. Create User with better-auth
      const { data: signupData, error: signupError } = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (signupError) {
        throw new Error(signupError.message || "Sign up failed");
      }

      // 2. Set Role and Wallet
      await axios.post("/api/user/role", {
        email: formData.email, 
        role,
        walletAddress: role === "CREATOR" ? walletToUse : null
      });

      // 3. Auto Sign In with better-auth
      const { error: signinError } = await signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (signinError) {
        throw new Error(signinError.message || "Auto sign-in failed");
      }

  
      if (role === "CREATOR") {
        router.push("/dashboard/creator");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper
      title="Create an account"
      description="Enter your details to get started"
    >
      <form onSubmit={handleSignup} className="space-y-4">
        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("BUYER")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200",
              role === "BUYER"
                ? "bg-white text-black border-white"
                : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <ShoppingBag className="w-5 h-5 mb-2" />
            <span className="text-sm font-medium">Buyer</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("CREATOR")}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200",
              role === "CREATOR"
                ? "bg-white text-black border-white"
                : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <User className="w-5 h-5 mb-2" />
            <span className="text-sm font-medium">Creator</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-100 font-medium">Full Name</Label>
            <Input
              id="name"
              placeholder="Ownmark"
              value={formData.name}
              onChange={handleChange}
              required
              className="bg-zinc-900/50 border-zinc-800 focus:border-zinc-700 text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ownmark@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-zinc-900/50 border-zinc-800 focus:border-zinc-700 text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-100 font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="bg-zinc-900/50 border-zinc-800 focus:border-zinc-700 text-white placeholder:text-zinc-600"
            />
          </div>

          {/* Wallet Address for Creators */}
          {role === "CREATOR" && (
            <div className="space-y-2">
              <Label htmlFor="walletAddress" className="text-white font-medium">
                Solana Wallet Address {connected && publicKey && <span className="text-green-400 text-xs">(Connected ✓)</span>}
              </Label>
              
              {!connected ? (
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={handleWalletConnect}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                  </Button>
                  <div className="relative flex items-center justify-center text-xs text-zinc-500">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <div className="relative bg-black px-2">or enter manually</div>
                  </div>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="walletAddress"
                      placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                      value={formData.walletAddress}
                      onChange={handleChange}
                      className="bg-zinc-900/50 border-zinc-800 focus:border-zinc-700 text-white placeholder:text-zinc-600 pl-10"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white truncate">
                    {publicKey?.toBase58()}
                  </div>
                  <Button
                    type="button"
                    onClick={handleWalletDisconnect}
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Disconnect
                  </Button>
                </div>
              )}
              <p className="text-xs text-zinc-500">This wallet will receive payments for your products.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-[#007DFC] hover:bg-[#0063ca] text-white mt-6 transition-all duration-200 shadow-[0_0_20px_-5px_#007DFC]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <div className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-white hover:text-zinc-300 transition-colors font-medium"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthWrapper>
  );
}
