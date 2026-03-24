"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { Question } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";
import type { ResponseData } from "@/types/response";
import { getAnswerDisplayValue } from "@/types/response";

interface ResponsesTableProps {
  responses: ResponseData[];
  questions: Question[];
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
  pagination,
  onPageChange,
}: ResponsesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<ResponseData>[]>(() => {
    const fixedCols: ColumnDef<ResponseData>[] = [
      {
        accessorKey: "user",
        header: "Respondente",
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div className="min-w-[120px]">
              <p className="text-sm font-semibold text-on-surface truncate">
                {user?.name || "Anonimo"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.email || "-"}
              </p>
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
            <p className="text-[9px] uppercase text-muted-foreground">
              {QUESTION_TYPE_LABELS[q.type]}
            </p>
          </div>
        ),
        cell: ({ row }: { row: { original: ResponseData } }) => {
          const answer = row.original.answers.find((a) => a.questionId === q.id);
          if (!answer) return <span className="text-xs text-muted-foreground">-</span>;
          const value = getAnswerDisplayValue(answer);
          return (
            <span className="text-xs text-on-surface max-w-[200px] truncate block" title={value}>
              {value}
            </span>
          );
        },
      }));

    return [...fixedCols, ...questionCols];
  }, [questions]);

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
