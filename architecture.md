# I. I. Tia Neuma — Arquitetura do Sistema

> Sistema de Gestão Escolar — Instituto Infantil Tia Neuma

## Versão
2.1 — Limpeza de dados e correções de segurança em 2026-07-14.

## Visão Geral

Frontend SPA (Single Page Application) que se conecta diretamente ao Supabase (PostgreSQL) sem backend intermediário. Usado para gerenciar cadastro de alunos, matrículas, documentos, financeiro e dashboard da escola.

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | React | 18.x |
| Bundler | Vite | 5.x |
| Linguagem | TypeScript | 5.x |
| Estilização | Tailwind CSS | 3.x |
| Componentes | shadcn/ui (Radix UI) | — |
| Roteamento | React Router DOM | 6.x |
| Server State | TanStack React Query | 5.x |
| Formulários | React Hook Form + Zod | — |
| Ícones | Lucide React | — |
| Gráficos | Recharts | 2.x |
| PDF | jsPDF + jsPDF-AutoTable | 4.x |
| Importação .docx | JSZip | 3.x |
| Banco de Dados | Supabase (PostgreSQL) | — |
| Testes Unitários | Vitest | 3.x |
| Testes E2E | Playwright | 1.x |
| Gerenciador de Pacotes | Bun | 1.x |

## Variáveis de Ambiente

