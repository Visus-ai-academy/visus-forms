"use client";

import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Table2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { ResponsesApiResult } from "@/types/response";

import { ResponsesAnalytics } from "./responses-analytics";
import { ResponsesIndividual } from "./responses-individual";
import { ResponsesTable } from "./responses-table";

type Tab = "tabela" | "analitico" | "individual";

interface ResponsesPanelProps {
  formId: string;
}

export function ResponsesPanel({ formId }: ResponsesPanelProps) {
  const { form } = useFormBuilderStore();
  const [activeTab, setActiveTab] = useState<Tab>("tabela");
  const [data, setData] = useState<ResponsesApiResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}/responses?page=${page}&limit=50`);
      if (!res.ok) throw new Error();
      const result = await res.json();
      setData(result as ResponsesApiResult);
    } catch {
      toast.error("Erro ao carregar respostas");
    } finally {
      setIsLoading(false);
    }
  }, [formId, page]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  async function handleExport(format: "csv" | "xlsx") {
    setIsExporting(format);
    try {
      const res = await fetch(`/api/forms/${formId}/responses/export?format=${format}`);
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form?.title || "respostas"}-respostas.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exportado como ${format.toUpperCase()}`);
    } catch {
      toast.error("Erro ao exportar");
    } finally {
      setIsExporting(null);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "tabela", label: "Tabela", icon: Table2 },
    { id: "analitico", label: "Analitico", icon: BarChart3 },
    { id: "individual", label: "Individual", icon: User },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-surface-container-low">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === tab.id
                        ? "bg-surface-container-lowest text-primary shadow-sm"
                        : "text-on-surface/50 hover:text-on-surface/80"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Stats resumidos */}
            {data?.stats && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  <strong className="text-on-surface">{data.stats.total}</strong> respostas
                </span>
                <span>
                  <strong className="text-on-surface">{data.stats.completionRate}%</strong> conclusao
                </span>
                {data.stats.avgDuration > 0 && (
                  <span>
                    <strong className="text-on-surface">{Math.round(data.stats.avgDuration / 60)}</strong> min media
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Exportacao */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("csv")}
              disabled={isExporting !== null || !data?.data.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface/60 hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40"
            >
              {isExporting === "csv" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              CSV
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              disabled={isExporting !== null || !data?.data.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface/60 hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40"
            >
              {isExporting === "xlsx" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5" />
              )}
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Download className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-lg font-bold font-heading text-on-surface/30">
                Nenhuma resposta ainda
              </p>
              <p className="text-sm text-muted-foreground">
                As respostas aparecerao aqui quando o formulario for respondido.
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "tabela" && (
              <ResponsesTable
                responses={data.data}
                questions={form?.questions || []}
                pagination={data.pagination}
                onPageChange={setPage}
              />
            )}
            {activeTab === "analitico" && (
              <ResponsesAnalytics
                responses={data.data}
                questions={form?.questions || []}
                stats={data.stats}
              />
            )}
            {activeTab === "individual" && (
              <ResponsesIndividual
                responses={data.data}
                questions={form?.questions || []}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
