-- ============================================================================
-- Migration: audit log + RPCs de agregacao
-- Data: 2026-07-14
--
-- Cria:
--   1. Tabela audit_log (LGPD art. 37 - registro de operacoes)
--   2. Trigger generica de auditoria em todas as tabelas de dados
--   3. RPCs de agregacao para o Dashboard (substituem select(*))
--   4. RPC log_operacao() para registrar geracao de PDF manualmente
-- ============================================================================

-- ============================================================================
-- 1) Tabela audit_log
-- ============================================================================

create table if not exists public.audit_log (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  acao text not null check (acao in ('INSERT','UPDATE','DELETE','PDF_GENERATED','LOGIN','LOGOUT')),
  tabela text not null,
  registro_id text,
  dados_antes jsonb,
  dados_depois jsonb,
  metadados jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_user_id   on public.audit_log (user_id);
create index if not exists idx_audit_log_tabela    on public.audit_log (tabela);
create index if not exists idx_audit_log_created   on public.audit_log (created_at desc);

-- Apenas admins leem o audit log
alter table public.audit_log enable row level security;

create policy "Admins can read audit log"
  on public.audit_log for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Staff can insert audit log"
  on public.audit_log for insert
  to authenticated
  with check (public.is_staff());

-- ============================================================================
-- 2) Trigger generica de auditoria
-- ============================================================================

create or replace function public.audit_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (user_id, acao, tabela, registro_id, dados_antes, dados_depois)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    case when tg_op = 'DELETE' then (old.id)::text else (new.id)::text end,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

-- Aplicar trigger em todas as tabelas com PII
drop trigger if exists audit_alunos               on public.alunos;
create trigger audit_alunos               after insert or update or delete on public.alunos               for each row execute function public.audit_changes();

drop trigger if exists audit_matriculas           on public.matriculas;
create trigger audit_matriculas           after insert or update or delete on public.matriculas           for each row execute function public.audit_changes();

drop trigger if exists audit_produtos             on public.produtos;
create trigger audit_produtos             after insert or update or delete on public.produtos             for each row execute function public.audit_changes();

drop trigger if exists audit_recibos              on public.recibos;
create trigger audit_recibos              after insert or update or delete on public.recibos              for each row execute function public.audit_changes();

drop trigger if exists audit_templates_documentos on public.templates_documentos;
create trigger audit_templates_documentos after insert or update or delete on public.templates_documentos for each row execute function public.audit_changes();

-- ============================================================================
-- 3) RPCs de agregacao para o Dashboard (item 6 da auditoria)
-- ============================================================================

-- Metricas basicas (substitui select(*) em alunos)
create or replace function public.dashboard_metrics(p_ano_letivo int)
returns table (
  total_ativos bigint,
  total_manha  bigint,
  total_tarde  bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    count(*)::bigint as total_ativos,
    count(*) filter (where m.turno ilike 'Manh%')::bigint as total_manha,
    count(*) filter (where m.turno ilike 'Tarde%')::bigint as total_tarde
  from public.matriculas m
  where m.ano_letivo = p_ano_letivo
    and m.status = 'Ativo';
$$;

grant execute on function public.dashboard_metrics(int) to authenticated;

-- Distribuicao por serie (grafico "Por Serie")
create or replace function public.dashboard_por_serie(p_ano_letivo int)
returns table (serie text, qtd bigint)
language sql
security definer
stable
set search_path = public
as $$
  select m.serie, count(*)::bigint as qtd
  from public.matriculas m
  where m.ano_letivo = p_ano_letivo
    and m.status = 'Ativo'
  group by m.serie
  order by m.serie;
$$;

grant execute on function public.dashboard_por_serie(int) to authenticated;

-- Distribuicao por genero/serie/turno (grafico empilhado)
create or replace function public.dashboard_genero_serie_turno(p_ano_letivo int)
returns table (
  serie text,
  turno text,
  masculino bigint,
  feminino bigint,
  nao_informado bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    m.serie,
    m.turno,
    count(*) filter (where a.genero = 'Masculino')::bigint as masculino,
    count(*) filter (where a.genero = 'Feminino')::bigint  as feminino,
    count(*) filter (where a.genero is null or a.genero not in ('Masculino','Feminino'))::bigint as nao_informado
  from public.matriculas m
  join public.alunos a on a.id = m.aluno_id
    where m.ano_letivo = p_ano_letivo
    and m.status = 'Ativo'
  group by m.serie, m.turno
  order by m.turno, m.serie;
$$;

grant execute on function public.dashboard_genero_serie_turno(int) to authenticated;

-- ============================================================================
-- 4) RPC log_operacao() - registrar geracao de PDF (item 12 da auditoria)
-- ============================================================================

create or replace function public.log_operacao(
  p_acao text,
  p_tabela text,
  p_registro_id text default null,
  p_metadados jsonb default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_log (user_id, acao, tabela, registro_id, metadados)
  values (auth.uid(), p_acao, p_tabela, p_registro_id, p_metadados);
$$;

grant execute on function public.log_operacao(text, text, text, jsonb) to authenticated;
