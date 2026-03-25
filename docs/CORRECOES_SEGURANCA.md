# Auditoria de Seguranca - Visus Forms

**Data**: 2026-03-25
**Escopo**: Todas as 24 rotas de API, autenticacao, autorizacao, storage, validacao e configuracao
**Stack**: Next.js (App Router), NextAuth (Credentials/JWT), Prisma, PostgreSQL (Supabase), Supabase Storage

---

## Resumo Executivo

| Severidade | Quantidade | IDs                     |
| ---------- | ---------- | ----------------------- |
| CRITICO    | 5          | CRITICO-01 a CRITICO-05 |
| ALTO       | 8          | ALTO-01 a ALTO-08       |
| MEDIO      | 7          | MEDIO-01 a MEDIO-07     |
| BAIXO      | 3          | BAIXO-01 a BAIXO-03     |
| **TOTAL**  | **23**     |                         |

**Padrao recorrente mais grave**: Rotas que verificam autenticacao mas falham na autorizacao. O `getRequiredSession()` confirma que o usuario esta logado, mas varias rotas de escrita (PATCH/DELETE) nao verificam que o recurso alvo pertence ao usuario, permitindo manipulacao cross-tenant (IDOR).

---

## Vulnerabilidades Criticas

### CRITICO-01 — Credenciais fracas e expostas no .env

**Arquivo**: `.env`
**Tipo**: Exposicao de Credenciais / Secrets Management

**Problema**: O arquivo `.env` contem credenciais reais em texto puro:

- Senha do banco PostgreSQL em texto puro nas connection strings
- `NEXTAUTH_SECRET` fraco e previsivel (nao e um hash criptografico aleatorio)

**Impacto**:

- Com o `NEXTAUTH_SECRET`, um atacante pode forjar sessoes JWT de qualquer usuario

- Com as connection strings, acesso direto ao PostgreSQL

**Correcao**:

```bash
# 1. Gerar NEXTAUTH_SECRET forte (minimo 32 bytes aleatorios):
openssl rand -base64 32

# 3. Usar gerenciador de secrets em producao (Vercel Environment Variables, AWS Secrets Manager, Doppler)
```

```typescript
// 4. Adicionar validacao de forca do secret na inicializacao (src/lib/auth.ts):
if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
  throw new Error(
    "NEXTAUTH_SECRET deve ter no minimo 32 caracteres aleatorios",
  );
}
```

---

### CRITICO-02 — IDOR nas rotas de Conditional Rules (PATCH/DELETE sem ownership)

**Arquivo**: `src/app/api/forms/[formId]/questions/[questionId]/rules/[ruleId]/route.ts`
**Tipo**: IDOR (Insecure Direct Object Reference)

**Problema**: PATCH e DELETE recebem `ruleId` do URL mas nao verificam se a regra pertence ao formulario/usuario autenticado. Os parametros `formId` e `questionId` sao completamente ignorados nas queries:

```typescript
// Codigo vulneravel:
const updated = await prisma.conditionalRule.update({
  where: { id: ruleId }, // Qualquer ruleId funciona
  data,
});
```

**Impacto**: Qualquer usuario autenticado pode modificar ou deletar regras condicionais de QUALQUER formulario de QUALQUER usuario.

**Correcao**:

```typescript
// Verificar que a regra pertence ao questionId/formId do usuario
const rule = await prisma.conditionalRule.findFirst({
  where: {
    id: ruleId,
    sourceQuestionId: questionId,
    sourceQuestion: {
      formId,
      form: {
        workflow: {
          workspace: {
            members: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "ADMIN", "MEMBER"] },
              },
            },
          },
        },
      },
    },
  },
});

if (!rule) {
  return NextResponse.json({ error: "Regra nao encontrada" }, { status: 404 });
}
```

---

### CRITICO-03 — IDOR em Members (cross-tenant manipulation)

**Arquivo**: `src/app/api/workspaces/[workspaceId]/members/[memberId]/route.ts`
**Tipo**: IDOR / Privilege Escalation

