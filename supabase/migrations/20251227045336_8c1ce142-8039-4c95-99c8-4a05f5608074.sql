-- Add new achievements for pet changes and quest completion
INSERT INTO public.achievements (name, name_ru, description, description_ru, icon, category, requirement_type, requirement_value, reward_crystals, reward_diamonds)
VALUES
  -- Pet change achievements
  ('First Friend', 'Первый друг', 'Change your pet for the first time', 'Смени питомца впервые', '🐾', 'pets', 'pet_changes', 1, 100, 2),
  ('Pet Lover', 'Любитель питомцев', 'Change your pet 5 times', 'Смени питомца 5 раз', '🐕🐈', 'pets', 'pet_changes', 5, 250, 5),
  ('Pet Master', 'Мастер питомцев', 'Change your pet 10 times', 'Смени питомца 10 раз', '👑🐾', 'pets', 'pet_changes', 10, 500, 10),
  
  -- Quest completion achievements  
  ('Quest Beginner', 'Новичок квестов', 'Complete 5 daily quests', 'Выполни 5 ежедневных квестов', '📋', 'quests', 'quests_completed', 5, 100, 2),
  ('Quest Hunter', 'Охотник за квестами', 'Complete 25 daily quests', 'Выполни 25 ежедневных квестов', '🎯', 'quests', 'quests_completed', 25, 300, 8),
  ('Quest Champion', 'Чемпион квестов', 'Complete 100 daily quests', 'Выполни 100 ежедневных квестов', '🏆', 'quests', 'quests_completed', 100, 1000, 25),
  ('Quest Legend', 'Легенда квестов', 'Complete 500 daily quests', 'Выполни 500 ежедневных квестов', '🌟', 'quests', 'quests_completed', 500, 3000, 75);

-- Add pet_changes and quests_completed columns to profiles for tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pet_changes integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS quests_completed integer NOT NULL DEFAULT 0;