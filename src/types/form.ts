import type {
  ConditionalAction,
  ConditionalOperator,
  FormStatus,
  PresentationMode,
  QuestionType,
} from "@/generated/prisma/client";

export type { QuestionType, FormStatus, PresentationMode, ConditionalAction, ConditionalOperator };

export interface QuestionOption {
  id: string;
  questionId: string;
  label: string;
  value: string;
  order: number;
  imageUrl: string | null;
}

export interface ConditionalRule {
  id: string;
  sourceQuestionId: string;
  operator: ConditionalOperator;
  value: string;
  action: ConditionalAction;
  targetQuestionId: string | null;
  order: number;
}

export interface QuestionLayout {
  id: string;
  questionId: string;
  breakpoint: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Question {
  id: string;
  formId: string;
  type: QuestionType;
  title: string;
  description: string | null;
  placeholder: string | null;
  order: number;
  required: boolean;
  config: Record<string, unknown>;
  options: QuestionOption[];
  conditionalRules: ConditionalRule[];
  layouts: QuestionLayout[];
  createdAt: string;
  updatedAt: string;
}

export interface FormSettings {
  id: string;
  formId: string;
  presentationMode: PresentationMode;
  showProgressBar: boolean;
  allowMultipleSubmissions: boolean;
  requireAuth: boolean;
  limitResponses: number | null;
  scheduledOpenAt: string | null;
  scheduledCloseAt: string | null;
  confirmationMessage: string | null;
  redirectUrl: string | null;
  notifyOnSubmission: boolean;
  notifyEmails: string[];
  identificationMode: string;
  identificationFields: string[];
}

export type IdentificationField = "name" | "email" | "cpf" | "phone" | "birthDate" | "gender";

export const IDENTIFICATION_FIELD_LABELS: Record<IdentificationField, string> = {
  name: "Nome",
  email: "E-mail",
  cpf: "CPF",
  phone: "Telefone",
  birthDate: "Data de nascimento",
  gender: "Sexo",
};

export interface FormTheme {
  id: string;
  formId: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  titleColor: string;
  formTitleColor: string;
  fontFamily: string;
  logoUrl: string | null;
  backgroundImageUrl: string | null;
  buttonStyle: string;
  customCss: string | null;
}

export interface FormDefinition {
  id: string;
  workflowId: string | null;
  creatorId: string;
  title: string;
  description: string | null;
  slug: string;
  status: FormStatus;
  settings: FormSettings | null;
  theme: FormTheme | null;
  questions: Question[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  submissionCount?: number;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SHORT_TEXT: "Texto curto",
  LONG_TEXT: "Texto longo",
  MULTIPLE_CHOICE: "Múltipla escolha",
  SINGLE_SELECT: "Seleção única",
  DROPDOWN: "Dropdown",
  NUMBER: "Número",
  DATE: "Data",
  RATING: "Avaliação",
  FILE_UPLOAD: "Upload de arquivo",
  YES_NO: "Sim / Não",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  URL: "URL",
  STATEMENT: "Informativo",
  ADDRESS: "Endereço",
  CPF: "CPF",
};

export interface FormWebhook {
  id: string;
  formId: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  enabled: boolean;
  questionIds: string[];
  secret: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  SHORT_TEXT: "Type",
  LONG_TEXT: "AlignLeft",
  MULTIPLE_CHOICE: "CheckSquare",
  SINGLE_SELECT: "Circle",
  DROPDOWN: "ChevronDown",
  NUMBER: "Hash",
  DATE: "Calendar",
  RATING: "Star",
  FILE_UPLOAD: "Upload",
  YES_NO: "ToggleLeft",
  EMAIL: "Mail",
  PHONE: "Phone",
  URL: "Link",
  STATEMENT: "MessageSquare",
  ADDRESS: "MapPin",
  CPF: "CreditCard",
};
