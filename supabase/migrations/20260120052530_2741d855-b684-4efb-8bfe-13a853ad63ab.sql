-- Добавляем колонки для статистики пойманных питомцев в profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS caught_common integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS caught_rare integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS caught_epic integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS caught_legendary integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_legendary_streak integer DEFAULT 0;

-- Добавляем ежедневные квесты за ловлю питомцев
INSERT INTO daily_quests (name, name_ru, description, description_ru, requirement_type, requirement_value, reward_crystals, reward_diamonds, reward_xp, icon) VALUES
  ('Catch 10 pets', 'Поймай 10 питомцев', 'Catch any 10 pets', 'Поймай любых 10 питомцев', 'catch_any', 10, 100, 0, 50, '🐾'),
  ('Catch 3 rare pets', 'Поймай 3 редких', 'Catch 3 rare or better pets', 'Поймай 3 редких или лучше питомца', 'catch_rare', 3, 200, 1, 100, '💙'),
  ('Catch 2 epic pets', 'Поймай 2 эпических', 'Catch 2 epic or legendary pets', 'Поймай 2 эпических или легендарных питомца', 'catch_epic', 2, 500, 3, 200, '💜'),
  ('Catch a legendary', 'Поймай легендарного', 'Catch 1 legendary pet', 'Поймай 1 легендарного питомца', 'catch_legendary', 1, 1000, 5, 300, '⭐');