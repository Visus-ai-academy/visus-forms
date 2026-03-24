# Design System: The Elevated Dialogue

Baseado no DESIGN.md e nas referencias visuais do Figma/Stitch.

---

## North Star

**"The Digital Atelier"** — formularios como experiencias premium editoriais, nao como planilhas mecanicas. Modelo mental: "form-as-a-conversation".

---

## Cores

### Paleta Principal

| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | #3730a3 | CTAs, acentos, indicadores ativos |
| `primary-container` | #4f4bbc | Gradientes em botoes primarios |
| `primary-fixed` | #e8e6ff | Tiles selecionados, highlights leves |
| `on-surface` | #191c1e | Texto principal (nunca #000) |
| `surface` | #f7f9fb | Canvas principal / background base |
| `surface-container-low` | #f2f4f6 | Sidebar, inputs agrupados |
| `surface-container-lowest` | #ffffff | Cards ativos, pergunta focada |
| `surface-container-high` | #e8eaed | Botoes secundarios |
| `surface-dim` | #d9dbe0 | Separadores tonais |
| `surface-bright` | #fdfdff | Zonas de drop (upload) |
| `outline-variant` | #c5c5d4 | Ghost borders (15% opacity) |
| `tertiary` | #6c3400 | Anomalias em graficos |
| `success` | #16a34a | Badges "Active", confirmacoes |
| `destructive` | #dc2626 | Erros, alertas |

### Regra "No-Line"

**Bordas de 1px sao proibidas para secionar.** Limites visuais sao definidos por mudancas de cor de fundo (surface tiers). Excepcao: ghost borders em inputs (outline-variant a 15% opacity).

### Regra "Glass & Gradient"

- Headers flutuantes: `backdrop-blur-[20px]` com 60% opacity
- Botoes primarios: gradiente `primary` → `primary-container`
- FABs: shadow com 32px blur, 6% opacity

---

## Tipografia

### Fontes

| Fonte | Uso |
|-------|-----|
| **Manrope** (700, 800) | Display, headlines, titulos de perguntas |
| **Inter** (400, 500, 600) | Body, labels, metadata, inputs |

### Escala

| Token | Fonte | Tamanho | Peso | Uso |
|-------|-------|---------|------|-----|
| `display-lg` | Manrope | 3rem (48px) | 800 | Tela de boas-vindas, titulo do form publico |
| `headline-lg` | Manrope | 2rem (32px) | 700 | Titulo de secao principal |
| `headline-md` | Manrope | 1.5rem (24px) | 700 | Titulo de pergunta |
| `title-lg` | Manrope | 1.25rem (20px) | 700 | Subtitulos, card headers |
| `body-lg` | Inter | 1.125rem (18px) | 400 | Respostas do respondente |
| `body-md` | Inter | 1rem (16px) | 400 | Texto geral |
| `body-sm` | Inter | 0.875rem (14px) | 400 | Helper text, descricoes |
| `label-lg` | Inter | 0.875rem (14px) | 600 | Labels de input, badges |
| `label-md` | Inter | 0.75rem (12px) | 500 | Metadata, timestamps |
| `label-sm` | Inter | 0.6875rem (11px) | 500 | Micro-labels |

**Regra:** Sempre pular um tamanho na escala para contraste dramatico (ex: `headline-lg` + `body-sm`).

---

## Elevacao & Profundidade

- **Sem sombras pesadas.** Profundidade vem de tiers de surface primeiro.
- **Ambient shadow** (floating elements): `0 4px 32px rgba(25, 28, 30, 0.06)`
- **Ghost border** (inputs): `outline-variant` a 15% opacity, transiciona para 2px `primary` bottom-stroke no focus
- Cards internos: `surface-container-lowest` sobre `surface-container`

---

## Componentes

### Botoes

- **Primario:** Gradiente (`primary` → `primary-container`), border-radius 1.5rem, texto branco. Hover: +10% brilho. Tap: scale(0.98).
- **Secundario:** Background `surface-container-high`, texto `on-secondary-container`. Sem borda.
- **Ghost:** Transparente, texto `primary`. Hover: background `primary-fixed`.

