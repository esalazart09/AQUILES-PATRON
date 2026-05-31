-- ============================================================
-- AQUILES Patrón — Etapa 2 · Fase 1 (login real)
-- CERRAR la base al público: solo usuarios autenticados pueden
-- leer y escribir eventos. Reemplaza a las reglas de prueba.
--
-- Cómo usar:
--   1. Supabase → "SQL Editor" → "New query".
--   2. Pega TODO este archivo y dale "Run".
-- ============================================================

-- Quitar las reglas permisivas de prueba (acceso anónimo).
drop policy if exists "prueba_insert" on public.events;
drop policy if exists "prueba_select" on public.events;

-- Nuevas reglas: solo usuarios con sesión iniciada.
drop policy if exists "auth_insert" on public.events;
drop policy if exists "auth_select" on public.events;

create policy "auth_insert" on public.events
  for insert to authenticated with check (true);

create policy "auth_select" on public.events
  for select to authenticated using (true);

-- Nota: cuando agreguemos multi-empresa, estas reglas se afinarán
-- para que cada usuario vea solo los eventos de SU empresa.
