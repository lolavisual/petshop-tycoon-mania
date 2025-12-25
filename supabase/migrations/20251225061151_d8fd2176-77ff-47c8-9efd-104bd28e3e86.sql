-- Create daily quests definitions table
CREATE TABLE public.daily_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  description_ru TEXT,
  icon TEXT NOT NULL DEFAULT '⭐',
  requirement_type TEXT NOT NULL, -- 'clicks', 'level', 'crystals_earned', 'chest_claim', 'passive_claim'
  requirement_value NUMERIC NOT NULL DEFAULT 1,
  reward_crystals NUMERIC NOT NULL DEFAULT 0,
  reward_diamonds NUMERIC NOT NULL DEFAULT 0,
  reward_xp NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user daily quest progress table
CREATE TABLE public.user_daily_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.daily_quests(id) ON DELETE CASCADE,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress NUMERIC NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id, quest_date)
);

-- Enable RLS
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quests ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_quests (read-only for all)
CREATE POLICY "Everyone can view active quests"
ON public.daily_quests
FOR SELECT
USING (is_active = true);

-- RLS policies for user_daily_quests
CREATE POLICY "Users can view their quests"
ON public.user_daily_quests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their quests"
ON public.user_daily_quests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their quests"
ON public.user_daily_quests
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert default daily quests
INSERT INTO public.daily_quests (name, name_ru, description, description_ru, icon, requirement_type, requirement_value, reward_crystals, reward_diamonds, reward_xp) VALUES
('Tap Master', 'Мастер тапов', 'Make 100 taps', 'Сделай 100 тапов', '👆', 'clicks', 100, 50, 0, 25),
('Crystal Hunter', 'Охотник за кристаллами', 'Earn 500 crystals', 'Заработай 500 кристаллов', '💎', 'crystals_earned', 500, 100, 1, 50),
('Chest Opener', 'Открыватель сундуков', 'Open a chest', 'Открой сундук', '🎁', 'chest_claim', 1, 75, 0, 30),
('Passive Income', 'Пассивный доход', 'Claim passive income', 'Забери пассивный доход', '💰', 'passive_claim', 1, 25, 0, 15),
('Tap Frenzy', 'Тап-безумие', 'Make 500 taps', 'Сделай 500 тапов', '🔥', 'clicks', 500, 150, 2, 100);