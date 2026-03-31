"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Send,
  Trash2,
  Webhook,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { FormWebhook } from "@/types/form";

interface WebhookPanelProps {
  formId: string;
}

interface HeaderEntry {
  key: string;
  value: string;
}

interface WebhookFormData {
  name: string;
  url: string;
  method: string;
  headers: HeaderEntry[];
  enabled: boolean;
  questionIds: string[];
  secret: string;
  retryCount: number;
}

const emptyForm: WebhookFormData = {
  name: "",
  url: "",
  method: "POST",
  headers: [],
  enabled: true,
  questionIds: [],
  secret: "",
  retryCount: 0,
};

function headersToEntries(headers: Record<string, string>): HeaderEntry[] {
  const entries = Object.entries(headers).map(([key, value]) => ({ key, value }));
  return entries.length > 0 ? entries : [];
}

function entriesToHeaders(entries: HeaderEntry[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const e of entries) {
    if (e.key.trim()) result[e.key.trim()] = e.value;
  }
  return result;
}

export function WebhookPanel({ formId }: WebhookPanelProps) {
  const { form } = useFormBuilderStore();
  const [webhooks, setWebhooks] = useState<FormWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<WebhookFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [expandedPayload, setExpandedPayload] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch(`/api/forms/${formId}/webhooks`);
      if (res.ok) {
        const { data } = await res.json();
        setWebhooks(data);
      }
    } catch {
      toast.error("Erro ao carregar webhooks");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  function startCreate() {
    setEditingId(null);
    setIsCreating(true);
    setFormData(emptyForm);
    setShowSecret(false);
  }

  function startEdit(webhook: FormWebhook) {
    setIsCreating(false);
    setEditingId(webhook.id);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      method: webhook.method,
      headers: headersToEntries(webhook.headers),
      enabled: webhook.enabled,
      questionIds: webhook.questionIds,
      secret: webhook.secret || "",
      retryCount: webhook.retryCount,
    });
    setShowSecret(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setFormData(emptyForm);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Nome do webhook obrigatório");
      return;
    }
    if (!formData.url.trim()) {
      toast.error("URL obrigatória");
      return;
    }
    if (formData.questionIds.length === 0) {
      toast.error("Selecione pelo menos uma pergunta");
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name,
      url: formData.url,
      method: formData.method,
      headers: entriesToHeaders(formData.headers),
      enabled: formData.enabled,
      questionIds: formData.questionIds,
      secret: formData.secret || null,
      retryCount: formData.retryCount,
    };

    try {
      const isEditing = editingId && !isCreating;
      const url = isEditing
        ? `/api/forms/${formId}/webhooks/${editingId}`
        : `/api/forms/${formId}/webhooks`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao salvar webhook");
        return;
      }

      toast.success(isEditing ? "Webhook atualizado" : "Webhook criado");
      cancelEdit();
      fetchWebhooks();
    } catch {
      toast.error("Erro ao salvar webhook");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/forms/${formId}/webhooks/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Erro ao excluir webhook");
        return;
      }

      toast.success("Webhook excluído");
      setWebhooks((prev) => prev.filter((w) => w.id !== deleteId));
      if (editingId === deleteId) cancelEdit();
    } catch {
      toast.error("Erro ao excluir webhook");
    } finally {
      setDeleteId(null);
    }
  }

  async function handleTest(webhookId: string) {
    setTesting(webhookId);

    try {
      const res = await fetch(
        `/api/forms/${formId}/webhooks/${webhookId}/test`,
        { method: "POST" }
      );
      const data = await res.json();

      if (res.ok && data.data?.success) {
        toast.success(`Teste enviado com sucesso (HTTP ${data.data.statusCode})`);
      } else {
        toast.error(data.error || `Falha no teste (HTTP ${data.data?.statusCode || "?"})`);
      }
    } catch {
      toast.error("Erro ao testar webhook");
    } finally {
      setTesting(null);
    }
  }

  async function handleToggle(webhook: FormWebhook) {
    try {
      const res = await fetch(`/api/forms/${formId}/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !webhook.enabled }),
      });

      if (res.ok) {
        setWebhooks((prev) =>
          prev.map((w) =>
            w.id === webhook.id ? { ...w, enabled: !w.enabled } : w
          )
        );
      }
    } catch {
      toast.error("Erro ao alterar status");
    }
  }

  function toggleQuestion(questionId: string) {
    setFormData((prev) => ({
      ...prev,
      questionIds: prev.questionIds.includes(questionId)
        ? prev.questionIds.filter((id) => id !== questionId)
        : [...prev.questionIds, questionId],
    }));
  }

  function addHeader() {
    setFormData((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: "", value: "" }],
    }));
  }

  function updateHeader(index: number, field: "key" | "value", val: string) {
    setFormData((prev) => ({
      ...prev,
      headers: prev.headers.map((h, i) =>
        i === index ? { ...h, [field]: val } : h
      ),
    }));
  }

  function removeHeader(index: number) {
    setFormData((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index),
    }));
  }

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }

  function buildSamplePayload(webhook: FormWebhook) {
    if (!form) return {};
    const data: Record<string, string> = {};
    for (const qId of webhook.questionIds) {
      const q = form.questions.find((q) => q.id === qId);
      if (q) data[slugify(q.title) || qId] = "(valor da resposta)";
    }

    const identificationFields = (form.settings?.identificationFields ?? []) as string[];
    const fieldLabels: Record<string, string> = {
      name: "nome",
      email: "email",
      cpf: "cpf",
      phone: "telefone",
      birthDate: "data_nascimento",
      gender: "sexo",
    };
    const fieldPlaceholders: Record<string, string> = {
      name: "(nome do respondente)",
      email: "(email do respondente)",
      cpf: "(cpf do respondente)",
      phone: "(telefone do respondente)",
      birthDate: "(data de nascimento do respondente)",
      gender: "(sexo do respondente)",
    };

    const isIdentified = form.settings?.identificationMode === "identified";
    let respondent: Record<string, string> | undefined;
    if (isIdentified && identificationFields.length > 0) {
      respondent = {};
      for (const field of identificationFields) {
        respondent[fieldLabels[field] || field] = fieldPlaceholders[field] || `(${field})`;
      }
    }

    return {
      event: "form.submitted",
      formId: form.id,
      formTitle: form.title,
      responseId: "(id-da-resposta)",
      submittedAt: new Date().toISOString(),
      ...(respondent && { respondent }),
      data,
    };
  }

  if (!form) return null;

  const questions = form.questions.filter((q) => q.type !== "STATEMENT");
  const isFormOpen = isCreating || editingId !== null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-heading text-on-surface">
              Webhooks
            </h2>
            <p className="text-sm text-muted-foreground">
              Dispare dados para APIs externas quando o formulário for respondido
            </p>
          </div>
          {!isFormOpen && (
            <Button onClick={startCreate} className="btn-primary-gradient gap-2">
              <Plus className="h-4 w-4" />
              Adicionar webhook
            </Button>
          )}
        </div>

        {/* Form (create/edit) */}
        {isFormOpen && (
          <div className="rounded-2xl bg-surface-container-lowest p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-on-surface">
                {isCreating ? "Novo webhook" : "Editar webhook"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelEdit}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Enviar para CRM"
                className="rounded-xl"
              />
            </div>

            {/* URL + Método */}
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">URL</Label>
                <Input
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="https://api.exemplo.com/webhook"
                  type="url"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Método</Label>
                <Select
                  value={formData.method}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, method: val as string }))
                  }
                >
                  <SelectTrigger className="w-24 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Headers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">
                  Headers personalizados
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addHeader}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar
                </Button>
              </div>
              {formData.headers.map((header, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={header.key}
                    onChange={(e) => updateHeader(i, "key", e.target.value)}
                    placeholder="Header"
                    className="rounded-xl flex-1"
                  />
                  <Input
                    value={header.value}
                    onChange={(e) => updateHeader(i, "value", e.target.value)}
                    placeholder="Valor"
                    className="rounded-xl flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHeader(i)}
                    className="shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Secret */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Secret (HMAC-SHA256)
              </Label>
              <div className="relative">
                <Input
                  value={formData.secret}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, secret: e.target.value }))
                  }
                  placeholder="Opcional"
                  type={showSecret ? "text" : "password"}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Se definido, o payload será assinado com HMAC-SHA256 no header
                X-Webhook-Signature
              </p>
            </div>

            {/* Retry */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tentativas de reenvio</Label>
              <Select
                value={String(formData.retryCount)}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    retryCount: Number(val),
                  }))
                }
              >
                <SelectTrigger className="w-40 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nenhuma</SelectItem>
                  <SelectItem value="1">1 tentativa</SelectItem>
                  <SelectItem value="2">2 tentativas</SelectItem>
                  <SelectItem value="3">3 tentativas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Perguntas */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Perguntas incluídas no payload
              </Label>
              <div className="space-y-1.5 rounded-xl bg-surface-container-low p-3 max-h-48 overflow-y-auto">
                {questions.map((q) => (
                  <label
                    key={q.id}
                    className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-surface-container-lowest transition-colors"
                  >
                    <Checkbox
                      checked={formData.questionIds.includes(q.id)}
                      onCheckedChange={() => toggleQuestion(q.id)}
                    />
                    <span className="text-sm text-on-surface truncate">
                      {q.title}
                    </span>
                  </label>
                ))}
                {questions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhuma pergunta no formulário
                  </p>
                )}
              </div>
            </div>

            {/* Ativo/Inativo */}
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.enabled}
                onCheckedChange={(val) =>
                  setFormData((prev) => ({ ...prev, enabled: val as boolean }))
                }
              />
              <span className="text-sm text-on-surface">
                {formData.enabled ? "Ativo" : "Inativo"}
              </span>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary-gradient gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isCreating ? "Criar webhook" : "Salvar alterações"}
              </Button>
              <Button variant="ghost" onClick={cancelEdit} className="rounded-xl">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de webhooks */}
        {webhooks.length === 0 && !isFormOpen && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Webhook className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum webhook configurado
            </p>
            <Button
              variant="outline"
              onClick={startCreate}
              className="rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar webhook
            </Button>
          </div>
        )}

        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="rounded-2xl bg-surface-container-lowest p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Webhook className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-semibold text-on-surface truncate">
                  {webhook.name}
                </span>
                <Badge
                  className={`text-[10px] font-semibold uppercase tracking-wider border-0 shrink-0 ${
                    webhook.enabled
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {webhook.enabled ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch
                  size="sm"
                  checked={webhook.enabled}
                  onCheckedChange={() => handleToggle(webhook)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] font-mono">
                {webhook.method}
              </Badge>
              <span className="truncate font-mono">{webhook.url}</span>
            </div>

            <div className="text-xs text-muted-foreground">
              {webhook.questionIds.length} pergunta(s) selecionada(s)
              {webhook.secret && " | Assinado com HMAC"}
              {webhook.retryCount > 0 &&
                ` | ${webhook.retryCount} tentativa(s) de reenvio`}
            </div>

            {/* Payload preview */}
            {expandedPayload === webhook.id && (
              <div className="relative">
                <pre className="rounded-xl bg-surface-container-low p-3 text-xs font-mono text-on-surface/80 overflow-x-auto max-h-64">
                  {JSON.stringify(buildSamplePayload(webhook), null, 2)}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(buildSamplePayload(webhook), null, 2)
                    );
                    toast.success("Payload copiado");
                  }}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEdit(webhook)}
                className="h-7 text-xs rounded-lg"
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setExpandedPayload(
                    expandedPayload === webhook.id ? null : webhook.id
                  )
                }
                className="h-7 text-xs rounded-lg gap-1"
              >
                {expandedPayload === webhook.id ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Payload
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={testing === webhook.id}
                onClick={() => handleTest(webhook.id)}
                className="h-7 text-xs rounded-lg gap-1"
              >
                {testing === webhook.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                Testar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(webhook.id)}
                className="h-7 text-xs rounded-lg text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O webhook será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
