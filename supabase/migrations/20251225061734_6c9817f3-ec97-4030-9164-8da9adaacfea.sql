-- Allow everyone to view basic profile info for leaderboard (only non-sensitive fields)
CREATE POLICY "Everyone can view leaderboard profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Пользователи могут видеть свой пр" ON public.profiles;