-- Таблица для отслеживания ежедневных бонусов за вход
CREATE TABLE public.daily_login_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number integer NOT NULL,
  reward_type text NOT NULL DEFAULT 'crystals',
  reward_amount integer NOT NULL DEFAULT 100,
  icon text NOT NULL DEFAULT '💎',
  is_premium boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Трекер ежедневных входов пользователя
CREATE TABLE public.user_login_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  current_day integer NOT NULL DEFAULT 1,
  last_claim_date date,
  total_claims integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Таблица сезонных событий
CREATE TABLE public.seasonal_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_ru text NOT NULL,
  description text,
  description_ru text,
  icon text NOT NULL DEFAULT '🎉',
  theme_color text NOT NULL DEFAULT '#FF6B6B',
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  bonus_multiplier numeric NOT NULL DEFAULT 1.5,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Награды сезонных событий
CREATE TABLE public.seasonal_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES seasonal_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ru text NOT NULL,
  description text,
  description_ru text,
  reward_type text NOT NULL DEFAULT 'crystals',
  reward_amount integer NOT NULL DEFAULT 100,
  requirement_type text NOT NULL DEFAULT 'clicks',
  requirement_value integer NOT NULL DEFAULT 100,
  icon text NOT NULL DEFAULT '🎁',
  rarity text NOT NULL DEFAULT 'common',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Прогресс пользователя по сезонным наградам
CREATE TABLE public.user_seasonal_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES seasonal_rewards(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  is_claimed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  claimed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

-- RLS для daily_login_rewards
ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view login rewards" ON public.daily_login_rewards FOR SELECT USING (true);

-- RLS для user_login_rewards
ALTER TABLE public.user_login_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their login rewards" ON public.user_login_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their login rewards" ON public.user_login_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their login rewards" ON public.user_login_rewards FOR UPDATE USING (auth.uid() = user_id);

-- RLS для seasonal_events
ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active events" ON public.seasonal_events FOR SELECT USING (is_active = true);

-- RLS для seasonal_rewards
ALTER TABLE public.seasonal_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view seasonal rewards" ON public.seasonal_rewards FOR SELECT USING (true);

-- RLS для user_seasonal_rewards
ALTER TABLE public.user_seasonal_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their seasonal rewards" ON public.user_seasonal_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their seasonal rewards" ON public.user_seasonal_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their seasonal rewards" ON public.user_seasonal_rewards FOR UPDATE USING (auth.uid() = user_id);

-- Начальные данные: 7-дневные награды за вход
INSERT INTO public.daily_login_rewards (day_number, reward_type, reward_amount, icon, is_premium) VALUES
(1, 'crystals', 50, '💎', false),
(2, 'crystals', 75, '💎', false),
(3, 'crystals', 100, '💎', false),
(4, 'diamonds', 5, '💠', false),
(5, 'crystals', 150, '💎', false),
(6, 'diamonds', 10, '💠', false),
(7, 'stones', 3, '🪨', true);

-- Начальные данные: Зимнее событие
INSERT INTO public.seasonal_events (name, name_ru, description, description_ru, icon, theme_color, start_date, end_date, is_active, bonus_multiplier) VALUES
('Winter Festival', 'Зимний фестиваль', 'Collect snowflakes and win unique rewards!', 'Собирай снежинки и получай уникальные награды!', '❄️', '#00D4FF', now(), now() + interval '30 days', true, 2.0);

-- Награды зимнего события
INSERT INTO public.seasonal_rewards (event_id, name, name_ru, description, description_ru, reward_type, reward_amount, requirement_type, requirement_value, icon, rarity)
SELECT 
  id,
  'Snowflake Collector',
  'Коллекционер снежинок',
  'Tap 500 times during the event',
  'Тапни 500 раз во время события',
  'crystals',
  500,
  'clicks',
  500,
  '❄️',
  'common'
FROM public.seasonal_events WHERE name = 'Winter Festival';

INSERT INTO public.seasonal_rewards (event_id, name, name_ru, description, description_ru, reward_type, reward_amount, requirement_type, requirement_value, icon, rarity)
SELECT 
  id,
  'Ice Master',
  'Ледяной мастер',
  'Catch 20 pets during the event',
  'Поймай 20 питомцев во время события',
  'diamonds',
  50,
  'pets_caught',
  20,
  '🧊',
  'rare'
FROM public.seasonal_events WHERE name = 'Winter Festival';

INSERT INTO public.seasonal_rewards (event_id, name, name_ru, description, description_ru, reward_type, reward_amount, requirement_type, requirement_value, icon, rarity)
SELECT 
  id,
  'Blizzard Champion',
  'Чемпион метели',
  'Reach 5 legendary streak',
  'Достигни легендарного стрика x5',
  'stones',
  10,
  'legendary_streak',
  5,
  '🌨️',
  'epic'
FROM public.seasonal_events WHERE name = 'Winter Festival';

INSERT INTO public.seasonal_rewards (event_id, name, name_ru, description, description_ru, reward_type, reward_amount, requirement_type, requirement_value, icon, rarity)
SELECT 
  id,
  'Aurora Pet',
  'Питомец Аврора',
  'Complete all winter challenges',
  'Заверши все зимние испытания',
  'pet',
  1,
  'event_complete',
  3,
  '🦌',
  'legendary'
FROM public.seasonal_events WHERE name = 'Winter Festival';