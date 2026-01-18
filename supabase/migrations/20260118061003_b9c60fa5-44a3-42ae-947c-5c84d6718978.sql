
-- Система рангов и титулов
CREATE TABLE public.ranks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_ru text NOT NULL,
  min_level integer NOT NULL DEFAULT 1,
  min_achievements integer NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT '⭐',
  color text NOT NULL DEFAULT '#FFD700',
  badge_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Титулы пользователей
CREATE TABLE public.user_titles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title_id uuid NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  is_equipped boolean NOT NULL DEFAULT false
);

-- Титулы
CREATE TABLE public.titles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_ru text NOT NULL,
  description text,
  description_ru text,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  rarity text NOT NULL DEFAULT 'common',
  color text NOT NULL DEFAULT '#FFFFFF',
  icon text NOT NULL DEFAULT '🏅',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Лутбоксы
CREATE TABLE public.lootboxes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_ru text NOT NULL,
  description text,
  description_ru text,
  rarity text NOT NULL DEFAULT 'common',
  price_crystals numeric NOT NULL DEFAULT 0,
  price_diamonds numeric NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT '📦',
  drop_rates jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Пользовательские лутбоксы (инвентарь)
CREATE TABLE public.user_lootboxes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lootbox_id uuid NOT NULL REFERENCES public.lootboxes(id),
  quantity integer NOT NULL DEFAULT 1,
  obtained_at timestamp with time zone NOT NULL DEFAULT now()
);

-- История открытий лутбоксов
CREATE TABLE public.lootbox_openings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lootbox_id uuid NOT NULL REFERENCES public.lootboxes(id),
  reward_type text NOT NULL,
  reward_id text,
  reward_amount numeric,
  opened_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS для ranks
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view ranks" ON public.ranks FOR SELECT USING (true);

-- RLS для titles
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view titles" ON public.titles FOR SELECT USING (true);

-- RLS для user_titles
ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their titles" ON public.user_titles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can unlock titles" ON public.user_titles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their titles" ON public.user_titles FOR UPDATE USING (auth.uid() = user_id);

-- RLS для lootboxes
ALTER TABLE public.lootboxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view lootboxes" ON public.lootboxes FOR SELECT USING (is_active = true);

-- RLS для user_lootboxes
ALTER TABLE public.user_lootboxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their lootboxes" ON public.user_lootboxes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add lootboxes" ON public.user_lootboxes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their lootboxes" ON public.user_lootboxes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their lootboxes" ON public.user_lootboxes FOR DELETE USING (auth.uid() = user_id);

-- RLS для lootbox_openings
ALTER TABLE public.lootbox_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their openings" ON public.lootbox_openings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert openings" ON public.lootbox_openings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Начальные ранги
INSERT INTO public.ranks (name, name_ru, min_level, min_achievements, icon, color) VALUES
('Novice', 'Новичок', 1, 0, '🌱', '#9CA3AF'),
('Apprentice', 'Ученик', 5, 3, '📖', '#22C55E'),
('Adventurer', 'Путешественник', 10, 7, '🗺️', '#3B82F6'),
('Expert', 'Эксперт', 20, 15, '⚔️', '#A855F7'),
('Master', 'Мастер', 35, 25, '👑', '#F59E0B'),
('Legend', 'Легенда', 50, 40, '🌟', '#EF4444'),
('Mythic', 'Мифический', 75, 60, '💎', '#EC4899'),
('Immortal', 'Бессмертный', 100, 80, '🔥', '#FF6B35');

-- Начальные титулы
INSERT INTO public.titles (name, name_ru, description, description_ru, requirement_type, requirement_value, rarity, color, icon) VALUES
('First Steps', 'Первые шаги', 'Complete your first quest', 'Выполни первый квест', 'quests_completed', 1, 'common', '#9CA3AF', '👣'),
('Quest Hunter', 'Охотник за квестами', 'Complete 10 quests', 'Выполни 10 квестов', 'quests_completed', 10, 'common', '#22C55E', '🎯'),
('Quest Master', 'Мастер квестов', 'Complete 50 quests', 'Выполни 50 квестов', 'quests_completed', 50, 'rare', '#3B82F6', '🏆'),
('Crystal Collector', 'Коллекционер кристаллов', 'Earn 10000 crystals', 'Заработай 10000 кристаллов', 'total_crystals', 10000, 'common', '#06B6D4', '💎'),
('Crystal King', 'Король кристаллов', 'Earn 100000 crystals', 'Заработай 100000 кристаллов', 'total_crystals', 100000, 'epic', '#A855F7', '👑'),
('Click Master', 'Мастер кликов', 'Make 10000 clicks', 'Сделай 10000 кликов', 'total_clicks', 10000, 'rare', '#F59E0B', '👆'),
('Pet Lover', 'Любитель питомцев', 'Collect 5 pets', 'Собери 5 питомцев', 'pets_count', 5, 'rare', '#EC4899', '🐾'),
('Zoo Keeper', 'Хранитель зоопарка', 'Collect 15 pets', 'Собери 15 питомцев', 'pets_count', 15, 'epic', '#EF4444', '🦁'),
('Streak Champion', 'Чемпион серий', 'Reach 7 day streak', 'Достигни серии в 7 дней', 'streak_days', 7, 'rare', '#10B981', '🔥'),
('Streak Legend', 'Легенда серий', 'Reach 30 day streak', 'Достигни серии в 30 дней', 'streak_days', 30, 'legendary', '#FFD700', '⚡');

-- Начальные лутбоксы
INSERT INTO public.lootboxes (name, name_ru, description, description_ru, rarity, price_crystals, price_diamonds, icon, drop_rates) VALUES
('Common Box', 'Обычный ящик', 'Contains common rewards', 'Содержит обычные награды', 'common', 500, 0, '📦', '{"crystals": 40, "diamonds": 5, "common_pet": 30, "rare_pet": 5, "accessory": 20}'),
('Rare Box', 'Редкий ящик', 'Contains rare rewards', 'Содержит редкие награды', 'rare', 2000, 5, '🎁', '{"crystals": 25, "diamonds": 10, "rare_pet": 35, "epic_pet": 10, "accessory": 15, "title": 5}'),
('Epic Box', 'Эпический ящик', 'Contains epic rewards', 'Содержит эпические награды', 'epic', 5000, 15, '💜', '{"crystals": 15, "diamonds": 15, "epic_pet": 30, "legendary_pet": 10, "rare_accessory": 20, "title": 10}'),
('Legendary Box', 'Легендарный ящик', 'Contains legendary rewards', 'Содержит легендарные награды', 'legendary', 0, 50, '✨', '{"diamonds": 20, "legendary_pet": 25, "mythic_pet": 10, "epic_accessory": 25, "rare_title": 15, "crystals": 5}');
