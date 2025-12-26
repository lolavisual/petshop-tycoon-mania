-- Add pet_type column to profiles table
ALTER TABLE public.profiles
ADD COLUMN pet_type text NOT NULL DEFAULT 'dog';

-- Add comment for the column
COMMENT ON COLUMN public.profiles.pet_type IS 'Type of pet: dog, cat, hamster, rabbit, parrot';