# Arquitetura do Sistema

## Stack Tecnologica

| Camada | Tecnologia | Finalidade |
|--------|-----------|------------|
| Framework | Next.js 15 (App Router) | SSR, API routes, roteamento |
| UI | ShadcnUI + Radix UI | Componentes acessiveis |
| Estilizacao | TailwindCSS | Utility-first CSS |
| Validacao | Zod | Schemas de validacao (client + server) |
| ORM | Prisma | Acesso ao banco de dados |
| Banco de dados | PostgreSQL | Persistencia |
| Autenticacao | NextAuth.js v4 | Login email/senha + Google |
| State management | Zustand | Estado do form builder |
| Formularios | React Hook Form | Gerenciamento de inputs do renderer |
| Drag & Drop | @dnd-kit | Reordenacao de perguntas |
| Animacoes | Framer Motion | Transicoes do modo TypeForm |
| Graficos | Recharts | Dashboard de respostas |
| Exportacao | exceljs, @react-pdf/renderer | XLSX e PDF |

---

## Estrutura de Pastas

```
visus-forms/
  app/
    (auth)/                          # Rotas de autenticacao (layout centralizado)
      login/page.tsx
      register/page.tsx
      layout.tsx
    (dashboard)/                     # Rotas protegidas (layout com sidebar)
      layout.tsx
      page.tsx                       # Dashboard home
      workspaces/
        page.tsx                     # Lista de workspaces
        new/page.tsx
        [workspaceId]/
          layout.tsx
          page.tsx                   # Overview do workspace
          settings/page.tsx
          members/page.tsx
          workflows/
            page.tsx
            new/page.tsx
            [workflowId]/page.tsx    # Forms do workflow
      forms/
        [formId]/
          layout.tsx                 # Layout do builder (tabs)
          edit/page.tsx              # Form builder
          settings/page.tsx
          theme/page.tsx
          logic/page.tsx             # Regras condicionais
          preview/page.tsx
          responses/
            page.tsx                 # Dashboard de respostas
            [responseId]/page.tsx
    f/                               # Rotas PUBLICAS (respondente)
      [slug]/
        page.tsx                     # Formulario publico
        success/page.tsx
    api/
      auth/
        [...nextauth]/route.ts
        register/route.ts
      workspaces/
        route.ts
        [workspaceId]/
          route.ts
          members/route.ts
          workflows/route.ts
      forms/
        route.ts
        [formId]/
          route.ts
          settings/route.ts
          theme/route.ts
          publish/route.ts
          duplicate/route.ts
          questions/
            route.ts
            reorder/route.ts
            [questionId]/
              route.ts
              options/route.ts
              rules/route.ts
          responses/
            route.ts
            export/route.ts
            stats/route.ts
            [responseId]/route.ts
      submit/
        [formSlug]/
          route.ts
          upload/route.ts
          partial/route.ts
    layout.tsx                       # Root layout (providers)
    page.tsx                         # Landing ou redirect
  components/
    ui/                              # ShadcnUI (gerado)
    auth/
      login-form.tsx
      register-form.tsx
    dashboard/
      sidebar.tsx
      header.tsx
      workspace-switcher.tsx
    form-builder/
      builder-canvas.tsx
      builder-header.tsx
      question-card.tsx
      question-type-picker.tsx
      question-editor/               # Um editor por tipo
      question-settings.tsx
      logic-builder/
        conditional-logic-panel.tsx
        logic-rule-row.tsx
      preview/
        device-frame.tsx
        builder-preview.tsx
      theme-editor/
        theme-editor.tsx
        color-picker.tsx
        font-selector.tsx
    form-elements/                   # Inputs compartilhados (builder + publico)
      short-text-input.tsx
      long-text-input.tsx
      multiple-choice-input.tsx
      single-select-input.tsx
      dropdown-input.tsx
      number-input.tsx
      date-input.tsx
      rating-input.tsx
      file-upload-input.tsx
      yes-no-input.tsx
      email-input.tsx
      phone-input.tsx
      url-input.tsx
      statement-display.tsx
    form-renderer/
      form-renderer.tsx              # Orquestrador (escolhe modo)
      typeform-renderer.tsx          # Uma pergunta por vez
      classic-renderer.tsx           # Todas de uma vez
      progress-bar.tsx
      navigation-buttons.tsx
    responses/
      responses-table.tsx
      response-detail.tsx
      stats-dashboard.tsx
      export-dialog.tsx
  lib/
    prisma.ts                        # Singleton PrismaClient
    auth.ts                          # Config NextAuth
    schemas/
      question-config.ts             # Zod schemas por tipo de pergunta
      form.ts
      workspace.ts
      response.ts
    services/
      conditional-engine.ts          # Motor de branching (isomorfico)
      export-service.ts              # CSV, XLSX, PDF
      form-service.ts
      response-service.ts
    utils/
      slug.ts
      pagination.ts
      file-storage.ts
  stores/
    form-builder-store.ts            # Zustand store
  types/
    form.ts                          # Tipos centrais
  prisma/
    schema.prisma
  docs/
  public/
```

