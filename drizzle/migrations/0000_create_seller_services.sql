CREATE TABLE public.seller_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL UNIQUE,
  seller_address TEXT NOT NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seller_services TO anon, authenticated;
GRANT ALL ON public.seller_services TO service_role;
ALTER TABLE public.seller_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deployed seller services are publicly listed"
ON public.seller_services FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX seller_services_seller_idx ON public.seller_services (seller_address);