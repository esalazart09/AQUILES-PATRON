-- ============================================================
-- AQUILES Patrón — Etapa 2 · Documentos generados en el expediente
-- Permite guardar los documentos que la app genera (contratos,
-- finiquitos, terminaciones) dentro del expediente del trabajador,
-- con su hash de integridad.
--
-- Cómo usar:
--   1. Supabase → "SQL Editor" → "New query".
--   2. Pega TODO este archivo y dale "Run".
-- ============================================================

-- 'kind' distingue el origen del documento:
--   'subido'    → archivo escaneado (INE, CURP…)  (valor por defecto)
--   'generado'  → documento creado por la app (contrato, finiquito…)
--   'firmado'   → documento con firma electrónica
alter table public.documents add column if not exists kind text not null default 'subido';

-- Hash SHA-256 del contenido, para comprobar que no se alteró.
alter table public.documents add column if not exists hash text;
