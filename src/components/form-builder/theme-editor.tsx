"use client";

import {
  Check,
  GripVertical,
  LayoutGrid,
  Loader2,
  Monitor,
  Paintbrush,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";

import { FieldWrapper, QuestionField } from "@/components/form-elements";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { FormDefinition, FormSettings, FormTheme } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";

const GOOGLE_FONTS = [
  "Inter", "Manrope", "Roboto", "Open Sans", "Lato", "Poppins",
  "Montserrat", "Raleway", "Nunito", "DM Sans", "Space Grotesk", "Plus Jakarta Sans",
];

const BUTTON_STYLES = [
  { value: "rounded", label: "Arredondado" },
  { value: "pill", label: "Pilula" },
  { value: "square", label: "Quadrado" },
];

const DEFAULT_THEME: Omit<FormTheme, "id" | "formId"> = {
  primaryColor: "#6366f1",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  fontFamily: "Inter",
  logoUrl: null,
  backgroundImageUrl: null,
  buttonStyle: "rounded",
  customCss: null,
};

// ─── Color Picker ───────────────────────────────────────────────

function ColorPickerField({ label, color, onChange }: { label: string; color: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger className="flex items-center gap-2 w-full rounded-lg bg-surface-container-lowest px-3 py-2.5 text-sm transition-colors hover:bg-surface-container-low">
          <div className="h-5 w-5 rounded-md shrink-0" style={{ backgroundColor: color }} />
          <span className="text-on-surface font-mono text-xs">{color}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" side="left" align="start">
          <HexColorPicker color={color} onChange={onChange} />
          <Input
            value={color}
            onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
            className="mt-2 rounded-lg bg-surface-container-low border-0 h-9 text-xs font-mono"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Theme Editor Principal ─────────────────────────────────────

interface ThemeEditorProps { formId: string }

export function ThemeEditor({ formId }: ThemeEditorProps) {
  const { form } = useFormBuilderStore();
  const [theme, setTheme] = useState<Omit<FormTheme, "id" | "formId">>(() => {
    if (form?.theme) { const { id: _id, formId: _fid, ...rest } = form.theme; return rest; }
    return DEFAULT_THEME;
  });
  const [settings, setSettings] = useState<Partial<FormSettings>>(() =>
    form?.settings ? form.settings : { presentationMode: "ONE_AT_A_TIME", showProgressBar: true }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const updateField = useCallback(<K extends keyof typeof theme>(key: K, value: (typeof theme)[K]) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const updateSettings = useCallback(<K extends keyof FormSettings>(key: K, value: FormSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasSettingsChanges(true);
  }, []);

  const hasPendingChanges = hasChanges || hasSettingsChanges;

  async function handleSave() {
    setIsSaving(true);
    try {
      const results = await Promise.all([
        hasChanges ? fetch(`/api/forms/${formId}/theme`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(theme) }) : null,
        hasSettingsChanges ? fetch(`/api/forms/${formId}/settings`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }) : null,
      ]);
      const failed = results.some((r) => r && !r.ok);
      if (failed) { toast.error("Erro ao salvar"); }
      else { toast.success("Alteracoes salvas!"); setHasChanges(false); setHasSettingsChanges(false); }
    } catch { toast.error("Erro ao salvar"); }
    finally { setIsSaving(false); }
  }

  function handleReset() { setTheme(DEFAULT_THEME); setHasChanges(true); }

  return (
    <div className="flex h-full">
      {/* ─── Sidebar de configuracoes ─── */}
      <div className="w-[300px] border-r border-surface-container-low bg-surface shrink-0 flex flex-col">
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-primary-fixed p-2">
                  <Paintbrush className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-bold font-heading text-on-surface">Aparencia</h2>
              </div>
              <button onClick={handleReset} className="rounded-lg p-1.5 text-on-surface/40 hover:text-on-surface hover:bg-surface-container-low transition-colors" title="Restaurar padrao">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Cores */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface/40">Cores</p>
              <ColorPickerField label="Cor primaria" color={theme.primaryColor} onChange={(c) => updateField("primaryColor", c)} />
              <ColorPickerField label="Cor de fundo" color={theme.backgroundColor} onChange={(c) => updateField("backgroundColor", c)} />
              <ColorPickerField label="Cor do texto" color={theme.textColor} onChange={(c) => updateField("textColor", c)} />
            </div>

            {/* Botoes */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface/40">Botoes</p>
              <div className="grid grid-cols-3 gap-2">
                {BUTTON_STYLES.map((s) => (
                  <button key={s.value} onClick={() => updateField("buttonStyle", s.value)} className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${theme.buttonStyle === s.value ? "bg-primary-fixed text-primary" : "bg-surface-container-lowest text-on-surface/60 hover:bg-surface-container-low"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo */}
            <ImageUploadField label="Logo" value={theme.logoUrl} onChange={(url) => updateField("logoUrl", url)} />

            {/* Imagem de fundo */}
            <ImageUploadField label="Imagem de fundo" value={theme.backgroundImageUrl} onChange={(url) => updateField("backgroundImageUrl", url)} />

            {/* Layout e Comportamento */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-3.5 w-3.5 text-on-surface/40" />
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface/40">Comportamento</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modo de apresentacao</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updateSettings("presentationMode", "ONE_AT_A_TIME")} className={`rounded-lg px-3 py-2.5 text-xs font-medium transition-all text-center ${settings.presentationMode === "ONE_AT_A_TIME" ? "bg-primary-fixed text-primary" : "bg-surface-container-lowest text-on-surface/60 hover:bg-surface-container-low"}`}>
                    Uma por vez<span className="block text-[10px] opacity-60 mt-0.5">Estilo TypeForm</span>
                  </button>
                  <button onClick={() => updateSettings("presentationMode", "ALL_AT_ONCE")} className={`rounded-lg px-3 py-2.5 text-xs font-medium transition-all text-center ${settings.presentationMode === "ALL_AT_ONCE" ? "bg-primary-fixed text-primary" : "bg-surface-container-lowest text-on-surface/60 hover:bg-surface-container-low"}`}>
                    Todas de uma vez<span className="block text-[10px] opacity-60 mt-0.5">Estilo Google Forms</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground">Barra de progresso</Label>
                <Switch checked={settings.showProgressBar ?? true} onCheckedChange={(val) => updateSettings("showProgressBar", val)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground">Multiplas respostas</Label>
                <Switch checked={settings.allowMultipleSubmissions ?? false} onCheckedChange={(val) => updateSettings("allowMultipleSubmissions", val)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagem de confirmacao</Label>
                <Input value={settings.confirmationMessage ?? ""} onChange={(e) => updateSettings("confirmationMessage", e.target.value || null)} placeholder="Obrigado por responder!" className="rounded-lg bg-surface-container-lowest border-0 h-10 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Redirecionar apos envio</Label>
                <Input value={settings.redirectUrl ?? ""} onChange={(e) => updateSettings("redirectUrl", e.target.value || null)} placeholder="https://meu-site.com/obrigado" className="rounded-lg bg-surface-container-lowest border-0 h-10 text-sm" />
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Botao salvar fixo */}
        <div className="p-3 border-t border-surface-container-low shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasPendingChanges}
            className="btn-primary-gradient w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {isSaving ? "Salvando..." : "Salvar alteracoes"}
          </button>
        </div>
      </div>

      {/* ─── Preview Real ─── */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Toggle device */}
        <div className="flex items-center justify-center gap-1 py-2 bg-surface border-b border-surface-container-low shrink-0">
          <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
            <button onClick={() => setPreviewDevice("desktop")} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", previewDevice === "desktop" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface/50 hover:text-on-surface/80")}>
              <Monitor className="h-3.5 w-3.5" />Desktop
            </button>
            <button onClick={() => setPreviewDevice("mobile")} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", previewDevice === "mobile" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface/50 hover:text-on-surface/80")}>
              <Smartphone className="h-3.5 w-3.5" />Mobile
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground ml-3">
            Arraste as perguntas para reposicionar
          </p>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto bg-surface-container-low">
          <div className="flex justify-center p-6">
            <div className={cn("rounded-2xl shadow-ambient transition-all duration-300", previewDevice === "mobile" ? "w-[375px]" : "w-full max-w-[900px]")}>
              {form && (
                <DesignLivePreview form={form} theme={theme} settings={settings} formId={formId} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Preview (com drag-and-drop) ───────────────────────────

function DesignLivePreview({ form, theme, settings, formId }: {
  form: FormDefinition;
  theme: Omit<FormTheme, "id" | "formId">;
  settings: Partial<FormSettings>;
  formId: string;
}) {
  const questions = form.questions;
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [questionOrder, setQuestionOrder] = useState<string[]>(() => questions.map((q) => q.id));

  const isTypeForm = settings.presentationMode !== "ALL_AT_ONCE";

  useEffect(() => {
    setQuestionOrder(questions.map((q) => q.id));
  }, [questions]);

  const orderedQuestions = useMemo(() => {
    return questionOrder
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as typeof questions;
  }, [questionOrder, questions]);

  const btnRadius = theme.buttonStyle === "pill" ? "9999px" : theme.buttonStyle === "square" ? "4px" : "12px";

  function handleDragStart(id: string) { setDraggedId(id); }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    setQuestionOrder((prev) => {
      const newOrder = [...prev];
      const dragIdx = newOrder.indexOf(draggedId);
      const targetIdx = newOrder.indexOf(targetId);
      if (dragIdx === -1 || targetIdx === -1) return prev;
      newOrder.splice(dragIdx, 1);
      newOrder.splice(targetIdx, 0, draggedId);
      return newOrder;
    });
  }

  async function handleDragEnd() {
    if (!draggedId) return;
    setDraggedId(null);
    try {
      await fetch(`/api/forms/${formId}/questions/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: questionOrder }),
      });
    } catch { /* silencioso */ }
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 p-8" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
        <p className="text-sm opacity-40">Adicione perguntas na aba Editor.</p>
      </div>
    );
  }

  function renderQuestionCard(question: typeof questions[0], index: number) {
    return (
      <div className="flex gap-3">
        <div className="pt-1 opacity-0 group-hover:opacity-40 transition-opacity shrink-0">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          {question.type === "STATEMENT" ? (
            <QuestionField type="STATEMENT" value={null} onChange={() => {}} title={question.title} description={question.description} />
          ) : (
            <FieldWrapper label={question.title} description={question.description} required={question.required} index={index} typeLabel={QUESTION_TYPE_LABELS[question.type]}>
              <QuestionField
                type={question.type}
                value={answers[question.id]}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [question.id]: v }))}
                placeholder={question.placeholder}
                options={question.options}
                config={question.config}
              />
            </FieldWrapper>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
      fontFamily: theme.fontFamily,
      backgroundImage: theme.backgroundImageUrl ? `url(${theme.backgroundImageUrl})` : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      {isTypeForm ? (
        /* ─── Modo TypeForm: cada pergunta como pagina individual ─── */
        <div className="space-y-6 p-6">
          {orderedQuestions.map((question, index) => (
            <div
              key={question.id}
              draggable
              onDragStart={() => handleDragStart(question.id)}
              onDragOver={(e) => handleDragOver(e, question.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative rounded-2xl transition-all duration-200 cursor-grab active:cursor-grabbing overflow-hidden",
                draggedId === question.id ? "opacity-50 scale-[0.98]" : "hover:ring-2 hover:ring-primary/20"
              )}
            >
              {/* Header da pagina */}
              <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: `${theme.primaryColor}10` }}>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.primaryColor }}>
                  Pagina {index + 1} de {orderedQuestions.length}
                </span>
                {settings.showProgressBar !== false && (
                  <div className="w-20 h-1 rounded-full" style={{ backgroundColor: `${theme.textColor}15` }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(((index + 1) / orderedQuestions.length) * 100)}%`, backgroundColor: theme.primaryColor }} />
                  </div>
                )}
              </div>

              {/* Conteudo da pergunta centralizado */}
              <div className="flex items-center justify-center min-h-[250px] px-8 py-10">
                <div className="w-full max-w-md">
                  {renderQuestionCard(question, index)}
                </div>
              </div>

              {/* Footer com botao */}
              <div className="px-8 pb-6 flex justify-end">
                <span
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)`, borderRadius: btnRadius }}
                >
                  {index === orderedQuestions.length - 1 ? (<><Check className="h-3.5 w-3.5" />Enviar</>) : "Continuar →"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ─── Modo Google Forms: todas juntas ─── */
        <div className="p-8">
          {/* Titulo */}
          <div className="space-y-2 mb-10">
            {theme.logoUrl && <img src={theme.logoUrl} alt="Logo" className="h-10 object-contain mb-4" />}
            <h1 className="text-2xl font-bold font-heading">{form.title}</h1>
            {form.description && <p className="text-base opacity-60">{form.description}</p>}
          </div>

          <div className="space-y-4">
            {orderedQuestions.map((question, index) => (
              <div
                key={question.id}
                draggable
                onDragStart={() => handleDragStart(question.id)}
                onDragOver={(e) => handleDragOver(e, question.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "group rounded-2xl p-6 transition-all duration-200 cursor-grab active:cursor-grabbing",
                  draggedId === question.id ? "opacity-50 scale-[0.98]" : "hover:ring-2 hover:ring-primary/20"
                )}
                style={{ backgroundColor: `${theme.textColor}05` }}
              >
                {renderQuestionCard(question, index)}
              </div>
            ))}
          </div>

          <div className="pt-8">
            <span className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white pointer-events-none" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}cc)`, borderRadius: btnRadius }}>
              <Check className="h-4 w-4" />Enviar respostas
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
