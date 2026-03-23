# Schema do Banco de Dados

## Visao Geral

O schema cobre **14 modelos** organizados em 4 dominios:

| Dominio | Modelos |
|---------|---------|
| Autenticacao | `User`, `Account`, `Session`, `VerificationToken` |
| Organizacao | `Workspace`, `WorkspaceMember`, `Workflow` |
| Formularios | `Form`, `FormSettings`, `FormTheme`, `Question`, `QuestionOption`, `ConditionalRule` |
| Respostas | `FormResponse`, `Answer`, `FileUpload` |

---

## Diagrama de Relacoes

```
User 1--N Account
User 1--N Session
User 1--N Workspace (owner)
User 1--N WorkspaceMember
User 1--N Form (creator)
User 1--N FormResponse

Workspace 1--N WorkspaceMember
Workspace 1--N Workflow

Workflow 1--N Form

Form 1--1 FormSettings
Form 1--1 FormTheme
Form 1--N Question
Form 1--N FormResponse

Question 1--N QuestionOption
Question 1--N ConditionalRule (source)
Question 1--N ConditionalRule (target)
Question 1--N Answer

FormResponse 1--N Answer

Answer 1--1 FileUpload (opcional)
```

---

## Enums

```prisma
enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum FormStatus {
  DRAFT
  PUBLISHED
  CLOSED
  ARCHIVED
}

enum PresentationMode {
  ONE_AT_A_TIME    // Estilo TypeForm
  ALL_AT_ONCE      // Estilo Google Forms
}

enum QuestionType {
  SHORT_TEXT
  LONG_TEXT
  MULTIPLE_CHOICE   // Checkboxes
  SINGLE_SELECT     // Radio buttons
  DROPDOWN
  NUMBER
  DATE
  RATING
  FILE_UPLOAD
  YES_NO
  EMAIL
  PHONE
  URL
  STATEMENT         // Tela informativa sem resposta
}

enum ConditionalOperator {
  EQUALS
  NOT_EQUALS
  CONTAINS
  NOT_CONTAINS
  GREATER_THAN
  LESS_THAN
  GREATER_EQUAL
  LESS_EQUAL
  IS_EMPTY
  IS_NOT_EMPTY
  IN_LIST
}

enum ConditionalAction {
  SKIP_TO
  HIDE
  SHOW
  END_FORM
}

enum ResponseStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}
```

---

## Modelos

