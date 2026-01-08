"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthWrapper } from "@/components/auth-wrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, User, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signUp, signIn } from "@/lib/auth-client";

type RoleOption = "BUYER" | "CREATOR";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleOption>("BUYER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create User with better-auth
      const { data: signupData, error: signupError } = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (signupError) {
        throw new Error(signupError.message || "Sign up failed");
      }

      // 2. Set Role
      const roleRes = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, role }),
      });

      if (!roleRes.ok) {
        const roleData = await roleRes.json();
        throw new Error(roleData.error || "Failed to set role");
      }

      // 3. Auto Sign In with better-auth
      const { error: signinError } = await signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (signinError) {
        throw new Error(signinError.message || "Auto sign-in failed");
      }

      // Redirect to home
      router.push("/");
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
