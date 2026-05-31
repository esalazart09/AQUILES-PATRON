-- ============================================================
-- AQUILES Patrón — Etapa 2 · Multi-empresa (multi-tenant)
-- Cada empresa es un espacio AISLADO. Un usuario solo puede ver
-- y tocar datos de SU empresa. Ninguna empresa ve a otra.
--
-- Cómo usar:
--   1. Supabase → "SQL Editor" → "New query".
--   2. Pega TODO este archivo y dale "Run".
-- ============================================================

-- ---------- Tablas ----------

create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Mi empresa',
  owner_id   uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.companies enable row level security;

-- Un perfil por usuario, que lo liga a su empresa.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  role       text not null default 'admin',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Trabajadores de cada empresa.
create table if not exists public.employees (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name  text not null,
  position   text,
  department text,
  created_at timestamptz not null default now()
);
alter table public.employees enable row level security;

-- Ligar los eventos a una empresa (y opcionalmente a un trabajador).
alter table public.events add column if not exists company_id  uuid references public.companies(id) on delete cascade;
alter table public.events add column if not exists employee_id uuid references public.employees(id) on delete set null;

-- ---------- Función ayudante ----------
-- Devuelve la empresa del usuario actual. SECURITY DEFINER para que no
-- entre en conflicto con las reglas de la tabla profiles.
create or replace function public.auth_company_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- ---------- Reglas de aislamiento (RLS) ----------

-- companies
drop policy if exists "companies_select" on public.companies;
drop policy if exists "companies_insert" on public.companies;
create policy "companies_select" on public.companies for select to authenticated
  using (owner_id = auth.uid() or id = public.auth_company_id());
create policy "companies_insert" on public.companies for insert to authenticated
  with check (owner_id = auth.uid());

-- profiles (cada quien maneja solo su propia fila)
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid());
create policy "profiles_insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- employees (solo los de TU empresa)
drop policy if exists "employees_select" on public.employees;
drop policy if exists "employees_insert" on public.employees;
drop policy if exists "employees_update" on public.employees;
drop policy if exists "employees_delete" on public.employees;
create policy "employees_select" on public.employees for select to authenticated
  using (company_id = public.auth_company_id());
create policy "employees_insert" on public.employees for insert to authenticated
  with check (company_id = public.auth_company_id());
create policy "employees_update" on public.employees for update to authenticated
  using (company_id = public.auth_company_id()) with check (company_id = public.auth_company_id());
create policy "employees_delete" on public.employees for delete to authenticated
  using (company_id = public.auth_company_id());

-- events (ahora también aislados por empresa)
drop policy if exists "auth_insert" on public.events;
drop policy if exists "auth_select" on public.events;
drop policy if exists "events_select" on public.events;
drop policy if exists "events_insert" on public.events;
create policy "events_select" on public.events for select to authenticated
  using (company_id = public.auth_company_id());
create policy "events_insert" on public.events for insert to authenticated
  with check (company_id = public.auth_company_id());
