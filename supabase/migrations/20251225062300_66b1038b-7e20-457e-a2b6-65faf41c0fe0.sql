-- Friends/Friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Gifts table
CREATE TABLE public.gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  gift_type TEXT NOT NULL DEFAULT 'crystals', -- 'crystals', 'diamonds', 'xp'
  amount NUMERIC NOT NULL DEFAULT 10,
  message TEXT,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- RLS policies for friendships
CREATE POLICY "Users can view their friendships"
ON public.friendships
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
ON public.friendships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
ON public.friendships
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
ON public.friendships
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS policies for gifts
CREATE POLICY "Users can view gifts sent to them or from them"
ON public.gifts
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send gifts"
ON public.gifts
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can claim their gifts"
ON public.gifts
FOR UPDATE
USING (auth.uid() = to_user_id);

-- Add total_clicks and total_crystals_earned to profiles for statistics
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_clicks BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_crystals_earned NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS friends_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS gifts_sent INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS gifts_received INTEGER NOT NULL DEFAULT 0;