-- Tabela de personagens do usuário
CREATE TABLE public.user_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  image_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para user_characters
ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters" 
ON public.user_characters FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own characters" 
ON public.user_characters FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters" 
ON public.user_characters FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters" 
ON public.user_characters FOR DELETE 
USING (auth.uid() = user_id);

-- Tabela de imagens dos personagens
CREATE TABLE public.user_character_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.user_characters(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para user_character_images (via join com user_characters)
ALTER TABLE public.user_character_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own character images" 
ON public.user_character_images FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_characters 
    WHERE id = character_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own character images" 
ON public.user_character_images FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_characters 
    WHERE id = character_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own character images" 
ON public.user_character_images FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_characters 
    WHERE id = character_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own character images" 
ON public.user_character_images FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_characters 
    WHERE id = character_id AND user_id = auth.uid()
  )
);

-- Índice para busca rápida
CREATE INDEX idx_character_images_character_id ON public.user_character_images(character_id);
CREATE INDEX idx_user_characters_user_id ON public.user_characters(user_id);

-- Função para limitar personagens por usuário (máx 10)
CREATE OR REPLACE FUNCTION public.enforce_user_characters_limit()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_characters
  WHERE id IN (
    SELECT id FROM public.user_characters
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_user_characters_limit_trigger
AFTER INSERT ON public.user_characters
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_characters_limit();

-- Função para limitar imagens por personagem (máx 70) e atualizar contagem
CREATE OR REPLACE FUNCTION public.enforce_character_images_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Deletar imagens excedentes (manter apenas 70)
  DELETE FROM public.user_character_images
  WHERE id IN (
    SELECT id FROM public.user_character_images
    WHERE character_id = NEW.character_id
    ORDER BY order_index ASC, created_at ASC
    OFFSET 70
  );
  
  -- Atualizar contador e avatar no personagem
  UPDATE public.user_characters 
  SET 
    image_count = (
      SELECT COUNT(*) FROM public.user_character_images 
      WHERE character_id = NEW.character_id
    ),
    avatar_url = COALESCE(
      (SELECT image_url FROM public.user_character_images 
       WHERE character_id = NEW.character_id 
       ORDER BY order_index ASC, created_at ASC 
       LIMIT 1),
      NEW.image_url
    ),
    updated_at = NOW()
  WHERE id = NEW.character_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_character_images_limit_trigger
AFTER INSERT ON public.user_character_images
FOR EACH ROW EXECUTE FUNCTION public.enforce_character_images_limit();

-- Função para atualizar contagem ao deletar imagem
CREATE OR REPLACE FUNCTION public.update_character_on_image_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_characters 
  SET 
    image_count = (
      SELECT COUNT(*) FROM public.user_character_images 
      WHERE character_id = OLD.character_id
    ),
    avatar_url = (
      SELECT image_url FROM public.user_character_images 
      WHERE character_id = OLD.character_id 
      ORDER BY order_index ASC, created_at ASC 
      LIMIT 1
    ),
    updated_at = NOW()
  WHERE id = OLD.character_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_character_on_image_delete_trigger
AFTER DELETE ON public.user_character_images
FOR EACH ROW EXECUTE FUNCTION public.update_character_on_image_delete();