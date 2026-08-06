-- ============================================================
-- AQUILES Patrón — Etapa 2 · Finiquitos y liquidaciones
-- Guarda cada cálculo de finiquito/liquidación en el expediente
-- del trabajador, aislado por empresa.
--
-- Cómo usar:
--   1. Supabase → "SQL Editor" → "New query".
--   2. Pega TODO este archivo y dale "Run".
-- ============================================================

create table if not exists public.settlements (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  employee_id   uuid references public.employees(id) on delete cascade,
  tipo          text,                 -- 'finiquito' o 'liquidacion'
  motivo        text,                 -- renuncia / termino / despido_injustificado / despido_justificado
  entrada       jsonb,                -- los datos con que se calculó (fechas, salarios, etc.)
  desglose      jsonb,                -- cada concepto y su monto
  total         numeric(14,2),        -- total a pagar
  created_at    timestamptz not null default now()
);
alter table public.settlements enable row level security;

drop policy if exists "settlements_select" on public.settlements;
drop policy if exists "settlements_insert" on public.settlements;
drop policy if exists "settlements_delete" on public.settlements;

create policy "settlements_select" on public.settlements for select to authenticated
  using (company_id = public.auth_company_id());
create policy "settlements_insert" on public.settlements for insert to authenticated
  with check (company_id = public.auth_company_id());
create policy "settlements_delete" on public.settlements for delete to authenticated
  using (company_id = public.auth_company_id());
