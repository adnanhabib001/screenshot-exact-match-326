CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text NOT NULL UNIQUE,
  extortionist_name text NOT NULL CHECK (char_length(extortionist_name) BETWEEN 1 AND 120),
  organization text CHECK (organization IS NULL OR char_length(organization) <= 120),
  category text NOT NULL CHECK (char_length(category) <= 60),
  amount numeric NOT NULL CHECK (amount >= 0 AND amount <= 1000000000),
  division text NOT NULL,
  district text NOT NULL,
  upazila text NOT NULL,
  landmark text CHECK (landmark IS NULL OR char_length(landmark) <= 200),
  image_url text,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO anon, authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reports" ON public.reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert reports" ON public.reports FOR INSERT TO anon, authenticated WITH CHECK (upvotes = 0 AND downvotes = 0);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  comment_text text NOT NULL CHECK (char_length(comment_text) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.comments(report_id);
GRANT SELECT, INSERT ON public.comments TO anon, authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON public.comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert comments" ON public.comments FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.vote_report(_report_id uuid, _up boolean, _delta integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _delta NOT IN (-1, 1) THEN RAISE EXCEPTION 'invalid delta'; END IF;
  IF _up THEN
    UPDATE reports SET upvotes = GREATEST(0, upvotes + _delta) WHERE id = _report_id;
  ELSE
    UPDATE reports SET downvotes = GREATEST(0, downvotes + _delta) WHERE id = _report_id;
  END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.vote_report(uuid, boolean, integer) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

CREATE POLICY "Public read proofs" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'proofs');
CREATE POLICY "Public upload proofs" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'proofs');

INSERT INTO public.reports (tracking_id, extortionist_name, organization, category, amount, division, district, upazila, landmark, upvotes, downvotes, created_at) VALUES
('#CB-10231','কালা জাহাঙ্গীর','স্থানীয় সিন্ডিকেট','হাট-বাজার',15000,'ঢাকা','ঢাকা','ধানমন্ডি','রাপা প্লাজার সামনে',42,3, now() - interval '2 hours'),
('#CB-10232','টোকাই রফিক',NULL,'পরিবহন',3000,'চট্টগ্রাম','চট্টগ্রাম','কোতোয়ালী','নিউ মার্কেট বাসস্ট্যান্ড',28,5, now() - interval '5 hours'),
('#CB-10233','বড় ভাই সোহেল','নির্মাণ সমিতি','নির্মাণ কাজ',50000,'ঢাকা','গাজীপুর','টঙ্গী','স্টেশন রোড',61,8, now() - interval '9 hours'),
('#CB-10234','মামা জসিম',NULL,'দোকান',2000,'রাজশাহী','রাজশাহী','বোয়ালিয়া','সাহেব বাজার',12,2, now() - interval '20 hours'),
('#CB-10235','লম্বু কামাল','ঘাট কমিটি','পরিবহন',8000,'খুলনা','খুলনা','সোনাডাঙ্গা','বাস টার্মিনাল',19,4, now() - interval '30 hours'),
('#CB-10236','গাজী বাবু',NULL,'মেলা',12000,'সিলেট','সিলেট','সিলেট সদর','জিন্দাবাজার',9,1, now() - interval '3 hours');