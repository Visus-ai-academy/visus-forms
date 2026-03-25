import { CheckCircle2 } from "lucide-react";

import { prisma } from "@/lib/prisma";

const DEFAULT_MESSAGE = "Obrigado por preencher o formulário. Sua resposta foi registrada com sucesso.";

export default async function FormSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const form = await prisma.form.findFirst({
    where: { slug },
    select: {
      title: true,
      settings: {
        select: { confirmationMessage: true },
      },
      theme: {
        select: {
          primaryColor: true,
          backgroundColor: true,
          textColor: true,
          fontFamily: true,
          logoUrl: true,
        },
      },
    },
  });

  const theme = form?.theme;
  const confirmationMessage = form?.settings?.confirmationMessage || DEFAULT_MESSAGE;
  const fontFamily = theme?.fontFamily || "Inter";
  const backgroundColor = theme?.backgroundColor || "#ffffff";
  const textColor = theme?.textColor || "#1f2937";
  const primaryColor = theme?.primaryColor || "#10b981";

  return (
    <div
      className="flex items-center justify-center min-h-screen px-6"
      style={{
        backgroundColor,
        color: textColor,
        fontFamily,
      }}
    >
      <div className="text-center space-y-6 max-w-md">
        {theme?.logoUrl && (
          <img
            src={theme.logoUrl}
            alt="Logo"
            className="h-10 object-contain mx-auto"
          />
        )}
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <CheckCircle2
            className="h-8 w-8"
            style={{ color: primaryColor }}
          />
        </div>
        <div className="space-y-2">
          <h1
            className="text-2xl font-bold font-heading"
            style={{ color: textColor }}
          >
            Resposta enviada!
          </h1>
          <p style={{ color: `${textColor}99` }}>
            {confirmationMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
