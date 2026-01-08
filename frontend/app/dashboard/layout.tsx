"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="h-full relative bg-black">
      {/* Desktop Sidebar */}
      <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-80 bg-zinc-900">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden flex items-center p-4 border-b border-zinc-800 bg-zinc-950">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-zinc-950 border-zinc-800 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="ml-4 flex items-center gap-2">
          <div className="relative w-6 h-6">
            <Image
              src="/icons/Ownmark.svg"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-bold text-white tracking-widest font-[family-name:var(--font-press-start-2p)] text-xs pt-1">
            OWNMARK
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:pl-64 min-h-screen bg-black">
        <div className="h-full p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