Arquivo `.env` na raiz do projeto:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
VITE_API_URL=http://localhost:8081
```

## Estrutura de Diretórios

```
zenite-app/
├── .env                          # Credenciais Supabase
├── .gitignore
├── components.json               # Config shadcn/ui
├── eslint.config.js
├── index.html                    # Entry HTML (título: "Zenite - I. I. Tia Neuma")
├── package.json                  # Dependências
├── bun.lock                      # Lockfile do Bun
├── vite.config.ts                # Config Vite (porta 8080, alias @/)
├── vitest.config.ts              # Config Vitest
├── playwright.config.ts          # Config Playwright
├── tailwind.config.ts            # Tema com cores navy+orange + sidebar
├── postcss.config.js             # PostCSS
├── tsconfig.json                 # TypeScript base
├── tsconfig.app.json             # TypeScript app
├── tsconfig.node.json            # TypeScript node
├── arquivos-modelo/              # Fichas de modelo (.docx)
├── public/                       # Assets estáticos (logo.png)
├── src/
│   ├── main.tsx                  # Entry point React
│   ├── App.tsx                   # Provider tree + rotas
│   ├── index.css                 # CSS custom (tema navy/orange, variáveis, animações)
│   ├── vite-env.d.ts             # Declarações de tipos Vite
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth provider (Supabase Auth)
│   ├── components/
│   │   ├── AppLayout.tsx         # Layout principal (Sidebar + Header + main)
│   │   ├── AppSidebar.tsx        # Sidebar sempre colapsada (48px), sem toggle
│   │   ├── AppHeader.tsx         # Header: logo + "I. I. Tia Neuma" + breadcrumbs + avatar
│   │   ├── NavLink.tsx           # Wrapper do React Router NavLink
│   │   ├── ProtectedRoute.tsx    # Redirect p/ /login se não autenticado
│   │   ├── StudentForm.tsx       # Sheet lateral com 4 abas de cadastro
│   │   └── ui/                   # ~60 componentes shadcn/ui
│   ├── hooks/
│   │   ├── use-toast.ts          # Toast hook (shadcn)
│   │   └── use-mobile.tsx        # Mobile breakpoint hook
│   ├── lib/
│   │   ├── api.ts                # Supabase client + interfaces + API (alunos, matrículas, dashboard, templates, produtos, recibos, profile)
│   │   ├── masks.ts              # Funções de máscara (CPF, RG, CEP, telefone)
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── assets.ts             # Logo e imagens em base64
│   │   ├── docxParser.ts         # Parser de .docx via JSZip
│   │   ├── docxModel.ts          # Geração de .docx modelo + lista de campos reconhecidos
│   │   ├── profileApi.ts         # API de perfis de usuário (avatar, display_name, senha)
│   │   ├── constants.ts          # GRADES, SHIFTS, STATUSES, RACES, SCHOOL_NAME, YEAR_RANGE, CURRENT_YEAR
│   │   └── utils.ts              # cn() helper (classnames)
│   └── pages/
│       ├── Login.tsx             # Tela de login com gradiente
│       ├── Dashboard.tsx         # Métricas + cards + gráfico de barras
│       ├── Students.tsx          # Tabela CRUD com filtros multi-select e ordenação
│       ├── StudentProfile.tsx    # Perfil detalhado + CRUD de matrículas
│       ├── ImportStudents.tsx    # Importação de .docx com drag-and-drop
│       ├── Documents.tsx         # Templates + geração de PDF
│       ├── Products.tsx          # CRUD de produtos
│       ├── Sales.tsx             # Vendas + recibos
│       ├── Profile.tsx           # Perfil do usuário logado (nome, senha, avatar)
│       └── NotFound.tsx          # Página 404
```

## Rotas

| Path | Componente | Descrição |
|---|---|---|
| `/login` | `Login.tsx` | Autenticação via Supabase Auth |
| `/` | `Dashboard.tsx` | Métricas, cards de turno, gráfico de matrículas por série e gênero (alunos ativos do ano letivo atual) |
| `/alunos` | `Students.tsx` | Tabela CRUD com filtros multi-select, ordenação, PDF lista filtrada |
| `/alunos/:id` | `StudentProfile.tsx` | Perfil completo + CRUD de matrículas + impressão de ficha |
| `/importar` | `ImportStudents.tsx` | Importação de alunos via .docx com drag-and-drop |
| `/documentos` | `Documents.tsx` | Criar/editar templates + gerar PDFs com tags dinâmicas |
| `/financeiro/produtos` | `Products.tsx` | CRUD de produtos (fardamento, material, taxa) |
| `/financeiro/vendas` | `Sales.tsx` | Vendas com busca de aluno, seleção de itens, geração de recibo PDF |
| `/perfil` | `Profile.tsx` | Perfil do usuário: nome, senha, avatar |
| `*` | `NotFound.tsx` | Página 404 |

## Banco de Dados (Supabase)

Sistema sem backend intermediário — o frontend acessa o Supabase diretamente via `@supabase/supabase-js`.

### Tabelas Principais

#### `alunos`

Cadastro dos alunos. Campo `id` é UUID gerado pelo Supabase.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | uuid | auto | Chave primária |
| `nome` | text | sim | Nome completo |
| `serie` | text | sim | Série (1º–5º Ano, Infantil I–V, etc.) |
| `turno` | text | sim | Manhã / Tarde |
| `genero` | text | — | Masculino / Feminino |
| `status` | text | — | Ativo / Inativo |
| `situacao` | text | — | Ativo / Inativo |
| `ano_letivo` | int | — | Ano letivo vigente |
| `datanascimento` | text | — | Data no formato YYYY-MM-DD |
| `naturalidade` | text | — | Cidade de origem |
| `cidade` | text | — | Cidade do aluno |
| `estado` | text | — | Estado do aluno |
| `rg` | text | — | RG do aluno |
| `cpf` | text | — | CPF do aluno |
| `nis` | text | — | NIS |
| `cia` | text | — | CIA |
| `raça` | text | — | Branca / Preta / Parda / Amarela / Indígena / Não declarada |
| `valormensalidade` | numeric | — | Valor da mensalidade em R$ |
| `datadovencimento` | int | — | Dia do vencimento (1–31) |
| `nomedopai` | text | — | Nome do pai |
| `rgdopai` | text | — | RG do pai |
| `cpfdopai` | text | — | CPF do pai |
| `nomedamae` | text | — | Nome da mãe |
| `rgmae` | text | — | RG da mãe |
| `cpfmae` | text | — | CPF da mãe |
| `responsavelfinanceiro` | text | — | Nome do responsável financeiro |
| `datanascimentoresponsavelfin` | text | — | Data de nascimento do resp. |
| `filiacaoresponsavelfin` | text | — | Filiação do resp. |
| `rgrespfin` | text | — | RG do resp. |
| `cpfrespfin` | text | — | CPF do resp. |
| `possuiirmao` | bool | — | Tem irmão na escola? |
| `nomeirmao` | text | — | Nome do irmão |
| `telefone1` | text | — | Telefone principal |
| `nometelefone1` | text | — | Nome do contato telefone 1 |
| `telefone2` | text | — | Telefone secundário |
| `nometelefone2` | text | — | Nome do contato telefone 2 |
| `telefone3` | text | — | Telefone terciário |
| `nometelefone3` | text | — | Nome do contato telefone 3 |
| `logradouro` | text | — | Rua / Av. |
| `numero` | text | — | Número |
| `complemento` | text | — | Complemento |
| `bairro` | text | — | Bairro |
| `cep` | text | — | CEP |
| `cidadetelefone` | text | — | Cidade do endereço |
| `estadotelefone` | text | — | Estado do endereço |
| `nomedocartorio` | text | — | Nome do cartório |
| `numerodotermo` | text | — | Número do termo |
| `livro` | text | — | Livro do cartório |
| `folha` | text | — | Folha do cartório |
| `matriculadocartorio` | text | — | Matrícula no cartório |
| `criado_em` | timestamp | auto | Data de criação |
| `atualizado_em` | timestamp | auto | Data de atualização |

#### `matriculas`

Histórico de matrículas por ano letivo. Cada linha = 1 ano letivo do aluno.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | uuid | auto | Chave primária |
| `aluno_id` | uuid | sim | FK → `alunos.id` |
| `ano_letivo` | int | sim | Ex: 2024, 2025, 2026 |
| `serie` | text | sim | Série naquele ano |
| `turno` | text | sim | Turno naquele ano |
| `status` | text | sim | Ativo / Concluído / Transferido / Cancelado |
| `data_matricula` | text | — | Data da matrícula |
| `created_at` | timestamp | auto | Data de criação |

#### `templates_documentos`

Templates de documentos editáveis (declarações, fichas, etc.).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `titulo` | text | Nome interno do template |
| `conteudo` | text | Texto com tags `{{...}}` e formatação `<b>`, `<i>`, `<u>` |
| `status` | text | Ativo / Inativo |
| `titulo_impresso` | text | Título que aparece no PDF |
| `requer_assinatura` | bool | Se deve incluir assinatura no rodapé |

#### `produtos`

Produtos para venda (fardamento, material, taxa).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `nome` | text | Nome do produto |
| `categoria` | text | Fardamento / Material Didático / Taxa |
| `serie_aplicavel` | text | Série a qual se aplica (ou null) |
| `preco` | numeric | Preço em R$ |
| `status` | text | Ativo / Inativo |

#### `recibos`

Recibos de pagamento gerados.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Chave primária |
| `aluno_id` | uuid | FK → `alunos.id` |
| `data_emissao` | text | Data de emissão |
| `itens` | jsonb | Array de `{ nome, preco, quantidade, subtotal }` |
| `valor_total` | numeric | Valor total do recibo |

#### `profiles`

Perfis de usuário (auto-criados no signup via trigger).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | uuid | FK → auth.users.id |
| `display_name` | text | Nome de exibição |
| `avatar_url` | text | URL do avatar (Supabase Storage) |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

## API (Frontend → Supabase)

Todas as funções ficam em `src/lib/api.ts` e usam o client Supabase JS diretamente.

### `alunosApi`

```typescript
alunosApi.list(params?)          // Lista alunos com paginação, busca e filtros
alunosApi.get(id)                // Busca aluno por ID (com matrículas)
alunosApi.create(aluno)          // Insere novo aluno
alunosApi.update(id, aluno)      // Atualiza aluno
alunosApi.delete(id)             // Remove aluno
```

### `matriculasApi`

```typescript
matriculasApi.listAll()          // Lista todas as matrículas
matriculasApi.list(alunoId)      // Matrículas de um aluno (por ano decrescente)
matriculasApi.create(matricula)  // Insere nova matrícula
matriculasApi.update(id, data)   // Atualiza matrícula
matriculasApi.delete(id)         // Remove matrícula
```

### `dashboardApi`

```typescript
dashboardApi.getMetrics()          // RPC dashboard_metrics(ano) — totais sem PII
dashboardApi.getGeneroSerieTurno() // RPC dashboard_genero_serie_turno(ano) — gráfico gênero/série/turno
```

Retorna: `{ total_alunos_ativos, alunos_inadimplentes, alunos_manhã, alunos_tarde, por_serie, genero_serie_turno }`

### `produtosApi`

```typescript
produtosApi.list()               // Lista produtos
produtosApi.create(produto)      // Insere produto
produtosApi.update(id, data)     // Atualiza produto
produtosApi.delete(id)           // Remove produto
```

### `recibosApi`

```typescript
recibosApi.create(recibo)        // Insere recibo
recibosApi.list()                // Lista recibos
```

### `templatesApi`

```typescript
templatesApi.list()              // Lista todos os templates
templatesApi.listAtivos()        // Lista templates com status "Ativo"
templatesApi.get(id)             // Busca template por ID
templatesApi.create(template)    // Insere template
templatesApi.update(id, data)    // Atualiza template
templatesApi.delete(id)          // Remove template
```

### `profileApi`

API de perfis de usuário (arquivo separado: `src/lib/profileApi.ts`).

```typescript
profileApi.get()                   // Busca profile do usuário logado (auth.uid())
profileApi.update(data)            // Atualiza display_name, sobrescreve senha via Supabase Auth
profileApi.uploadAvatar(file)      // Upload de avatar para Supabase Storage (bucket "avatars")
```

### Funções Auxiliares

```typescript
substituirTags(conteudo, aluno, matriculaAtiva?)   // Substitui {{tags}} por dados reais
getMatriculaAtiva(aluno)                            // Retorna matrícula ativa mais recente
gerarDocumentoPDF(titulo, corpo, tituloImpresso?, requerAssinatura?)  // Gera PDF de documento
gerarFichaAlunoPDF(aluno, matriculas)               // Gera PDF da ficha do aluno
formatarDataExtenso()                               // "Fortaleza, 13 de julho de 2026"
formatarMoeda(valor)                                // "R$ 1.200,00"
formatarCPF(cpf)                                    // "000.000.000-00"
```

## Autenticação

- **Provider:** Supabase Auth
- **Modo demo:** Ativado quando `VITE_SUPABASE_URL` não está configurada — aceita qualquer credencial
- **Fluxo login:** `Login.tsx` → `signIn()` → `AuthContext` → `ProtectedRoute` → rotas protegidas
- **Fluxo cadastro:** Admin cria usuários pelo painel Supabase; primeiro login confirma email e profile é criado via trigger `handle_new_user()`
- **Token:** JWT injetado automaticamente via client Supabase
- **Perfis:** Tabela `profiles` vinculada a auth.users, auto-criada via trigger `handle_new_user()` — usa `raw_user_meta_data ->> 'display_name'` com fallback para prefixo do email
- **Avatar:** Bucket `avatars` no Supabase Storage
- **Redirect URL:** `https://zenite-app.vercel.app` (configurado no Supabase)
- **Templates de email:** Todos em PT-BR (confirmação, recuperação, convite, magic link, reautenticação)

