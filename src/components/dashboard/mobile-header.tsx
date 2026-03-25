"use client";

import { FileText, Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Sidebar } from "./sidebar";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Header mobile */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface-container-low border-b border-surface-container-low">
        <div className="flex items-center gap-2">
          <img src="/LOGOTIPO_V1.png" alt="Visus" className="h-7 object-contain" />
          <span className="text-sm font-bold tracking-tight text-on-surface font-heading">
            Visus-Forms
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="rounded-xl text-on-surface/60 hover:bg-surface-container-lowest"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay + Sidebar mobile */}
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 z-50" onClick={() => setOpen(false)}>
            <Sidebar />
          </div>
        </>
      )}
    </>
  );
}