**Problema**: PATCH e DELETE verificam que o usuario e OWNER/ADMIN do workspace, mas nao verificam que o `memberId` alvo pertence ao mesmo `workspaceId`:

```typescript
// Codigo vulneravel:
const updated = await prisma.workspaceMember.update({
  where: { id: memberId }, // memberId pode ser de OUTRO workspace!
  data: { role: data.role },
});
```

**Impacto**: ADMIN do workspace A pode alterar roles ou remover membros do workspace B (escalacao de privilegios cross-tenant).

**Correcao**:

```typescript
// Garantir que o membro pertence ao workspace
const target = await prisma.workspaceMember.findFirst({
  where: { id: memberId, workspaceId },
});

if (!target) {
  return NextResponse.json(
    { error: "Membro nao encontrado neste workspace" },
    { status: 404 },
  );
}

// Impedir alteracao de roles superiores
if (target.role === "OWNER") {
  return NextResponse.json(
    { error: "Nao e possivel alterar role do owner" },
    { status: 403 },
  );
}
if (target.role === "ADMIN" && currentMember.role === "ADMIN") {
  return NextResponse.json(
    { error: "Admin nao pode alterar role de outro admin" },
    { status: 403 },
  );
}
```

---

### CRITICO-04 — IDOR em Settings (PATCH sem ownership)

**Arquivo**: `src/app/api/forms/[formId]/settings/route.ts`
**Tipo**: IDOR / Broken Access Control

**Problema**: A funcao PATCH verifica autenticacao mas nao verifica se o formulario pertence ao usuario. O GET faz a verificacao correta, mas o PATCH pula completamente:

```typescript
// Codigo vulneravel:
const updated = await (prisma.formSettings.update as Function)({
  where: { formId }, // Qualquer formId funciona!
  data,
});
```

**Impacto**: Qualquer usuario autenticado pode alterar configuracoes de QUALQUER formulario (limite de respostas, agendamento, URL de redirecionamento, notificacoes).

**Correcao**:

```typescript
// Verificar ownership antes de atualizar
const form = await prisma.form.findFirst({
  where: {
    id: formId,
    workflow: {
      workspace: {
        members: {
          some: {
            userId: session.user.id,
            role: { in: ["OWNER", "ADMIN", "MEMBER"] },
          },
        },
      },
    },
  },
});

if (!form) {
  return NextResponse.json(
    { error: "Formulario nao encontrado" },
    { status: 404 },
  );
}
```

---

### CRITICO-05 — IDOR em Theme (PATCH sem ownership)

**Arquivo**: `src/app/api/forms/[formId]/theme/route.ts`
**Tipo**: IDOR / Broken Access Control

**Problema**: Identico ao CRITICO-04. PATCH atualiza o tema diretamente pelo `formId` sem verificar permissao.

**Impacto**: Qualquer usuario autenticado pode alterar o tema visual de qualquer formulario, incluindo injetar CSS customizado (`customCss`).

**Correcao**: Mesma correcao do CRITICO-04 — verificar workspace membership antes do update.

---

## Vulnerabilidades Altas

### ALTO-01 — Middleware nao protege rotas /api/\*

**Arquivo**: `src/middleware.ts`
**Tipo**: Broken Access Control / Missing Authentication Layer

**Problema**: O matcher so cobre `/dashboard/:path*`, `/login` e `/register`. Todas as rotas `/api/*` dependem exclusivamente de `getRequiredSession()` em cada handler individual. Se um desenvolvedor esquecer de adicionar a verificacao em uma nova rota, ela fica publica.

```typescript
// Codigo atual:
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
  // FALTANDO: "/api/:path*"
};
```

**Correcao**:

```typescript
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/api/:path*"],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Rotas de API publicas
  const publicApiPaths = ["/api/auth", "/api/submit/"];
  const isPublicApi = publicApiPaths.some((path) => pathname.startsWith(path));

  if (pathname.startsWith("/api/") && !isPublicApi && !token) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  // ... resto da logica existente
}
```

---

### ALTO-02 — Upload publico sem rate limiting

**Arquivo**: `src/app/api/submit/[formSlug]/upload/route.ts`
**Tipo**: Denial of Service / Resource Exhaustion

