-- ============================================================
-- AQUILES Patrón — Etapa 2 · Firma electrónica de documentos
-- Guarda solicitudes de firma y su evidencia (firma simple con
-- valor probatorio; NO es NOM-151).
--
-- Cómo usar:
--   1. Supabase → "SQL Editor" → "New query".
--   2. Pega TODO este archivo y dale "Run".
-- ============================================================

create table if not exists public.signatures (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  employee_id   uuid references public.employees(id) on delete set null,
  token         text not null unique,        -- identificador secreto del link
  doc_tipo      text,                          -- 'contrato', 'convenio', etc.
  doc_titulo    text,                          -- nombre visible del documento
  doc_html      text,                          -- el documento a firmar (HTML)
  doc_hash      text,                          -- SHA-256 del documento (integridad)
  firmante_email text,                         -- correo declarado por quien firma
  firmante_nombre text,
  firma_img     text,                          -- la firma dibujada (data URL)
  estado        text not null default 'pendiente',  -- 'pendiente' | 'firmado'
  -- Evidencia al firmar:
  firmado_at    timestamptz,
  firmante_ip   text,
  firmante_ua   text,                          -- navegador/dispositivo
  created_at    timestamptz not null default now()
);
alter table public.signatures enable row level security;

-- El PATRÓN (con sesión) gestiona las firmas de SU empresa.
drop policy if exists "sig_select" on public.signatures;
drop policy if exists "sig_insert" on public.signatures;
create policy "sig_select" on public.signatures for select to authenticated
  using (company_id = public.auth_company_id());
create policy "sig_insert" on public.signatures for insert to authenticated
  with check (company_id = public.auth_company_id());

-- Nota: la lectura pública por token y el guardado de la firma los hace una
-- función de servidor (con permisos de servicio), NO el navegador anónimo.
-- Así el token no expone toda la tabla.
