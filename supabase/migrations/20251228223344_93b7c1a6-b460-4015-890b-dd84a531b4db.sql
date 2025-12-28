-- Добавляем колонки для бонусов питомцев
ALTER TABLE public.pet_types
ADD COLUMN IF NOT EXISTS bonus_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bonus_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT NULL;

-- Обновляем существующих питомцев с бонусами
UPDATE public.pet_types SET 
  bonus_type = 'click_multiplier', 
  bonus_value = 1.0,
  description = 'Loyal companion',
  name = 'Dog'
WHERE type = 'dog';

UPDATE public.pet_types SET 
  bonus_type = 'passive_boost', 
  bonus_value = 0.1,
  description = 'Increases passive income by 10%',
  name = 'Cat'
WHERE type = 'cat';

UPDATE public.pet_types SET 
  bonus_type = 'xp_multiplier', 
  bonus_value = 1.1,
  description = 'Earns 10% more XP',
  name = 'Hamster'
WHERE type = 'hamster';

UPDATE public.pet_types SET 
  bonus_type = 'crystal_boost', 
  bonus_value = 0.05,
  description = '5% more crystals from clicks',
  name = 'Rabbit'
WHERE type = 'rabbit';

UPDATE public.pet_types SET 
  bonus_type = 'streak_protection', 
  bonus_value = 1,
  description = 'Protects streak once per week',
  name = 'Parrot'
WHERE type = 'parrot';

-- Добавляем новых питомцев с уникальными способностями
INSERT INTO public.pet_types (type, name, name_ru, emoji, price_crystals, price_diamonds, is_default, description, description_ru, bonus_type, bonus_value)
VALUES 
  ('fox', 'Fox', 'Лиса', '🦊', 2500, 0, false, 'Lucky finder - 15% chest bonus', 'Счастливый искатель - +15% к сундуку', 'chest_bonus', 0.15),
  ('owl', 'Owl', 'Сова', '🦉', 0, 50, false, 'Wise one - 20% more XP', 'Мудрец - +20% XP', 'xp_multiplier', 1.2),
  ('unicorn', 'Unicorn', 'Единорог', '🦄', 0, 100, false, 'Magic aura - 25% all bonuses', 'Магическая аура - +25% ко всем бонусам', 'all_boost', 0.25),
  ('dragon', 'Dragon', 'Дракон', '🐉', 0, 200, false, 'Fire breath - 2x click power', 'Огненное дыхание - 2x клики', 'click_multiplier', 2.0),
  ('phoenix', 'Phoenix', 'Феникс', '🐦‍🔥', 0, 300, false, 'Eternal flame - never lose streak', 'Вечное пламя - стрик не теряется', 'streak_protection', 999),
  ('panda', 'Panda', 'Панда', '🐼', 1500, 0, false, 'Zen master - 10% passive boost', 'Мастер дзен - +10% пассивный доход', 'passive_boost', 0.1),
  ('turtle', 'Turtle', 'Черепаха', '🐢', 800, 0, false, 'Steady gains - 5% daily bonus', 'Стабильный рост - +5% дневной бонус', 'daily_bonus', 0.05),
  ('penguin', 'Penguin', 'Пингвин', '🐧', 1200, 0, false, 'Cool customer - 8% crystal boost', 'Хладнокровный - +8% к кристаллам', 'crystal_boost', 0.08),
  ('wolf', 'Wolf', 'Волк', '🐺', 2000, 0, false, 'Pack leader - 10% friend bonus', 'Вожак стаи - +10% бонус друзей', 'friend_bonus', 0.1),
  ('lion', 'Lion', 'Лев', '🦁', 0, 75, false, 'King - 15% all currency', 'Король - +15% ко всей валюте', 'currency_boost', 0.15)
ON CONFLICT DO NOTHING;