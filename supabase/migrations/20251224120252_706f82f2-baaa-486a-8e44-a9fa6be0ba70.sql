-- Добавляем политику INSERT для click_logs
CREATE POLICY "Пользователи могут создавать записи кликов"
  ON public.click_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Исправляем функцию с search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;