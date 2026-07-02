-- Phase 5: track the pre-edit total so CSV exports can show "original vs edited"
ALTER TABLE public.orders ADD COLUMN original_total NUMERIC(10, 2);
