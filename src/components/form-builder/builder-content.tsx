"use client";

import { Construction } from "lucide-react";

import { ResponsesPanel } from "@/components/responses/responses-panel";
import { useFormBuilderStore } from "@/stores/form-builder-store";

import { BuilderCanvas } from "./builder-canvas";
import { BuilderPreview } from "./builder-preview";
import { LogicPanel } from "./logic-panel";
import { SharePanel } from "./share-panel";
import { ThemeEditor } from "./theme-editor";

interface BuilderContentProps {
  formId: string;
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Construction className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-lg font-bold font-heading text-on-surface/30">{label}</p>
        <p className="text-sm text-muted-foreground">Em desenvolvimento</p>
      </div>
    </div>
  );
}

export function BuilderContent({ formId }: BuilderContentProps) {
  const activeTab = useFormBuilderStore((s) => s.activeTab);
  const showPreview = useFormBuilderStore((s) => s.showPreview);

  function renderContent() {
    switch (activeTab) {
      case "editor":
        return (
          <div className="flex h-full">
            <div className={showPreview ? "w-1/2 shrink-0 h-full" : "flex-1 h-full"}>
              <BuilderCanvas formId={formId} />
            </div>
            {showPreview && (
              <div className="w-1/2 shrink-0 h-full overflow-y-auto border-l border-surface-container-low">
                <BuilderPreview formId={formId} />
              </div>
            )}
          </div>
        );
      case "logica":
        return <LogicPanel formId={formId} />;
      case "design":
        return <ThemeEditor formId={formId} />;
      case "compartilhar":
        return <SharePanel formId={formId} />;
      case "respostas":
        return <ResponsesPanel formId={formId} />;
      default:
        return <BuilderCanvas formId={formId} />;
    }
  }

  return <div className="h-full overflow-hidden">{renderContent()}</div>;
}
