# Zenite — Briefing Frontend (SaaS V1)

> Substitui todos os briefings anteriores.
> O Zenite é uma plataforma SaaS multi-tenant de gestão de entidades + geração de documentos.
> A escola do Gabriel é o cliente zero — mas o sistema serve qualquer tipo de organização.

---

## 1. Stack (sem alterações)

- **Framework**: Vite + React + TypeScript
- **UI**: Tailwind + shadcn-ui (tema verde/emerald — manter)
- **Roteamento**: React Router
- **Dados**: React Query

---

## 2. Conceito Central que Muda Tudo

O sistema não é "um sistema de gestão escolar". É uma plataforma onde
**cada organização configura o que quer gerir**.

Consequências para o frontend:
- Não existe um formulário de "aluno" fixo — os campos vêm da API (`GET /schemas`)
- O formulário de cadastro é **dinâmico**: renderizado a partir dos `field_schemas` da org
- A palavra "Aluno" pode ser "Cliente", "Atleta", "Associado" — vem da org (`rotulo_registro`)
- Os tipos de documento também não são fixos — vêm de `GET /templates`

---

## 3. Tipos TypeScript

```typescript
// Organização (tenant)
interface Organization {
  id: string;
  nome: string;
  slug: string;
  tipo_preset: 'escola' | 'academia' | 'empresa' | 'generico';
  rotulo_registro: string;   // ex: "Aluno", "Cliente", "Atleta"
  rotulo_registros: string;  // ex: "Alunos", "Clientes", "Atletas"
  logo_url?: string;
}

// Definição de campo (vem de GET /schemas)
interface FieldSchema {
  id: string;
  chave: string;             // snake_case, ex: "cpf", "serie", "plano"
  rotulo: string;            // label da UI, ex: "CPF", "Série", "Plano"
  tipo: 'text' | 'number' | 'date' | 'boolean' | 'select';
  opcoes?: string[];         // para tipo 'select'
  obrigatorio: boolean;
  ordem: number;
}

// Registro (o "aluno", cliente, atleta...)
interface Record {
  id: string;
  nome: string;
  status: 'Ativo' | 'Inativo';
  foto_url?: string;
  campos: Record<string, any>;  // chave → valor conforme field_schemas
  criado_em: string;
  atualizado_em?: string;
}

// Template de documento
interface DocumentTemplate {
  id: string;
  nome: string;
  descricao?: string;
  placeholders: string[];    // ex: ["{nome}", "{serie}", "{cpf}"]
  criado_em: string;
}

// Histórico de documento gerado
interface GeneratedDocument {
  id: string;
  record_id: string;
  record_nome: string;
  template_id: string;
  template_nome: string;
  gerado_em: string;
  gerado_por_nome: string;
}
```

---

## 4. Fluxo de Autenticação

Login e logout via `supabase-js` diretamente no frontend.
Após login, o JWT do Supabase vai em **todas** as chamadas à API:

```typescript
const { data: { session } } = await supabase.auth.getSession();

// Todas as requests:
headers: { Authorization: `Bearer ${session?.access_token}` }
```

Rota pós-login: se o usuário não tiver org, redirecionar para `/onboarding`.
Se tiver, redirecionar para `/dashboard`.

---

## 5. Tela de Onboarding (nova — obrigatória)

Rota: `/onboarding`

Exibida uma única vez, quando o usuário logou mas ainda não tem org.

**Passo 1** — Nome da organização (campo de texto)

**Passo 2** — Escolha do preset com cards visuais:
- 🏫 **Escola** — gestão de alunos, turmas, mensalidades
- 🏃 **Academia / Escolinha** — alunos, planos, pagamentos
- 🏢 **Empresa / MEI** — clientes, contratos, cobranças
- ⚙️ **Genérico** — começa em branco, configure do zero

Ao confirmar: `POST /orgs` com `{ nome, tipo_preset }`.
Redirecionar para `/dashboard` após criação.

---

## 6. Layout Geral

Sidebar fixa à esquerda:
- Logo "Zenite" + nome da org
- Links: **Dashboard**, **[rotulo_registros]** (dinâmico), **Documentos**, **Configurações**
- Avatar + nome do usuário logado + logout no rodapé

O link "Alunos" não existe — o nome do link vem de `org.rotulo_registros` da API.

---

## 7. Dashboard

`GET /dashboard/stats` → exibir:
- Total de registros ativos
- Total de registros inativos
- Distribuição por campos do tipo `select` (ex: série, turno, plano)
- Novos registros no mês atual (gráfico de barras — Recharts)

