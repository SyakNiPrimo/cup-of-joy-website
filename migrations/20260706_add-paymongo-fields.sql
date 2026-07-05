-- PayMongo QR Ph integration: replaces the manual GCash screenshot flow with automatic
-- payment confirmation via PayMongo's Payment Intents API + webhook.

ALTER TABLE public.online_orders
  ADD COLUMN payment_intent_id TEXT,
  ADD COLUMN paymongo_reference TEXT,
  ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  ADD COLUMN paid_at TIMESTAMPTZ;

CREATE INDEX idx_online_orders_payment_intent_id ON public.online_orders(payment_intent_id);

ALTER TABLE public.online_orders DROP CONSTRAINT online_orders_payment_method_check;
ALTER TABLE public.online_orders ADD CONSTRAINT online_orders_payment_method_check
  CHECK (payment_method IN ('QR Ph', 'Cash', 'gcash', 'cod'));
