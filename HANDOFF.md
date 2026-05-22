# Zênite - Session Handoff

> Sistema de Gestão Escolar — Frontend React

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + Vite 5 |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS + shadcn/ui |
| Roteamento | React Router DOM v6 |
| Server State | TanStack React Query |
| Formulários | React Hook Form + Zod |
| Autenticação | Supabase Auth |
| Ícones | Lucide React |
| Gráficos | Recharts |
| HTTP Client | Axios |
| Testes Unitários | Vitest |
| Testes E2E | Playwright |
| Gerenciador | Bun |

## Scripts

```bash
bun dev           # Dev server (porta 8080)
bun build         # Build produção
bun build:dev     # Build dev
bun test          # Vitest
bun test:watch    # Vitest watch
bun lint          # ESLint
bun preview       # Preview build
```

## Variáveis de Ambiente (`.env`)

```
VITE_SUPABASE_URL=https://ollkmehbzasfirydzize.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_aAQlEzYjXN7Dtlaf5_izWQ_c-YVjCBw
VITE_API_URL=http://localhost:8000
```

## Rotas

| Path | Componente | Descrição |
|---|---|---|
| `/login` | `Login.tsx` | Login com Supabase Auth (modo demo se sem credenciais) |
| `/` | `Dashboard.tsx` | Métricas, cards de turno, gráficos (Recharts) |
| `/alunos` | `Students.tsx` | Tabela CRUD com busca, filtros por série/turno |
| `/alunos/:id` | `StudentProfile.tsx` | Perfil completo com dados pessoais, filiação, contato |
| `/documentos` | `Documents.tsx` | Selecionar aluno + tipo e baixar PDF |

## Autenticação (`AuthContext.tsx`)

- Supabase Auth com fallback **modo demo** automático (se `VITE_SUPABASE_URL` não estiver configurada)
- Modo demo: login aceita qualquer credencial, usuário fictício
- Token JWT injetado via interceptor do Axios

## API — Backend Esperado (`lib/api.ts`)

Base URL: `{VITE_API_URL}/api/v1`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/alunos` | Lista alunos (query: `page`, `limit`, `search`, `serie`) |
| GET | `/alunos/:id` | Detalhes do aluno |
| POST | `/alunos` | Criar aluno |
| PUT | `/alunos/:id` | Atualizar aluno |
| DELETE | `/alunos/:id` | Excluir aluno |
| GET | `/dashboard/metrics` | Métricas do dashboard |
| GET | `/documentos/templates` | Listar templates de documentos |
| POST | `/documentos/gerar` | Gerar PDF (body: `{ template, aluno_id }`) |

## Estrutura de Arquivos

```
zenite-app/
├── .env                          # Credenciais Supabase + API URL
├── .gitignore
├── components.json               # Config shadcn/ui
├── eslint.config.js
├── bun.lock / bun.lockb
├── package.json / package-lock.json
├── playwright.config.ts
├── playwright-fixture.ts
├── postcss.config.js
├── tailwind.config.ts            # Tema verde-escuro + sidebar
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts                # Porta 8080, alias @/, SWC
├── vitest.config.ts
├── GEMINI.md                     # ⚠️ ARQUIVO LEGADO — de outro projeto (ignorar)
├── supabase_integration.md       # ⚠️ ARQUIVO LEGADO — anotações antigas (ignorar)
├── README.md
├── index.html
├── public/
└── src/
    ├── main.tsx                  # Entry point
    ├── App.tsx                   # Provider tree + rotas
    ├── index.css                 # CSS custom (tema, animações)
    ├── vite-env.d.ts
    ├── test/
    │   ├── setup.ts
    │   └── example.test.ts       # Teste placeholder
    ├── lib/
    │   ├── api.ts                # Axios instance + tipos + API functions
    │   ├── supabase.ts           # Supabase client
    │   └── utils.ts              # cn() helper
    ├── contexts/
    │   └── AuthContext.tsx        # Auth provider (Supabase + demo mode)
    ├── hooks/
    │   ├── use-toast.ts          # Toast hook (shadcn)
    │   └── use-mobile.tsx        # Mobile breakpoint hook
    ├── data/
    │   └── mockData.ts           # Mock data SÓ usado em Documents.tsx
    ├── components/
    │   ├── AppLayout.tsx         # Sidebar + Header + main wrapper
    │   ├── AppSidebar.tsx        # Sidebar colapsável com navegação
    │   ├── AppHeader.tsx         # Header com breadcrumb + user menu
    │   ├── NavLink.tsx           # Wrapper do React Router NavLink
    │   ├── ProtectedRoute.tsx    # Redirect p/ /login se não autenticado
    │   ├── StudentForm.tsx       # Sheet (sidebar) com 4 abas: Dados Pessoais, Filiação, Contato, Docs
    │   └── ui/                   # ~60 componentes shadcn/ui
    └── pages/
        ├── Login.tsx             # Tela de login com gradiente
        ├── Dashboard.tsx         # Métricas + gráficos
        ├── Students.tsx          # CRUD alunos
        ├── StudentProfile.tsx    # Perfil detalhado
        ├── Documents.tsx         # Geração de documentos
        └── NotFound.tsx          # 404
```

## Modelo `Aluno` (interface em `lib/api.ts`)

Campos principais: `id`, `nome`, `serie`, `turno`, `situacao`, `datanascimento`, `naturalidade`, `cidade`, `estado`, `valormensalidade`, `datadovencimento`, `nomedopai`, `nomedamae`, `responsavelfinanceiro`, `telefone1-3`, `nometelefone1-3`, `logradouro`, `numero`, `bairro`, `cep`, `cidadetelefone`, `estadotelefone`, `rg`, `cpf`, `nis`, `cia`, `raça`, dados de cartório (`nomedocartorio`, `numerodotermo`, `livro`, `folha`, `matriculadocartorio`), `possuiirmao`, `nomeirmao`, `escola_id`.

## Design System

- **Cores primárias:** Verde floresta escuro (`#152B21`)
- **Sidebar:** tom mais escuro do primary, colapsável (ícone-only)
- **Background:** fundo claro com mesh gradient sutil
- **Cards:** brancos com sombra, hover elevado
- **Animações:** `fade-in`, `slide-up`, `scale-in` (cubic-bezier custom)
- **Dark mode:** suporte completo via CSS variables (classe `.dark`)
- **Fonte:** Inter via Google Fonts

## Observações / Pendências

1. **Backend não existe neste repositório** — o backend deve ser criado separadamente seguindo a especificação da API acima
2. **GEMINI.md** e **supabase_integration.md** são artefatos de outros projetos/geração automática — **podem ser deletados**
3. **mockData.ts** tem dados mockados usados exclusivamente na página `Documents.tsx` — o resto do app busca da API real
4. **Dois sistemas de toast convivem**: o shadcn/ui Toaster e o Sonner — o código usa **sonner** majoritariamente
5. **Testes**: só tem um placeholder (`example.test.ts`) — sem cobertura real
6. **Playwright**: configurado mas sem testes escritos
7. **Página de perfil** (`AppHeader.tsx:94-101`) e **configurações** têm menu dropdown com itens "Perfil" e "Configurações" que não levam a lugar nenhum
8. **Badge de notificação** no header tem número fixo `3` — sem lógica real
9. **Documentos** usa mock data (`students` de `mockData.ts`) em vez dos dados da API — possível melhoria: unificar com `alunosApi`
10. **Valor mensalidade** não é formatado corretamente como moeda na página de documentos (`Documents.tsx:185` usa `selectedStudent.monthlyFee.toFixed(2)` em vez de `formatCurrency`)
