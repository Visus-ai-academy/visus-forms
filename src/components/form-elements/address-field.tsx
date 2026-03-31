"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

export interface AddressValue {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface AddressFieldProps {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
}

function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

const inputClassName =
  "rounded-xl bg-surface-container-lowest border-0 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-b-2 focus-visible:border-primary transition-all";

export function AddressField({ value, onChange }: AddressFieldProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedCep = useRef<string>("");

  const update = useCallback(
    (partial: Partial<AddressValue>) => {
      onChange({ ...value, ...partial });
    },
    [value, onChange]
  );

  const handleCepChange = useCallback(
    (raw: string) => {
      const formatted = formatCep(raw);
      update({ cep: formatted });
      setError(null);
    },
    [update]
  );

  useEffect(() => {
    const digits = value.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    if (digits === lastFetchedCep.current) return;

    lastFetchedCep.current = digits;
    setLoading(true);
    setError(null);

    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.erro) {
          setError("CEP não encontrado");
          return;
        }
        onChange({
          ...value,
          logradouro: data.logradouro || value.logradouro,
          bairro: data.bairro || value.bairro,
          cidade: data.localidade || value.cidade,
          estado: data.uf || value.estado,
          cep: value.cep,
          numero: value.numero,
          complemento: value.complemento,
        });
      })
      .catch(() => {
        setError("Erro ao buscar CEP");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [value, onChange]);

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          CEP
        </label>
        <div className="relative">
          <Input
            value={value.cep}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
            className={inputClassName}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Endereço
        </label>
        <Input
          value={value.logradouro}
          onChange={(e) => update({ logradouro: e.target.value })}
          placeholder="Rua, Avenida..."
          className={inputClassName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Número
          </label>
          <Input
            value={value.numero}
            onChange={(e) => update({ numero: e.target.value })}
            placeholder="Nº"
            className={inputClassName}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Complemento
          </label>
          <Input
            value={value.complemento}
            onChange={(e) => update({ complemento: e.target.value })}
            placeholder="Apto, Bloco..."
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Bairro
        </label>
        <Input
          value={value.bairro}
          onChange={(e) => update({ bairro: e.target.value })}
          placeholder="Bairro"
          className={inputClassName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Cidade
          </label>
          <Input
            value={value.cidade}
            onChange={(e) => update({ cidade: e.target.value })}
            placeholder="Cidade"
            className={inputClassName}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Estado
          </label>
          <Input
            value={value.estado}
            onChange={(e) => update({ estado: e.target.value })}
            placeholder="UF"
            maxLength={2}
            className={inputClassName}
          />
        </div>
      </div>
    </div>
  );
}
