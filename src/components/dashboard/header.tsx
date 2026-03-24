"use client";

import { Bell, Menu, Search, Settings } from "lucide-react";
import { useSession } from "next-auth/react";

import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Sidebar } from "./sidebar";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="glass-header sticky top-0 z-10 flex h-16 items-center gap-4 px-6">
      {/* Menu mobile */}
      <Sheet>
        <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-xl p-2 text-on-surface/60 hover:bg-surface-container-lowest transition-colors">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[220px] p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Titulo */}
      <div className="flex-1">
        <h1 className="text-xl font-bold tracking-tight text-on-surface font-heading">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Busca */}
      <div className="hidden md:flex items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar workflows..."
            className="h-9 w-64 rounded-lg bg-surface-container-low pl-9 ghost-border"
          />
        </div>
      </div>

      {/* Acoes */}
      <div className="flex items-center gap-2">
        <button className="rounded-xl p-2 text-on-surface/50 hover:bg-surface-container-lowest transition-colors">
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <button className="rounded-xl p-2 text-on-surface/50 hover:bg-surface-container-lowest transition-colors">
          <Settings className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
