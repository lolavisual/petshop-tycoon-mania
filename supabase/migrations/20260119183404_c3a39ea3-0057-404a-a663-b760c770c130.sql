-- Create table for bot message logs
CREATE TABLE public.bot_message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  username TEXT,
  first_name TEXT,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  response_time_ms INTEGER,
  is_command BOOLEAN DEFAULT false,
  command_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_message_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access logs
CREATE POLICY "Service role only"
ON public.bot_message_logs
AS RESTRICTIVE
FOR ALL
USING (false);

-- Create index for analytics queries
CREATE INDEX idx_bot_message_logs_created_at ON public.bot_message_logs(created_at DESC);
CREATE INDEX idx_bot_message_logs_telegram_id ON public.bot_message_logs(telegram_id);