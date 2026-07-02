-- Deleting a staff member permanently removes their history (per spec warning),
-- while disabling a staff member preserves it. Switch the FK from SET NULL to CASCADE.
ALTER TABLE public.login_logs DROP CONSTRAINT login_logs_staff_id_fkey;

ALTER TABLE public.login_logs
  ADD CONSTRAINT login_logs_staff_id_fkey
  FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;
