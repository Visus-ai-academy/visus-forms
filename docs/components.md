# Catalogo de Componentes

## Organizacao

Os componentes estao organizados em 7 grupos dentro de `components/`:

```
components/
  ui/              -> ShadcnUI (gerado automaticamente)
  auth/            -> Login e registro
  dashboard/       -> Shell do app (sidebar, header)
  form-builder/    -> Editor de formularios
  form-elements/   -> Inputs compartilhados (builder + publico)
  form-renderer/   -> Renderizadores de formulario publico
  responses/       -> Dashboard de respostas
```

---

## Auth

### `LoginForm`
Formulario de login com email/senha e botao Google.
- Validacao com Zod + react-hook-form
- Chama `signIn()` do NextAuth

### `RegisterForm`
Formulario de registro com nome, email, senha, confirmacao.
- POST para `/api/auth/register`
- Redirect para login apos sucesso

---

## Dashboard

### `Sidebar`
Navegacao lateral do dashboard.
- Links: Workspaces, Forms, Settings
- Componente `WorkspaceSwitcher` embutido
- Colapsavel em mobile

### `Header`
Barra superior com:
- Breadcrumbs
- Busca (opcional)
- Avatar do usuario + dropdown (perfil, logout)

### `WorkspaceSwitcher`
Dropdown para alternar entre workspaces.
- Mostra workspace atual
- Lista todos os workspaces do usuario
- Botao "Criar workspace"

---

## Form Builder

### `BuilderHeader`
Barra superior do editor.
- Input editavel para titulo do form
- Indicador de save status (Salvo / Salvando... / Nao salvo)
- Botao Preview
- Botao Publicar

### `BuilderCanvas`
Area principal de edicao.
- Renderiza lista de `QuestionCard` dentro de `DndContext` + `SortableContext` do @dnd-kit
- Botao "Adicionar pergunta" abre `QuestionTypePicker`
- Area vazia mostra placeholder/CTA

### `QuestionCard`
Card individual de cada pergunta.
- Drag handle (arrastar para reordenar)
- Icone do tipo + titulo editavel
- Botoes: duplicar, deletar
- Badge "Obrigatoria" se `required = true`
- Expande para mostrar `QuestionEditor` ao clicar

### `QuestionTypePicker`
Modal ou drawer para escolher tipo de pergunta.
- Grid de icones organizados por categoria:
  - **Texto**: Short Text, Long Text
  - **Escolha**: Multiple Choice, Single Select, Dropdown, Yes/No
  - **Dados**: Number, Date, Email, Phone, URL
  - **Midia**: File Upload, Rating
  - **Outro**: Statement

### `QuestionEditor` (por tipo)
Editor especifico para cada tipo de pergunta:

| Componente | Tipo | Funcionalidades |
|---|---|---|
| `ShortTextEditor` | SHORT_TEXT | Placeholder, min/maxLength |
| `LongTextEditor` | LONG_TEXT | Placeholder, min/maxLength, rows |
| `MultipleChoiceEditor` | MULTIPLE_CHOICE | Lista de opcoes editavel, add/remove, drag reorder, min/maxSelections, allowOther |
| `SingleSelectEditor` | SINGLE_SELECT | Lista de opcoes editavel, randomize, allowOther |
| `DropdownEditor` | DROPDOWN | Lista de opcoes, searchable toggle |
| `NumberEditor` | NUMBER | Min, max, step, decimais, prefixo/sufixo |
| `DateEditor` | DATE | Min/max date, incluir horario, formato |
| `RatingEditor` | RATING | Max valor (2-10), tipo de icone, labels low/high |
| `FileUploadEditor` | FILE_UPLOAD | Tipos permitidos, tamanho maximo, max arquivos |
| `YesNoEditor` | YES_NO | Labels customizaveis (Sim/Nao) |
| `EmailEditor` | EMAIL | Dominios permitidos |
| `PhoneEditor` | PHONE | Codigo do pais, formato |
| `UrlEditor` | URL | Protocolos permitidos |
| `StatementEditor` | STATEMENT | Texto do botao |

### `QuestionSettings`
Painel lateral ou secao do card com:
- Toggle "Obrigatoria"
- Campo descricao
- Regras de validacao especificas do tipo

### `ConditionalLogicPanel`
Painel lateral para configurar branching.
- Lista de regras da pergunta selecionada
- Botao "Adicionar regra"
- Cada regra e um `LogicRuleRow`

### `LogicRuleRow`
Editor de uma regra condicional:
- "Se a resposta da pergunta [select] [operador] [valor]"
- "Entao [acao] [pergunta destino]"
- Botao remover regra

### `DeviceFrame`
Frame de preview que simula dispositivos.
- Modo desktop: 1280px width
- Modo mobile: 375px width com bordas de celular
- Toggle entre modos

### `BuilderPreview`
Overlay ou split-pane que renderiza o formulario em tempo real.
- Usa `FormRenderer` (mesmo componente do publico)
- Dados vem do Zustand store
- Atualiza em tempo real conforme edita

### `ThemeEditor`
Painel lateral para personalizar aparencia:
- `ColorPicker` (react-colorful) para primaryColor, backgroundColor, textColor
- `FontSelector` dropdown com fontes populares
- Upload de logo
- Seletor de background (cor solida ou imagem)
- Estilo de botao (rounded, pill, square)
- Preview em tempo real

---

## Form Elements (Inputs Compartilhados)

