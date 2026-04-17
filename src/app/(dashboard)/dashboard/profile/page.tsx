"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Senha deve ter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "Senha deve ter pelo menos um número"),
    confirmPassword: z.string().min(1, "Confirmação é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordValues) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        toast.error(body.error || "Erro ao alterar senha");
        return;
      }

      toast.success("Senha alterada com sucesso!");
      reset();
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="px-8 py-8 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard" />}>Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Perfil</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-xl font-bold tracking-tight text-on-surface font-heading">Perfil</h1>

      <div className="max-w-md">
        <div className="rounded-2xl bg-surface-container-lowest p-6 space-y-5">
          <h2 className="text-base font-bold font-heading text-on-surface">Alterar Senha</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="currentPassword"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Senha Atual
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="********"
                className="rounded-lg bg-surface-container-low border-0 h-11 focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-b-2 focus:border-b-primary"
                {...register("currentPassword")}
              />
              {errors.currentPassword && (
                <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Nova Senha
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="********"
                className="rounded-lg bg-surface-container-low border-0 h-11 focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-b-2 focus:border-b-primary"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="********"
                className="rounded-lg bg-surface-container-low border-0 h-11 focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-b-2 focus:border-b-primary"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="btn-primary-gradient w-full py-3 text-sm font-semibold"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
