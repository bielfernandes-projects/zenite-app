# Zenite — Arquitetura SaaS (V1 + Roadmap V2)

> Plataforma de gestão de entidades e geração de documentos.
> Multi-tenant, configurável por qualquer tipo de organização.
> Escola do Gabriel = cliente zero / prova de conceito.

---

## 1. Visão do Produto

```
Uma organização entra no Zenite, configura seus campos e templates,
e passa a gerenciar seus registros e gerar documentos — sem código.
```

Casos de uso validados desde o V1:
- Escola de ensino fundamental (cliente zero)
- Escolinha de esporte
- Microempreendedor com carteira de clientes
- Pequena empresa com contratos recorrentes

---

## 2. Conceitos Centrais

| Conceito | O que é | Exemplo (escola) | Exemplo (academia) |
|---|---|---|---|
| **Organization** | O tenant — quem contratou o Zenite | Escola Zenite | Academia FitPro |
| **Member** | Usuário com acesso à org | Diretora, coordenador | Gerente, recepcionista |
| **Field Schema** | Campos que a org quer guardar | nome, série, CPF, NIS | nome, plano, data início |
| **Record** | Um registro da org (o "aluno") | João da Silva | Maria Souza |
| **Template** | Modelo de documento com placeholders | Declaração de matrícula | Contrato de adesão |
| **Document** | PDF gerado a partir de template + record | Declaração do João | Contrato da Maria |

---

## 3. Estratégia V1 → V2

### V1 (construir agora)
- Multi-tenant completo — toda org totalmente isolada
- Schema **semi-fixo**: campos comuns em colunas reais + `extra_fields` JSONB para o resto
- Templates por org — upload de `.docx` com placeholders `{campo}`
- CRUD de registros com os campos do schema
- Geração de PDF server-side
- Auth com contexto de org (convite por e-mail)
- Onboarding: ao criar org, escolher um **preset** (escola, academia, empresa genérica) que pré-popula campos e templates de exemplo

### V2 (depois de validar com clientes)
- Interface visual de "construtor de campos" — admin da org cria/remove campos sem tocar em código
- Planos e billing (Stripe)
- Múltiplos templates por tipo de entidade
- Relatórios e exportação CSV
- API pública para integrações

---

## 4. Schema do Banco (Supabase / PostgreSQL)

### 4.1 Organizations (tenants)

```sql
CREATE TABLE organizations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  slug         text UNIQUE NOT NULL,       -- zenite.app/org/escola-gabriel
  tipo_preset  text DEFAULT 'generico'     -- 'escola', 'academia', 'empresa', 'generico'
               CHECK (tipo_preset IN ('escola','academia','empresa','generico')),
  plano        text NOT NULL DEFAULT 'free',
  logo_url     text,
  criado_em    timestamptz NOT NULL DEFAULT now()
);
```

### 4.2 Memberships (usuário ↔ org)

```sql
CREATE TABLE org_memberships (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'membro' CHECK (role IN ('admin','membro')),
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX idx_memberships_user ON org_memberships(user_id);
CREATE INDEX idx_memberships_org  ON org_memberships(org_id);
```

### 4.3 Field Schemas (definição dos campos por org)

```sql
-- V1: preenchida via seed/preset ao criar a org
-- V2: o admin da org edita via interface
CREATE TABLE field_schemas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chave        text NOT NULL,          -- snake_case, ex: "cpf", "serie", "plano"
  rotulo       text NOT NULL,          -- label exibido na UI, ex: "CPF", "Série", "Plano"
  tipo         text NOT NULL DEFAULT 'text'
               CHECK (tipo IN ('text','number','date','boolean','select')),
  opcoes       text[],                 -- para tipo 'select': ["1º Ano","2º Ano",...]
  obrigatorio  boolean NOT NULL DEFAULT false,
  ordem        integer NOT NULL DEFAULT 0,
  ativo        boolean NOT NULL DEFAULT true,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, chave)
);

CREATE INDEX idx_field_schemas_org ON field_schemas(org_id);
```

### 4.4 Records (os "alunos", clientes, atletas...)

