# Auditoria de UX/UI - Visus Forms

**Data:** 25/03/2026
**Auditor:** Agente UX/UI Designer
**Plataforma:** Visus Forms (clone TypeForm)

---

## Resumo Executivo

| Prioridade | Quantidade | Foco principal |
|---|---|---|
| **ALTO** | 7 | Mobile, acessibilidade, consistencia, textos PT-BR |
| **MEDIO** | 14 | Confirmacoes, feedback, design system, responsividade |
| **BAIXO** | 4 | Loading states, erro recovery, polish |

**Total: 25 problemas identificados**

---

## PROBLEMAS DE ALTO IMPACTO

### ~~1. Pagina de registro~~ — REMOVIDO (sistema interno, sem cadastro publico)

---

### 2. Botao "Criar Formulario" na sidebar e enganoso

- **Arquivo:** `src/components/dashboard/sidebar.tsx` (linha ~68-74)
- **Problema:** O botao redireciona para `/dashboard/workspaces` (listagem de workspaces) em vez de iniciar criacao de formulario. Usuario precisa de 4 cliques para criar um formulario: Workspaces > selecionar workspace > selecionar workflow > "Novo Formulario".
- **Impacto:** O botao mais proeminente da sidebar nao faz o que promete. Alta friccao no fluxo principal.
- **Correcao:**
  - Abrir modal de criacao rapida com selecao de workspace/workflow
  - Ou implementar wizard de criacao guiada

---

### 3. Builder completamente inutilizavel no mobile

- **Arquivos:**
  - `src/components/form-builder/builder-header.tsx` (linha ~62): abas usam `hidden md:flex` sem alternativa
  - `src/components/form-builder/builder-canvas.tsx` (linha ~134): sidebar com `w-72` fixo (288px)
  - `src/components/form-builder/theme-editor.tsx` (linha ~192): sidebar com `w-[300px] shrink-0`
- **Problema:** No mobile (< 768px), as abas desaparecem sem alternativa, o canvas fica espremido, e os paineis laterais nao se adaptam.
- **Impacto:** Usuario fica preso na aba Editor no mobile, sem acesso a Design, Logica, Compartilhar ou Respostas.
- **Correcao:**
  - Adicionar navegacao mobile com Sheet ou DropdownMenu para as abas
  - Tornar paineis laterais responsivos (full-width no mobile, overlay ou sheet)
  - Usar breakpoints para adaptar o canvas

---

### 4. Nao existem breadcrumbs em nenhuma pagina

- **Escopo:** Projeto inteiro (zero ocorrencias de "breadcrumb")
- **Problema:** Dentro de `workspaces/[id]/workflows/[id]`, o usuario nao tem contexto visual de onde esta na hierarquia. O unico caminho de "volta" e o browser ou a sidebar (que so tem 2 itens).
- **Impacto:** Desorientacao na navegacao, especialmente em paginas aninhadas.
- **Correcao:**
  - Criar componente `Breadcrumb` reutilizavel (pode usar o do shadcn)
  - Aplicar em todas as paginas internas do dashboard
  - Formato sugerido: Dashboard > Workspace X > Workflow Y > Formulario Z

---

### 5. Tres padroes de botao diferentes no projeto

- **Padroes encontrados:**
  1. `btn-primary-gradient` (classe customizada em CSS) - usado na maioria dos lugares
  2. `<Button>` do shadcn - usado em `workflows/new/page.tsx`, `question-options-editor.tsx`
  3. `<button>` nativo com classes Tailwind - usado em varios componentes do builder
- **Problema:** Cada padrao tem border-radius, padding, hover e transicao diferentes. Falta coesao visual.
- **Correcao:**
  - Padronizar todos os botoes usando `<Button>` do shadcn com variantes customizadas
  - Mover o estilo `btn-primary-gradient` para uma variante do shadcn Button
  - Eliminar `<button>` nativos com Tailwind inline

---

### 6. Botoes somente-icone sem accessible name