**Problema**: Endpoint de upload publico sem rate limiting. Atacante pode enviar milhares de arquivos, esgotar storage e gerar custos.

**Correcao**: Implementar rate limiting por IP (10 uploads/minuto). Em producao, usar Redis com `rate-limiter-flexible`.

---

### ALTO-03 — Registro sem rate limiting

**Arquivo**: `src/app/api/auth/register/route.ts`
**Tipo**: Brute Force / Account Abuse

**Problema**: Endpoint de registro sem rate limiting, CAPTCHA ou anti-abuso. Permite criacao massiva de contas.

**Correcao**: Rate limiting por IP + considerar CAPTCHA (hCaptcha, Cloudflare Turnstile).

---

### ALTO-04 — Upload confia no MIME type do cliente

**Arquivo**: `src/lib/services/storage.ts`
**Tipo**: File Upload Bypass / Malicious File Upload

**Problema**: Validacao de tipo confia exclusivamente em `file.type` (definido pelo cliente). Atacante pode enviar executavel/HTML com `Content-Type: image/jpeg`.

```typescript
// Codigo vulneravel:
if (allowedTypes && !allowedTypes.includes(file.type)) { ... }
// Nao inspeciona o conteudo real do arquivo
```

**Correcao**:

```typescript
import { fileTypeFromBuffer } from "file-type";

const buffer = Buffer.from(await file.arrayBuffer());
const detectedType = await fileTypeFromBuffer(buffer);
const actualMime = detectedType?.mime || file.type;

if (allowedTypes && !allowedTypes.includes(actualMime)) {
  throw new StorageError("Tipo de arquivo nao permitido");
}
```

---

### ALTO-05 — Vazamento de erros internos para o cliente

**Arquivos**: `src/app/api/forms/[formId]/settings/route.ts`, `src/app/api/forms/[formId]/theme/route.ts`
**Tipo**: Information Disclosure

**Problema**: Erros do Prisma (nomes de tabelas, colunas, SQL) vazam para o cliente via `err.message`.

**Correcao**:

```typescript
} catch (err) {
  console.error("Settings update error:", err); // Log interno OK
  return NextResponse.json({ error: "Dados invalidos" }, { status: 400 }); // Mensagem generica
}
```

---

### ALTO-06 — Submissao publica sem validacao de respondent/metadata

**Arquivo**: `src/app/api/submit/[formSlug]/route.ts`
**Tipo**: Missing Input Validation

**Problema**: Campos `metadata`, `respondent` e `startedAt` usam type assertion (`body as { ... }`) sem Zod. O `metadata` e salvo como JSON sem limites.

**Correcao**:

```typescript
const submitBodySchema = z.object({
  answers: z.record(z.unknown()),
  startedAt: z.string().datetime().optional(),
  metadata: z
    .record(z.unknown())
    .optional()
    .refine(
      (val) => !val || JSON.stringify(val).length < 10000,
      "Metadata muito grande",
    ),
  respondent: z
    .object({
      name: z.string().max(200).optional(),
      email: z.string().email().optional(),
      cpf: z
        .string()
        .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
        .optional(),
      phone: z.string().max(20).optional(),
    })
    .optional(),
});
```

---

### ALTO-07 — Open Redirect via redirectUrl

**Arquivo**: `src/app/f/[slug]/page.tsx`
**Tipo**: Open Redirect

**Problema**: Apos submissao, o usuario e redirecionado para `form.settings.redirectUrl` sem validacao de protocolo. Aceita `javascript:` URLs e qualquer dominio.

**Correcao**:

```typescript
if (form?.settings?.redirectUrl) {
  try {
    const url = new URL(form.settings.redirectUrl);
    if (url.protocol === "https:" || url.protocol === "http:") {
      window.location.href = form.settings.redirectUrl;
    }
  } catch {
    router.push(`/f/${params.slug}/success`);
  }
}
```

---

### ALTO-08 — CSS Injection via customCss

**Arquivo**: `src/lib/schemas/form.ts`
**Tipo**: CSS Injection / Potencial Stored XSS

