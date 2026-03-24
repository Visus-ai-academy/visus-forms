import type { Question } from "@/types/form";

/**
 * Agrupa perguntas em paginas baseado em `config.startsNewPage`.
 * A primeira pergunta sempre inicia a primeira pagina.
 * Perguntas com `config.startsNewPage = true` iniciam uma nova pagina.
 */
export function groupQuestionsIntoPages(questions: Question[]): Question[][] {
  if (questions.length === 0) return [];

  const pages: Question[][] = [[]];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (i > 0 && q.config?.startsNewPage === true) {
      pages.push([]);
    }
    pages[pages.length - 1].push(q);
  }

  return pages;
}

/**
 * Alterna a quebra de pagina antes de uma pergunta.
 * Retorna o novo valor de `startsNewPage`.
 */
export function togglePageBreak(question: Question): boolean {
  return !(question.config?.startsNewPage === true);
}
