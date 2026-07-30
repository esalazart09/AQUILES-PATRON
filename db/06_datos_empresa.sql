-- ============================================================
-- AQUILES Patrón — Etapa 2 · Datos de la empresa (para contratos)
-- Amplía la tabla companies con todos los datos legales del
-- patrón que necesita el contrato, y agrega 3 campos al trabajador.
--
-- Cómo usar:
--   1. Supabase → "SQL Editor" → "New query".
--   2. Pega TODO este archivo y dale "Run".
-- ============================================================

-- ---------- Datos legales de la empresa (patrón) ----------
alter table public.companies add column if not exists rfc              text;   -- RFC de la empresa
alter table public.companies add column if not exists fiscal_address   text;   -- domicilio fiscal
alter table public.companies add column if not exists imss_registro    text;   -- registro patronal IMSS
alter table public.companies add column if not exists legal_rep_name   text;   -- representante legal
alter table public.companies add column if not exists legal_rep_role   text;   -- carácter (apoderado, admin. único, etc.)
alter table public.companies add column if not exists jurisdiction     text;   -- estado, municipio (tribunales)
-- Datos de constitución (escritura pública de la sociedad)
alter table public.companies add column if not exists const_escritura  text;   -- no. de escritura
alter table public.companies add column if not exists const_fecha      text;   -- fecha de la escritura
alter table public.companies add column if not exists const_notario    text;   -- nombre del notario
alter table public.companies add column if not exists const_notaria    text;   -- no. de notaría
alter table public.companies add column if not exists const_ciudad     text;   -- ciudad/estado del notario
alter table public.companies add column if not exists const_folio      text;   -- folio mercantil (RPPC)
-- Datos del poder del representante (escritura del apoderado)
alter table public.companies add column if not exists rep_escritura    text;
alter table public.companies add column if not exists rep_fecha        text;
alter table public.companies add column if not exists rep_notario      text;
alter table public.companies add column if not exists rep_notaria      text;
alter table public.companies add column if not exists rep_ciudad       text;

-- Permitir que el dueño ACTUALICE los datos de su empresa.
drop policy if exists "companies_update" on public.companies;
create policy "companies_update" on public.companies for update to authenticated
  using (owner_id = auth.uid() or id = public.auth_company_id())
  with check (owner_id = auth.uid() or id = public.auth_company_id());

-- ---------- 3 campos extra del trabajador (para el contrato) ----------
alter table public.employees add column if not exists nationality  text;
alter table public.employees add column if not exists civil_status text;
alter table public.employees add column if not exists hire_date    date;