### Cards de Workflow

- Background `surface-container-lowest` (branco)
- Border-radius 1rem
- Sem borda visivel (tonal separation do canvas `surface`)
- Badge de status: verde "ACTIVE", cinza "DRAFT"
- Metricas (responses, completion) em `label-md`

### Sidebar

- Background `surface-container-low` (#f2f4f6)
- Item ativo: background `primary-fixed`, texto `primary`, icone `primary`
- Item inativo: texto `on-surface` a 60% opacity
- Logo "Visus-Forms" + subtitle "DIGITAL ATELIER" em `label-sm`
- Botao "Create New Form": gradiente primary, border-radius 1.5rem

### Form Builder (Editor)

- Layout 3 colunas: sidebar esquerda (questions list) | canvas central | painel direito (design & style)
- Tabs no topo: EDITOR, LOGIC, DESIGN, SHARE, RESULTS
- Questions list: cards com tipo tag (colorido), titulo, handle de drag
- Canvas central: preview live com placeholder "Type your question here" em Manrope
- Painel direito: color palette, typography selectors, layout toggle, background image

### Form Publico (Respondente)

- Uma pergunta por tela (modo TypeForm)
- Numero + categoria em `label-lg` uppercase com circulo `primary`
- Titulo da pergunta em `display-lg` Manrope (grande, dramatico)
- Descricao em `body-lg` Inter
- Tile Selectors para escolhas (nao radio buttons tradicionais):
  - Cards `surface-container-low`, border-radius 1rem
  - Icone + titulo bold + descricao
  - Selecionado: background `primary-fixed`, ghost border `primary`
- Botao "Next Question →": gradiente primary, border-radius 1.5rem
- "Press Enter" hint ao lado do botao
- Progress bar no rodape: azul/indigo
- Navegacao: setas < > no canto inferior direito
- Branding: logo + nome no canto inferior direito

### Painel de Respostas

- Top: 4 stat cards com icone colorido + valor grande + label
- Graficos: bar chart azul/indigo para trends, lista para sources
- Tabela de respostas: sem bordas de celula, zebra striping com surface tiers
- Avatares nos rows da tabela
- Rating com estrelas amarelas
- Badges de nivel (Senior, Mid-Level)
- Paginacao no rodape

---

## Spacing

| Token | Valor | Uso |
|-------|-------|-----|
| `spacing-2` | 0.5rem | Gap interno minimo |
| `spacing-4` | 1rem | Gap entre elementos inline |
| `spacing-6` | 1.5rem | Padding de cards |
| `spacing-8` | 2rem | Padding de graficos |
| `spacing-10` | 2.5rem | Gap entre perguntas (substitui dividers) |
| `spacing-12` | 3rem | Padding de upload zones |
| `spacing-16` | 4rem | Gap entre secoes |
| `spacing-20` | 5rem | Breathing room entre major sections |

---

## Interacoes

### Fluid Flow (transicao entre perguntas)

- Duracao: 400ms ease-in-out
- Saida: scale(0.95) + fade out
- Entrada: scale(1.05) → scale(1) + fade in
- Cria sensacao de movimento 3D

### Hover States

- Cards: sutil shift de background (surface → surface-container-lowest)
- Botoes primarios: gradiente +10% brightness
- Links: underline com transicao

### Focus States

- Inputs: ghost border → 2px primary bottom-stroke
- Tiles: background → primary-fixed
- Nunca usar focus ring azul do browser

---

## Do's and Don'ts

### Do

- Abracar white space generoso (spacing-16/20 entre secoes)
- Usar transicoes tonais para separar areas
- Border-radius: 1rem (lg) e 1.5rem (xl)
- Manrope para impacto, Inter para funcionalidade

### Don't

- Nunca usar bordas de 1px para seccionar
- Nunca usar #000000 (usar #191c1e)
- Nunca usar focus rings do browser
- Nunca usar sombras pesadas/escuras
