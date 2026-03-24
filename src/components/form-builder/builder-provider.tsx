"use client";

import { useEffect } from "react";

import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { FormDefinition } from "@/types/form";

interface BuilderProviderProps {
  form: FormDefinition;
  children: React.ReactNode;
}

export function BuilderProvider({ form, children }: BuilderProviderProps) {
  const setForm = useFormBuilderStore((s) => s.setForm);

  useEffect(() => {
    setForm(form);
  }, [form, setForm]);

  return <>{children}</>;
}
