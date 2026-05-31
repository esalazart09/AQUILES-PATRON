-- ============================================================
-- AQUILES Patrón — Etapa 2 · Campos del trabajador para contratos
-- Agrega: actividades a realizar, pago diario y periodo de pago.
-- Estos datos alimentan el autollenado de contratos.
--
-- Cómo usar:
--   1. Supabase → "SQL Editor" → "New query".
--   2. Pega TODO este archivo y dale "Run".
-- ============================================================

alter table public.employees add column if not exists activities text;
alter table public.employees add column if not exists daily_pay  numeric(12,2);
alter table public.employees add column if not exists pay_period text;  -- Diario / Semanal / Quincenal

-- (La columna 'department' anterior se deja por compatibilidad; ya no se usa.)
