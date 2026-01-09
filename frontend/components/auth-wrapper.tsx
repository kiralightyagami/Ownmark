import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AuthWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function AuthWrapper({
  children,
  title,
  description,
  className,
}: AuthWrapperProps) {
  return (
    <div className="min-h-screen w-full flex bg-black font-[family-name:var(--font-geist-sans)]">
      {/* Left Side - Visual Showcase */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Animated Orbs/Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[128px]" />

        {/* Logo Area */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image
              src="/icons/Ownmark.svg"
              alt="Ownmark Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-doto)] text-white/90 mt-1">OWNMARK</span>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-5xl font-bold leading-tight">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007DFC] to-blue-400">
              Creator Commerce
            </span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Sell digital assets directly to your audience. No intermediaries, instant payouts, and verifiable ownership on Solana.
          </p>
          
          <div className="grid grid-cols-1 gap-4 mt-8">
            <FeatureItem 
              imageSrc="/tabler-illustrations/dark/shield.png" 
              title="Secure & Trustless" 
              desc="Powered by decentralized escrow smart contracts." 
            />
            <FeatureItem 
              imageSrc="/tabler-illustrations/dark/payment.png" 
              title="Instant Settlements" 
              desc="Receive funds directly to your wallet in seconds." 
            />
            <FeatureItem 
              imageSrc="/tabler-illustrations/dark/fingerprint.png" 
              title="Verifiable Access" 
              desc="Token-gated content ensures true ownership." 
            />
          </div>
        </div>

        {/* Footer Area */}
        <div className="relative z-10 text-sm text-zinc-500">
          © {new Date().getFullYear()} Ownmark Inc. Built on Solana.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative overflow-hidden">
        {/* Subtle background for right side - Minimal & Clean */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black -z-10" />

        <div className={cn("w-full max-w-sm space-y-6 z-10", className)}>
        {/* Logo Centered above Form */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative w-8 h-8">
            <Image
              src="/icons/Ownmark.svg"
              alt="Ownmark Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
            <span className="text-2xl font-bold tracking-[0.2em] font-[family-name:var(--font-doto)] text-white pt-1">
              OWNMARK
            </span>
        </div>

        <p className="text-center text-zinc-400 text-md font-medium tracking-[0.2em] uppercase">
          Create it. Own it. Ship it.
        </p>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white font-[family-name:var(--font-geist-sans)]">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-zinc-400 font-[family-name:var(--font-geist-sans)]">{description}</p>
            )}
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ imageSrc, title, desc }: { imageSrc: string, title: string, desc: string }) {
  return (
    <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm transition-all hover:bg-white/10 group">
      <div className="relative w-20 h-20 shrink-0">
        <Image 
          src={imageSrc} 
          alt={title} 
          fill 
          className="object-contain opacity-90 group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div>
        <h3 className="font-bold text-white text-xl mb-1">{title}</h3>
        <p className="text-base text-zinc-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
