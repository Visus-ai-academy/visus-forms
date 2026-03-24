"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ClassicRenderer } from "@/components/form-renderer/classic-renderer";
import { TypeformRenderer } from "@/components/form-renderer/typeform-renderer";
import type { FormDefinition } from "@/types/form";

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(new Date().toISOString());

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/submit/${params.slug}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Formulário não encontrado");
          return;
        }
        const { data } = await res.json();
        setForm(data);
      } catch {
        setError("Erro ao carregar formulario");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [params.slug]);

  async function handleSubmit(answers: Record<string, unknown>) {
    const res = await fetch(`/api/submit/${params.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, startedAt }),
    });

    if (!res.ok) {
      const data = await res.json();
      if (data.details) {
        const msgs = Object.values(data.details).flat().join(", ");
        toast.error(msgs);
      } else {
        toast.error(data.error || "Erro ao enviar respostas");
      }
      return;
    }

    // Redirecionar ou ir para success
    if (form?.settings?.redirectUrl) {
      window.location.href = form.settings.redirectUrl;
    } else {
      router.push(`/f/${params.slug}/success`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold font-heading text-on-surface">
            Formulario indisponivel
          </h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const mode = form.settings?.presentationMode ?? "ONE_AT_A_TIME";

  if (mode === "ALL_AT_ONCE") {
    return <ClassicRenderer form={form} onSubmit={handleSubmit} />;
  }

  return <TypeformRenderer form={form} onSubmit={handleSubmit} />;
}
