-- Create pet_types table with prices
CREATE TABLE public.pet_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL UNIQUE,
  name text NOT NULL,
  name_ru text NOT NULL,
  emoji text NOT NULL,
  price_crystals integer NOT NULL DEFAULT 0,
  price_diamonds integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  description text,
  description_ru text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pet_types ENABLE ROW LEVEL SECURITY;

-- Everyone can view pet types
CREATE POLICY "Everyone can view pet types" 
ON public.pet_types 
FOR SELECT 
USING (true);

-- Insert default pet types
INSERT INTO public.pet_types (type, name, name_ru, emoji, price_crystals, price_diamonds, is_default, description_ru)
VALUES
  ('dog', 'Dog', 'Собака', '🐕', 0, 0, true, 'Верный друг, доступен всем'),
  ('cat', 'Cat', 'Кот', '🐈', 500, 0, false, 'Пушистый и независимый'),
  ('hamster', 'Hamster', 'Хомяк', '🐹', 1000, 0, false, 'Маленький и милый'),
  ('rabbit', 'Rabbit', 'Кролик', '🐰', 0, 10, false, 'Мягкий и пушистый'),
  ('parrot', 'Parrot', 'Попугай', '🦜', 0, 25, false, 'Яркий и говорливый');

-- Create user_pets table for owned pets
CREATE TABLE public.user_pets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_type text NOT NULL,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, pet_type)
);

-- Enable RLS
ALTER TABLE public.user_pets ENABLE ROW LEVEL SECURITY;

-- Users can view their pets
CREATE POLICY "Users can view their pets" 
ON public.user_pets 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can purchase pets
CREATE POLICY "Users can purchase pets" 
ON public.user_pets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Automatically give default pets to all users
INSERT INTO public.user_pets (user_id, pet_type)
SELECT p.id, 'dog' FROM public.profiles p
ON CONFLICT (user_id, pet_type) DO NOTHING;