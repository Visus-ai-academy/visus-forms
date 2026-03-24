"use client";

import { FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Senha e obrigatoria"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginValues) {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Email ou senha incorretos");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-surface-container-lowest shadow-ambient p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <FileText className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-on-surface">Visus Forms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your credentials to continue
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            className="rounded-lg bg-surface-container-low border-0 h-11 focus:border-b-2 focus:border-b-primary"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Senha
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            className="rounded-lg bg-surface-container-low border-0 h-11 focus:border-b-2 focus:border-b-primary"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary-gradient w-full py-3 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Nao tem uma conta?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
