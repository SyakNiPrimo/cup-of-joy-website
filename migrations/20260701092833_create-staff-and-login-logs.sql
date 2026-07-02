-- Staff management + login logs for Cup of Joy business system (Phase 1)

CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('full_time', 'part_time')),
  pin TEXT NOT NULL CHECK (pin ~ '^[0-9]{4}$'),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_status ON public.staff(status);
CREATE INDEX idx_staff_token ON public.staff(token);

CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TABLE public.login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  staff_name TEXT,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_from_shop DOUBLE PRECISION,
  method TEXT NOT NULL CHECK (method IN ('qr', 'pin')),
  success BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_logs_staff_id ON public.login_logs(staff_id);
CREATE INDEX idx_login_logs_timestamp ON public.login_logs("timestamp");

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Single-tenant internal tool with no InsForge Auth session yet (Phase 1 is
-- vanilla client-side JS only). The `anon` role is the only runtime identity
-- available, so it needs full access to both tables; the owner/staff distinction
-- is enforced in the client UI, not at the database layer. Revisit with real
-- InsForge Auth for the owner account in a later phase to move this enforcement
-- into RLS.
CREATE POLICY "anon full access" ON public.staff
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon full access" ON public.login_logs
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_logs TO anon;
