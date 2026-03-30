# Zênite - Sistema de Gestão Escolar

Frontend React com Vite, TypeScript, Tailwind CSS e shadcn/ui.

## Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** React Query + Zustand (via AuthContext)
- **Forms:** React Hook Form + Zod
- **Auth:** Supabase Auth
- **Charts:** Recharts
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
   - `VITE_API_URL` (opcional, padrão: http://localhost:8000)

2. Iniciar desenvolvimento:
   ```bash
   bun dev
   ```

## Estrutura

```
src/
├── contexts/       # AuthContext
├── components/    # Componentes UI + AppLayout
├── pages/         # Dashboard, Students, Documents, Login
├── lib/           # Supabase client, API layer
├── data/          # Mock data
└── hooks/         # Custom hooks
```

## API

O backend deve expor:
- `GET /api/v1/alunos` - Lista alunos (paginação, filtros)
- `GET /api/v1/alunos/:id` - Detalhes do aluno
- `POST /api/v1/alunos` - Criar aluno
- `PUT /api/v1/alunos/:id` - Atualizar aluno
- `DELETE /api/v1/alunos/:id` - Excluir aluno
- `GET /api/v1/dashboard/metrics` - Métricas
- `GET /api/v1/documentos/templates` - Lista templates
- `POST /api/v1/documentos/gerar` - Gerar PDF
