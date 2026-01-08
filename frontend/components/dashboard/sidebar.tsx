"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Compass,
  Library,
  Settings,
  LogOut,
  User,
  ShoppingBag,
  Menu,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

import Image from "next/image";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;


const FALLBACK_AVATARS = [
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_1.png",
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_2.png",
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_3.png",
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_4.png",
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_5.png",
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_6.png",
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_12.png",
  "https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_16.png",
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };


  const avatarIndex = session?.user?.email ? session.user.email.length % FALLBACK_AVATARS.length : 0;
  const fallbackAvatar = FALLBACK_AVATARS[avatarIndex];

  const routes = [
    {
      label: "Discover",
      icon: Compass,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Library",
      icon: Library,
      href: "/dashboard/library",
      active: pathname === "/dashboard/library",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
  ];

  return (
    <div className={cn("pb-12 min-h-screen w-64 bg-zinc-950 border-r border-zinc-800", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-4 mb-8">
            <div className="relative w-8 h-8">
              <Image
                src="/icons/Ownmark.svg"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <h2 className="text-lg font-bold tracking-widest font-[family-name:var(--font-press-start-2p)] text-white pt-1">
              OWNMARK
            </h2>
          </div>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                  route.active ? "text-white bg-white/10" : "text-zinc-400"
                )}
              >
                <div className="flex items-center flex-1">
                  <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-white" : "text-zinc-400")} />
                  {route.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="absolute bottom-4 left-0 w-full px-3">
        <div className="space-y-1">
          <div className="px-4 py-2 flex items-center gap-3 mb-2">
            <Avatar className="h-9 w-9 border border-zinc-700 bg-zinc-800">
              <AvatarImage 
                src={session?.user?.image || fallbackAvatar} 
                className="object-cover"
              />
              <AvatarFallback className="bg-zinc-800 text-zinc-400">
                {session?.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">
                {session?.user?.name || "User"}
              </span>
              <span className="text-xs text-zinc-500 truncate">
                {session?.user?.email || "View Profile"}
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