### Autenticacao (NextAuth.js Prisma Adapter)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?

  accounts             Account[]
  sessions             Session[]
  ownedWorkspaces      Workspace[]       @relation("WorkspaceOwner")
  workspaceMemberships WorkspaceMember[]
  forms                Form[]            @relation("FormCreator")
  formResponses        FormResponse[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

### Organizacao

```prisma
model Workspace {
  id          String @id @default(cuid())
  name        String
  slug        String @unique
  description String?
  ownerId     String

  owner     User              @relation("WorkspaceOwner", fields: [ownerId], references: [id])
  members   WorkspaceMember[]
  workflows Workflow[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("workspaces")
}

model WorkspaceMember {
  id          String        @id @default(cuid())
  workspaceId String
  userId      String
  role        WorkspaceRole @default(MEMBER)

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

model Workflow {
  id          String @id @default(cuid())
  workspaceId String
  name        String
  description String?
  order       Int    @default(0)

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  forms     Form[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("workflows")
}
```

### Formularios

```prisma
model Form {
  id          String     @id @default(cuid())
  workflowId  String
  creatorId   String
  title       String
  description String?    @db.Text
  slug        String     @unique
  status      FormStatus @default(DRAFT)

  workflow  Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  creator   User     @relation("FormCreator", fields: [creatorId], references: [id])
  settings  FormSettings?
  theme     FormTheme?
  questions Question[]
  responses FormResponse[]

  publishedAt DateTime?
  closedAt    DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([workflowId])
  @@index([creatorId])
  @@index([status])
  @@map("forms")
}

model FormSettings {
  id     String @id @default(cuid())
  formId String @unique

  presentationMode        PresentationMode @default(ONE_AT_A_TIME)
  showProgressBar         Boolean          @default(true)
  allowMultipleSubmissions Boolean         @default(false)
  requireAuth             Boolean          @default(false)
  limitResponses          Int?
  scheduledOpenAt         DateTime?
  scheduledCloseAt        DateTime?
  confirmationMessage     String?          @db.Text
  redirectUrl             String?
  notifyOnSubmission      Boolean          @default(false)
  notifyEmails            String[]

  form Form @relation(fields: [formId], references: [id], onDelete: Cascade)

  @@map("form_settings")
}

model FormTheme {
  id     String @id @default(cuid())
  formId String @unique

  primaryColor       String  @default("#6366f1")
  backgroundColor    String  @default("#ffffff")
  textColor          String  @default("#1f2937")
  fontFamily         String  @default("Inter")
  logoUrl            String?
  backgroundImageUrl String?
  buttonStyle        String  @default("rounded")
  customCss          String? @db.Text

  form Form @relation(fields: [formId], references: [id], onDelete: Cascade)

  @@map("form_themes")
}
```

### Questoes

```prisma
model Question {
  id          String       @id @default(cuid())
  formId      String
  type        QuestionType
  title       String
  description String?      @db.Text
  placeholder String?
  order       Int          @default(0)
  required    Boolean      @default(false)
  config      Json         @default("{}")

  form             Form              @relation(fields: [formId], references: [id], onDelete: Cascade)
  options          QuestionOption[]
  answers          Answer[]
  conditionalRules ConditionalRule[] @relation("RuleSourceQuestion")
  targetedByRules  ConditionalRule[] @relation("RuleTargetQuestion")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([formId, order])
  @@map("questions")
}

model QuestionOption {
  id         String  @id @default(cuid())
  questionId String
  label      String
  value      String
  order      Int     @default(0)
  imageUrl   String?

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId, order])
  @@map("question_options")
}

model ConditionalRule {
  id               String              @id @default(cuid())
  sourceQuestionId String
  operator         ConditionalOperator
  value            String
  action           ConditionalAction
  targetQuestionId String?
  order            Int                 @default(0)

  sourceQuestion Question  @relation("RuleSourceQuestion", fields: [sourceQuestionId], references: [id], onDelete: Cascade)
  targetQuestion Question? @relation("RuleTargetQuestion", fields: [targetQuestionId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([sourceQuestionId])
  @@map("conditional_rules")
}
```

### Respostas

```prisma
model FormResponse {
  id          String         @id @default(cuid())
  formId      String
  userId      String?
  status      ResponseStatus @default(IN_PROGRESS)
  metadata    Json?
  startedAt   DateTime       @default(now())
  completedAt DateTime?
  duration    Int?

  form    Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
  user    User?    @relation(fields: [userId], references: [id])
  answers Answer[]

  @@index([formId])
  @@index([userId])
  @@index([formId, status])
  @@map("form_responses")
}

model Answer {
  id             String @id @default(cuid())
  formResponseId String
  questionId     String

  textValue    String?  @db.Text
  numberValue  Float?
  booleanValue Boolean?
  dateValue    DateTime?
  jsonValue    Json?

  formResponse FormResponse @relation(fields: [formResponseId], references: [id], onDelete: Cascade)
  question     Question     @relation(fields: [questionId], references: [id])
  fileUpload   FileUpload?

  createdAt DateTime @default(now())

  @@unique([formResponseId, questionId])
  @@index([questionId])
  @@map("answers")
}

model FileUpload {
  id           String @id @default(cuid())
  answerId     String @unique
  originalName String
  storagePath  String
  storageUrl   String
  mimeType     String
  sizeBytes    Int
  width        Int?
  height       Int?

  answer Answer @relation(fields: [answerId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("file_uploads")
}
```

---

## Schemas Zod para `config` por QuestionType

O campo `config` de cada `Question` e validado conforme o tipo:

| QuestionType | Campos do config |
|---|---|
| `SHORT_TEXT` | `minLength?`, `maxLength?` |
| `LONG_TEXT` | `minLength?`, `maxLength?`, `rows?` |
| `NUMBER` | `min?`, `max?`, `step?`, `allowDecimals?`, `prefix?`, `suffix?` |
| `DATE` | `minDate?`, `maxDate?`, `includeTime?`, `format?` |
| `RATING` | `maxValue` (2-10, default 5), `icon` (star/heart/thumbsUp/number), `labels?` |
| `FILE_UPLOAD` | `allowedMimeTypes?`, `maxSizeMb` (default 10), `maxFiles` (default 1) |
| `MULTIPLE_CHOICE` | `minSelections?`, `maxSelections?`, `randomizeOrder?`, `allowOther?` |
| `SINGLE_SELECT` | `randomizeOrder?`, `allowOther?` |
| `DROPDOWN` | `searchable?`, `allowOther?` |
| `YES_NO` | `yesLabel` (default "Sim"), `noLabel` (default "Nao") |
| `EMAIL` | `allowedDomains?` |
| `PHONE` | `defaultCountryCode` (default "+55"), `format?` |
| `URL` | `allowedProtocols` (default ["https", "http"]) |
| `STATEMENT` | `buttonText` (default "Continuar") |

---

## Decisoes de Design

| Decisao | Justificativa |
|---------|---------------|
| Polimorfismo via `config: Json` | Evita dezenas de tabelas. Cada tipo tem seu Zod schema de validacao. |
| Colunas tipadas em `Answer` | Permite queries SQL eficientes (AVG, COUNT) sem desserializar JSON. |
| `ConditionalRule` como modelo separado | Uma pergunta pode ter N regras avaliadas em ordem. |
| `FormSettings` e `FormTheme` como 1:1 | Separacao de comportamento vs. aparencia. |
| `Workspace` com `WorkspaceMember` | Preparado para colaboracao (multiplos usuarios com roles). |
| `FileUpload` separado de `Answer` | Metadados de arquivo sao complexos e opcionais. |
