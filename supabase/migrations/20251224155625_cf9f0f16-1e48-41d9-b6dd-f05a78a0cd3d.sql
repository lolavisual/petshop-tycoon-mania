-- Create enum for order statuses
CREATE TYPE public.order_status AS ENUM ('new', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Create orders table
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_username TEXT,
    product_name TEXT NOT NULL,
    product_id UUID REFERENCES public.pet_products(id),
    price TEXT NOT NULL,
    status order_status NOT NULL DEFAULT 'new',
    manager_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies: only authenticated users (admins) can manage orders
CREATE POLICY "Authenticated can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (true);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;