### Usuários Cadastrados

| Email | Role |
|---|---|
| admin.zeniteapp@gmail.com | admin |
| gab.m.fernandes@gmail.com | funcionario |

## Sistema de Documentos (PDF)

### Tags Dinâmicas

No conteúdo dos templates, usar `{{tag}}` para dados do aluno:

| Tag | Descrição |
|---|---|
| `{{nome_aluno}}` | Nome completo |
| `{{data_nascimento}}` | Data de nascimento |
| `{{serie_aluno}}` | Série atual |
| `{{turno_aluno}}` | Turno atual |
| `{{nome_pai}}` | Nome do pai |
| `{{nome_mae}}` | Nome da mãe |
| `{{responsavel}}` | Responsável financeiro |
| `{{cpf_responsavel}}` | CPF do responsável |
| `{{ano_letivo}}` | Ano letivo da matrícula ativa |
| `{{data_atual}}` | Data por extenso |

### Formatação de Texto

O conteúdo do template aceita tags de formatação HTML:

- `<b>texto</b>` — **negrito**
- `<i>texto</i>` — *itálico*
- `<u>texto</u>` — sublinhado

Funcionam combinadas e em qualquer parte do texto. A formatação é renderizada tanto no PDF quanto na visualização.

### Geração de PDF

- **jsPDF** para criação do documento PDF
- **renderFormattedParagraph()** processa as tags `<b>`, `<i>`, `<u>` e renderiza com fontes corretas
- **Cabeçalho fixo** com dados da escola (logo, endereço, CNPJ, INEP, site) — fonte 12/11/10pt
- **Assinatura opcional** no rodapé (configurável por template)