- **Arquivos afetados:**
  - `src/components/dashboard/sidebar.tsx` (linha ~89): botao de logout
  - `src/components/dashboard/mobile-header.tsx` (linha ~21): botao de menu
  - `src/components/form-builder/builder-header.tsx` (linha ~53): botao de voltar
  - `src/components/form-builder/question-card.tsx`: botoes de copy, delete, edit
  - `src/components/shared/edit-delete-actions.tsx`: botoes de acoes
- **Problema:** Leitores de tela nao conseguem identificar a funcao desses botoes.
- **Impacto:** Plataforma inacessivel para usuarios com deficiencia visual.
- **Correcao:**
  - Adicionar `aria-label` descritivo em todos os botoes que contem apenas icones
  - Exemplos: `aria-label="Sair"`, `aria-label="Menu"`, `aria-label="Voltar"`

---

### 7. 30+ textos sem acentuacao correta em PT-BR

- **Problema sistematico** em praticamente todos os arquivos da interface. Exemplos:

| Arquivo | Texto incorreto | Texto correto |
|---|---|---|
| `dashboard/page.tsx:48` | "Voce ainda nao tem nenhum workspace" | "Voce ainda nao tem..." |
| `builder-header.tsx:18` | "Logica" | "Logica" |
| `builder-header.tsx:45,58` | "Formulario" | "Formulario" |
| `create-form-modal.tsx:55,74,82,117` | "Formulario"/"formulario" | "Formulario"/"formulario" |
| `create-workflow-modal.tsx:72` | "formularios" | "formularios" |
| `sidebar.tsx:67,71` | "Criar Formulario" / "Usuario" | "Criar Formulario" / "Usuario" |
| `question-type-picker.tsx:66` | "Midia" | "Midia" |
| `question-options-editor.tsx:52,62,82` | "Opcoes"/"Opcao" | "Opcoes"/"Opcao" |
| `logic-panel.tsx:99,102` | "Logica"/"formulario"/"proxima" | Com acentos corretos |
| `share-panel.tsx:170` | "codigo"/"formulario" | "codigo"/"formulario" |
| `theme-editor.tsx:211` | "Cor primaria" | "Cor primaria" |
| `typeform-renderer.tsx:38+` | "invalido"/"numero" | "invalido"/"numero" |
| `classic-renderer.tsx:143+` | "obrigatorio"/"opcao" | "obrigatorio"/"opcao" |
| `success/page.tsx:17` | "formulario" | "formulario" |
| `register-form.tsx:18` | "Email invalido" | "E-mail invalido" |
| `edit-delete-actions.tsx:79` | "excluido" | "excluido" |

- **Correcao:** Varredura completa em todos os arquivos e correcao de acentuacao

---

### 8. Pagina de sucesso generica e desconectada do tema

- **Arquivo:** `src/app/f/[slug]/success/page.tsx`
- **Problema:** Mostra texto fixo generico com fundo branco. Nao usa a `confirmationMessage` configurada no formulario, nem respeita o tema (cores, logo, fonte).
- **Impacto:** A experiencia do respondente e desconectada do branding do formulario.
- **Correcao:**
  - Buscar dados do formulario (tema + confirmationMessage) na pagina de sucesso
  - Aplicar cores, fonte e logo do tema
  - Renderizar a mensagem personalizada configurada pelo criador

---

## PROBLEMAS DE MEDIO IMPACTO

### 9. Delete de pergunta sem confirmacao

- **Arquivo:** `src/components/form-builder/question-card.tsx` (linha ~110-117)
- **Problema:** `handleDelete()` faz DELETE direto na API sem dialog de confirmacao. Ironicamente, o `edit-delete-actions.tsx` para workspace/workflow TEM confirmacao.
- **Correcao:** Adicionar `AlertDialog` antes de deletar pergunta

---

### 10. Publicar/Despublicar sem confirmacao

- **Arquivo:** `src/components/form-builder/builder-header.tsx` (linhas ~32-47)
- **Problema:** `handlePublish` altera o status sem dialog. Despublicar um formulario ativo pode afetar respondentes em andamento.
- **Correcao:** Adicionar dialog de confirmacao com aviso de impacto

