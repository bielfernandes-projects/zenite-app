# Zênite — Arquitetura do Sistema

> Sistema de Gestão Escolar — Instituto Infantil Tia Neuma

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
├── .env                          # Credenciais Supabase + API URL
├── .gitignore
├── components.json               # Config shadcn/ui
├── eslint.config.js
├── index.html                    # Entry HTML
├── package.json                  # Dependências
├── bun.lock                      # Lockfile do Bun
├── vite.config.ts                # Config Vite (porta 8080, alias @/)
├── vitest.config.ts              # Config Vitest
├── playwright.config.ts          # Config Playwright
├── tailwind.config.ts            # Tema verde-escuro + sidebar
├── postcss.config.js             # PostCSS
├── tsconfig.json                 # TypeScript base
├── tsconfig.app.json             # TypeScript app
├── tsconfig.node.json            # TypeScript node
├── arquivos-modelo/              # Fichas de modelo (.docx)
├── public/                       # Assets estáticos (robots.txt)
├── src/
│   ├── main.tsx                  # Entry point React
│   ├── App.tsx                   # Provider tree + rotas
│   ├── index.css                 # CSS custom (tema, variáveis, animações)
│   ├── vite-env.d.ts             # Declarações de tipos Vite
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth provider (Supabase Auth)
│   ├── components/
│   │   ├── AppLayout.tsx         # Layout principal (Sidebar + Header + main)
│   │   ├── AppSidebar.tsx        # Sidebar colapsável com navegação
│   │   ├── AppHeader.tsx         # Header com breadcrumb + user menu
│   │   ├── NavLink.tsx           # Wrapper do React Router NavLink
│   │   ├── ProtectedRoute.tsx    # Redirect p/ /login se não autenticado
│   │   ├── StudentForm.tsx       # Sheet lateral com 4 abas de cadastro
│   │   └── ui/                   # ~60 componentes shadcn/ui
│   ├── hooks/
│   │   ├── use-toast.ts          # Toast hook (shadcn)
│   │   └── use-mobile.tsx        # Mobile breakpoint hook
│   ├── lib/
│   │   ├── api.ts                # Supabase client + interfaces + API functions
│   │   ├── masks.ts              # Funções de máscara (CPF, RG, CEP, telefone)
│   │   ├── supabase.ts           # Supabase client init
│   │   └── utils.ts              # cn() helper (classnames)
│   └── pages/
│       ├── Login.tsx             # Tela de login com gradiente
│       ├── Dashboard.tsx         # Métricas + cards + gráfico de barras
│       ├── Students.tsx          # Tabela CRUD de alunos
│       ├── StudentProfile.tsx    # Perfil detalhado do aluno
│       ├── Documents.tsx         # Templates + geração de PDF
│       ├── Products.tsx          # CRUD de produtos
│       ├── Sales.tsx             # Vendas + recibos
│       └── NotFound.tsx          # Página 404
```

## Rotas

| Path | Componente | Descrição |
|---|---|---|
| `/login` | `Login.tsx` | Autenticação via Supabase Auth |
| `/` | `Dashboard.tsx` | Métricas, cards de turno, gráfico de matrículas por série |
| `/alunos` | `Students.tsx` | Tabela CRUD com busca, filtros por série/turno, PDF de lista |
| `/alunos/:id` | `StudentProfile.tsx` | Perfil completo + histórico de matrícula + impressão de ficha |
| `/documentos` | `Documents.tsx` | Criar/editar templates + gerar PDFs com tags dinâmicas |
| `/financeiro/produtos` | `Products.tsx` | CRUD de produtos (fardamento, material, taxa) |
| `/financeiro/vendas` | `Sales.tsx` | Vendas com busca de aluno, seleção de itens, geração de recibo PDF |
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
| `turno` | text | sim | Manhã / Tarde / Integral |
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
```

### `dashboardApi`

```typescript
dashboardApi.getMetrics()        // Métricas computadas em memória a partir de alunosApi.list()
```

Retorna: `{ total_alunos_ativos, alunos_inadimplentes, alunos_manhã, alunos_tarde, alunos_integral, por_serie }`

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

### Funções Auxiliares

```typescript
substituirTags(conteudo, aluno, matriculaAtiva?)   // Substitui {{tags}} por dados reais
getMatriculaAtiva(aluno)                            // Retorna matrícula ativa mais recente
gerarDocumentoPDF(titulo, corpo, tituloImpresso?, requerAssinatura?)  // Gera PDF de documento
gerarFichaAlunoPDF(aluno, matriculas)               // Gera PDF da ficha do aluno
formatarDataExtenso()                               // "Fortaleza, 13 de julho de 2026"
```

## Autenticação

- **Provider:** Supabase Auth
- **Modo demo:** Ativado quando `VITE_SUPABASE_URL` não está configurada — aceita qualquer credencial
- **Fluxo:** `Login.tsx` → `signIn()` → `AuthContext` → `ProtectedRoute` → rotas protegidas
- **Token:** JWT injetado automaticamente via client Supabase

### Usuários Cadastrados

| Email | Último Login |
|---|---|
| admin.zeniteapp@gmail.com | ~Jun/2026 |
| dev@dev.com | ~Mai/2026 |
| pedrohcarvalho556@gmail.com | ~Abr/2026 |

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
- **Cabeçalho fixo** com dados da escola (logo, endereço, CNPJ, INEP)
- **Assinatura opcional** no rodapé (configurável por template)

## Design System

### Cores

| Elemento | Cor | CSS Variable |
|---|---|---|
| Primária | Verde floresta escuro `#152B21` | `--primary` |
| Sidebar | Tom mais escuro da primária | `--sidebar-background` |
| Background | Fundo claro com mesh gradient sutil | `--background` |
| Cards | Brancos com sombra | `--card` |
| Sucesso | Verde | `--success` |
| Aviso | Amarelo | `--warning` |
| Destrutivo | Vermelho | `--destructive` |

### Tipografia

- **Fonte:** Inter (via Google Fonts)
- **Pesos:** 300–900

### Componentes

- **shadcn/ui** (Radix UI) — ~60 componentes na pasta `src/components/ui/`
- **Sidebar colapsável** — modo ícone-only ou expandido
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

## Observações e Pendências

1. **Schema do Supabase** — as migrações não estão versionadas no repositório; foram criadas manualmente no painel do Supabase
2. **Testes** — apenas placeholder; sem cobertura real
3. **Playwright** — configurado mas sem testes E2E escritos
4. **Dois sistemas de toast** — shadcn/ui Toaster e Sonner coexistem; o código usa Sonner majoritariamente
5. **Dashboard** — métricas computadas em memória a partir de `alunosApi.list()`, não de query dedicada no banco
6. **Valor mensalidade** — em `Documents.tsx`, o campo de documentos usa `.toFixed(2)` em vez de `formatCurrency`
