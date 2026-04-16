"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchUser {
  id: string;
  name: string | null;
  email: string;
}

interface InviteMemberModalProps {
  workspaceId: string;
  trigger: React.ReactNode;
}

export function InviteMemberModal({ workspaceId, trigger }: InviteMemberModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [results, setResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function resetForm() {
    setEmail("");
    setRole("MEMBER");
    setEmailError(null);
    setResults([]);
    setShowResults(false);
    setSelectedUser(null);
  }

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const { data } = await res.json();
        setResults(data);
        setShowResults(data.length > 0);
      }
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleEmailChange(value: string) {
    setEmail(value);
    setSelectedUser(null);
    if (emailError) setEmailError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(value.trim()), 300);
  }

  function handleSelectUser(user: SearchUser) {
    setEmail(user.email);
    setSelectedUser(user);
    setShowResults(false);
    setResults([]);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function handleInvite() {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("E-mail é obrigatório");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("E-mail inválido");
      return;
    }

    setEmailError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Erro ao convidar membro");
        return;
      }

      toast.success("Convite processado com sucesso!");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Erro ao convidar membro");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger onClick={(e) => e.stopPropagation()}>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>
            Busque pelo e-mail do usuário para adicioná-lo ao workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              E-mail
            </Label>
            <div className="relative" ref={containerRef}>
              <Input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onFocus={() => { if (results.length > 0) setShowResults(true); }}
                placeholder="usuario@email.com"
                className={`rounded-lg bg-surface-container-low border-0 h-11 ${emailError ? "ring-2 ring-destructive" : ""}`}
                onKeyDown={(e) => e.key === "Enter" && !showResults && handleInvite()}
                autoComplete="off"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}

              {showResults && results.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg bg-surface-container-lowest border border-border shadow-lg overflow-hidden">
                  {results.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-xs font-semibold text-on-surface shrink-0">
                        {(user.name?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        {user.name && (
                          <p className="text-sm font-medium text-on-surface truncate">
                            {user.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            {selectedUser && (
              <p className="text-xs text-muted-foreground">
                Usuário encontrado: {selectedUser.name || selectedUser.email}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Função
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "MEMBER" | "VIEWER")}>
              <SelectTrigger className="rounded-lg bg-surface-container-low border-0 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Membro</SelectItem>
                <SelectItem value="VIEWER">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <DialogClose className="px-4 py-2 text-sm rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-dim transition-colors">
              Cancelar
            </DialogClose>
            <Button
              onClick={handleInvite}
              disabled={isLoading || !email.trim()}
              className="btn-primary-gradient px-5 py-2 text-sm font-semibold"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              Convidar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
