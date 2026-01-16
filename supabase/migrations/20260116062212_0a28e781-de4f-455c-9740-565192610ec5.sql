-- Add rarity to pet_types
ALTER TABLE public.pet_types ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'common';

-- Add evolution system to user_pets
ALTER TABLE public.user_pets ADD COLUMN IF NOT EXISTS pet_level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.user_pets ADD COLUMN IF NOT EXISTS pet_xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.user_pets ADD COLUMN IF NOT EXISTS evolved_at TIMESTAMPTZ;

-- Update existing pets with rarity
UPDATE public.pet_types SET rarity = 'common' WHERE type IN ('dog', 'cat', 'hamster');
UPDATE public.pet_types SET rarity = 'rare' WHERE type IN ('rabbit', 'parrot', 'fox', 'owl', 'turtle', 'penguin');
UPDATE public.pet_types SET rarity = 'epic' WHERE type IN ('panda', 'wolf');
UPDATE public.pet_types SET rarity = 'legendary' WHERE type IN ('unicorn', 'dragon', 'phoenix', 'lion');

-- Add more products to pet shop
INSERT INTO public.pet_products (name, name_ru, description, description_ru, category, price, icon, in_stock) VALUES
-- Cats
('Premium Cat Food', 'Премиум корм для кошек', 'High-quality nutrition', 'Высококачественное питание', 'cats', 450, '🍖', true),
('Cat Scratching Post', 'Когтеточка для кошек', 'Durable sisal post', 'Прочная сизалевая стойка', 'cats', 1800, '🪵', true),
('Cat Bed Deluxe', 'Лежанка Делюкс', 'Orthopedic memory foam', 'Ортопедическая пена', 'cats', 3200, '🛏️', true),
('Interactive Cat Laser', 'Интерактивный лазер', 'Automatic play toy', 'Автоматическая игрушка', 'cats', 890, '🔴', true),
-- Dogs
('Organic Dog Treats', 'Органические лакомства', 'Natural ingredients', 'Натуральные ингредиенты', 'dogs', 380, '🦴', true),
('Dog Raincoat', 'Дождевик для собак', 'Waterproof protection', 'Водонепроницаемая защита', 'dogs', 1200, '🧥', true),
('Smart Dog Collar', 'Умный ошейник', 'GPS tracking included', 'С GPS-трекером', 'dogs', 4500, '📍', true),
('Dog Agility Kit', 'Набор аджилити', 'Training equipment set', 'Набор для тренировок', 'dogs', 2800, '🏃', true),
-- Birds
('Exotic Bird Seeds', 'Экзотические семена', 'Premium seed mix', 'Премиальная смесь', 'birds', 320, '🌻', true),
('Bird Swing Deluxe', 'Качели Делюкс', 'Natural wood swing', 'Качели из натурального дерева', 'birds', 650, '🎋', true),
('Bird Bath Fountain', 'Фонтан-купалка', 'Circulating water', 'Циркулирующая вода', 'birds', 1100, '💧', true),
-- Accessories
('Pet Camera', 'Камера для питомцев', 'HD with night vision', 'HD с ночным видением', 'accessories', 5200, '📷', true),
('Automatic Feeder', 'Автокормушка', 'Programmable portions', 'Программируемые порции', 'accessories', 3800, '⏰', true),
('Pet First Aid Kit', 'Аптечка первой помощи', 'Essential supplies', 'Необходимые материалы', 'accessories', 890, '🏥', true),
('Pet Carrier Premium', 'Переноска Премиум', 'Airline approved', 'Одобрена авиакомпаниями', 'accessories', 4200, '✈️', true),
('Pet Grooming Set', 'Набор для груминга', 'Professional tools', 'Профессиональные инструменты', 'accessories', 1650, '✂️', true);

