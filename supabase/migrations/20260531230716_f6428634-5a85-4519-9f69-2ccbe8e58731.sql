-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis (Configurações da Empresa)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Permissões Perfis
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3. Tabela de Produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  original_code TEXT,
  brand TEXT,
  category TEXT,
  supplier TEXT,
  internal_notes TEXT,
  favorite BOOLEAN DEFAULT false,
  keywords JSONB DEFAULT '[]'::jsonb,
  competitors JSONB DEFAULT '[]'::jsonb,
  mercado_livre JSONB DEFAULT '{}'::jsonb,
  shopee JSONB DEFAULT '{}'::jsonb,
  amazon JSONB DEFAULT '{}'::jsonb,
  tiktok JSONB DEFAULT '{}'::jsonb,
  pricing JSONB DEFAULT '{}'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  niche_faqs TEXT,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000),
  updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)
);

-- Permissões Produtos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- 4. Tabela de Kits
CREATE TABLE public.kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  type TEXT CHECK (type IN ('identical', 'composed')),
  items JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  mercado_livre JSONB DEFAULT '{}'::jsonb,
  shopee JSONB DEFAULT '{}'::jsonb,
  amazon JSONB DEFAULT '{}'::jsonb,
  tiktok JSONB DEFAULT '{}'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  pricing JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000),
  updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)
);

-- Permissões Kits
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kits TO authenticated;
GRANT ALL ON public.kits TO service_role;

-- 5. Tabela de Biblioteca Viral
CREATE TABLE public.viral_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  link TEXT,
  platform TEXT,
  views TEXT,
  hook TEXT,
  strategy TEXT,
  structure TEXT,
  audio TEXT,
  notes TEXT,
  edit_type TEXT,
  created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)
);

-- Permissões Viral
GRANT SELECT, INSERT, UPDATE, DELETE ON public.viral_library TO authenticated;
GRANT ALL ON public.viral_library TO service_role;

-- 6. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_library ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Acesso (Dono dos dados)
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own products" ON public.products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own kits" ON public.kits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own viral videos" ON public.viral_library FOR ALL USING (auth.uid() = user_id);

-- 8. Função e Trigger para updated_at (Profiles)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();