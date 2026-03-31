import type { Question } from "@/types/form";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\(\d{2}\)\s?\d{4,5}-\d{4}|\d{10,11})$/;
const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object" && value !== null) {
    return Object.values(value).every(
      (v) => v === "" || v === undefined || v === null
    );
  }
  if (typeof value === "string") return value.trim() === "";
  return false;
}

/**
 * Valida uma pergunta individualmente (obrigatoriedade + formato).
 * Retorna a mensagem de erro ou null se válido.
 */
export function validateQuestion(
  question: Question,
  value: unknown
): string | null {
  const strVal = typeof value === "string" ? value.trim() : "";
  const isArray = Array.isArray(value);
  const isEmpty = isEmptyValue(value);

  if (question.required && isEmpty) {
    if (isArray) return "Selecione pelo menos uma opção";
    return "Este campo é obrigatório";
  }

  if (isEmpty && !question.required) return null;

  switch (question.type) {
    case "EMAIL":
      if (strVal && !EMAIL_REGEX.test(strVal))
        return "Formato de e-mail inválido";
      break;
    case "PHONE": {
      const cleanPhone = strVal.replace(/\s/g, "");
      if (cleanPhone && !PHONE_REGEX.test(cleanPhone))
        return "Formato inválido. Ex: (11) 99999-9999 ou (11) 3333-4444";
      break;
    }
    case "CPF":
      if (strVal && !CPF_REGEX.test(strVal))
        return "CPF inválido. Ex: 000.000.000-00";
      break;
    case "URL":
      if (strVal && !strVal.match(/^(https?:\/\/)?[\w.-]+\.\w{2,}/))
        return "URL inválida";
      break;
    case "NUMBER":
    case "RATING":
      if (strVal && isNaN(Number(strVal)))
        return "Informe um número válido";
      break;
    case "DATE":
      if (strVal && isNaN(Date.parse(strVal))) return "Data inválida";
      break;
    case "ADDRESS": {
      if (typeof value !== "object" || value === null) break;
      const addr = value as Record<string, string>;
      if (!addr.cep || !/^\d{5}-?\d{3}$/.test(addr.cep))
        return "CEP inválido";
      if (!addr.logradouro?.trim()) return "Endereço é obrigatório";
      if (!addr.numero?.trim()) return "Número é obrigatório";
      if (!addr.bairro?.trim()) return "Bairro é obrigatório";
      if (!addr.cidade?.trim()) return "Cidade é obrigatória";
      if (!addr.estado?.trim() || addr.estado.trim().length !== 2)
        return "Estado é obrigatório (UF)";
      break;
    }
  }

  return null;
}
