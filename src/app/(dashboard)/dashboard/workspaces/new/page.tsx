"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewWorkspacePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Erro ao criar workspace");
        return;
      }

      const { data: workspace } = await res.json();
      toast.success("Workspace criado com sucesso!");
      router.push(`/dashboard/workspaces/${workspace.id}`);
    } catch {
      toast.error("Erro ao criar workspace");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest shadow-ambient p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold font-heading text-on-surface">Novo Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie um workspace para organizar seus formularios
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nome
            </Label>
            <Input
              id="name"
              placeholder="Meu Workspace"
              className="rounded-lg bg-surface-container-low border-0 h-11"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descricao (opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva o workspace..."
              className="rounded-lg bg-surface-container-low border-0"
              {...register("description")}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary-gradient w-full py-3 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar Workspace
          </button>
        </form>
      </div>
    </div>
  );
}
