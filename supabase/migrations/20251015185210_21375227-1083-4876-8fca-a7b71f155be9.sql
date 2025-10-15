-- Tabela de clientes Stripe
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de assinaturas Stripe
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  tokens_per_period INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de produtos Stripe (referência local)
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'brl',
  billing_period TEXT NOT NULL,
  tokens_included INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar campos à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS current_subscription_id UUID REFERENCES public.stripe_subscriptions(id) ON DELETE SET NULL;

-- RLS para stripe_customers
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stripe customer"
ON public.stripe_customers FOR SELECT
USING (auth.uid() = user_id);

-- RLS para stripe_subscriptions
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON public.stripe_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- RLS para stripe_products (público para leitura)
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
ON public.stripe_products FOR SELECT
USING (active = TRUE);

-- Trigger para atualizar updated_at em stripe_subscriptions
CREATE TRIGGER update_stripe_subscriptions_updated_at
BEFORE UPDATE ON public.stripe_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir produtos iniciais (valores de teste R$ 1,00)
INSERT INTO public.stripe_products (stripe_product_id, stripe_price_id, plan_id, plan_name, amount_cents, billing_period, tokens_included)
VALUES 
  ('prod_TF3sp9KwNwYSbq', 'price_1SIZkN3llBehq08NRLSNvTjt', 'basic_monthly', 'Básico Mensal', 100, 'month', 100000),
  ('prod_TF3s9fCJPunYnr', 'price_1SIZky3llBehq08NWzqqR2bH', 'basic_annual', 'Básico Anual', 100, 'year', 100000),
  ('prod_TF3sXCceXjCISR', 'price_1SIZlB3llBehq08NJeq7DMaT', 'pro_monthly', 'Pro Mensal', 100, 'month', 500000),
  ('prod_TF3vlo7m1FJCAU', 'price_1SIZnP3llBehq08NuUYbb66l', 'pro_annual', 'Pro Anual', 100, 'year', 500000)
ON CONFLICT (stripe_price_id) DO NOTHING;