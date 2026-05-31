-- ============================================================
-- AQUILES Patrón — Etapa 2 · Fase 1
-- Tabla de EVENTOS (faltas / eventos laborales del supervisor)
--
-- Cómo usar:
--   1. Entra a tu proyecto en Supabase.
--   2. Menú izquierdo → "SQL Editor" → "New query".
--   3. Pega TODO este archivo y dale "Run".
-- ============================================================

create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  worker_name      text,
  fault_type       text,
  legal_basis      text,
  evidence         text,
  signature_status text,
  geolocation      text,
  hash             text not null
);

-- Seguridad a nivel de fila (cada empresa solo verá lo suyo, más adelante).
alter table public.events enable row level security;

-- ⚠️ FASE DE PRUEBA: por ahora permitimos insertar y leer SIN login,
-- solo para probar que la conexión funciona de punta a punta.
-- Estas dos reglas se REEMPLAZAN por reglas por-empresa cuando
-- agreguemos el login (Fase 1, segunda parte).
drop policy if exists "prueba_insert" on public.events;
drop policy if exists "prueba_select" on public.events;

create policy "prueba_insert" on public.events
  for insert to anon with check (true);

create policy "prueba_select" on public.events
  for select to anon using (true);
