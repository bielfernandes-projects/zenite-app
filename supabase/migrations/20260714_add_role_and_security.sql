-- ============================================================================
-- Migration: adicionar role em profiles + endurecer RLS em todas as tabelas
-- Data: 2026-07-14
-- Status: aplicado no servidor
-- ============================================================================

-- Funcao helper: usuario autenticado tem role admin ou funcionario
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','funcionario')
  )
$$;

grant execute on function public.is_staff() to authenticated;

-- Funcoes security definer para evitar RLS recursivo em policies de profiles.
-- Quando uma policy referencia profiles via subquery, dispara a policy
-- de SELECT, que pode referenciar profiles de novo, criando loop infinito.
-- Essas funcoes bypassam RLS (security definer) e quebram o ciclo.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid()
$$;

grant execute on function public.my_role() to authenticated;

-- ============================================================================
-- 1) Adicionar coluna `role` em `profiles`
-- ============================================================================

alter table public.profiles
  add column if not exists role text not null default 'funcionario'
  check (role in ('admin', 'funcionario'));

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin.zeniteapp@gmail.com');

-- ============================================================================
-- 2) Refinar RLS de `profiles` (impedir auto-promocao de role)
-- ============================================================================

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile (not role)"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = public.my_role()
  );

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile, admins view all"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or public.is_admin()
  );

create policy "Admins can update any profile role"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 3) Remover policies permissivas das tabelas de dados
-- ============================================================================

drop policy if exists "Allow all access to alunos" on public.alunos;
drop policy if exists "Permitir acesso total as matriculas para usuarios logados" on public.matriculas;
drop policy if exists "Permitir acesso total aos produtos para usuarios logados" on public.produtos;
drop policy if exists "Permitir acesso total aos recibos para usuarios logados" on public.recibos;
drop policy if exists "Permitir acesso total aos templates para usuarios logados" on public.templates_documentos;

-- ============================================================================
-- 4) Policies restritivas: somente staff autenticado leem/escrevem
-- ============================================================================

-- ALUNOS
create policy "staff_select_alunos"  on public.alunos for select to authenticated using (public.is_staff());
create policy "staff_insert_alunos"  on public.alunos for insert to authenticated with check (public.is_staff());
create policy "staff_update_alunos"  on public.alunos for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff_delete_alunos"  on public.alunos for delete to authenticated using (public.is_staff());

-- MATRICULAS
create policy "staff_select_matriculas" on public.matriculas for select to authenticated using (public.is_staff());
create policy "staff_insert_matriculas" on public.matriculas for insert to authenticated with check (public.is_staff());
create policy "staff_update_matriculas" on public.matriculas for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff_delete_matriculas" on public.matriculas for delete to authenticated using (public.is_staff());

-- PRODUTOS / RECIBOS / TEMPLATES (for all cobre select/insert/update/delete)
create policy "staff_all_produtos"             on public.produtos             for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff_all_recibos"              on public.recibos              for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff_all_templates_documentos" on public.templates_documentos for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ============================================================================
-- 5) Storage: endurecer bucket avatars
-- ============================================================================

drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users update own avatar"     on storage.objects;
drop policy if exists "Users delete own avatar"     on storage.objects;

create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using      (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- 6) Atualizar handle_new_user para aceitar role via meta_data
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'role' in ('admin', 'funcionario')
        then new.raw_user_meta_data ->> 'role'
      else 'funcionario'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