## Design System

### Cores

| Elemento | Cor | CSS Variable |
|---|---|---|
| Primária | Navy blue `#01182C` | `--primary` |
| Accent | Orange `#EF7F2D` | `--accent` |
| Sidebar | Navy blue uniforme `#01182C` | `--sidebar-background` |
| Sidebar Hover | Orange `#EF7F2D` | `--sidebar-accent` |
| Background | Fundo claro com mesh gradient sutil | `--background` |
| Cards | Brancos com sombra | `--card` |
| Sucesso | Verde | `--success` |
| Aviso | Amarelo | `--warning` |
| Destrutivo | Vermelho | `--destructive` |

### Branding

- **Nome:** I. I. Tia Neuma (Instituto Infantil Tia Neuma)
- **Logo:** `public/logo.png` (aparece no header)
- **Título da página:** "Zenite - I. I. Tia Neuma"
- **Sidebar:** Sempre colapsada (48px), sem botão toggle, fundo uniforme navy, ícones centralizados verticalmente, hover laranja
- **Header:** `[logo.png] I. I. Tia Neuma | [breadcrumbs] | [avatar + display_name/email dropdown]`

### Tipografia

- **Fonte:** Inter (via Google Fonts)
- **Pesos:** 300–900

### Componentes

- **shadcn/ui** (Radix UI) — ~60 componentes na pasta `src/components/ui/`
- **Sidebar sempre colapsada** — largura fixa 48px, sem toggle, sem atalho Ctrl+B
- **Dark mode** suportado via CSS variables (classe `.dark`)