Os cards de "por série" e "por turno" existentes continuam funcionando —
a API devolve os dados agrupados por campo select automaticamente.

---

## 8. Tela de Registros (substitui "Alunos")

Rota: `/registros`

O título da página usa `org.rotulo_registros` (ex: "Alunos", "Clientes").

### Listagem
Tabela com colunas fixas: **Nome**, **Status** + até 3 colunas dos campos
mais relevantes da org (os primeiros `field_schemas` por `ordem`).

Barra de busca (filtra por nome) + filtro de status.
`GET /records?busca=&status=&page=1&limit=20`

Botão **"Novo [rotulo_registro]"** abre o formulário dinâmico.

### Formulário Dinâmico (drawer lateral)

O formulário **não tem campos fixos além de nome e status**.
Renderizar os campos a partir de `GET /schemas`, respeitando `ordem`:

```typescript
function renderizarCampo(field: FieldSchema) {
  switch (field.tipo) {
    case 'text':    return <Input label={field.rotulo} required={field.obrigatorio} />
    case 'number':  return <Input type="number" label={field.rotulo} />
    case 'date':    return <DatePicker label={field.rotulo} />
    case 'boolean': return <Switch label={field.rotulo} />
    case 'select':  return <Select label={field.rotulo} options={field.opcoes} />
  }
}
```

Os valores de todos os campos dinâmicos vão no objeto `campos: {}` do body:
```typescript
// POST /records
{
  "nome": "João da Silva",
  "status": "Ativo",
  "campos": {
    "serie": "3º Ano",
    "turno": "Manhã",
    "cpf": "123.456.789-00",
    "valor_mensalidade": 450
  }
}
```

---

## 9. Perfil do Registro

Rota: `/registros/:id`

Exibe todos os dados do registro. Renderizar campos dinâmicos com o mesmo
mapeamento do formulário, mas em modo leitura (labels + valores).

Agrupar campos em seções se a org for do preset `escola`
(Dados Pessoais / Filiação / Contato) — mas essa lógica é opcional no V1,
pode exibir tudo em sequência pelo campo `ordem`.

Ações:
- **Editar** → abre drawer pré-preenchido
- **Gerar documento** → navega para `/documentos?record_id=:id`
- **Excluir** → confirmação + `DELETE /records/:id`

---

## 10. Tela de Documentos

Rota: `/documentos`

Dois painéis lado a lado:

**Painel esquerdo:**
- Combobox de registro (busca por nome → `GET /records?busca=`)
- Lista de templates disponíveis (`GET /templates`) — clicar para selecionar

**Painel direito:**
- Preview dos dados do registro selecionado
- Lista dos placeholders que o template usa (ex: `{nome}`, `{serie}`, `{cpf}`)
- Indicação visual se algum placeholder não tem valor preenchido no registro
- Botão **"Gerar PDF"**

Ao gerar: `POST /documents/generate` com `{ template_id, record_id }`.
Resposta é um stream PDF — abrir em nova aba ou download automático.

Abaixo: tabela de histórico `GET /documents/history`.

---

## 11. Configurações (admin da org)

Rota: `/configuracoes`

Acessível apenas para membros com `role = 'admin'`.

### Aba — Templates de Documento
- Lista os templates da org
- Botão upload de novo `.docx`
  - Após upload, a API extrai os placeholders automaticamente
  - Exibir a lista de placeholders encontrados para confirmar
- Botão excluir template

### Aba — Membros (V1 simples)
- Lista membros da org com seus roles
- Botão convidar por e-mail → `POST /auth/invite`

### Aba — Campos (V2 — deixar como "em breve")
- Interface de construção de campos
- Bloqueada no V1 com badge "Em breve"

---

## 12. Variáveis de Ambiente

```env
VITE_API_URL=https://zenite-api.onrender.com
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 13. O que muda em relação ao frontend atual

| Componente | Ação |
|---|---|
| Interface `Student` | Substituir por `Record` + `FieldSchema` (seção 3) |
| Rota `/alunos` | Renomear para `/registros` |
| Formulário fixo de aluno | Substituir por formulário dinâmico (seção 8) |
| `documentTypes` hardcoded | Buscar de `GET /templates` |
| Sem tela de onboarding | Criar `/onboarding` (seção 5) |
| Sem tela de configurações | Criar `/configuracoes` (seção 11) |
| Nome "Alunos" na sidebar | Usar `org.rotulo_registros` da API |
