-- ============================================================
-- AQUILES Patrón — Etapa 2 · Documentos y datos del trabajador
-- Agrega datos legales al trabajador (CURP, RFC, NSS, domicilio,
-- fecha de nacimiento) y un almacén de archivos (INE, CURP, etc.)
-- aislado por empresa.
--
-- Cómo usar:
--   1. Supabase → "SQL Editor" → "New query".
--   2. Pega TODO este archivo y dale "Run".
-- ============================================================

-- ---------- Datos legales del trabajador ----------
alter table public.employees add column if not exists curp       text;
alter table public.employees add column if not exists rfc        text;
alter table public.employees add column if not exists nss        text;
alter table public.employees add column if not exists address    text;
alter table public.employees add column if not exists birth_date date;

-- ---------- Tabla de documentos (metadatos de cada archivo) ----------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  doc_type    text,        -- INE, CURP, NSS, Comprobante de domicilio, Otro
  file_path   text not null,
  file_name   text,
  created_at  timestamptz not null default now()
);
alter table public.documents enable row level security;

drop policy if exists "documents_select" on public.documents;
drop policy if exists "documents_insert" on public.documents;
drop policy if exists "documents_delete" on public.documents;
create policy "documents_select" on public.documents for select to authenticated
  using (company_id = public.auth_company_id());
create policy "documents_insert" on public.documents for insert to authenticated
  with check (company_id = public.auth_company_id());
create policy "documents_delete" on public.documents for delete to authenticated
  using (company_id = public.auth_company_id());

-- ---------- Almacén de archivos (Storage), privado ----------
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- Reglas: cada empresa solo toca archivos cuya carpeta = su company_id.
-- (Los archivos se guardan como  company_id/employee_id/archivo)
drop policy if exists "docs_select" on storage.objects;
drop policy if exists "docs_insert" on storage.objects;
drop policy if exists "docs_delete" on storage.objects;
create policy "docs_select" on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and split_part(name, '/', 1) = public.auth_company_id()::text);
create policy "docs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and split_part(name, '/', 1) = public.auth_company_id()::text);
create policy "docs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and split_part(name, '/', 1) = public.auth_company_id()::text);
