"use client";

import { create } from "zustand";

import type { FormDefinition, Question, QuestionType } from "@/types/form";

export type BuilderTab = "editor" | "logica" | "design" | "compartilhar" | "respostas";

interface FormBuilderState {
  form: FormDefinition | null;
  selectedQuestionId: string | null;
  isDirty: boolean;
  saveStatus: "saved" | "saving" | "unsaved" | "error";
  previewDevice: "desktop" | "mobile";
  activeTab: BuilderTab;
  showPreview: boolean;
  isQuestionsLocked: boolean;
  lockReason: "published" | "has_responses" | null;

  // Init
  setForm: (form: FormDefinition) => void;

  // Form meta
  updateFormMeta: (updates: Partial<Pick<FormDefinition, "title" | "description">>) => void;
  updateTheme: (updates: Partial<NonNullable<FormDefinition["theme"]>>) => void;
  updateSettings: (updates: Partial<NonNullable<FormDefinition["settings"]>>) => void;

  // Questions
  addQuestion: (question: Question) => void;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  removeQuestion: (questionId: string) => void;
  reorderQuestions: (questionIds: string[]) => void;
  duplicateQuestion: (questionId: string, newQuestion: Question) => void;

  // Selection
  setSelectedQuestion: (id: string | null) => void;

  // UI
  setActiveTab: (tab: BuilderTab) => void;
  setPreviewDevice: (device: "desktop" | "mobile") => void;
  togglePreview: () => void;

  // Save
  setSaveStatus: (status: FormBuilderState["saveStatus"]) => void;
  markDirty: () => void;
  markSaved: () => void;
}

export const useFormBuilderStore = create<FormBuilderState>((set, get) => ({
  form: null,
  selectedQuestionId: null,
  isDirty: false,
  saveStatus: "saved",
  previewDevice: "desktop",
  activeTab: "editor",
  showPreview: false,
  isQuestionsLocked: false,
  lockReason: null,

  setForm: (form) => {
    const isPublished = form.status === "PUBLISHED";
    const hasResponses = (form.submissionCount ?? 0) > 0;
    const locked = isPublished || hasResponses;
    set({
      form,
      isDirty: false,
      saveStatus: "saved",
      activeTab: "editor",
      showPreview: false,
      isQuestionsLocked: locked,
      lockReason: locked ? (isPublished ? "published" : "has_responses") : null,
    });
  },

  updateFormMeta: (updates) => {
    const { form } = get();
    if (!form) return;
    set({
      form: { ...form, ...updates },
      isDirty: true,
      saveStatus: "unsaved",
    });
  },

  updateTheme: (updates) => {
    const { form } = get();
    if (!form) return;
    set({
      form: { ...form, theme: { ...form.theme!, ...updates } },
    });
  },

  updateSettings: (updates) => {
    const { form } = get();
    if (!form) return;
    set({
      form: { ...form, settings: { ...form.settings!, ...updates } },
    });
  },

  addQuestion: (question) => {
    const { form } = get();
    if (!form) return;
    set({
      form: { ...form, questions: [...form.questions, question] },
      selectedQuestionId: question.id,
      isDirty: true,
      saveStatus: "unsaved",
    });
  },

  updateQuestion: (questionId, updates) => {
    const { form } = get();
    if (!form) return;
    set({
      form: {
        ...form,
        questions: form.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q
        ),
      },
      isDirty: true,
      saveStatus: "unsaved",
    });
  },

  removeQuestion: (questionId) => {
    const { form, selectedQuestionId } = get();
    if (!form) return;
    set({
      form: {
        ...form,
        questions: form.questions.filter((q) => q.id !== questionId),
      },
      selectedQuestionId: selectedQuestionId === questionId ? null : selectedQuestionId,
      isDirty: true,
      saveStatus: "unsaved",
    });
  },

  reorderQuestions: (questionIds) => {
    const { form } = get();
    if (!form) return;

    const questionMap = new Map(form.questions.map((q) => [q.id, q]));
    const reordered = questionIds
      .map((id, index) => {
        const q = questionMap.get(id);
        return q ? { ...q, order: index } : null;
      })
      .filter((q): q is Question => q !== null);

    set({
      form: { ...form, questions: reordered },
      isDirty: true,
      saveStatus: "unsaved",
    });
  },

  duplicateQuestion: (questionId, newQuestion) => {
    const { form } = get();
    if (!form) return;

    const index = form.questions.findIndex((q) => q.id === questionId);
    const questions = [...form.questions];
    questions.splice(index + 1, 0, newQuestion);

    set({
      form: { ...form, questions },
      selectedQuestionId: newQuestion.id,
      isDirty: true,
      saveStatus: "unsaved",
    });
  },

  setSelectedQuestion: (id) => set({ selectedQuestionId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  setPreviewDevice: (device) => set({ previewDevice: device }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  markDirty: () => set({ isDirty: true, saveStatus: "unsaved" }),
  markSaved: () => set({ isDirty: false, saveStatus: "saved" }),
}));
