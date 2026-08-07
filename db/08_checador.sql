-- ============================================================
-- AQUILES Patrón — Etapa 2 · Checador electrónico
-- Registra entradas y salidas de los trabajadores, con
-- geolocalización, aislado por empresa.
--
-- Cómo usar:
--   1. Supabase → "SQL Editor" → "New query".
--   2. Pega TODO este archivo y dale "Run".
-- ============================================================

create table if not exists public.checadas (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  tipo        text,               -- 'entrada' o 'salida'
  marcada_at  timestamptz not null default now(),
  lat         double precision,   -- latitud (geolocalización)
  lng         double precision,   -- longitud
  precision_m double precision,   -- precisión en metros
  estado      text,               -- 'ok' | 'retardo' (referencia)
  created_at  timestamptz not null default now()
);
alter table public.checadas enable row level security;

drop policy if exists "checadas_select" on public.checadas;
drop policy if exists "checadas_insert" on public.checadas;

create policy "checadas_select" on public.checadas for select to authenticated
  using (company_id = public.auth_company_id());
create policy "checadas_insert" on public.checadas for insert to authenticated
  with check (company_id = public.auth_company_id());
