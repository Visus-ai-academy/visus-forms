# Plano de Execucao: Visus Forms

## Contexto

Visus Forms e um clone do TypeForm para uso interno da empresa. O sistema permite criar workflows, formularios dinamicos com logica condicional, visualizar respostas e exportar dados.

**Stack**: Next.js (App Router), ShadcnUI, TailwindCSS, Zod, Prisma ORM, PostgreSQL, NextAuth.js

**Decisoes tecnicas**:
- Autenticacao: NextAuth.js (email/senha + Google)
- Banco de dados: PostgreSQL
- Logica condicional: sim, branching entre perguntas
- Apresentacao: ambos os modos (uma pergunta por vez + todas de uma vez), configuravel por formulario
- Workflows agrupam formularios relacionados
- Exportacao de respostas: PDF, XLSX, CSV

---

## Fase 1 -- Fundacao (Setup do Projeto)

### 1.1 Inicializar projeto
- `npx create-next-app@latest` com App Router + TypeScript + TailwindCSS + ESLint
- Inicializar ShadcnUI (`npx shadcn@latest init`)
- Instalar dependencias core:
  - `prisma`, `@prisma/client`
  - `next-auth`, `@auth/prisma-adapter`, `bcryptjs`
  - `zod`, `react-hook-form`, `@hookform/resolvers`
  - `zustand`, `zundo`
  - `nanoid`, `lucide-react`

### 1.2 Configurar Prisma + PostgreSQL
- Criar `prisma/schema.prisma` com todos os modelos (ver [database.md](database.md))
- Enums: `WorkspaceRole`, `FormStatus`, `PresentationMode`, `QuestionType`, `ConditionalOperator`, `ConditionalAction`, `ResponseStatus`
- `npx prisma migrate dev --name init`

### 1.3 Configurar NextAuth.js
- `lib/auth.ts` com Prisma Adapter, providers (Credentials + Google)
- `app/api/auth/[...nextauth]/route.ts`
- `app/api/auth/register/route.ts` (registro com bcryptjs)

### 1.4 Layout base
- `app/(auth)/layout.tsx` -- layout centralizado para login/registro
- `app/(auth)/login/page.tsx` e `register/page.tsx`
- `app/(dashboard)/layout.tsx` -- sidebar + header (protegido)
- `app/layout.tsx` -- root layout com providers

### 1.5 Tipos e schemas Zod
- `types/form.ts` -- tipos centrais
- `lib/schemas/question-config.ts` -- Zod schemas por QuestionType
- `lib/schemas/form.ts`, `workspace.ts`, `response.ts`

**Entregavel**: App rodando com auth, DB configurado, layout base.

---

## Fase 2 -- Workspaces e Workflows

### 2.1 CRUD Workspaces
- API: `app/api/workspaces/route.ts` (GET, POST)
- API: `app/api/workspaces/[workspaceId]/route.ts` (GET, PATCH, DELETE)
- Pages: lista, criar, settings, membros
- Componente: `WorkspaceSwitcher` na sidebar

### 2.2 CRUD Workflows
- API: `app/api/workspaces/[workspaceId]/workflows/route.ts`
- Pages: lista de workflows, criar workflow

### 2.3 Middleware de protecao
- Middleware Next.js para rotas autenticadas
- Verificacao de permissoes por workspace

**Entregavel**: Usuarios podem criar workspaces, convidar membros, criar workflows.

---

## Fase 3 -- Form Builder

### 3.1 CRUD Forms (API)
- `app/api/forms/route.ts` (GET, POST)
- `app/api/forms/[formId]/route.ts` (GET, PATCH, DELETE)
- `app/api/forms/[formId]/questions/route.ts` (GET, POST)
- `app/api/forms/[formId]/questions/reorder/route.ts` (PATCH)
- `app/api/forms/[formId]/questions/[questionId]/route.ts` (PATCH, DELETE)
- `app/api/forms/[formId]/publish/route.ts` (POST, DELETE)

### 3.2 Zustand Store do Builder
- `stores/form-builder-store.ts`
- State: form, selectedQuestionId, isDirty, saveStatus, previewDevice
- Actions: addQuestion, updateQuestion, removeQuestion, duplicateQuestion, reorderQuestions
- Middleware: `zundo` (undo/redo), debounced auto-save

