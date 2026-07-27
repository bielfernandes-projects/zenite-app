# Zênite - Sistema de Gestão Escolar

Frontend React com Vite, TypeScript, Tailwind CSS e shadcn/ui.

## Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **Auth:** Supabase Auth (modo demo automático)
- **Database:** Supabase (PostgreSQL)
- **Charts:** Recharts
- **PDF:** jsPDF
- **Package Manager:** Bun

## Comandos

```bash
# Desenvolvimento
bun dev

# Build de produção
bun build

# Linting
bun lint

# Testes
bun test
```

## Configuração

1. Copiar `.env.example` para `.env` e configurar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Iniciar desenvolvimento:
   ```bash
   bun dev
   ```

## Estrutura

```
src/
├── contexts/       # AuthContext
├── components/     # Componentes UI + AppLayout
├── pages/          # Dashboard, Students, StudentProfile, Documents, Login
├── lib/            # Supabase client, API layer, masks, utils
└── hooks/          # Custom hooks
```

## Banco de Dados (Supabase)

O sistema usa Supabase diretamente (sem backend intermediário). Tabelas principais:

- **`alunos`** — Dados cadastrais dos alunos
- **`matriculas`** — Histórico de matrículas por ano letivo
- **`produtos`** — Produtos para venda (fardamento, material, taxa)
- **`recibos`** — Recibos de pagamento
- **`templates_documentos`** — Templates de documentos editáveis
