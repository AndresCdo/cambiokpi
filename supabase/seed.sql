-- CambioKPI Seed Data
-- IMPORTANT: Run this AFTER creating a demo operator through the auth UI
-- Or run it with a known operator_id for development

-- Replace this with your actual demo user UUID from Supabase Auth
-- DO NOT use this seed directly - first create a user, then replace the UUID
-- \set demo_operator_id '00000000-0000-0000-0000-000000000000'

-- Example demo data (skeleton - replace IDs):

/*
-- Margin settings for demo operator
insert into public.margin_settings (operator_id, pair, margin_percent, min_margin_percent)
values
  (:demo_operator_id, 'USD_USDT', 1.50, 0.50),
  (:demo_operator_id, 'EUR_USDT', 2.00, 1.00),
  (:demo_operator_id, 'VES_USDT', 5.00, 3.00)
on conflict (operator_id, pair) do nothing;

-- Sample transactions for the last 30 days
insert into public.transactions (operator_id, pair, direction, amount_in, currency_in, amount_out, currency_out, rate_used, margin_percent, profit_usdt, payment_method, client_name, notes, status, source, created_at)
values
  -- USD_USDT operations
  (:demo_operator_id, 'USD_USDT', 'BUY', 1000.00, 'USD', 985.00, 'USDT', 1.0152, 1.50, 14.78, 'Zelle', 'Carlos Perez', null, 'completed', 'manual', now() - interval '29 days'),
  (:demo_operator_id, 'USD_USDT', 'SELL', 500.00, 'USDT', 492.50, 'USD', 1.0152, 1.50, 7.39, 'Transferencia', 'Maria Lopez', null, 'completed', 'manual', now() - interval '27 days'),
  (:demo_operator_id, 'USD_USDT', 'BUY', 2500.00, 'USD', 2462.50, 'USDT', 1.0152, 1.50, 36.95, 'Efectivo', 'Juan Rodriguez', 'Cliente recurrente', 'completed', 'client_request', now() - interval '25 days'),
  (:demo_operator_id, 'USD_USDT', 'BUY', 800.00, 'USD', 788.00, 'USDT', 1.0152, 1.50, 11.82, 'Zelle', 'Ana Martinez', null, 'completed', 'manual', now() - interval '20 days'),
  (:demo_operator_id, 'USD_USDT', 'SELL', 1500.00, 'USDT', 1477.50, 'USD', 1.0152, 1.40, 20.73, 'PayPal', 'Pedro Gonzalez', null, 'completed', 'manual', now() - interval '18 days'),
  
  -- EUR_USDT operations
  (:demo_operator_id, 'EUR_USDT', 'BUY', 2000.00, 'EUR', 2352.00, 'USDT', 0.8500, 2.00, 47.04, 'Transferencia', 'Laura Fernandez', null, 'completed', 'manual', now() - interval '28 days'),
  (:demo_operator_id, 'EUR_USDT', 'SELL', 1000.00, 'USDT', 850.00, 'EUR', 0.8500, 2.00, 20.00, 'Efectivo', 'Diego Torres', null, 'completed', 'client_request', now() - interval '22 days'),
  (:demo_operator_id, 'EUR_USDT', 'BUY', 3500.00, 'EUR', 4112.50, 'USDT', 0.8510, 1.80, 73.63, 'Zelle', 'Sofia Ramirez', null, 'completed', 'manual', now() - interval '15 days'),
  (:demo_operator_id, 'EUR_USDT', 'BUY', 600.00, 'EUR', 706.80, 'USDT', 0.8490, 1.90, 13.43, 'PayPal', 'Miguel Castro', null, 'completed', 'manual', now() - interval '10 days'),
  (:demo_operator_id, 'EUR_USDT', 'SELL', 2000.00, 'USDT', 1704.00, 'EUR', 0.8520, 2.10, 42.55, 'Transferencia', 'Carmen Vargas', null, 'completed', 'manual', now() - interval '5 days'),
  
  -- VES_USDT operations
  (:demo_operator_id, 'VES_USDT', 'BUY', 50000.00, 'VES', 850.00, 'USDT', 58.82, 5.00, 42.50, 'Pago movil', 'Luis Sanchez', null, 'completed', 'manual', now() - interval '26 days'),
  (:demo_operator_id, 'VES_USDT', 'BUY', 80000.00, 'VES', 1360.00, 'USDT', 58.82, 5.00, 68.00, 'Efectivo', 'Rosa Mendez', 'Cliente VIP', 'completed', 'client_request', now() - interval '19 days'),
  (:demo_operator_id, 'VES_USDT', 'SELL', 500.00, 'USDT', 29411.76, 'VES', 58.82, 5.50, 27.50, 'Pago movil', 'Jose Contreras', null, 'completed', 'manual', now() - interval '14 days'),
  (:demo_operator_id, 'VES_USDT', 'BUY', 120000.00, 'VES', 2040.00, 'USDT', 58.82, 5.20, 106.08, 'Transferencia', 'Patricia Silva', null, 'completed', 'manual', now() - interval '8 days'),
  (:demo_operator_id, 'VES_USDT', 'BUY', 30000.00, 'VES', 507.00, 'USDT', 59.17, 4.80, 24.34, 'Zelle', 'Andres Marquez', null, 'completed', 'manual', now() - interval '3 days'),
  
  -- Recent transactions (today)
  (:demo_operator_id, 'USD_USDT', 'BUY', 400.00, 'USD', 394.00, 'USDT', 1.0152, 1.50, 5.91, 'Zelle', 'Gabriel Leon', null, 'completed', 'client_request', now() - interval '4 hours'),
  (:demo_operator_id, 'EUR_USDT', 'SELL', 500.00, 'USDT', 425.50, 'EUR', 0.8510, 2.00, 10.00, 'PayPal', 'Adriana Rojas', null, 'completed', 'manual', now() - interval '2 hours'),
  (:demo_operator_id, 'USD_USDT', 'BUY', 200.00, 'USD', 197.00, 'USDT', 1.0152, 1.50, 2.96, 'Efectivo', 'Ricardo Pena', null, 'completed', 'manual', now() - interval '1 hour'),
  
  -- Pending transactions
  (:demo_operator_id, 'VES_USDT', 'BUY', 45000.00, 'VES', null, 'USDT', 59.00, 5.00, 0, 'Pago movil', 'Fernando Gil', 'Esperando confirmacion', 'pending', 'manual', now() - interval '30 minutes')
;

-- Monthly goal for current month
insert into public.monthly_goals (operator_id, year, month, target_profit_usdt)
values
  (:demo_operator_id, extract(year from now())::int, extract(month from now())::int, 800.00)
on conflict (operator_id, year, month) do nothing;

-- Sample pending client requests
insert into public.client_requests (operator_id, client_name, client_contact, amount_in, currency_in, currency_out, payment_method, wallet_address, status, notes, created_at)
values
  (:demo_operator_id, 'Andrea Gutierrez', 'andrea@email.com', 500.00, 'USD', 'USDT', 'Zelle', 'TAcS5q8vQZYaXGxjcEk5B3Zx7cPmRD2UXJ', 'pending', 'Primera vez usando P2P', now() - interval '10 minutes'),
  (:demo_operator_id, 'Roberto Mendez', '+58 414 555 01 02', 300.00, 'EUR', 'USDT', 'Transferencia', 'TAbCdEf1234567890ABCDEF1234567890ABCDE', 'pending', null, now() - interval '45 minutes'),
  (:demo_operator_id', 'Carla Jimenez', 'carla_jimenez@hotmail.com', 100000.00, 'VES', 'USDT', 'Efectivo', 'TAxYz0987654321ZYXWVUTSRQPONMLKJIHGF', 'pending', 'Solo disponible en las tardes', now() - interval '2 hours')
;
*/
