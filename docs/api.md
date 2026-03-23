# Documentacao da API

Todas as rotas usam o App Router do Next.js (`app/api/`).

**Convencoes**:
- Rotas protegidas: validadas via `getServerSession()` (NextAuth)
- Validacao: toda entrada validada com Zod
- Paginacao: `?page=1&limit=20&sortBy=createdAt&order=desc`
- Resposta de listagem: `{ data: [...], meta: { total, page, limit } }`
- Resposta de erro: `{ error: string, details?: ZodError }`

---

## Autenticacao

### `POST /api/auth/register`
Registro de novo usuario com email/senha.

**Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string (min 8 chars)"
}
```

**Resposta**: `201 Created` com dados do usuario (sem passwordHash).

### `[...nextauth]`
Rotas automaticas do NextAuth: `/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`, etc.

---

## Workspaces

### `GET /api/workspaces`
Lista workspaces do usuario autenticado.

### `POST /api/workspaces`
Cria novo workspace.

**Body**:
```json
{
  "name": "string",
  "description": "string?"
}
```

### `GET /api/workspaces/[workspaceId]`
Retorna detalhes do workspace.

### `PATCH /api/workspaces/[workspaceId]`
Atualiza workspace.

### `DELETE /api/workspaces/[workspaceId]`
Remove workspace (apenas OWNER).

---

## Membros do Workspace

### `GET /api/workspaces/[workspaceId]/members`
Lista membros do workspace.

### `POST /api/workspaces/[workspaceId]/members`
Convida membro.

**Body**:
```json
{
  "email": "string",
  "role": "ADMIN | MEMBER | VIEWER"
}
```

### `PATCH /api/workspaces/[workspaceId]/members/[memberId]`
Atualiza role do membro.

### `DELETE /api/workspaces/[workspaceId]/members/[memberId]`
Remove membro.

---

## Workflows

### `GET /api/workspaces/[workspaceId]/workflows`
Lista workflows do workspace.

### `POST /api/workspaces/[workspaceId]/workflows`
Cria novo workflow.

**Body**:
```json
{
  "name": "string",
  "description": "string?"
}
```

### `PATCH /api/workspaces/[workspaceId]/workflows/[workflowId]`
Atualiza workflow.

### `DELETE /api/workspaces/[workspaceId]/workflows/[workflowId]`
Remove workflow.

---

## Formularios

### `GET /api/forms`
Lista formularios do usuario. Suporta filtro por `workflowId`.

**Query**: `?workflowId=xxx&status=DRAFT|PUBLISHED`

### `POST /api/forms`
Cria novo formulario.

**Body**:
```json
{
  "workflowId": "string",
  "title": "string",
  "description": "string?"
}
```

### `GET /api/forms/[formId]`
Retorna formulario completo (com questions, settings, theme).

### `PATCH /api/forms/[formId]`
Atualiza formulario (titulo, descricao).

### `DELETE /api/forms/[formId]`
Remove formulario.

### `POST /api/forms/[formId]/publish`
Publica formulario (muda status para PUBLISHED, gera slug se necessario).

### `DELETE /api/forms/[formId]/publish`
Despublica (volta para DRAFT).

### `POST /api/forms/[formId]/duplicate`
Duplica formulario completo (questions, options, rules, settings, theme).

---

## Configuracoes do Formulario

### `GET /api/forms/[formId]/settings`
Retorna configuracoes.

### `PATCH /api/forms/[formId]/settings`
Atualiza configuracoes.

**Body** (todos opcionais):
```json
{
  "presentationMode": "ONE_AT_A_TIME | ALL_AT_ONCE",
  "showProgressBar": "boolean",
  "allowMultipleSubmissions": "boolean",
  "requireAuth": "boolean",
  "limitResponses": "number | null",
  "scheduledOpenAt": "datetime | null",
  "scheduledCloseAt": "datetime | null",
  "confirmationMessage": "string | null",
  "redirectUrl": "string | null",
  "notifyOnSubmission": "boolean",
  "notifyEmails": "string[]"
}
```

---

## Tema do Formulario

### `GET /api/forms/[formId]/theme`
Retorna tema.

### `PATCH /api/forms/[formId]/theme`
Atualiza tema.

**Body** (todos opcionais):
```json
{
  "primaryColor": "string (hex)",
  "backgroundColor": "string (hex)",
  "textColor": "string (hex)",
  "fontFamily": "string",
  "logoUrl": "string | null",
  "backgroundImageUrl": "string | null",
  "buttonStyle": "rounded | pill | square",
  "customCss": "string | null"
}
```

---

## Questoes

### `GET /api/forms/[formId]/questions`
Lista questoes do formulario (ordenadas por `order`).

### `POST /api/forms/[formId]/questions`
Adiciona questao.

**Body**:
```json
{
  "type": "QuestionType",
  "title": "string",
  "description": "string?",
  "placeholder": "string?",
  "required": "boolean",
  "config": "object (varia por tipo)",
  "options": [
    { "label": "string", "value": "string", "imageUrl": "string?" }
  ]
}
```

### `PATCH /api/forms/[formId]/questions/reorder`
Reordena questoes (bulk).

**Body**:
```json
{
  "questionIds": ["id1", "id2", "id3"]
}
```

### `GET /api/forms/[formId]/questions/[questionId]`
Retorna questao.

### `PATCH /api/forms/[formId]/questions/[questionId]`
Atualiza questao.

### `DELETE /api/forms/[formId]/questions/[questionId]`
Remove questao.

---

## Opcoes de Questao

### `POST /api/forms/[formId]/questions/[questionId]/options`
Adiciona opcao.

### `PATCH /api/forms/[formId]/questions/[questionId]/options/[optionId]`
Atualiza opcao.

### `DELETE /api/forms/[formId]/questions/[questionId]/options/[optionId]`
Remove opcao.

### `PATCH /api/forms/[formId]/questions/[questionId]/options/reorder`
Reordena opcoes.

---

## Regras Condicionais

### `GET /api/forms/[formId]/questions/[questionId]/rules`
Lista regras da questao.

### `POST /api/forms/[formId]/questions/[questionId]/rules`
Cria regra condicional.

**Body**:
```json
{
  "operator": "ConditionalOperator",
  "value": "string",
  "action": "ConditionalAction",
  "targetQuestionId": "string | null"
}
```

### `PATCH /api/forms/[formId]/questions/[questionId]/rules/[ruleId]`
Atualiza regra.

### `DELETE /api/forms/[formId]/questions/[questionId]/rules/[ruleId]`
Remove regra.

---

## Respostas

### `GET /api/forms/[formId]/responses`
Lista respostas com paginacao.

**Query**: `?page=1&limit=20&status=COMPLETED`

### `GET /api/forms/[formId]/responses/stats`
Estatisticas agregadas (total, taxa de conclusao, tempo medio, distribuicao por pergunta).

### `GET /api/forms/[formId]/responses/export`
Exporta respostas.

**Query**: `?format=csv|xlsx|pdf`

**Resposta**: arquivo para download com `Content-Disposition: attachment`.

### `GET /api/forms/[formId]/responses/[responseId]`
Resposta individual detalhada (com todas as answers).

### `DELETE /api/forms/[formId]/responses/[responseId]`
Remove resposta.

---

## Rotas Publicas (Respondente)

Estas rotas NAO requerem autenticacao (a menos que `FormSettings.requireAuth = true`).

### `GET /api/submit/[formSlug]`
Carrega formulario publico (form + questions + options + rules + theme).

Retorna `404` se form nao existe ou nao esta publicado.

### `POST /api/submit/[formSlug]`
Submete respostas.

**Body**:
```json
{
  "answers": [
    {
      "questionId": "string",
      "textValue": "string?",
      "numberValue": "number?",
      "booleanValue": "boolean?",
      "dateValue": "datetime?",
      "jsonValue": "any?"
    }
  ]
}
```

**Validacao server-side**:
1. Valida cada answer contra o Zod schema do tipo de questao
2. Re-avalia branching para garantir que apenas questoes alcancaveis foram respondidas
3. Verifica `required` apenas para questoes visiveis
4. Verifica limites (limitResponses, scheduledOpenAt/CloseAt)

### `PATCH /api/submit/[formSlug]/partial`
Salva progresso parcial (rascunho).

### `POST /api/submit/[formSlug]/upload`
Upload de arquivo para questoes do tipo FILE_UPLOAD.

**Body**: `multipart/form-data` com o arquivo.

**Resposta**: `{ url: "string", fileId: "string" }`

---

## Upload de Arquivos

### `POST /api/uploads/presign`
Gera URL pre-assinada para upload direto ao storage (S3/Vercel Blob).

**Body**:
```json
{
  "filename": "string",
  "mimeType": "string",
  "sizeBytes": "number"
}
```

**Resposta**:
```json
{
  "uploadUrl": "string",
  "fileKey": "string"
}
```
