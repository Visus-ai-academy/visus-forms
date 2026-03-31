"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { CreateFormModalSidebar } from "@/components/shared/create-form-modal-sidebar";

interface CreateFormButtonProps {
  label?: string;
  className?: string;
}

export function CreateFormButton({
  label = "Novo Formulário",
  className = "btn-primary-gradient px-5 py-2 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer",
}: CreateFormButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Plus className="h-4 w-4" />
        {label}
      </button>
      <CreateFormModalSidebar open={open} onOpenChange={setOpen} />
    </>
  );
}
