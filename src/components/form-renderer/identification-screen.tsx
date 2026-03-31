"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { PhoneField } from "@/components/form-elements/phone-field";
import type { FormDefinition, IdentificationField } from "@/types/form";
import { IDENTIFICATION_FIELD_LABELS } from "@/types/form";

export interface RespondentData {
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
}

interface IdentificationScreenProps {
  form: FormDefinition;
  onContinue: (data: RespondentData) => void;
}

const CPF_REGEX = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function applyCpfMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function IdentificationScreen({ form, onContinue }: IdentificationScreenProps) {
  const fields = (form.settings?.identificationFields ?? []) as IdentificationField[];
  const [values, setValues] = useState<RespondentData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const btnRadius =
    form.theme?.buttonStyle === "pill" ? "9999px" : form.theme?.buttonStyle === "square" ? "4px" : "12px";
  const primaryColor = form.theme?.primaryColor ?? "#214037";

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      const val = values[field]?.trim() ?? "";
      if (!val) {
        newErrors[field] = `${IDENTIFICATION_FIELD_LABELS[field]} é obrigatório`;
        continue;
      }

      if (field === "email" && !EMAIL_REGEX.test(val)) {
        newErrors[field] = "E-mail inválido";
      }
      if (field === "cpf" && !CPF_REGEX.test(val)) {
        newErrors[field] = "CPF inválido";
      }
      if (field === "birthDate") {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          newErrors[field] = "Data inválida";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onContinue(values);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        backgroundColor: form.theme?.backgroundColor ?? "#ffffff",
        color: form.theme?.textColor ?? "#1f2937",
        fontFamily: form.theme?.fontFamily ?? "Inter",
        backgroundImage: form.theme?.backgroundImageUrl ? `url(${form.theme.backgroundImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Logo */}
      {form.theme?.logoUrl && (
        <div className="fixed top-4 left-6 z-40 hidden md:block">
          <img src={form.theme.logoUrl} alt="Logo" className="h-10 object-contain" />
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            {form.theme?.logoUrl && (
              <img src={form.theme.logoUrl} alt="Logo" className="h-8 object-contain mx-auto mb-4 md:hidden" />
            )}
            <h2 className="text-xl font-bold font-heading" style={{ color: form.theme?.formTitleColor ?? form.theme?.textColor ?? "#1f2937" }}>
              {form.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              Antes de começar, informe seus dados:
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {IDENTIFICATION_FIELD_LABELS[field]}
                </label>
                {field === "phone" ? (
                  <PhoneField
                    value={values.phone ?? ""}
                    onChange={(v) => setValues((prev) => ({ ...prev, phone: v }))}
                  />
                ) : field === "cpf" ? (
                  <Input
                    value={values.cpf ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, cpf: applyCpfMask(e.target.value) }))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="rounded-xl bg-surface-container-lowest border-0 h-12 text-base"
                  />
                ) : field === "birthDate" ? (
                  <Input
                    value={values.birthDate ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, birthDate: e.target.value }))}
                    type="date"
                    className="rounded-xl bg-surface-container-lowest border-0 h-12 text-base"
                  />
                ) : field === "gender" ? (
                  <div className="flex gap-2">
                    {[
                      { value: "masculino", label: "Masculino" },
                      { value: "feminino", label: "Feminino" },
                      { value: "outro", label: "Outro" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValues((prev) => ({ ...prev, gender: opt.value }))}
                        className={`flex-1 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                          values.gender === opt.value
                            ? "text-white"
                            : "bg-surface-container-lowest text-on-surface/60 hover:bg-surface-container-low"
                        }`}
                        style={
                          values.gender === opt.value
                            ? { background: `linear-gradient(135deg, ${primaryColor}, ${form.theme?.primaryColor ?? "#34594F"})` }
                            : undefined
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input
                    value={values[field as "name" | "email"] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={field === "email" ? "seu@email.com" : field === "name" ? "Seu nome completo" : ""}
                    type={field === "email" ? "email" : "text"}
                    className="rounded-xl bg-surface-container-lowest border-0 h-12 text-base"
                  />
                )}
                {errors[field] && (
                  <p className="text-xs text-destructive font-medium">{errors[field]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${form.theme?.primaryColor ?? "#34594F"})`,
                borderRadius: btnRadius,
              }}
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