### 3.3 Builder UI
- `BuilderHeader` -- titulo, status de save, botao publicar
- `BuilderCanvas` -- area principal com drag-and-drop (`@dnd-kit`)
- `QuestionCard` -- card de cada pergunta
- `QuestionTypePicker` -- modal/drawer para escolher tipo
- `QuestionEditor` -- editor especifico por tipo (13 tipos)
- `QuestionSettings` -- toggle required, descricao, validacoes

### 3.4 Dependencias adicionais
- `@dnd-kit/core`, `@dnd-kit/sortable`
- Componentes ShadcnUI: Dialog, Popover, Select, Tabs, Switch, Slider

**Entregavel**: Builder funcional com todos os 13 tipos de pergunta + drag-and-drop.

---

## Fase 4 -- Logica Condicional (Branching)

### 4.1 Motor de avaliacao
- `lib/services/conditional-engine.ts` (isomorfico)
  - `evaluateNextQuestion()` -- modo TypeForm
  - `getVisibleQuestions()` -- modo classico
  - `evaluateCondition()` -- operadores (EQUALS, CONTAINS, GREATER_THAN, etc.)

### 4.2 CRUD de regras
- `app/api/forms/[formId]/questions/[questionId]/rules/route.ts`

### 4.3 UI do editor de logica
- `ConditionalLogicPanel` -- painel lateral no builder
- `LogicRuleRow` -- editor de regra individual
- Validacao contra loops infinitos

**Entregavel**: Logica condicional configuravel e funcional.

---

## Fase 5 -- Formulario Publico (Renderer)

### 5.1 Pagina publica
- `app/f/[slug]/page.tsx` -- renderizacao do formulario
- `app/f/[slug]/success/page.tsx` -- confirmacao
- `app/api/submit/[formSlug]/route.ts` -- GET/POST

### 5.2 Renderer com dois modos
- **TypeformRenderer** (uma pergunta por vez):
  - `framer-motion` AnimatePresence
  - Navegacao por teclado
  - ProgressBar
- **ClassicRenderer** (todas de uma vez):
  - Re-avaliacao de visibilidade via `useWatch`
  - Animacao show/hide

### 5.3 Componentes de input compartilhados
- `components/form-elements/` -- um componente por tipo
- Integrados com react-hook-form via Controller

### 5.4 Submissao e validacao
- Validacao client-side com Zod schema dinamico
- Validacao server-side + re-avaliacao de branching
- Suporte a progresso parcial

**Entregavel**: Formularios publicos funcionais nos dois modos.

---

## Fase 6 -- Preview e Temas

### 6.1 Preview no builder
- `DeviceFrame` -- desktop (1280px) e mobile (375px)
- `BuilderPreview` -- split-pane ou overlay
- Toggle desktop/mobile

### 6.2 Tema customizavel
- `ThemeEditor` -- cores, fontes, logo, background, estilo de botao
- `ThemeProvider` -- CSS custom properties
- API: `app/api/forms/[formId]/theme/route.ts`

**Entregavel**: Aparencia personalizada com preview responsivo.

---

## Fase 7 -- Dashboard de Respostas e Exportacao

### 7.1 Dashboard
- Tabs: Tabela | Analitico | Individual

### 7.2 Tabela de respostas
- `@tanstack/react-table` com colunas dinamicas
- Sorting, filtros, paginacao

### 7.3 Analitico (graficos)
- `recharts` por tipo de pergunta
- Stats gerais: total, taxa de conclusao, tempo medio

### 7.4 Visualizacao individual
- Card-based: pergunta + resposta
- Navegacao prev/next

### 7.5 Exportacao
- **CSV**: client-side com Blob
- **XLSX**: `exceljs` (server-side)
- **PDF**: `@react-pdf/renderer`

**Entregavel**: Dashboard completo com exportacao.

---

## Fase 8 -- Polish e Producao

### 8.1 Upload de arquivos
- Storage (Vercel Blob, S3 ou uploadthing)
- Presigned URLs

### 8.2 Qualidade
- Loading states, error boundaries, toasts
- Responsividade mobile

### 8.3 Documentacao
- Atualizar `/docs/` com mudancas
- Guia de deploy e configuracao

---

## Verificacao End-to-End

1. `npx prisma migrate dev` -- schema correto
2. Criar usuario, login, workspace e workflow
3. Criar formulario com todos os tipos de pergunta
4. Configurar regras condicionais
5. Publicar e preencher nos dois modos
6. Verificar respostas no dashboard
7. Exportar para CSV, XLSX e PDF
8. Testar preview desktop/mobile
9. Testar responsividade em dispositivo movel
