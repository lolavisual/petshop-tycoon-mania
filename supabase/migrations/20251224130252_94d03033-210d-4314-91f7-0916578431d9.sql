-- Таблица реальных зоотоваров
CREATE TABLE public.pet_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  description_ru TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RUB',
  image_url TEXT,
  icon TEXT NOT NULL DEFAULT '🐾',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.pet_products ENABLE ROW LEVEL SECURITY;

-- Политика: все могут видеть товары в наличии
CREATE POLICY "Все могут видеть товары" 
ON public.pet_products 
FOR SELECT 
USING (in_stock = true);