-- Таблица Premium подписок
CREATE TABLE public.premium_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_type text NOT NULL DEFAULT 'monthly',
  stars_paid integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  telegram_payment_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Таблица планов Premium
CREATE TABLE public.premium_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_ru text NOT NULL,
  description text,
  description_ru text,
  duration_days integer NOT NULL DEFAULT 30,
  stars_price integer NOT NULL DEFAULT 100,
  crystals_bonus integer NOT NULL DEFAULT 0,
  diamonds_bonus integer NOT NULL DEFAULT 0,
  click_multiplier numeric NOT NULL DEFAULT 1.5,
  passive_multiplier numeric NOT NULL DEFAULT 2.0,
  xp_multiplier numeric NOT NULL DEFAULT 1.5,
  exclusive_pet text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS для premium_subscriptions
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their subscriptions" ON public.premium_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert subscriptions" ON public.premium_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS для premium_plans
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view plans" ON public.premium_plans FOR SELECT USING (is_active = true);

-- Добавляем поле is_premium в profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at timestamp with time zone;

-- Начальные Premium планы
INSERT INTO public.premium_plans (name, name_ru, description, description_ru, duration_days, stars_price, crystals_bonus, diamonds_bonus, click_multiplier, passive_multiplier, xp_multiplier, exclusive_pet) VALUES
('Weekly VIP', 'VIP на неделю', '7 days of premium benefits', '7 дней премиум бонусов', 7, 50, 500, 25, 1.5, 2.0, 1.5, NULL),
('Monthly VIP', 'VIP на месяц', '30 days of premium + exclusive pet', '30 дней премиум + эксклюзивный питомец', 30, 150, 2000, 100, 2.0, 3.0, 2.0, 'crown_cat'),
('Yearly VIP', 'VIP на год', '365 days of ultimate premium', '365 дней максимального премиума', 365, 1000, 25000, 1500, 3.0, 5.0, 3.0, 'golden_dragon');

-- Добавляем зимнего питомца (Северный олень) в pet_types
INSERT INTO public.pet_types (type, name, name_ru, emoji, description, description_ru, rarity, bonus_type, bonus_value, price_crystals, price_diamonds) VALUES
('reindeer', 'Arctic Reindeer', 'Северный олень', '🦌', 'Exclusive winter event pet with snow magic', 'Эксклюзивный зимний питомец со снежной магией', 'legendary', 'xp_boost', 50, 0, 0),
('crown_cat', 'Crown Cat', 'Королевский кот', '👑', 'Exclusive VIP pet with royal presence', 'Эксклюзивный VIP питомец с королевским величием', 'epic', 'crystals_boost', 25, 0, 0),
('golden_dragon', 'Golden Dragon', 'Золотой дракон', '🐲', 'Ultimate VIP pet with legendary power', 'Ультимативный VIP питомец с легендарной силой', 'legendary', 'all_boost', 30, 0, 0);