### Animações

- `fade-in`, `slide-up`, `scale-in` com cubic-bezier custom
- Accordion up/down (Radix)

## Mascaras de Input

Funções em `src/lib/masks.ts` aplicadas nos campos de formulário:

```typescript
maskCPF(value)    // 000.000.000-00
maskRG(value)     // Alfanumérico, máx 12 chars
maskCEP(value)    // 00000-000
maskPhone(value)  // (00) 00000-0000 ou (00) 0000-0000
```

## Testes

- **Vitest:** configurado, apenas placeholder (`example.test.ts`)
- **Playwright:** configurado, sem testes escritos

## Scripts Disponíveis

```bash
bun dev           # Dev server (porta 8080)
bun build         # Build produção
bun build:dev     # Build development
bun test          # Vitest (execução única)
bun test:watch    # Vitest (watch mode)
bun lint          # ESLint
bun preview       # Preview da build de produção
```

## Deploy

- **Plataforma:** Vercel (arquivo `vercel.json` na raiz)
- **Build:** `vite build`
- **Variáveis de ambiente:** configuradas no painel da Vercel

## Migrations (Supabase)

Aplicadas em ordem, versionadas em `supabase/migrations/`:

1. `20260713_create_profiles.sql` — tabela `profiles`, RLS, bucket `avatars`, trigger `handle_new_user`
2. `20260714_add_role_and_security.sql` — coluna `role` em `profiles`, `is_staff()`, policies restritivas em `alunos`/`matriculas`/`produtos`/`recibos`/`templates_documentos`, endurecimento do bucket `avatars`
3. `20260714_audit_and_rpcs.sql` — tabela `audit_log` + triggers + RPCs `dashboard_metrics`, `dashboard_por_serie`, `dashboard_genero_serie_turno`, `log_operacao`

## Segurança

- **RLS ativa** em todas as tabelas de dados; policies `staff_*` baseadas em `is_staff()` (que checa `role in ('admin','funcionario')`)
- **Bucket `avatars` privado** com policies por usuário (`auth.uid()` é dono do path)
- **CSP** em `vercel.json` restringe scripts, imagens e conexões; permite `fonts.googleapis.com` e `fonts.gstatic.com`
- **HSTS** força HTTPS
- **Sessão em `sessionStorage`** (não persiste entre abas)
- **Audit log** registra INSERT/UPDATE/DELETE em `alunos`/`matriculas`/`produtos`/`recibos`/`templates_documentos` + `PDF_GENERATED` via `log_operacao()`
- **Cadastro público desabilitado** — admin cria usuários pelo painel Supabase
- **`nativeFetch`** — bypass via iframe para evitar override por extensões de navegador
- **RLS policies sem recursão** — `is_admin()` e `my_role()` são security definer para evitar循环 na tabela `profiles`

## Observações e Pendências

