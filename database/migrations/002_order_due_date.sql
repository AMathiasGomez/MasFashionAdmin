USE clothing_admin;

ALTER TABLE orders
  ADD COLUMN due_date DATE NULL AFTER observations;

ALTER TABLE orders
  ADD INDEX idx_orders_due_date (due_date);
