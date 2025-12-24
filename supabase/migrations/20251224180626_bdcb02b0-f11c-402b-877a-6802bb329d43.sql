-- Create achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_ru text NOT NULL,
  description text,
  description_ru text,
  icon text NOT NULL DEFAULT '🏆',
  category text NOT NULL DEFAULT 'general',
  requirement_type text NOT NULL, -- 'level', 'crystals', 'streak', 'clicks', 'diamonds'
  requirement_value numeric NOT NULL DEFAULT 1,
  reward_crystals numeric NOT NULL DEFAULT 0,
  reward_diamonds numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  reward_claimed boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Everyone can view achievements" 
ON public.achievements 
FOR SELECT 
USING (is_active = true);

-- Policies for user_achievements
CREATE POLICY "Users can view their achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their achievements" 
ON public.user_achievements 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, name_ru, description, description_ru, icon, category, requirement_type, requirement_value, reward_crystals, reward_diamonds) VALUES
-- Level achievements
('Beginner', 'Новичок', 'Reach level 5', 'Достигни 5 уровня', '🌱', 'level', 'level', 5, 100, 0),
('Apprentice', 'Ученик', 'Reach level 10', 'Достигни 10 уровня', '🌿', 'level', 'level', 10, 250, 5),
('Expert', 'Эксперт', 'Reach level 25', 'Достигни 25 уровня', '🌳', 'level', 'level', 25, 500, 10),
('Master', 'Мастер', 'Reach level 50', 'Достигни 50 уровня', '👑', 'level', 'level', 50, 1000, 25),
('Legend', 'Легенда', 'Reach level 100', 'Достигни 100 уровня', '🏆', 'level', 'level', 100, 2500, 50),

-- Crystals achievements
('First Crystals', 'Первые кристаллы', 'Earn 100 crystals', 'Заработай 100 кристаллов', '💎', 'crystals', 'crystals', 100, 50, 0),
('Crystal Collector', 'Собиратель', 'Earn 1,000 crystals', 'Заработай 1,000 кристаллов', '💎', 'crystals', 'crystals', 1000, 100, 2),
('Crystal Hoarder', 'Накопитель', 'Earn 10,000 crystals', 'Заработай 10,000 кристаллов', '💎', 'crystals', 'crystals', 10000, 500, 10),
('Crystal King', 'Король кристаллов', 'Earn 100,000 crystals', 'Заработай 100,000 кристаллов', '👑💎', 'crystals', 'crystals', 100000, 2000, 50),

-- Streak achievements
('First Streak', 'Первый стрик', 'Maintain a 3-day streak', 'Сохрани стрик 3 дня', '🔥', 'streak', 'streak', 3, 50, 1),
('Week Warrior', 'Воин недели', 'Maintain a 7-day streak', 'Сохрани стрик 7 дней', '🔥🔥', 'streak', 'streak', 7, 150, 3),
('Month Master', 'Мастер месяца', 'Maintain a 30-day streak', 'Сохрани стрик 30 дней', '🔥🔥🔥', 'streak', 'streak', 30, 500, 15),
('Dedicated Player', 'Преданный игрок', 'Maintain a 100-day streak', 'Сохрани стрик 100 дней', '⭐🔥', 'streak', 'streak', 100, 2000, 50),

-- Diamond achievements
('Diamond Finder', 'Искатель алмазов', 'Collect 10 diamonds', 'Собери 10 алмазов', '💠', 'diamonds', 'diamonds', 10, 200, 0),
('Diamond Hunter', 'Охотник за алмазами', 'Collect 50 diamonds', 'Собери 50 алмазов', '💠💠', 'diamonds', 'diamonds', 50, 500, 0),
('Diamond Tycoon', 'Алмазный магнат', 'Collect 200 diamonds', 'Собери 200 алмазов', '💠💠💠', 'diamonds', 'diamonds', 200, 1500, 0);