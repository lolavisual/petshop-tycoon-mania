-- Политика: аутентифицированные пользователи могут обновлять товары (для админки)
CREATE POLICY "Аутентифицированные могут обновлять товары"
ON public.pet_products
FOR UPDATE
TO authenticated
USING (true);

-- Политика: аутентифицированные пользователи могут добавлять товары
CREATE POLICY "Аутентифицированные могут добавлять товары"
ON public.pet_products
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Политика: аутентифицированные пользователи могут удалять товары
CREATE POLICY "Аутентифицированные могут удалять товары"
ON public.pet_products
FOR DELETE
TO authenticated
USING (true);