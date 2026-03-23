-- Create orders table for PizzaPad
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  table_number INTEGER NOT NULL,
  restaurant_name TEXT NOT NULL DEFAULT 'Napoli''s Kitchen',
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  tax INTEGER NOT NULL,
  total INTEGER NOT NULL,
  stripe_session_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Enable RLS (but allow public access for this kiosk app - no auth required)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert orders (kiosk mode)
CREATE POLICY "Allow public insert" ON orders FOR INSERT WITH CHECK (true);

-- Allow anyone to read orders by order_number (for confirmation page)
CREATE POLICY "Allow public read" ON orders FOR SELECT USING (true);

-- Allow updates to payment_status and order_status
CREATE POLICY "Allow public update" ON orders FOR UPDATE USING (true);
