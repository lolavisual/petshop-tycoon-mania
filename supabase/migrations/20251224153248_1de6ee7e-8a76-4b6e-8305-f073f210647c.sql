-- Таблица подписчиков бота
CREATE TABLE public.bot_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    chat_id BIGINT NOT NULL,
    first_name TEXT,
    username TEXT,
    subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Таблица рассылок
CREATE TABLE public.bot_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    button_text TEXT,
    button_url TEXT,
    product_ids UUID[] DEFAULT '{}',
    broadcast_type TEXT NOT NULL DEFAULT 'promo',
    status TEXT NOT NULL DEFAULT 'draft',
    sent_at TIMESTAMP WITH TIME ZONE,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Таблица акций
CREATE TABLE public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    discount_percent INTEGER,
    promo_code TEXT,
    product_ids UUID[] DEFAULT '{}',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица квизов
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]',
    reward_type TEXT DEFAULT 'discount',
    reward_value TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.bot_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Политики для подписчиков (только через edge functions)
CREATE POLICY "Service role only" ON public.bot_subscribers FOR ALL USING (false);

-- Политики для рассылок
CREATE POLICY "Authenticated can view broadcasts" ON public.bot_broadcasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage broadcasts" ON public.bot_broadcasts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Политики для акций
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage promotions" ON public.promotions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Политики для квизов
CREATE POLICY "Anyone can view active quizzes" ON public.quizzes FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Индексы
CREATE INDEX idx_bot_subscribers_telegram ON public.bot_subscribers(telegram_id);
CREATE INDEX idx_bot_subscribers_active ON public.bot_subscribers(is_active);
CREATE INDEX idx_promotions_active ON public.promotions(is_active, start_date, end_date);
CREATE INDEX idx_quizzes_active ON public.quizzes(is_active);