```sql
CREATE TABLE records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Campos fixos comuns a qualquer entidade
  nome         text NOT NULL,
  status       text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo','Inativo')),
  foto_url     text,

  -- Campos dinâmicos definidos pela org via field_schemas
  -- Ex escola:  {"serie": "3º Ano", "cpf": "123.456.789-00", "nis": "..."}
  -- Ex academia: {"plano": "Mensal", "data_inicio": "2024-03-01"}
  campos       jsonb NOT NULL DEFAULT '{}',

  criado_em    timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz,
  criado_por   uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_records_org    ON records(org_id);
CREATE INDEX idx_records_status ON records(org_id, status);
CREATE INDEX idx_records_campos ON records USING gin(campos);  -- busca dentro do JSONB
CREATE INDEX idx_records_nome   ON records USING gin(to_tsvector('portuguese', nome));

-- Trigger atualizado_em
CREATE TRIGGER records_atualizado_em
  BEFORE UPDATE ON records
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
```

### 4.5 Document Templates

```sql
CREATE TABLE document_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome         text NOT NULL,          -- "Declaração de Matrícula"
  descricao    text,
  arquivo_path text NOT NULL,          -- path no Supabase Storage: orgs/{org_id}/templates/{id}.docx
  placeholders text[],                 -- extraídos automaticamente do .docx: ["{nome}", "{cpf}"]
  ativo        boolean NOT NULL DEFAULT true,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  criado_por   uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_templates_org ON document_templates(org_id);
```

### 4.6 Documents Generated (histórico)

```sql
CREATE TABLE documents_generated (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_id     uuid NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  template_id   uuid NOT NULL REFERENCES document_templates(id),
  gerado_em     timestamptz NOT NULL DEFAULT now(),
  gerado_por    uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_docs_org    ON documents_generated(org_id);
CREATE INDEX idx_docs_record ON documents_generated(record_id);
```

### 4.7 Row Level Security

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_schemas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE records             ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_generated ENABLE ROW LEVEL SECURITY;

