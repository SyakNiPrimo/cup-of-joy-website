-- Phase 2: POS orders

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeout', 'delivery')),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none', 'fixed', 'percentage')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'gcash')),
  cash_received NUMERIC(10, 2),
  change_given NUMERIC(10, 2),
  gcash_reference TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'edited', 'voided')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_staff_id ON public.orders(staff_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  size TEXT,
  variant TEXT,
  addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total NUMERIC(10, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Same single-tenant tradeoff as Phase 1: no InsForge Auth session yet, so
-- `anon` needs full access and the owner/staff boundary is enforced client-side.
CREATE POLICY "anon full access" ON public.orders
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon full access" ON public.order_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon;

-- Daily order number sequence: COJ-YYYYMMDD-XXXX
CREATE TABLE public.order_number_counters (
  day DATE PRIMARY KEY,
  counter INT NOT NULL DEFAULT 0
);

ALTER TABLE public.order_number_counters ENABLE ROW LEVEL SECURITY;
-- No policies/grants for anon on purpose: only reachable through the
-- SECURITY DEFINER function below, which runs as the table owner.

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  seq INT;
BEGIN
  INSERT INTO public.order_number_counters (day, counter)
  VALUES (today, 1)
  ON CONFLICT (day) DO UPDATE SET counter = public.order_number_counters.counter + 1
  RETURNING counter INTO seq;
  RETURN 'COJ-' || to_char(today, 'YYYYMMDD') || '-' || lpad(seq::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_order_number() TO anon;
