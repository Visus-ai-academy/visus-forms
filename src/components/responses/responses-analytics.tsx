"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Question } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";
import type { ResponseData } from "@/types/response";
import { getAnswerDisplayValue } from "@/types/response";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

interface ResponsesAnalyticsProps {
  responses: ResponseData[];
  questions: Question[];
  stats: {
    total: number;
    completed: number;
    completionRate: number;
    avgDuration: number;
  };
}

function getQuestionData(
  questionId: string,
  responses: ResponseData[],
  optionsMap?: Map<string, string>
) {
  const values: string[] = [];
  for (const response of responses) {
    const answer = response.answers.find((a) => a.questionId === questionId);
    if (answer) {
      const val = getAnswerDisplayValue(answer, optionsMap);
      if (val && val !== "-") {
        // Multipla escolha pode ter valores separados por virgula
        if (Array.isArray(answer.jsonValue)) {
          for (const v of answer.jsonValue as string[]) {
            values.push(optionsMap?.get(v) || v);
          }
        } else {
          values.push(val);
        }
      }
    }
  }
  return values;
}

function getDistribution(values: string[]) {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function getNumericStats(values: string[]) {
  const nums = values.map(Number).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  const sorted = [...nums].sort((a, b) => a - b);
  return {
    avg: Math.round((sum / nums.length) * 10) / 10,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    count: nums.length,
  };
}

const choiceTypes = ["SINGLE_SELECT", "MULTIPLE_CHOICE", "DROPDOWN", "YES_NO"];
const numericTypes = ["NUMBER", "RATING"];

export function ResponsesAnalytics({ responses, questions, stats }: ResponsesAnalyticsProps) {
  const questionAnalytics = useMemo(() => {
    return questions
      .sort((a, b) => a.order - b.order)
      .map((q) => {
        // Mapa value→label para perguntas de escolha
        let optionsMap: Map<string, string> | undefined;
        if (q.options && q.options.length > 0) {
          optionsMap = new Map(q.options.map((o) => [o.value, o.label]));
        }

        const values = getQuestionData(q.id, responses, optionsMap);
        const isChoice = choiceTypes.includes(q.type);
        const isNumeric = numericTypes.includes(q.type);
        return {
          question: q,
          values,
          distribution: isChoice ? getDistribution(values) : null,
          numericStats: isNumeric ? getNumericStats(values) : null,
          textSample: !isChoice && !isNumeric ? values.slice(0, 5) : null,
        };
      });
  }, [questions, responses]);

  return (
    <div className="overflow-y-auto h-full p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Stats gerais */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total de respostas" value={stats.total} />
          <StatCard label="Completas" value={stats.completed} />
          <StatCard label="Taxa de conclusao" value={`${stats.completionRate}%`} />
          <StatCard
            label="Tempo medio"
            value={stats.avgDuration > 0 ? `${Math.round(stats.avgDuration / 60)}min` : "-"}
          />
        </div>

        {/* Graficos por pergunta */}
        {questionAnalytics.map(({ question, values, distribution, numericStats, textSample }) => (
          <div
            key={question.id}
            className="rounded-2xl bg-surface-container-lowest p-6 space-y-4"
          >
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {QUESTION_TYPE_LABELS[question.type]}
              </p>
              <h3 className="text-sm font-bold text-on-surface">{question.title}</h3>
              <p className="text-xs text-muted-foreground">{values.length} respostas</p>
            </div>

            {/* Grafico de distribuicao (choice types) */}
            {distribution && distribution.length > 0 && (
              <div className="flex gap-6">
                {/* Pie */}
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar */}
                <div className="flex-1 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distribution} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Stats numericos */}
            {numericStats && (
              <div className="grid grid-cols-5 gap-3">
                <MiniStat label="Media" value={numericStats.avg} />
                <MiniStat label="Mediana" value={numericStats.median} />
                <MiniStat label="Min" value={numericStats.min} />
                <MiniStat label="Max" value={numericStats.max} />
                <MiniStat label="Respostas" value={numericStats.count} />
              </div>
            )}

            {/* Amostra de texto */}
            {textSample && textSample.length > 0 && (
              <div className="space-y-1">
                {textSample.map((text, i) => (
                  <p key={i} className="text-xs text-on-surface bg-surface-container-low rounded-lg px-3 py-2">
                    &ldquo;{text}&rdquo;
                  </p>
                ))}
                {values.length > 5 && (
                  <p className="text-[11px] text-muted-foreground">
                    ...e mais {values.length - 5} respostas
                  </p>
                )}
              </div>
            )}

            {values.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma resposta para esta pergunta.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-4 text-center">
      <p className="text-2xl font-bold font-heading text-on-surface">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3 text-center">
      <p className="text-lg font-bold text-on-surface">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