-- Helper function: verifica se o usuário autenticado pertence à org
CREATE OR REPLACE FUNCTION is_org_member(p_org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: verifica se é admin da org
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_id = p_org_id AND user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies
CREATE POLICY "membros podem ver sua org"       ON organizations       FOR SELECT  USING (is_org_member(id));
CREATE POLICY "membros podem ver memberships"   ON org_memberships     FOR SELECT  USING (is_org_member(org_id));
CREATE POLICY "membros acessam field schemas"   ON field_schemas       FOR SELECT  USING (is_org_member(org_id));
CREATE POLICY "membros CRUD records"            ON records             FOR ALL     USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));
CREATE POLICY "membros acessam templates"       ON document_templates  FOR SELECT  USING (is_org_member(org_id));
CREATE POLICY "admin gerencia templates"        ON document_templates  FOR INSERT  WITH CHECK (is_org_admin(org_id));
CREATE POLICY "admin deleta templates"          ON document_templates  FOR DELETE  USING (is_org_admin(org_id));
CREATE POLICY "membros veem historico"          ON documents_generated FOR SELECT  USING (is_org_member(org_id));
CREATE POLICY "membros geram documentos"        ON documents_generated FOR INSERT  WITH CHECK (is_org_member(org_id));
```

---

## 5. Estrutura do Projeto Python

```
zenite-backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, routers, lifespan
│   ├── config.py                # pydantic-settings, lê .env
│   ├── database.py              # cliente Supabase singleton
│   ├── auth.py                  # dependência get_current_user + get_current_org
│   │
│   ├── models/                  # schemas Pydantic (request/response)
│   │   ├── organization.py      # OrgCreate, OrgOut
│   │   ├── record.py            # RecordCreate, RecordUpdate, RecordOut, RecordListItem
│   │   ├── field_schema.py      # FieldSchemaOut, FieldSchemaCreate
│   │   ├── template.py          # TemplateOut, TemplateUpload
│   │   └── document.py          # DocumentGerar, DocumentOut
│   │
│   ├── routers/
│   │   ├── auth.py              # GET /auth/me, POST /auth/invite
│   │   ├── organizations.py     # POST /orgs, GET /orgs/me
│   │   ├── field_schemas.py     # GET /schemas, POST /schemas (admin)
│   │   ├── records.py           # CRUD /records
│   │   ├── templates.py         # GET/POST/DELETE /templates
│   │   ├── documents.py         # POST /documents/generate, GET /documents/history
│   │   └── dashboard.py         # GET /dashboard/stats
│   │
│   └── services/
│       ├── document_service.py  # substitui placeholders no .docx
│       ├── pdf_service.py       # converte .docx → PDF (LibreOffice headless)
│       ├── storage_service.py   # upload/download Supabase Storage
│       └── preset_service.py    # popula field_schemas ao criar org
│
├── presets/                     # configs JSON dos presets
│   ├── escola.json
│   ├── academia.json
│   └── generico.json
│
├── scripts/
│   └── seed.py                  # popula a org do Gabriel com dados de exemplo
│
├── requirements.txt
├── Dockerfile
├── .env.example
└── render.yaml
```

---

## 6. Presets de Onboarding

Ao criar uma org, o admin escolhe um preset. O `preset_service.py` lê o JSON e insere os `field_schemas` correspondentes — já com os campos certos para aquele tipo de negócio.

### presets/escola.json
```json
{
  "tipo": "escola",
  "rotulo_registro": "Aluno",
  "rotulo_registros": "Alunos",
  "campos": [
    { "chave": "serie",             "rotulo": "Série",             "tipo": "select", "opcoes": ["1º Ano","2º Ano","3º Ano","4º Ano","5º Ano"], "obrigatorio": true, "ordem": 1 },
    { "chave": "turno",             "rotulo": "Turno",             "tipo": "select", "opcoes": ["Manhã","Tarde"], "obrigatorio": true, "ordem": 2 },
    { "chave": "data_nascimento",   "rotulo": "Data de Nascimento","tipo": "date",   "ordem": 3 },
    { "chave": "cpf",               "rotulo": "CPF",               "tipo": "text",   "ordem": 4 },
    { "chave": "rg",                "rotulo": "RG",                "tipo": "text",   "ordem": 5 },
    { "chave": "nis",               "rotulo": "NIS",               "tipo": "text",   "ordem": 6 },
    { "chave": "valor_mensalidade", "rotulo": "Valor Mensalidade", "tipo": "number", "ordem": 7 },
    { "chave": "data_vencimento",   "rotulo": "Vencimento",        "tipo": "date",   "ordem": 8 },
    { "chave": "nome_mae",          "rotulo": "Nome da Mãe",       "tipo": "text",   "ordem": 9 },
    { "chave": "nome_pai",          "rotulo": "Nome do Pai",       "tipo": "text",   "ordem": 10 },
    { "chave": "responsavel_financeiro", "rotulo": "Responsável Financeiro", "tipo": "text", "ordem": 11 },
    { "chave": "telefone1",         "rotulo": "Telefone 1",        "tipo": "text",   "ordem": 12 },
    { "chave": "telefone2",         "rotulo": "Telefone 2",        "tipo": "text",   "ordem": 13 },
    { "chave": "cep",               "rotulo": "CEP",               "tipo": "text",   "ordem": 14 },
    { "chave": "logradouro",        "rotulo": "Logradouro",        "tipo": "text",   "ordem": 15 },
    { "chave": "bairro",            "rotulo": "Bairro",            "tipo": "text",   "ordem": 16 },
    { "chave": "cidade",            "rotulo": "Cidade",            "tipo": "text",   "ordem": 17 },
    { "chave": "estado",            "rotulo": "Estado",            "tipo": "text",   "ordem": 18 }
  ]
}
```

### presets/academia.json
```json
{
  "tipo": "academia",
  "rotulo_registro": "Aluno",
  "rotulo_registros": "Alunos",
  "campos": [
    { "chave": "modalidade",    "rotulo": "Modalidade",     "tipo": "select", "opcoes": ["Musculação","Natação","Artes Marciais","Crossfit"], "ordem": 1 },
    { "chave": "plano",         "rotulo": "Plano",          "tipo": "select", "opcoes": ["Mensal","Trimestral","Anual"], "ordem": 2 },
    { "chave": "data_inicio",   "rotulo": "Início",         "tipo": "date",   "ordem": 3 },
    { "chave": "valor",         "rotulo": "Valor",          "tipo": "number", "ordem": 4 },
    { "chave": "dia_vencimento","rotulo": "Dia Vencimento", "tipo": "number", "ordem": 5 },
    { "chave": "telefone",      "rotulo": "Telefone",       "tipo": "text",   "ordem": 6 },
    { "chave": "cpf",           "rotulo": "CPF",            "tipo": "text",   "ordem": 7 }
  ]
}
```

### presets/generico.json
```json
{
  "tipo": "generico",
  "rotulo_registro": "Registro",
  "rotulo_registros": "Registros",
  "campos": [
    { "chave": "descricao",  "rotulo": "Descrição",  "tipo": "text",   "ordem": 1 },
    { "chave": "categoria",  "rotulo": "Categoria",  "tipo": "text",   "ordem": 2 },
    { "chave": "contato",    "rotulo": "Contato",    "tipo": "text",   "ordem": 3 },
    { "chave": "valor",      "rotulo": "Valor",      "tipo": "number", "ordem": 4 }
  ]
}
```

---

## 7. Endpoints da API

Todas as rotas (exceto `/auth` e `/orgs` de criação) exigem:
- Header `Authorization: Bearer {supabase_jwt}`
- O middleware extrai `user_id` e `org_id` (via query param `?org_id=` ou header `X-Org-ID`)

```
# Auth
GET  /auth/me                              → usuário + lista de orgs que pertence
POST /auth/invite                          → convida usuário por e-mail para a org

