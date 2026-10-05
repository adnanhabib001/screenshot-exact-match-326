ALTER TABLE public.reports ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','fake'));
DROP POLICY IF EXISTS "Public insert reports" ON public.reports;
CREATE POLICY "Public insert reports" ON public.reports FOR INSERT TO anon, authenticated WITH CHECK (upvotes = 0 AND downvotes = 0 AND status = 'pending');
GRANT ALL ON public.reports TO service_role;
GRANT ALL ON public.comments TO service_role;