---

### 11. Falta "Esqueci minha senha"

- **Arquivo:** `src/components/auth/login-form.tsx`
- **Problema:** Formulario de login sem link de recuperacao de senha.
- **Correcao:** Implementar fluxo de reset de senha (envio de email + pagina de redefinicao)

---

### 12. Indicador de status de save sem texto/tooltip

- **Arquivo:** `src/components/form-builder/builder-header.tsx` (linhas ~80-84)
- **Problema:** Mostra apenas icones (check, spinner, cloud, X) sem nenhum texto ou tooltip explicativo.
- **Correcao:** Adicionar `Tooltip` do shadcn com texto descritivo ("Salvo", "Salvando...", "Alteracoes nao salvas", "Erro ao salvar")

---

### 13. Cores hardcoded fora do design system

- **Arquivos:**
  - `src/app/(dashboard)/dashboard/forms/page.tsx`: `bg-gray-100 text-gray-600`, `bg-green-100 text-green-700`
  - `src/components/form-builder/question-card.tsx`: `bg-blue-100`, `bg-violet-100`, `bg-amber-100`, `bg-rose-100`
- **Problema:** Cores fora dos tokens do design system. Se o tema mudar, essas cores nao acompanham.
- **Correcao:** Substituir por tokens semanticos (success, destructive, muted, accent)

---

### 14. Border-radius inconsistente

- **Problema:** Mix de `rounded-3xl` (login, new-workspace), `rounded-2xl` (cards), `rounded-xl` (botoes builder), `rounded-lg` (inputs), `rounded-md` (question-type-picker) sem padrao claro.
- **Correcao:** Definir escala de border-radius no design system e aplicar consistentemente

---

### 15. Tipografia com tamanhos arbitrarios

- **Problema:** Uso extensivo de `text-[9px]`, `text-[10px]`, `text-[11px]` em dezenas de locais, criando escala tipografica fragmentada.
- **Correcao:** Substituir por presets do Tailwind (`text-xs` = 12px, `text-sm` = 14px, etc.)

---

### 16. Drag and drop inconsistente

- **Arquivos:**
  - `src/components/form-builder/builder-canvas.tsx`: usa @dnd-kit (feedback visual, keyboard support)
  - `src/components/form-builder/theme-editor.tsx`: usa drag nativo HTML (`draggable`, `onDragStart`)
- **Problema:** O drag nativo nao tem ghost/placeholder visual e funciona mal no mobile.
- **Correcao:** Padronizar ambos com @dnd-kit

---

### 17. Inputs sem focus ring visivel

- **Arquivos:** Varios inputs com `border-0` e `focus-visible:ring-0` explicito (ex: `question-card.tsx`, linha ~210)
- **Problema:** Elimina totalmente o indicador de foco. Compromete navegacao por teclado.
- **Correcao:** Garantir focus ring visivel (ring-2 ring-primary/50) em todos os inputs interativos

---

### 18. Selects sem labels associados

- **Arquivo:** `src/components/form-builder/logic-rule-row.tsx`
- **Problema:** `<select>` sem `<label>` associado nem `aria-label`.
- **Correcao:** Adicionar labels acessiveis (`aria-label` ou `<label htmlFor>`)

---

### 19. Loading do formulario publico minimalista

- **Arquivo:** `src/app/f/[slug]/page.tsx` (linhas ~99-104)
- **Problema:** Apenas um spinner centralizado em fundo branco, sem skeleton ou indicacao de contexto.
- **Correcao:** Adicionar skeleton simulando estrutura do formulario

---

### 20. Dashboard loading sem padding consistente

- **Arquivo:** `src/app/(dashboard)/dashboard/loading.tsx`
- **Problema:** Nao tem o padding `px-8 py-8` das paginas reais, causando salto visual na transicao.
- **Correcao:** Alinhar padding do loading com as paginas

---