---

## Decisoes de Arquitetura

### 1. Polimorfismo de perguntas via JSON `config`

Cada `Question` tem um campo `config: Json` cujo schema Zod varia conforme o `QuestionType`. Isso evita dezenas de tabelas ou colunas nullable.

```
Question { type: RATING, config: { maxValue: 5, icon: "star" } }
Question { type: FILE_UPLOAD, config: { maxSizeMb: 10, allowedMimeTypes: ["image/*"] } }
```

### 2. Respostas com colunas tipadas

O modelo `Answer` tem colunas `textValue`, `numberValue`, `booleanValue`, `dateValue`, `jsonValue`. Isso permite queries SQL eficientes (AVG, COUNT) sem desserializar JSON.

### 3. Motor condicional isomorfico

`conditional-engine.ts` e TypeScript puro sem dependencias de plataforma. Roda no client (preview, respondente) e no server (validacao de submissao).

### 4. Dois renderers separados

`TypeformRenderer` e `ClassicRenderer` sao componentes distintos porque o UX e state management sao fundamentalmente diferentes. Compartilham os componentes de `form-elements/`.

### 5. Zustand para o builder, React Hook Form para o renderer

- **Builder**: edita metadata (definicoes de perguntas) -- Zustand com undo/redo
- **Renderer**: coleta respostas de um formulario -- React Hook Form com validacao Zod

### 6. FormSettings e FormTheme como modelos 1:1

Separacao de concerns: comportamento (settings) vs. aparencia (theme). Facilita updates independentes.

---

## Fluxos Principais

### Criacao de Formulario
```
Login -> Dashboard -> Workspace -> Workflow -> "Novo Form"
  -> POST /api/forms
  -> Redirect /forms/[formId]/edit
  -> Builder: arrastar perguntas, configurar opcoes
  -> POST/PATCH /api/forms/[formId]/questions
  -> Aba Logic: regras condicionais
  -> "Publicar" -> POST /api/forms/[formId]/publish
  -> Link publico: /f/{slug}
```

### Preenchimento (Respondente)
```
Acessa /f/{slug}
  -> GET /api/submit/{slug} (carrega form)
  -> Renderiza conforme presentationMode
  -> Motor condicional avalia branching
  -> POST /api/submit/{slug} (submissao)
  -> Validacao server-side
  -> Redirect /f/{slug}/success
```

### Exportacao de Respostas
```
Dashboard -> /forms/[formId]/responses
  -> GET /api/forms/[formId]/responses
  -> "Exportar" -> GET /api/forms/[formId]/responses/export?format=xlsx
  -> Download do arquivo
```

---

## Dependencias Principais

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "@prisma/client": "^6.x",
    "next-auth": "^4.x",
    "@auth/prisma-adapter": "^2.x",
    "bcryptjs": "^2.x",
    "zod": "^3.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zustand": "^5.x",
    "zundo": "^2.x",
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^9.x",
    "framer-motion": "^11.x",
    "@tanstack/react-table": "^8.x",
    "recharts": "^2.x",
    "exceljs": "^4.x",
    "@react-pdf/renderer": "^4.x",
    "nanoid": "^5.x",
    "lucide-react": "latest",
    "date-fns": "^3.x",
    "react-colorful": "^5.x"
  }
}
```
