-- Online ordering system: customer-facing order-online.html + owner dashboard "Online Orders" tab

CREATE TABLE public.online_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  delivery_address TEXT,
  barangay TEXT,
  landmark TEXT,
  distance_km NUMERIC(6, 2),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('gcash', 'cod')),
  gcash_reference TEXT,
  gcash_screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN (
    'Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Completed', 'Cancelled'
  )),
  cancelled_reason TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_online_orders_created_at ON public.online_orders(created_at);
CREATE INDEX idx_online_orders_status ON public.online_orders(status);
CREATE INDEX idx_online_orders_scheduled_date ON public.online_orders(scheduled_date);

CREATE TRIGGER online_orders_updated_at
  BEFORE UPDATE ON public.online_orders
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TABLE public.online_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  online_order_id UUID NOT NULL REFERENCES public.online_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  size TEXT,
  variant TEXT,
  notes TEXT,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total NUMERIC(10, 2) NOT NULL
);

CREATE INDEX idx_online_order_items_online_order_id ON public.online_order_items(online_order_id);

ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_order_items ENABLE ROW LEVEL SECURITY;

-- Same single-tenant tradeoff as the POS orders tables: order-online.html is a public,
-- unauthenticated page, so `anon` needs full access and there's no per-customer boundary.
CREATE POLICY "anon full access" ON public.online_orders
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon full access" ON public.online_order_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.online_orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.online_order_items TO anon;

-- Daily online order number sequence: COJ-ONL-YYYYMMDD-XXXX
CREATE TABLE public.online_order_number_counters (
  day DATE PRIMARY KEY,
  counter INT NOT NULL DEFAULT 0
);

ALTER TABLE public.online_order_number_counters ENABLE ROW LEVEL SECURITY;
-- No policies/grants for anon on purpose: only reachable through the
-- SECURITY DEFINER function below, which runs as the table owner.

CREATE OR REPLACE FUNCTION public.next_online_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  seq INT;
BEGIN
  INSERT INTO public.online_order_number_counters (day, counter)
  VALUES (today, 1)
  ON CONFLICT (day) DO UPDATE SET counter = public.online_order_number_counters.counter + 1
  RETURNING counter INTO seq;
  RETURN 'COJ-ONL-' || to_char(today, 'YYYYMMDD') || '-' || lpad(seq::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_online_order_number() TO anon;