**Problema**: Campo `customCss` aceita qualquer string CSS sem sanitizacao. Quando renderizado, permite exfiltracao de dados via `url()`, XSS via `expression()`, e carga de recursos externos via `@import`.

**Correcao**:

```typescript
const DANGEROUS_CSS_PATTERNS = [
  /url\s*\(/i,
  /expression\s*\(/i,
  /@import/i,
  /javascript:/i,
  /behavior\s*:/i,
  /-moz-binding/i,
];

customCss: z.string().nullable().optional().refine(
  (val) => {
    if (!val) return true;
    return !DANGEROUS_CSS_PATTERNS.some((pattern) => pattern.test(val));
  },
  "CSS contem padroes nao permitidos"
),
```

---

## Vulnerabilidades Medias

### MEDIO-01 — Header injection no export de respostas

**Arquivo**: `src/app/api/forms/[formId]/responses/export/route.ts`
**Tipo**: Header Injection / CRLF Injection

**Problema**: Titulo do formulario interpolado no header `Content-Disposition` sem sanitizacao.

**Correcao**: Sanitizar titulo removendo caracteres especiais e limitando tamanho.

---

### MEDIO-02 — VIEWER pode criar formularios

**Arquivo**: `src/app/api/forms/route.ts`
**Tipo**: Insufficient Authorization

**Problema**: Verificacao de criacao de formularios aceita qualquer role, incluindo VIEWER.

**Correcao**: Filtrar `role: { in: ["OWNER", "ADMIN", "MEMBER"] }` na query.

---

### MEDIO-03 — Enumeracao de emails

**Arquivos**: `src/app/api/auth/register/route.ts`, `src/app/api/workspaces/[workspaceId]/members/route.ts`
**Tipo**: Information Disclosure / User Enumeration

**Problema**: Respostas diferentes para email existente vs. novo permitem enumeracao.

**Correcao**: Usar mensagens genericas que nao revelam se o email existe.

---

### MEDIO-04 — .passthrough() no schema dinamico

**Arquivo**: `src/lib/services/form-validator.ts`
**Tipo**: Input Validation Bypass

**Problema**: `z.object(shape).passthrough()` aceita campos extras nao validados.

**Correcao**: Trocar por `.strip()` (remove campos extras silenciosamente).

---

### MEDIO-05 — Sem protecao CSRF

**Tipo**: Cross-Site Request Forgery

**Problema**: Nenhuma rota implementa protecao CSRF. Cookies JWT sem `SameSite=Strict`.

**Correcao**:

```typescript
// Em src/lib/auth.ts:
cookies: {
  sessionToken: {
    name: "next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
},
```

---

### MEDIO-06 — Sem security headers

**Arquivo**: `next.config.ts`
**Tipo**: Missing Security Headers

**Problema**: Nenhum header de seguranca configurado (CSP, X-Frame-Options, HSTS, etc.).