# Organizations
POST /orgs                                 → cria org + aplica preset → OrgOut
GET  /orgs/me                              → org ativa do usuário

# Field Schemas (definição dos campos)
GET  /schemas                              → lista campos da org (ordenados)
POST /schemas                  [admin]     → cria campo customizado (V2)
PUT  /schemas/:id              [admin]     → edita rótulo/opções
DELETE /schemas/:id            [admin]     → desativa campo

# Records (os registros: alunos, clientes, atletas...)
GET  /records                              ?busca=&status=&page=1&limit=20
POST /records                              body: { nome, status, campos: {} }
GET  /records/:id
PUT  /records/:id
DELETE /records/:id

# Dashboard
GET  /dashboard/stats                      → totais, por campo select, novos/mês

# Document Templates
GET  /templates                            → lista templates da org
POST /templates                [admin]     → upload .docx → extrai placeholders
DELETE /templates/:id          [admin]

# Documents
POST /documents/generate                   body: { template_id, record_id } → PDF stream
GET  /documents/history                    ?record_id=
```

---

## 8. Sistema de Templates e Placeholders

O template `.docx` usa placeholders no formato `{chave}` onde `chave` é exatamente
o valor de `field_schemas.chave` da org, mais os campos fixos:

```
Campos fixos disponíveis em qualquer template:
  {nome}        → records.nome
  {status}      → records.status
  {data_hoje}   → data atual formatada

Campos dinâmicos (dependem dos field_schemas da org):
  Escola:   {serie}, {turno}, {cpf}, {nis}, {valor_mensalidade}, {nome_mae}, etc.
  Academia: {modalidade}, {plano}, {valor}, {dia_vencimento}, etc.
```

### document_service.py

```python
import re
from docx import Document
from copy import deepcopy

def extrair_placeholders(docx_path: str) -> list[str]:
    doc = Document(docx_path)
    texto = " ".join(p.text for p in doc.paragraphs)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                texto += " " + cell.text
    return list(set(re.findall(r'\{(\w+)\}', texto)))