1. **Schema do Supabase** — migrações versionadas em `supabase/migrations/`
2. **Testes** — apenas placeholder; sem cobertura real
3. **Playwright** — configurado mas sem testes E2E escritos
4. **Dois sistemas de toast** — shadcn/ui Toaster e Sonner coexistem; o código usa Sonner majoritariamente
5. **Dashboard** — métricas via RPCs `dashboard_metrics`, `dashboard_por_serie`, `dashboard_genero_serie_turno`; gráficos filtram por ano letivo atual
6. **Students.tsx** — filtros multi-select (série, turno, status) + ordenação por coluna; PDF gera lista filtrada; filtros preservados via `sessionStorage` ao navegar para perfil e voltar; status padrão "Ativo"
7. **Matrícula CRUD** —StudentProfile.tsx tem edição e exclusão de matrículas via dialog e AlertDialog
8. **Importação .docx** — módulo completo com drag-and-drop, parser regex, 4 abas de edição, vínculo automático de matrícula e capitalização automática de nomes
9. **Sidebar** — sempre colapsada (48px), sem toggle, hover laranja, ícones centralizados verticalmente; seção "Administração" só aparece para admin
10. **Branding** — cores navy #01182C + orange #EF7F2D, logo no header, título "I. I. Tia Neuma"
11. **Confirmações destrutivas** — AlertDialog em excluir aluno (Students, StudentProfile), excluir matrícula (StudentProfile), excluir produto (Products), e em gerar PDF de aluno
12. **Dashboard real** — badges de tendência calculados de `enrollmentByYear` (year-over-year); não renderiza quando não há base histórica; `naoInformado` no gráfico de gênero só aparece quando há dados
13. **A11y** — `autoComplete` em inputs de email/senha, `aria-label` em botões-ícone, `prefers-reduced-motion` respeitado em animações
14. **Toaster único** — apenas Sonner (shadcn `Toaster` removido em `App.tsx`)
15. **Constantes centralizadas** — `src/lib/constants.ts` exporta `GRADES`, `SHIFTS` (Manhã/Tarde), `STATUSES`, `RACES`, `YEAR_RANGE`, `SCHOOL_NAME`, `CURRENT_YEAR`
16. **Turno Integral removido** — escola só tem Manhã e Tarde; removido de constants, api, Dashboard, StudentForm e docxParser
17. **Importer .docx** — botão "Baixar modelo .docx" + lista de campos reconhecidos na própria página
18. **RBAC** — tabela `profiles` tem coluna `role` (`admin` | `funcionario`); RLS em todas as tabelas de dados checa `public.is_staff()`; rota `/admin/usuarios` protegida por `ProtectedRoute roles={['admin']}`
19. **Sessão em sessionStorage** — não persiste entre abas/fechamento (mitiga XSS e roubo de token)
20. **RPCs de agregação** — `dashboard_metrics(ano)`, `dashboard_por_serie(ano)`, `dashboard_genero_serie_turno(ano)` substituem `select(*)` no Dashboard; PII não trafega para contar
21. **Projeção em `alunosApi.list()`** — lista retorna apenas campos necessários (sem CPF, RG, NIS, CIA, endereço); apenas `get(id)` retorna tudo
22. **Audit log** — tabela `audit_log` + trigger em todas as tabelas de dados; geracao de PDF registrada via RPC `log_operacao('PDF_GENERATED', ...)`; LGPD art. 37
23. **Cabecalhos HTTP** — `vercel.json` define CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
24. **Storage avatars** — bucket `avatars` com policies restritas (so dono escreve/le/apaga); `profileApi.uploadAvatar(file)` obtem `auth.uid()` internamente
25. **Cadastro publico removido** — `Login.tsx` nao tem botao "Criar Conta"; admin cria usuarios pelo painel Supabase; primeiro login confirma email e profile e criado via trigger `handle_new_user()`
26. **Confirmation dialog em geracao de PDF** — `StudentProfile.tsx` exige confirmacao antes de gerar ficha do aluno (alinhado com audit log)
27. **nativeFetch bypass** — `supabase.ts` captura `window.fetch` via iframe para evitar que extensões de navegador sobrescrevam o fetch global
28. **RLS policies sem recursão** — `is_admin()` e `my_role()` são security definer para evitar循环 na tabela `profiles`
29. **Dados limpos** — todos os alunos, matrículas e fotos foram excluídos em 2026-07-14 para início de população com dados reais; produtos e templates mantidos
