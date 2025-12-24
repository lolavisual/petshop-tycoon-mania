-- Создание таблицы пользователей/профилей с игровыми данными
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_variant INTEGER NOT NULL DEFAULT 1,
  level INTEGER NOT NULL DEFAULT 1,
  xp NUMERIC NOT NULL DEFAULT 0,
  crystals NUMERIC NOT NULL DEFAULT 0,
  diamonds NUMERIC NOT NULL DEFAULT 0,
  stones NUMERIC NOT NULL DEFAULT 0,
  passive_rate NUMERIC NOT NULL DEFAULT 0.1,
  last_passive_claim TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_chest_claim TIMESTAMP WITH TIME ZONE,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_streak_date DATE,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Индексы
CREATE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX idx_profiles_level ON public.profiles(level);
CREATE INDEX idx_profiles_streak_days ON public.profiles(streak_days);

-- RLS для profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи могут видеть свой профиль"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Пользователи могут обновлять свой профиль"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Таблица аксессуаров
CREATE TABLE public.accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  description_ru TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'hat',
  required_level INTEGER NOT NULL DEFAULT 1,
  price_crystals NUMERIC NOT NULL DEFAULT 0,
  price_diamonds NUMERIC NOT NULL DEFAULT 0,
  is_special BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS для accessories (публичное чтение)
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Все могут видеть аксессуары"
  ON public.accessories FOR SELECT
  USING (true);

-- Таблица купленных/экипированных аксессуаров
CREATE TABLE public.user_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES public.accessories(id) ON DELETE CASCADE,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, accessory_id)
);

CREATE INDEX idx_user_accessories_user ON public.user_accessories(user_id);

-- RLS для user_accessories
ALTER TABLE public.user_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи видят свои аксессуары"
  ON public.user_accessories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут покупать аксессуары"
  ON public.user_accessories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять свои аксессуары"
  ON public.user_accessories FOR UPDATE
  USING (auth.uid() = user_id);

-- Таблица статей
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reward_given BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX idx_articles_author ON public.articles(author_id);
CREATE INDEX idx_articles_status ON public.articles(status);

-- RLS для articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи видят свои статьи"
  ON public.articles FOR SELECT
  USING (auth.uid() = author_id OR status = 'approved');

CREATE POLICY "Пользователи могут создавать статьи"
  ON public.articles FOR INSERT
  WITH CHECK (auth.uid() = author_id AND char_length(content) >= 50);

-- Таблица товаров магазина
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description TEXT,
  description_ru TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'boost',
  price_crystals NUMERIC NOT NULL DEFAULT 0,
  price_diamonds NUMERIC NOT NULL DEFAULT 0,
  effect_type TEXT,
  effect_value NUMERIC,
  is_golden BOOLEAN NOT NULL DEFAULT false,
  discount_percent INTEGER DEFAULT 0,
  required_level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS для shop_items (публичное чтение)
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Все могут видеть товары"
  ON public.shop_items FOR SELECT
  USING (is_active = true);

-- Таблица покупок
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_purchases_user ON public.user_purchases(user_id);

-- RLS для user_purchases
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи видят свои покупки"
  ON public.user_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут делать покупки"
  ON public.user_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Таблица кликов (для анти-чита и аналитики)
CREATE TABLE public.click_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clicks_count INTEGER NOT NULL DEFAULT 1,
  crystals_earned NUMERIC NOT NULL DEFAULT 0,
  xp_earned NUMERIC NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_click_logs_user_time ON public.click_logs(user_id, timestamp DESC);

-- RLS для click_logs
ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Пользователи видят свои клики"
  ON public.click_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Таблица админов (только 1)
CREATE TABLE public.admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_telegram_id BIGINT UNIQUE NOT NULL,
  secret_key TEXT NOT NULL,
  allowed_ips TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS для admin_config (никто не видит через API)
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Функция автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Вставка начальных аксессуаров
INSERT INTO public.accessories (name, name_ru, icon, category, required_level, is_special) VALUES
  ('santa_hat', 'Шапка Санты', '🎅', 'hat', 15, true),
  ('crown', 'Корона', '👑', 'hat', 25, false),
  ('bow', 'Бантик', '🎀', 'hat', 5, false),
  ('glasses', 'Очки', '🕶️', 'accessory', 10, false),
  ('necklace', 'Ожерелье', '📿', 'accessory', 20, false);

-- Вставка начальных товаров
INSERT INTO public.shop_items (name, name_ru, description_ru, icon, category, price_crystals, price_diamonds, effect_type, effect_value, is_golden, discount_percent) VALUES
  ('double_tap', 'Двойной тап', '+1 кристалл за тап на 1 час', '💎', 'boost', 500, 0, 'tap_multiplier', 2, false, 0),
  ('xp_boost', 'XP Буст', '+50% XP на 1 час', '⚡', 'boost', 0, 100, 'xp_multiplier', 1.5, false, 0),
  ('passive_upgrade', 'Улучшение пассива', '+0.05 к пассивному доходу', '💰', 'upgrade', 1000, 0, 'passive_rate', 0.05, false, 0),
  ('golden_food', 'Золотой корм', 'Особый корм для питомца', '✨', 'food', 800, 0, null, null, true, 20),
  ('premium_treat', 'Премиум лакомство', 'Лучшее лакомство', '🍖', 'food', 0, 50, null, null, false, 0);