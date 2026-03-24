"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewWorkflowPage() {
  const router = useRouter();
  const params = useParams<{ workspaceId: string }>();
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
      const res = await fetch(
        `/api/workspaces/${params.workspaceId}/workflows`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Erro ao criar workflow");
        return;
      }

      toast.success("Workflow criado com sucesso!");
      router.push(`/dashboard/workspaces/${params.workspaceId}`);
      router.refresh();
    } catch {
      toast.error("Erro ao criar workflow");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Novo Workflow</CardTitle>
          <CardDescription>
            Crie um workflow para agrupar formularios relacionados
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Ex: Pesquisa de Satisfação"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o workflow..."
                {...register("description")}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Workflow
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
