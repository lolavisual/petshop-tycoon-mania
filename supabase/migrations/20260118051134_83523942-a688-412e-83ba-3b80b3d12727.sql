
-- Add weekly and seasonal quests table
CREATE TABLE public.weekly_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  description_ru TEXT,
  icon TEXT NOT NULL DEFAULT '📅',
  requirement_type TEXT NOT NULL,
  requirement_value NUMERIC NOT NULL DEFAULT 1,
  reward_crystals NUMERIC NOT NULL DEFAULT 0,
  reward_diamonds NUMERIC NOT NULL DEFAULT 0,
  reward_xp NUMERIC NOT NULL DEFAULT 0,
  quest_type TEXT NOT NULL DEFAULT 'weekly', -- 'weekly' or 'seasonal'
  season TEXT, -- 'winter', 'spring', 'summer', 'autumn' for seasonal quests
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User weekly quests progress
CREATE TABLE public.user_weekly_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.weekly_quests(id) ON DELETE CASCADE,
  week_start DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  progress NUMERIC NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quest notifications table
CREATE TABLE public.quest_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'new_quest', 'reminder', 'completed', 'reward_available'
  quest_id UUID,
  quest_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'seasonal'
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_quests
CREATE POLICY "Everyone can view active weekly quests"
ON public.weekly_quests FOR SELECT
USING (is_active = true);

-- RLS policies for user_weekly_quests
CREATE POLICY "Users can view their weekly quests"
ON public.user_weekly_quests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their weekly quests"
ON public.user_weekly_quests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their weekly quests"
ON public.user_weekly_quests FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for quest_notifications
CREATE POLICY "Users can view their notifications"
ON public.quest_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their notifications"
ON public.quest_notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.quest_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
ON public.quest_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Insert weekly quests
INSERT INTO public.weekly_quests (name, name_ru, description_ru, icon, requirement_type, requirement_value, reward_crystals, reward_diamonds, reward_xp, quest_type) VALUES
('Weekly Clicker', 'Недельный кликер', 'Сделай 5000 кликов за неделю', '🖱️', 'clicks', 5000, 500, 10, 1000, 'weekly'),
('Crystal Miner', 'Добытчик кристаллов', 'Собери 10000 кристаллов за неделю', '💎', 'crystals', 10000, 1000, 20, 2000, 'weekly'),
('Chest Hunter', 'Охотник за сундуками', 'Открой 14 сундуков за неделю', '🎁', 'chests', 14, 300, 15, 800, 'weekly'),
('Quest Master', 'Мастер квестов', 'Выполни 21 ежедневный квест за неделю', '⭐', 'daily_quests', 21, 800, 25, 1500, 'weekly'),
('Pet Trainer', 'Тренер питомцев', 'Прокачай питомца на 3 уровня', '🐾', 'pet_levels', 3, 600, 20, 1200, 'weekly'),
('Social Butterfly', 'Социальная бабочка', 'Отправь 10 подарков друзьям', '🎁', 'gifts_sent', 10, 400, 15, 600, 'weekly');

-- Insert seasonal quests (current season - winter)
INSERT INTO public.weekly_quests (name, name_ru, description_ru, icon, requirement_type, requirement_value, reward_crystals, reward_diamonds, reward_xp, quest_type, season) VALUES
('Winter Legend', 'Зимняя легенда', 'Сделай 50000 кликов за сезон', '❄️', 'clicks', 50000, 5000, 100, 10000, 'seasonal', 'winter'),
('Crystal Emperor', 'Кристальный император', 'Собери 100000 кристаллов за сезон', '👑', 'crystals', 100000, 10000, 200, 20000, 'seasonal', 'winter'),
('Ultimate Collector', 'Великий коллекционер', 'Собери 5 разных питомцев', '🏆', 'pets_collected', 5, 3000, 50, 5000, 'seasonal', 'winter'),
('Streak Champion', 'Чемпион серий', 'Достигни 30-дневной серии', '🔥', 'streak', 30, 2000, 75, 8000, 'seasonal', 'winter'),
('Quest Legend', 'Легенда квестов', 'Выполни 100 квестов за сезон', '🌟', 'total_quests', 100, 8000, 150, 15000, 'seasonal', 'winter');

-- Add quest completion achievements
INSERT INTO public.achievements (name, name_ru, description_ru, icon, category, requirement_type, requirement_value, reward_crystals, reward_diamonds) VALUES
('Quest Beginner', 'Начинающий квестер', 'Выполни 10 квестов', '📋', 'quests', 'quests_completed', 10, 100, 5),
('Quest Expert', 'Эксперт квестов', 'Выполни 50 квестов', '📜', 'quests', 'quests_completed', 50, 500, 25),
('Quest Master', 'Мастер квестов', 'Выполни 100 квестов', '🏅', 'quests', 'quests_completed', 100, 1000, 50),
('Quest Legend', 'Легенда квестов', 'Выполни 500 квестов', '🎖️', 'quests', 'quests_completed', 500, 5000, 200),
('Weekly Warrior', 'Недельный воин', 'Выполни 10 еженедельных квестов', '⚔️', 'quests', 'weekly_quests_completed', 10, 800, 40),
('Seasonal Champion', 'Сезонный чемпион', 'Выполни 5 сезонных квестов', '🏆', 'quests', 'seasonal_quests_completed', 5, 2000, 100);
