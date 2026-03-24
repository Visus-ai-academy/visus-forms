import type { ConditionalAction, ConditionalOperator } from "@/types/form";

export interface RuleDefinition {
  id: string;
  sourceQuestionId: string;
  operator: ConditionalOperator;
  value: string;
  action: ConditionalAction;
  targetQuestionId: string | null;
  order: number;
}

export interface QuestionDefinition {
  id: string;
  order: number;
  type: string;
}

export type AnswerValue = string | number | boolean | string[] | null | undefined | unknown;

/**
 * Avalia se uma condicao e verdadeira dado o valor da resposta.
 */
export function evaluateCondition(
  operator: ConditionalOperator,
  answer: AnswerValue,
  ruleValue: string
): boolean {
  if (operator === "IS_EMPTY") {
    return answer === null || answer === undefined || answer === "" ||
      (Array.isArray(answer) && answer.length === 0);
  }

  if (operator === "IS_NOT_EMPTY") {
    return answer !== null && answer !== undefined && answer !== "" &&
      !(Array.isArray(answer) && answer.length === 0);
  }

  const answerStr = Array.isArray(answer) ? answer.join(",") : String(answer ?? "");
  const answerNum = Number(answerStr);
  const ruleNum = Number(ruleValue);

  switch (operator) {
    case "EQUALS":
      return answerStr === ruleValue;

    case "NOT_EQUALS":
      return answerStr !== ruleValue;

    case "CONTAINS":
      return answerStr.toLowerCase().includes(ruleValue.toLowerCase());

    case "NOT_CONTAINS":
      return !answerStr.toLowerCase().includes(ruleValue.toLowerCase());

    case "GREATER_THAN":
      return !isNaN(answerNum) && !isNaN(ruleNum) && answerNum > ruleNum;

    case "LESS_THAN":
      return !isNaN(answerNum) && !isNaN(ruleNum) && answerNum < ruleNum;

    case "GREATER_EQUAL":
      return !isNaN(answerNum) && !isNaN(ruleNum) && answerNum >= ruleNum;

    case "LESS_EQUAL":
      return !isNaN(answerNum) && !isNaN(ruleNum) && answerNum <= ruleNum;

    case "IN_LIST": {
      const list = ruleValue.split(",").map((v) => v.trim().toLowerCase());
      if (Array.isArray(answer)) {
        return answer.some((a) => list.includes(a.toLowerCase()));
      }
      return list.includes(answerStr.toLowerCase());
    }

    default:
      return false;
  }
}

/**
 * Dado a pergunta atual e as respostas, determina a proxima pergunta (modo TypeForm).
 * Retorna o ID da proxima pergunta, ou null se o formulario deve encerrar.
 */
export function evaluateNextQuestion(
  currentQuestionId: string,
  answers: Map<string, AnswerValue>,
  questions: QuestionDefinition[],
  rules: RuleDefinition[]
): string | null {
  const currentAnswer = answers.get(currentQuestionId);

  const questionRules = rules
    .filter((r) => r.sourceQuestionId === currentQuestionId)
    .sort((a, b) => a.order - b.order);

  for (const rule of questionRules) {
    if (evaluateCondition(rule.operator, currentAnswer, rule.value)) {
      if (rule.action === "END_FORM") return null;
      if (rule.action === "SKIP_TO" && rule.targetQuestionId) {
        return rule.targetQuestionId;
      }
    }
  }

  // Sem regra ativada: proxima pergunta na ordem
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  const currentIndex = sortedQuestions.findIndex((q) => q.id === currentQuestionId);

  if (currentIndex === -1 || currentIndex >= sortedQuestions.length - 1) {
    return null;
  }

  return sortedQuestions[currentIndex + 1].id;
}

/**
 * Dado todas as respostas, retorna as perguntas visiveis (modo classico).
 * Caminha pela lista de perguntas seguindo regras de branching.
 */
export function getVisibleQuestions(
  answers: Map<string, AnswerValue>,
  questions: QuestionDefinition[],
  rules: RuleDefinition[]
): string[] {
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  if (sortedQuestions.length === 0) return [];

  const visible: string[] = [];
  const hiddenByRules = new Set<string>();

  // Primeiro, avaliar regras HIDE/SHOW
  for (const rule of rules) {
    const answer = answers.get(rule.sourceQuestionId);
    const matches = evaluateCondition(rule.operator, answer, rule.value);

    if (matches && rule.action === "HIDE" && rule.targetQuestionId) {
      hiddenByRules.add(rule.targetQuestionId);
    }
    if (matches && rule.action === "SHOW" && rule.targetQuestionId) {
      hiddenByRules.delete(rule.targetQuestionId);
    }
  }

  // Caminhar pelas perguntas seguindo SKIP_TO e END_FORM
  let currentId: string | null = sortedQuestions[0].id;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);

    if (!hiddenByRules.has(currentId)) {
      visible.push(currentId);
    }

    // Verificar regras SKIP_TO / END_FORM para esta pergunta
    const questionRules = rules
      .filter((r) => r.sourceQuestionId === currentId && (r.action === "SKIP_TO" || r.action === "END_FORM"))
      .sort((a, b) => a.order - b.order);

    let jumped = false;
    const answer = answers.get(currentId);

    for (const rule of questionRules) {
      if (evaluateCondition(rule.operator, answer, rule.value)) {
        if (rule.action === "END_FORM") {
          return visible;
        }
        if (rule.action === "SKIP_TO" && rule.targetQuestionId) {
          currentId = rule.targetQuestionId;
          jumped = true;
          break;
        }
      }
    }

    if (!jumped) {
      const currentIndex = sortedQuestions.findIndex((q) => q.id === currentId);
      currentId = currentIndex < sortedQuestions.length - 1
        ? sortedQuestions[currentIndex + 1].id
        : null;
    }
  }

  return visible;
}

/**
 * Labels dos operadores em PT-BR
 */
export const OPERATOR_LABELS: Record<ConditionalOperator, string> = {
  EQUALS: "e igual a",
  NOT_EQUALS: "e diferente de",
  CONTAINS: "contem",
  NOT_CONTAINS: "nao contem",
  GREATER_THAN: "e maior que",
  LESS_THAN: "e menor que",
  GREATER_EQUAL: "e maior ou igual a",
  LESS_EQUAL: "e menor ou igual a",
  IS_EMPTY: "esta vazio",
  IS_NOT_EMPTY: "nao esta vazio",
  IN_LIST: "esta na lista",
};

/**
 * Labels das acoes em PT-BR
 */
export const ACTION_LABELS: Record<ConditionalAction, string> = {
  SKIP_TO: "Pular para",
  HIDE: "Esconder",
  SHOW: "Mostrar",
  END_FORM: "Encerrar formulario",
};
