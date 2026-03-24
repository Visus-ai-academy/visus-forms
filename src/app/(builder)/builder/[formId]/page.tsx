import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BuilderContent } from "@/components/form-builder/builder-content";
import { BuilderHeader } from "@/components/form-builder/builder-header";
import { BuilderProvider } from "@/components/form-builder/builder-provider";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FormDefinition } from "@/types/form";

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      workflow: {
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
    },
    include: {
      settings: true,
      theme: true,
      _count: { select: { responses: true } },
      questions: {
        orderBy: { order: "asc" },
        include: {
          options: { orderBy: { order: "asc" } },
          conditionalRules: true,
          layouts: true,
        },
      },
      workflow: {
        select: { id: true, name: true, workspaceId: true },
      },
    },
  });

  if (!form) notFound();

  const raw = JSON.parse(JSON.stringify(form));
  const formData = {
    ...raw,
    submissionCount: raw._count?.responses ?? 0,
  } as FormDefinition & {
    workflow: { id: string; name: string; workspaceId: string };
  };

  return (
    <BuilderProvider form={formData}>
      <BuilderHeader
        workspaceId={formData.workflow.workspaceId}
        workflowId={formData.workflow.id}
      />
      <div className="flex-1 min-h-0">
        <BuilderContent formId={formId} />
      </div>
    </BuilderProvider>
  );
}