### 21. Duplicidade dashboard/page.tsx vs workspaces/page.tsx

- **Arquivos:** `src/app/(dashboard)/dashboard/page.tsx` e `src/app/(dashboard)/dashboard/workspaces/page.tsx`
- **Problema:** Ambas renderizam listagem de workspaces com comportamentos diferentes (modal vs pagina inteira para criacao).
- **Correcao:** Unificar comportamento ou diferenciar claramente o proposito

---

### 22. Pagina de criar workflow com visual diferente

- **Arquivo:** `src/app/(dashboard)/dashboard/workspaces/[workspaceId]/workflows/new/page.tsx`
- **Problema:** Usa `Card/CardHeader/CardContent` do shadcn, enquanto o resto do dashboard usa design system customizado (rounded-3xl, bg-surface-container-lowest, shadow-ambient).
- **Correcao:** Alinhar visual com o padrao do dashboard

---

## PROBLEMAS DE BAIXO IMPACTO

### 23. Validacao silenciosa em modais de criacao

- **Arquivos:** `create-form-modal.tsx`, `create-workspace-modal.tsx`, `create-workflow-modal.tsx`
- **Problema:** Validam com `if (!name.trim()) return;` - silenciosamente nao fazem nada sem mensagem de erro.
- **Correcao:** Exibir mensagem de erro visual quando campo obrigatorio esta vazio

---

### 24. Paginas internas sem loading.tsx

- **Paginas afetadas:** `workspaces/[workspaceId]/page.tsx`, `workflows/[workflowId]/page.tsx`
- **Problema:** Sem loading state dedicado, usuario ve tela anterior ou nada enquanto carrega.
- **Correcao:** Adicionar `loading.tsx` com skeleton

---

### 25. Tela de erro de formulario sem acao de recuperacao

- **Arquivo:** `src/app/f/[slug]/page.tsx` (linhas ~108-117)
- **Problema:** Mostra "Formulario indisponivel" sem botao de "Tentar novamente".
- **Correcao:** Adicionar botao de retry com `router.refresh()`

---

### 26. Sem header reutilizavel no dashboard

- **Problema:** Componente Header existe mas e minimo, sem breadcrumbs ou acoes contextuais.
- **Correcao:** Enriquecer header com breadcrumbs e acoes relevantes por pagina

---

## ORDEM DE EXECUCAO SUGERIDA

### Sprint 1 - Critico (ALTO)
1. Corrigir acentuacao em todos os textos PT-BR (#7)
2. Adicionar `aria-label` em botoes de icone (#6)
3. Corrigir botao "Criar Formulario" na sidebar (#2)
4. Padronizar botoes com shadcn Button (#5)

### Sprint 2 - Estrutural (ALTO + MEDIO)
6. Criar componente Breadcrumb e aplicar (#4)
7. Tornar builder responsivo no mobile (#3)
8. Pagina de sucesso com tema e mensagem configurada (#8)
9. Adicionar confirmacao em delete de pergunta (#9)
10. Adicionar confirmacao em publicar/despublicar (#10)

### Sprint 3 - Polish (MEDIO)
11. Corrigir cores hardcoded para tokens (#13)
12. Padronizar border-radius (#14)
13. Corrigir tipografia arbitraria (#15)
14. Tooltip no indicador de save (#12)
15. Focus rings em inputs (#17)

### Sprint 4 - Refinamento (MEDIO + BAIXO)
16. Padronizar drag and drop (#16)
17. Loading states e skeletons (#19, #20, #24)
18. Labels em selects (#18)
19. Validacao visivel em modais (#23)
20. Botao retry na tela de erro (#25)

---

## VERIFICACAO

- [ ] Testar fluxo completo: login -> criar workspace -> workflow -> form -> publicar -> responder -> ver respostas
- [ ] Testar em mobile (< 768px) todas as paginas
- [ ] Rodar audit de acessibilidade (axe-core ou Lighthouse)
- [ ] Verificar todos os textos PT-BR com acentuacao correta
- [ ] Validar consistencia visual entre paginas
