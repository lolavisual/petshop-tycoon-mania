-- Create table for consultant chat history
CREATE TABLE public.consultant_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chat messages
CREATE TABLE public.consultant_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.consultant_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultant_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for consultant_chats
CREATE POLICY "Users can view their own chats"
ON public.consultant_chats FOR SELECT
USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create their own chats"
ON public.consultant_chats FOR INSERT
WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own chats"
ON public.consultant_chats FOR DELETE
USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS policies for consultant_messages
CREATE POLICY "Users can view messages in their chats"
ON public.consultant_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.consultant_chats
    WHERE id = consultant_messages.chat_id
    AND user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

CREATE POLICY "Users can create messages in their chats"
ON public.consultant_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.consultant_chats
    WHERE id = consultant_messages.chat_id
    AND user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_consultant_chats_updated_at
BEFORE UPDATE ON public.consultant_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for pet images
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-images', 'pet-images', true);

-- Storage policies for pet images
CREATE POLICY "Anyone can view pet images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-images');

CREATE POLICY "Users can upload pet images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pet-images');

CREATE POLICY "Users can delete their own pet images"
ON storage.objects FOR DELETE
USING (bucket_id = 'pet-images');