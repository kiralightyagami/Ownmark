"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthWrapper } from "@/components/auth-wrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { signIn, authClient } from "@/lib/auth-client";

export default function SigninPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign in with better-auth
      const { error } = await signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw new Error(error.message || "Invalid credentials");
      }

      // Fetch user role to redirect
      const session = await authClient.getSession();
      const role = (session?.data?.user as any)?.role;

      
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
      title="Welcome back"
      description="Enter your credentials to access your account"
    >
      <form onSubmit={handleSignin} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-zinc-900/50 border-zinc-800 focus:border-zinc-700 text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white font-medium">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
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
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <div className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-white hover:text-zinc-300 transition-colors font-medium"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthWrapper>
  );
}
