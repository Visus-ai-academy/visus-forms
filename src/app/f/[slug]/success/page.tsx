import { CheckCircle2 } from "lucide-react";

export default function FormSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading text-on-surface">
            Resposta enviada!
          </h1>
          <p className="text-muted-foreground">
            Obrigado por preencher o formulario. Sua resposta foi registrada com sucesso.
          </p>
        </div>
      </div>
    </div>
  );
}