-- Add more daily quests
INSERT INTO public.daily_quests (name, name_ru, description, description_ru, icon, requirement_type, requirement_value, reward_crystals, reward_diamonds, reward_xp, is_active) VALUES
-- Easy quests
('First Click', 'Первый клик', 'Make your first click today', 'Сделай первый клик сегодня', '👆', 'clicks', 1, 10, 0, 5, true),
('Morning Routine', 'Утренняя рутина', 'Collect 50 clicks', 'Собери 50 кликов', '🌅', 'clicks', 50, 30, 0, 15, true),
('Quick Tapper', 'Быстрый тапер', 'Tap 100 times', 'Тапни 100 раз', '⚡', 'clicks', 100, 50, 0, 25, true),
-- Medium quests
('Crystal Hunter', 'Охотник за кристаллами', 'Earn 500 crystals', 'Заработай 500 кристаллов', '💎', 'crystals', 500, 100, 1, 50, true),
('Dedicated Player', 'Преданный игрок', 'Make 300 clicks', 'Сделай 300 кликов', '🎯', 'clicks', 300, 80, 0, 40, true),
('Crystal Master', 'Мастер кристаллов', 'Collect 1000 crystals', 'Собери 1000 кристаллов', '💰', 'crystals', 1000, 150, 2, 75, true),
-- Hard quests  
('Tap Champion', 'Чемпион тапов', 'Reach 500 clicks', 'Достигни 500 кликов', '🏆', 'clicks', 500, 200, 2, 100, true),
('Wealthy Player', 'Богатый игрок', 'Earn 2000 crystals', 'Заработай 2000 кристаллов', '🤑', 'crystals', 2000, 300, 3, 150, true),
('Endurance Test', 'Тест на выносливость', 'Make 750 clicks', 'Сделай 750 кликов', '💪', 'clicks', 750, 250, 2, 125, true),
-- Expert quests
('Legend Maker', 'Создатель легенд', 'Tap 1000 times', 'Тапни 1000 раз', '⭐', 'clicks', 1000, 500, 5, 250, true),
('Crystal Tycoon', 'Кристальный магнат', 'Collect 5000 crystals', 'Собери 5000 кристаллов', '👑', 'crystals', 5000, 750, 7, 350, true),
-- Streak quests
('Streak Starter', 'Начало серии', 'Login for 3 days', 'Заходи 3 дня подряд', '🔥', 'streak', 3, 100, 1, 50, true),
('Week Warrior', 'Недельный воин', 'Maintain 7 day streak', 'Держи серию 7 дней', '📅', 'streak', 7, 300, 5, 150, true),
-- Level quests
('Level Up!', 'Повышение уровня!', 'Reach level 5', 'Достигни 5 уровня', '📈', 'level', 5, 200, 2, 100, true),
('Rising Star', 'Восходящая звезда', 'Reach level 10', 'Достигни 10 уровня', '🌟', 'level', 10, 500, 5, 250, true);

-- Add achievements for evolution
INSERT INTO public.achievements (name, name_ru, description, description_ru, icon, category, requirement_type, requirement_value, reward_crystals, reward_diamonds, is_active) VALUES
('First Evolution', 'Первая эволюция', 'Evolve your first pet', 'Прокачай первого питомца', '🔄', 'pets', 'pet_evolution', 1, 500, 5, true),
('Pet Trainer', 'Тренер питомцев', 'Evolve 3 pets', 'Прокачай 3 питомцев', '🏋️', 'pets', 'pet_evolution', 3, 1500, 10, true),
('Evolution Master', 'Мастер эволюций', 'Evolve 5 pets to max', 'Прокачай 5 питомцев до макс', '🧬', 'pets', 'pet_evolution', 5, 3000, 25, true),
('Rare Collector', 'Коллекционер редких', 'Own 3 rare pets', 'Владей 3 редкими питомцами', '💜', 'pets', 'rare_pets', 3, 1000, 10, true),
('Legendary Owner', 'Владелец легенд', 'Own a legendary pet', 'Владей легендарным питомцем', '🔱', 'pets', 'legendary_pets', 1, 2000, 15, true);