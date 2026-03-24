"use client";

import {
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const mainNav = [
  { name: "Workspaces", href: "/dashboard", icon: LayoutDashboard },
  { name: "Formulários", href: "/dashboard/forms", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-full w-[220px] flex-col bg-surface-container-low">
      {/* Logo */}
      <div className="px-5 pt-6 pb-8 flex justify-center">
        <img src="/LOGOTIPO_V1.png" alt="Visus" className="h-16 object-contain" />
      </div>

      {/* Nav principal */}
      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-2">
          {mainNav.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard" || pathname.startsWith("/dashboard/workspaces")
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-fixed text-primary"
                    : "text-on-surface/60 hover:bg-surface-container-lowest hover:text-on-surface"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-primary" : "")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Botao criar form */}
        <div className="mt-6 px-1">
          <Link href="/dashboard/workspaces">
            <button className="btn-primary-gradient flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold">
              <Plus className="h-4 w-4" />
              Criar Formulario
            </button>
          </Link>
        </div>
      </ScrollArea>

      {/* Usuário */}
      <div className="flex items-center gap-3 px-5 py-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-surface-container-high text-xs font-medium">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">
            {session?.user?.name || "Usuario"}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-on-surface/40 hover:text-on-surface/70 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
