DROP POLICY IF EXISTS "Signed-in users view all companies" ON public.companies;
CREATE POLICY "Users view own companies" ON public.companies FOR SELECT TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Block client role inserts" ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Block client role updates" ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block client role deletes" ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated USING (false);