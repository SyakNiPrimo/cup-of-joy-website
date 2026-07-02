-- Phase 4: owner dashboard + manual time entry

ALTER TABLE public.orders
  ADD COLUMN edited_by TEXT,
  ADD COLUMN edited_at TIMESTAMPTZ,
  ADD COLUMN edited_notes TEXT,
  ADD COLUMN voided_by TEXT,
  ADD COLUMN voided_at TIMESTAMPTZ;

ALTER TABLE public.shift_logs
  ADD COLUMN edited_by TEXT,
  ADD COLUMN edited_at TIMESTAMPTZ;

CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Same single-tenant tradeoff as Phases 1-3: no InsForge Auth session yet, so
-- `anon` needs full access and the owner/staff boundary is enforced client-side.
CREATE POLICY "anon full access" ON public.settings
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO anon;
