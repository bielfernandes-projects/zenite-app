# Briefing para Planejamento do Backend

## Projeto Zenite - Sistema de Gestão Escolar

---

## 1. Visão Geral do Frontend

Frontend já desenvolvido com:
- **Stack**: Vite + React + TypeScript + Tailwind + shadcn-ui
- **Roteamento**: React Router
- **Estado/ Dados**: React Query (implementar após backend)
- **UI**: Componentes shadcn/ui com tema verde/emaragd

### Páginas Existentes

| Página | Funcionalidades |
|--------|-----------------|
| **Dashboard** | Cards com estatísticas (alunos ativos, matrículas por mês, alunos por turno/série), gráficos usando Recharts |
| **Alunos** | Listagem com filtros (buscar, série, turno), CRUD completo via modal, ordenação |
| **Documentos** | Seleção de aluno via combobox, geração de documentos (declaração, recibo, histórico), preview de dados |

---

## 2. Modelo de Dados Atual (Frontend)

### Student
```typescript
interface Student {
  id: string;
  name: string;
  photo: string;
  status: "Ativo" | "Inativo";
  grade: string;           // "1º Ano" até "5º Ano"
  shift: "Manhã" | "Tarde";
  guardian: string;        // Nome do responsável
  phone: string;
  birthDate: string;      // ISO date
  monthlyFee: number;     // Valor da mensalidade
  dueDay: number;         // Dia de vencimento (1-31)
  motherName: string;
  motherCpf: string;
  fatherName: string;
  fatherCpf: string;
  financialGuardian: string;
  financialGuardianCpf: string;
  zip: string;
  street: string;
  neighborhood: string;
  city: string;
  phone2: string;
  phone3: string;
}
```

### Dados de Referência
```typescript
grades = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"]
shifts = ["Manhã", "Tarde"]
documentTypes = [
  { value: "declaracao", label: "Declaração de Matrícula" },
  { value: "recibo", label: "Recibo de Pagamento" },
  { value: "historico", label: "Histórico Escolar" }
]
enrollmentsByMonth = [{ month: "Jan", count: 12 }, ...] // último ano
```

---

## 3. Requisitos do Backend

### 3.1 Autenticação
- Sistema de login para admins/coordenadores
- Autenticação via Supabase Auth (email/senha)
- Roles: admin, usuario (futuro)

### 3.2 API RESTful
- Endpoints para CRUD de alunos
- Endpoints para estatísticas do dashboard
- Integração com Supabase (PostgreSQL + Row Level Security)

### 3.3 Geração de Documentos
-API para gerar PDFs (declaração, recibo, histórico)
- Usar biblioteca Python (ReportLab ou similar)

### 3.4 Persistence
- Substituir dados mock por banco Supabase
- Sincronização em tempo real (supabase-js)

---

## 4. Stack Técnica Proposta

| Componente | Tecnologia |
|------------|------------|
| Backend API | FastAPI (Python) |
| Banco de Dados | Supabase (PostgreSQL) |
| ORM | SQLAlchemy + async |
| Autenticação | Supabase Auth |
| Documentos | ReportLab / WeasyPrint |
| Deploy | Supabase Edge Functions ou Container |

---

## 5. Perguntas para o Claude

1. **Schema do Banco**: Quais tabelas e relacionamentos você recomenda para o Supabase? Considere-normalização, extensões úteis (PostGIS, etc.), e políticas RLS.

2. **API Design**: Quais endpoints você sugere para o FastAPI? Estruture a resposta com exemplo de resposta JSON para cada endpoint.

3. **Geração de PDFs**: Qual abordagem recomendada para gerar os documentos (declaração, recibo, histórico) no backend? Há alternativas serverless?

4. **Sincronização**: Como estruturar o frontend para consumir a API em tempo real com Supabase? Usar supabase-js diretamente ou criar camada de abstração?

5. **Migração**: Como você sugere migrar os dados mock atuais para o Supabase? seed script?

6. **Structura de Projeto**: Poderia sugerir a estrutura de diretórios para o projeto Python, considerando Clean Architecture ou padrão similar?

---

## 6. Próximos Passos

1. Validar schema do banco
2. Projetar endpoints da API
3. Definir estrutura do projeto Python
4. Implementar autenticidade
5. Criar seed com dados mock
6. Integrar frontend com backend

---

**Objetivo**: Criar um backend robusto, escalável e de fácil manutenção, aproveitando o ecossistema Supabase para autenticação, banco de dados e realtime.