**Correcao**:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};
```

---

### MEDIO-07 — IDOR em Workflows (PATCH/DELETE sem filtro workspaceId)

**Arquivo**: `src/app/api/workspaces/[workspaceId]/workflows/[workflowId]/route.ts`
**Tipo**: IDOR

**Problema**: Update/delete do workflow nao filtra por `workspaceId`.

**Correcao**: Verificar `{ id: workflowId, workspaceId }` antes de atualizar/deletar.

---

## Vulnerabilidades Baixas

### BAIXO-01 — Politica de senha fraca

**Arquivo**: `src/app/api/auth/register/route.ts`
**Problema**: Apenas 8 caracteres, sem requisitos de complexidade.

### BAIXO-02 — NEXTAUTH_URL hardcoded como localhost

**Arquivo**: `.env`
**Problema**: Pode causar problemas em producao com callbacks e cookies.

### BAIXO-03 — Campo config aceita qualquer JSON sem limite

**Arquivo**: `src/lib/schemas/form.ts`
**Problema**: `config: z.record(z.string(), z.unknown())` sem limite de tamanho.

---

## O que esta BOM no projeto

- [x] Senhas hasheadas com bcrypt (cost 12)
- [x] JWT strategy com NextAuth
- [x] Validacao Zod na maioria das rotas
- [x] Service role key nao exposta ao cliente (sem NEXT*PUBLIC*)
- [x] Sessao centralizada via `getRequiredSession()`
- [x] RBAC implementado na maioria das rotas de escrita
- [x] UUIDs nos slugs (previne enumeracao trivial)
- [x] Upload gera nomes aleatorios (previne path traversal)
- [x] Form lock para formularios publicados/com respostas
- [x] Paginacao com limites no GET de responses (max 100)
- [x] `.env` no `.gitignore`
- [x] Supabase client server-side only

---

## Testes de Verificacao

Apos implementar as correcoes, executar os seguintes testes:

### Testes de IDOR (CRITICO-02 a CRITICO-05, MEDIO-07)

1. **Criar dois usuarios** (User A e User B) com workspaces separados
2. **Logar como User A**, criar formulario com questions, rules, settings e theme
3. **Logar como User B** e tentar via curl/Postman:
   - `PATCH /api/forms/{formId-de-A}/settings` — deve retornar 404
   - `PATCH /api/forms/{formId-de-A}/theme` — deve retornar 404
   - `PATCH /api/forms/{formId-de-A}/questions/{qId}/rules/{ruleId}` — deve retornar 404
   - `DELETE /api/forms/{formId-de-A}/questions/{qId}/rules/{ruleId}` — deve retornar 404
   - `PATCH /api/workspaces/{wsId-de-A}/members/{memberId}` — deve retornar 404
   - `DELETE /api/workspaces/{wsId-de-A}/members/{memberId}` — deve retornar 404
   - `PATCH /api/workspaces/{wsId-de-A}/workflows/{wfId}` — deve retornar 404
   - `DELETE /api/workspaces/{wsId-de-A}/workflows/{wfId}` — deve retornar 404

### Testes de Middleware (ALTO-01)

4. **Sem sessao**, fazer requisicoes para rotas protegidas:
   - `GET /api/forms` — deve retornar 401
   - `GET /api/workspaces` — deve retornar 401
   - `POST /api/uploads` — deve retornar 401
5. **Rotas publicas devem continuar funcionando**:
   - `POST /api/auth/register` — deve funcionar
   - `POST /api/submit/{slug}` — deve funcionar
   - `POST /api/submit/{slug}/upload` — deve funcionar

### Testes de Upload (ALTO-04)

6. **Criar arquivo `.html` e renomear para `.jpg`**, tentar upload — deve ser rejeitado
7. **Criar arquivo executavel com Content-Type `image/jpeg`** — deve ser rejeitado
8. **Upload de imagem real** — deve funcionar normalmente

### Testes de Validacao (ALTO-06)

9. **Submeter formulario** com `metadata` de 1MB — deve ser rejeitado
10. **Submeter formulario** com `respondent.email` invalido — deve ser rejeitado
11. **Submeter formulario** com `startedAt` nao-datetime — deve ser rejeitado

### Testes de Redirect (ALTO-07)

12. **Configurar redirectUrl** como `javascript:alert(1)` — nao deve redirecionar
13. **Configurar redirectUrl** como `https://evil.com` — deve redirecionar (URL externa valida e permitida por design)

### Testes de CSS (ALTO-08)

14. **Salvar customCss** com `url(https://evil.com)` — deve ser rejeitado
15. **Salvar customCss** com `@import url(...)` — deve ser rejeitado
16. **Salvar customCss** valido (cores, fontes) — deve funcionar

### Testes de Headers (MEDIO-06)

17. **Verificar headers de seguranca**:
    ```bash
    curl -I http://localhost:3000
    # Deve conter: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.
    ```

### Testes de Autorizacao (MEDIO-02)

18. **Logar como VIEWER** e tentar `POST /api/forms` — deve retornar 403

### Testes de Erro (ALTO-05)

19. **Enviar dados malformados** para settings/theme — resposta deve conter apenas "Dados invalidos", sem stack trace ou nomes de tabelas

### Teste de Build

20. **Executar `npm run build`** — deve compilar sem erros apos todas as correcoes
