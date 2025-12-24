-- Создаём bucket для изображений товаров
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Политика: все могут просматривать изображения
CREATE POLICY "Все могут видеть изображения товаров"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Политика: только аутентифицированные могут загружать
CREATE POLICY "Аутентифицированные могут загружать изображения"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Политика: только аутентифицированные могут удалять свои файлы
CREATE POLICY "Аутентифицированные могут удалять изображения"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');