def preencher_template(docx_path: str, dados: dict) -> bytes:
    doc = Document(docx_path)

    def substituir(texto: str) -> str:
        for chave, valor in dados.items():
            texto = texto.replace(f"{{{chave}}}", str(valor) if valor is not None else "")
        return texto

    for paragrafo in doc.paragraphs:
        for run in paragrafo.runs:
            run.text = substituir(run.text)

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragrafo in cell.paragraphs:
                    for run in paragrafo.runs:
                        run.text = substituir(run.text)

    from io import BytesIO
    buffer = BytesIO()
    doc.save(buffer)
    return buffer.getvalue()
```

### Construção do dicionário de dados

```python
async def montar_dados_para_template(record: dict, org_id: str) -> dict:
    from datetime import date

    dados = {
        "nome":      record["nome"],
        "status":    record["status"],
        "data_hoje": date.today().strftime("%d/%m/%Y"),
        **record["campos"]   # desempacota todos os campos dinâmicos
    }
    return dados
```

---

## 9. Conversão DOCX → PDF

```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y libreoffice --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```python
# services/pdf_service.py
import subprocess, tempfile, os
from pathlib import Path

def docx_para_pdf(docx_bytes: bytes) -> bytes:
    with tempfile.TemporaryDirectory() as tmpdir:
        input_path = Path(tmpdir) / "documento.docx"
        input_path.write_bytes(docx_bytes)

        subprocess.run([
            "libreoffice", "--headless", "--convert-to", "pdf",
            "--outdir", tmpdir, str(input_path)
        ], check=True, capture_output=True)

        pdf_path = Path(tmpdir) / "documento.pdf"
        return pdf_path.read_bytes()
```

---

## 10. Seed — Org do Gabriel

```python
# scripts/seed.py
# Cria a org da escola do Gabriel com dados de exemplo

ORG = {
    "nome": "Escola Primeiros Passos",
    "slug": "primeiros-passos",
    "tipo_preset": "escola"
}

RECORDS = [
    { "nome": "Ana Souza",    "campos": { "serie": "2º Ano", "turno": "Manhã",  "valor_mensalidade": 450, "nome_mae": "Carla Souza" } },
    { "nome": "Bruno Lima",   "campos": { "serie": "3º Ano", "turno": "Tarde",  "valor_mensalidade": 450, "nome_mae": "Paula Lima"  } },
    { "nome": "Clara Matos",  "campos": { "serie": "1º Ano", "turno": "Manhã",  "valor_mensalidade": 400, "nome_mae": "Rita Matos"  } },
]
```

---

## 11. requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
supabase==2.4.6
python-docx==1.1.2
python-jose[cryptography]==3.3.0
pydantic==2.7.0
pydantic-settings==2.2.1
httpx==0.27.0
python-multipart==0.0.9
```

---

## 12. Ordem de Implementação

### Sprint 1 — Fundação
1. `config.py` + `database.py` (Supabase conectado)
2. SQL migrations no Supabase (todas as tabelas + RLS)
3. `auth.py` — middleware JWT + `get_current_user`
4. `preset_service.py` — carrega JSONs e popula `field_schemas`
5. `POST /orgs` — cria org + aplica preset
6. `GET /auth/me`

### Sprint 2 — Core
7. `GET /schemas` — lista campos da org
8. CRUD `/records` completo
9. `GET /dashboard/stats`

### Sprint 3 — Documentos
10. `storage_service.py` — upload/download Supabase Storage
11. `POST /templates` — upload .docx + extrai placeholders
12. `GET /templates`
13. `document_service.py` + `pdf_service.py`
14. `POST /documents/generate`
15. `GET /documents/history`

### Sprint 4 — Deploy
16. Dockerfile + render.yaml
17. Seed da org do Gabriel
18. Configurar variáveis no Render
19. Testar CORS com o frontend

---

## 13. Custos (V1)

| Serviço | Plano | Limite free | Custo |
|---|---|---|---|
| Supabase | Free | 500MB DB + 1GB Storage + Auth | R$ 0 |
| Render | Free | 750h/mês, hiberna em inatividade | R$ 0 |
| Vercel | Free | Frontend estático ilimitado | R$ 0 |
| **Total V1** | | | **R$ 0/mês** |

Quando o produto validar e escalar: Supabase Pro (~R$130/mês) + Render Starter (~R$40/mês).
