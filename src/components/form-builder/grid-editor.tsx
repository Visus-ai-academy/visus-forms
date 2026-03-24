"use client";

import { GripVertical, Loader2, Monitor, Save, Smartphone } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  GridLayout,
  type Layout,
  type LayoutItem,
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import { QUESTION_TYPE_LABELS } from "@/types/form";
import type { QuestionLayout } from "@/types/form";

import "react-grid-layout/css/styles.css";

interface GridEditorProps {
  formId: string;
}

export function GridEditor({ formId }: GridEditorProps) {
  const { form } = useFormBuilderStore();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { width: containerWidth, containerRef, mounted } = useContainerWidth();

  const questions = form?.questions ?? [];

  // Construir layout a partir dos dados salvos
  const buildLayout = useCallback(
    (bp: "desktop" | "mobile"): LayoutItem[] => {
      return questions.map((q, index) => {
        const saved = q.layouts?.find((l: QuestionLayout) => l.breakpoint === bp);
        return {
          i: q.id,
          x: saved?.x ?? 0,
          y: saved?.y ?? index * 2,
          w: saved?.w ?? 12,
          h: saved?.h ?? 2,
          minW: bp === "mobile" ? 6 : 3,
          minH: 1,
        };
      });
    },
    [questions]
  );

  const [layouts, setLayouts] = useState<Record<string, LayoutItem[]>>(() => ({
    desktop: buildLayout("desktop"),
    mobile: buildLayout("mobile"),
  }));

  const activeLayout: Layout = useMemo(() => {
    return layouts[device] ?? buildLayout(device);
  }, [layouts, device, buildLayout]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      setLayouts((prev) => ({
        ...prev,
        [device]: [...newLayout],
      }));
      setIsDirty(true);
    },
    [device]
  );

  async function handleSave() {
    setIsSaving(true);

    const layoutsToSave: {
      questionId: string;
      breakpoint: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }[] = [];

    for (const bp of ["desktop", "mobile"] as const) {
      const items = layouts[bp] ?? [];
      for (const item of items) {
        layoutsToSave.push({
          questionId: item.i,
          breakpoint: bp,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        });
      }
    }

    try {
      const res = await fetch(`/api/forms/${formId}/layouts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layouts: layoutsToSave }),
      });

      if (!res.ok) {
        toast.error("Erro ao salvar layout");
        return;
      }

      toast.success("Layout salvo!");
      setIsDirty(false);
    } catch {
      toast.error("Erro ao salvar layout");
    } finally {
      setIsSaving(false);
    }
  }

  if (!form || questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Adicione perguntas na aba Editor para configurar o layout.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-surface-container-low shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
            <button
              onClick={() => setDevice("desktop")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                device === "desktop"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface/50 hover:text-on-surface/80"
              )}
            >
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                device === "mobile"
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface/50 hover:text-on-surface/80"
              )}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground ml-2">
            Arraste e redimensione os blocos para personalizar o layout
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="btn-primary-gradient px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Salvar layout
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto bg-surface-container-low p-6">
        <div
          ref={containerRef}
          className={cn(
            "mx-auto bg-white rounded-2xl shadow-ambient min-h-[600px]",
            device === "mobile" ? "max-w-[375px]" : "max-w-[900px]"
          )}
        >
          {mounted && containerWidth > 0 && (
            <GridLayout
              layout={activeLayout}
              width={containerWidth}
              gridConfig={{
                cols: 12,
                rowHeight: 60,
                margin: [12, 12] as const,
                containerPadding: [16, 16] as const,
              }}
              dragConfig={{
                enabled: true,
                handle: ".grid-drag-handle",
              }}
              resizeConfig={{
                enabled: true,
              }}
              compactor={verticalCompactor}
              onLayoutChange={handleLayoutChange}
            >
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="rounded-xl bg-surface-container-lowest border-2 border-transparent hover:border-primary/20 transition-colors overflow-hidden"
                >
                  <div className="flex items-start gap-2 p-3 h-full">
                    <div className="grid-drag-handle cursor-grab active:cursor-grabbing pt-0.5 shrink-0">
                      <GripVertical className="h-4 w-4 text-on-surface/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full h-4 w-4 flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {q.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </GridLayout>
          )}
        </div>
      </div>
    </div>
  );
}
