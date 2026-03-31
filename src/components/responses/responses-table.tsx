"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { Question } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";
import type { ResponseData } from "@/types/response";
import { getAnswerDisplayValue } from "@/types/response";

const IDENTIFICATION_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  cpf: "CPF",
  phone: "Telefone",
};

interface ResponsesTableProps {
  responses: ResponseData[];
  questions: Question[];
  identificationFields: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Completa", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "Em andamento", color: "bg-amber-100 text-amber-700" },
  ABANDONED: { label: "Abandonada", color: "bg-red-100 text-red-700" },
};

export function ResponsesTable({
  responses,
  questions,
  identificationFields,
  pagination,
  onPageChange,
}: ResponsesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const anonymousMap = useMemo(() => {
    const map = new Map<string, string>();
    const anonymousIds: string[] = [];
    for (const r of responses) {
      const hasIdentity =
        r.respondentName || r.respondentEmail || r.respondentCpf || r.respondentPhone || r.respondentBirthDate || r.respondentGender || r.user?.name || r.user?.email;
      if (!hasIdentity) {
        anonymousIds.push(r.id);
      }
    }
    // responses vêm desc (mais recente primeiro), invertemos para numerar do mais antigo
    anonymousIds.reverse();
    anonymousIds.forEach((id, i) => {
      map.set(id, `Anônimo ${i + 1}`);
    });
    return map;
  }, [responses]);

  const columns = useMemo<ColumnDef<ResponseData>[]>(() => {
    const fieldGetters: Record<string, (r: ResponseData) => string | null> = {
      name: (r) => r.respondentName || r.user?.name || null,
      email: (r) => r.respondentEmail || r.user?.email || null,
      cpf: (r) => r.respondentCpf || null,
      phone: (r) => r.respondentPhone || null,
      birthDate: (r) => r.respondentBirthDate || null,
      gender: (r) => r.respondentGender || null,
    };

    const fixedCols: ColumnDef<ResponseData>[] = [
      {
        accessorKey: "user",
        header: "Respondente",
        cell: ({ row }) => {
          const fields = identificationFields.length > 0
            ? identificationFields
            : ["name", "email"];

          const values = fields.map((f) => ({
            label: IDENTIFICATION_FIELD_LABELS[f] || f,
            value: fieldGetters[f]?.(row.original) || null,
          }));

          const primary = values[0]?.value || anonymousMap.get(row.original.id) || "Anônimo";
          const secondary = values.slice(1).filter((v) => v.value);

          return (
            <div className="min-w-[120px]">
              <p className="text-sm font-semibold text-on-surface truncate">
                {primary}
              </p>
              {secondary.map((v) => (
                <p key={v.label} className="text-xs text-muted-foreground truncate">
                  {v.value}
                </p>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = statusLabels[row.original.status] || statusLabels.COMPLETED;
          return (
            <Badge className={`${s.color} border-0 text-[10px] font-semibold`}>
              {s.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "completedAt",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const date = row.original.completedAt || row.original.startedAt;
          return (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(date).toLocaleString("pt-BR")}
            </span>
          );
        },
      },
      {
        accessorKey: "duration",
        header: "Duração",
        cell: ({ row }) => {
          const d = row.original.duration;
          if (!d) return <span className="text-xs text-muted-foreground">-</span>;
          const min = Math.floor(d / 60);
          const sec = d % 60;
          return (
            <span className="text-xs text-muted-foreground">
              {min > 0 ? `${min}m ${sec}s` : `${sec}s`}
            </span>
          );
        },
      },
    ];

    const questionCols: ColumnDef<ResponseData>[] = questions
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        id: `q_${q.id}`,
        header: () => (
          <div className="min-w-[100px] max-w-[200px]">
            <p className="text-xs font-semibold text-on-surface truncate">{q.title}</p>
            <p className="text-[10px] uppercase text-muted-foreground">
              {QUESTION_TYPE_LABELS[q.type]}
            </p>
          </div>
        ),
        cell: ({ row }: { row: { original: ResponseData } }) => {
          const answer = row.original.answers.find((a) => a.questionId === q.id);
          if (!answer) return <span className="text-xs text-muted-foreground">-</span>;
          const value = getAnswerDisplayValue(answer);
          if (q.type === "FILE_UPLOAD" && answer.fileUpload) {
            return (
              <a href={answer.fileUpload.storageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate block max-w-[200px]">
                {answer.fileUpload.originalName}
              </a>
            );
          }
          if (q.type === "RATING" && answer.numberValue != null) {
            const max = (q.config as { maxRating?: number })?.maxRating || 5;
            return (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: max }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < answer.numberValue!
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            );
          }
          return (
            <span className="text-xs text-on-surface max-w-[200px] truncate block" title={value}>
              {value}
            </span>
          );
        },
      }));

    return [...fixedCols, ...questionCols];
  }, [questions, identificationFields, anonymousMap]);

  const table = useReactTable({
    data: responses,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col h-full">
      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-lg bg-surface-container-lowest overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-surface-container-low z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-surface-container-low"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-surface-container-low/50 hover:bg-surface-container-low/30 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Paginacao */}
      {pagination.totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-surface-container-low">
          <p className="text-xs text-muted-foreground">
            Mostrando {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg p-1.5 text-on-surface/50 hover:bg-surface-container-low disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-on-surface">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg p-1.5 text-on-surface/50 hover:bg-surface-container-low disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