Estes componentes sao usados tanto no preview do builder quanto no formulario publico. Todos integram com react-hook-form via `Controller`.

| Componente | Props principais |
|---|---|
| `ShortTextInput` | placeholder, maxLength |
| `LongTextInput` | placeholder, maxLength, rows |
| `MultipleChoiceInput` | options[], minSelections, maxSelections |
| `SingleSelectInput` | options[], layout (vertical/horizontal) |
| `DropdownInput` | options[], searchable, placeholder |
| `NumberInput` | min, max, step, prefix, suffix |
| `DateInput` | minDate, maxDate, includeTime, format |
| `RatingInput` | maxValue, icon (star/heart/thumbsUp/number) |
| `FileUploadInput` | allowedTypes, maxSizeMb, maxFiles |
| `YesNoInput` | yesLabel, noLabel |
| `EmailInput` | placeholder, allowedDomains |
| `PhoneInput` | defaultCountryCode, format |
| `UrlInput` | placeholder, allowedProtocols |
| `StatementDisplay` | buttonText (nao coleta resposta) |

---

## Form Renderer

### `FormRenderer`
Componente orquestrador que escolhe o modo de apresentacao.
- Recebe `FormDefinition` completa
- Se `presentationMode === ONE_AT_A_TIME`: renderiza `TypeformRenderer`
- Se `presentationMode === ALL_AT_ONCE`: renderiza `ClassicRenderer`
- Aplica `ThemeProvider` com CSS custom properties

### `TypeformRenderer`
Modo "uma pergunta por vez" (estilo TypeForm).
- Gerencia `currentQuestionIndex` via state local
- Usa `framer-motion` `AnimatePresence` para transicoes (slide up/down)
- Integra com `conditional-engine` para determinar proxima pergunta
- Suporte a navegacao por teclado (Enter, setas)
- Renderiza `ProgressBar` e `NavigationButtons`

### `ClassicRenderer`
Modo "todas de uma vez" (estilo Google Forms).
- Renderiza todas as perguntas visiveis em scroll vertical
- Usa `useWatch` do react-hook-form para re-avaliar visibilidade
- Perguntas condicionais aparecem/desaparecem com animacao
- Botao de submit no final

### `ProgressBar`
Barra de progresso horizontal.
- Calcula porcentagem baseado em perguntas respondidas / total alcancavel
- Animacao suave com framer-motion

### `NavigationButtons`
Botoes de navegacao do modo TypeForm.
- "Anterior" e "Proximo" / "Enviar"
- Atalhos de teclado mostrados como hints

---

## Responses

### `ResponsesTable`
Tabela de respostas usando `@tanstack/react-table`.
- Colunas dinamicas geradas a partir das perguntas do form
- Sorting por coluna
- Filtros por status, data
- Paginacao
- Toggle de visibilidade de colunas
- Cell renderers por tipo (estrelas para rating, link para file, etc.)

### `ResponseDetail`
Visualizacao de uma resposta individual.
- Layout card-based: cada pergunta + resposta do usuario
- Metadados: data, duracao, status
- Navegacao prev/next entre respostas

### `StatsDashboard`
Dashboard analitico com graficos.
- Grid responsiva de cards, um por pergunta
- Tipo de grafico varia conforme tipo de pergunta:
  - Choice/Yes-No: Pie chart + bar chart
  - Rating: distribuicao em barras + media
  - Number: histograma + estatisticas (media, mediana, min, max)
  - Text: lista de respostas mais comuns
- Card de resumo: total, taxa de conclusao, tempo medio

### `ExportDialog`
Modal de exportacao.
- Opcoes: CSV, XLSX, PDF
- Filtros: todas as respostas ou apenas as filtradas
- Botao de download
- Loading state durante geracao

---

## State Management

### Zustand Store (`form-builder-store.ts`)

Usado exclusivamente no **Form Builder**:

```typescript
interface FormBuilderStore {
  // State
  form: FormDefinition;
  selectedQuestionId: string | null;
  isDirty: boolean;
  saveStatus: "saved" | "saving" | "unsaved" | "error";
  activePanel: "questions" | "logic" | "theme" | "preview" | null;
  previewDevice: "desktop" | "mobile";

  // Question CRUD
  addQuestion: (type: QuestionType, index?: number) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  duplicateQuestion: (id: string) => void;
  reorderQuestions: (activeId: string, overId: string) => void;

  // Logic CRUD
  addLogicRule: (rule: Omit<LogicRule, "id">) => void;
  updateLogicRule: (id: string, updates: Partial<LogicRule>) => void;
  removeLogicRule: (id: string) => void;

  // Theme
  updateTheme: (updates: Partial<FormTheme>) => void;

  // Form meta
  updateFormMeta: (updates: Partial<Pick<FormDefinition, "title" | "description">>) => void;

  // Persistence
  saveForm: () => Promise<void>;

  // UI
  setSelectedQuestion: (id: string | null) => void;
  setActivePanel: (panel: string | null) => void;
  setPreviewDevice: (device: "desktop" | "mobile") => void;
}
```

**Middleware**:
- `zundo`: undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- Auto-save debounced (2s apos ultima alteracao)

### React Hook Form

Usado exclusivamente no **Form Renderer** (formulario publico):
- Schema Zod gerado dinamicamente a partir da `FormDefinition`
- `useForm()` com `zodResolver`
- `Controller` para cada `form-element`
- `useWatch()` para re-avaliacao de visibilidade condicional
