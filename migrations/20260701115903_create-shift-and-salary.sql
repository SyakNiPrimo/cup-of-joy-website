-- Phase 3: shift tracking + salary periods

CREATE TABLE public.shift_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  date DATE NOT NULL,
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  clock_in_lat DOUBLE PRECISION,
  clock_in_lng DOUBLE PRECISION,
  clock_out_lat DOUBLE PRECISION,
  clock_out_lng DOUBLE PRECISION,
  clock_in_distance DOUBLE PRECISION,
  clock_out_distance DOUBLE PRECISION,
  method TEXT NOT NULL DEFAULT 'auto' CHECK (method IN ('auto', 'manual')),
  duration_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shift_logs_staff_id ON public.shift_logs(staff_id);
CREATE INDEX idx_shift_logs_date ON public.shift_logs(date);
CREATE INDEX idx_shift_logs_open ON public.shift_logs(staff_id) WHERE clock_out_time IS NULL;

CREATE TRIGGER shift_logs_updated_at
  BEFORE UPDATE ON public.shift_logs
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TABLE public.salary_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_date DATE NOT NULL,
  days_worked INT NOT NULL DEFAULT 0,
  daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 300,
  total_pay NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, period_start)
);

CREATE INDEX idx_salary_periods_staff_id ON public.salary_periods(staff_id);

ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_periods ENABLE ROW LEVEL SECURITY;

-- Same single-tenant tradeoff as Phase 1/2: no InsForge Auth session yet, so
-- `anon` needs full access and the owner/staff boundary is enforced client-side.
CREATE POLICY "anon full access" ON public.shift_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon full access" ON public.salary_periods
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_periods TO anon;
