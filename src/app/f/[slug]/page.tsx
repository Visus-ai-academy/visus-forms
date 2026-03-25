"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ClassicRenderer } from "@/components/form-renderer/classic-renderer";
import {
  IdentificationScreen,
  type RespondentData,
} from "@/components/form-renderer/identification-screen";
import { TypeformRenderer } from "@/components/form-renderer/typeform-renderer";
import type { FormDefinition } from "@/types/form";

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(new Date().toISOString());
  const [respondent, setRespondent] = useState<RespondentData | null>(null);
  const [identificationDone, setIdentificationDone] = useState(false);

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

        // Se for anônimo, pular identificação
        if (!data.settings?.identificationMode || data.settings.identificationMode === "anonymous") {
          setIdentificationDone(true);
        }
      } catch {
        setError("Erro ao carregar formulário");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [params.slug]);

  function handleIdentification(data: RespondentData) {
    setRespondent(data);
    setIdentificationDone(true);
  }

  async function handleSubmit(answers: Record<string, unknown>) {
    const res = await fetch(`/api/submit/${params.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers,
        startedAt,
        respondent: respondent ?? undefined,
      }),
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

    if (form?.settings?.redirectUrl) {
      // Validar protocolo para prevenir Open Redirect (ex: javascript: URLs)
      try {
        const redirectTarget = new URL(form.settings.redirectUrl);
        if (
          redirectTarget.protocol === "https:" ||
          redirectTarget.protocol === "http:"
        ) {
          window.location.href = form.settings.redirectUrl;
        } else {
          router.push(`/f/${params.slug}/success`);
        }
      } catch {
        // URL inválida - redirecionar para página de sucesso padrão
        router.push(`/f/${params.slug}/success`);
      }
    } else {
      router.push(`/f/${params.slug}/success`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-full max-w-lg px-6 space-y-8">
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-2/5 bg-gray-200 rounded animate-pulse" />
              <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="h-11 w-32 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold font-heading text-on-surface">
            Formulário indisponível
          </h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Mostrar tela de identificação se necessário
  if (!identificationDone) {
    return (
      <IdentificationScreen form={form} onContinue={handleIdentification} />
    );
  }

  const mode = form.settings?.presentationMode ?? "ONE_AT_A_TIME";

  if (mode === "ALL_AT_ONCE") {
    return <ClassicRenderer form={form} onSubmit={handleSubmit} />;
  }

  return <TypeformRenderer form={form} onSubmit={handleSubmit} />;
}
