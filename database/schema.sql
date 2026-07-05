CREATE DATABASE IF NOT EXISTS clothing_admin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE clothing_admin;

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE revoked_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_jti VARCHAR(100) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_revoked_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_revoked_tokens_expires_at (expires_at)
) ENGINE=InnoDB;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE suppliers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(160) NULL,
  address VARCHAR(255) NULL,
  notes TEXT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_suppliers_name (name)
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  supplier_id INT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  size VARCHAR(30) NOT NULL,
  color VARCHAR(60) NOT NULL,
  sale_price DECIMAL(12, 2) NOT NULL,
  manufacturing_cost DECIMAL(12, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_products_sale_price CHECK (sale_price >= 0),
  CONSTRAINT chk_products_manufacturing_cost CHECK (manufacturing_cost >= 0),
  CONSTRAINT chk_products_stock CHECK (stock >= 0),
  CONSTRAINT chk_products_min_stock CHECK (min_stock >= 0),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_products_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_products_name (name),
  INDEX idx_products_category_id (category_id),
  INDEX idx_products_supplier_id (supplier_id),
  INDEX idx_products_stock_min_stock (stock, min_stock),
  INDEX idx_products_active (active)
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_main TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_product_images_product_id (product_id)
) ENGINE=InnoDB;

CREATE TABLE inventory_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  movement_type ENUM('in', 'out', 'sale', 'return', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason VARCHAR(255) NULL,
  reference_type ENUM('order', 'manual', 'supply', 'correction') NOT NULL DEFAULT 'manual',
  reference_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_inventory_movements_quantity CHECK (quantity > 0),
  CONSTRAINT chk_inventory_movements_previous_stock CHECK (previous_stock >= 0),
  CONSTRAINT chk_inventory_movements_new_stock CHECK (new_stock >= 0),
  CONSTRAINT fk_inventory_movements_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_movements_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_inventory_movements_product_id (product_id),
  INDEX idx_inventory_movements_user_id (user_id),
  INDEX idx_inventory_movements_created_at (created_at),
  INDEX idx_inventory_movements_reference (reference_type, reference_id)
) ENGINE=InnoDB;

CREATE TABLE customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NULL,
  instagram VARCHAR(100) NULL,
  address VARCHAR(255) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_name (name),
  INDEX idx_customers_phone (phone),
  INDEX idx_customers_instagram (instagram)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'in_production', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_method ENUM('cash', 'card', 'transfer', 'nequi', 'daviplata', 'other') NOT NULL DEFAULT 'cash',
  delivery_address VARCHAR(255) NULL,
  observations TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0),
  CONSTRAINT chk_orders_discount CHECK (discount >= 0),
  CONSTRAINT chk_orders_total CHECK (total >= 0),
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_orders_customer_id (customer_id),
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  unit_cost DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_items_unit_price CHECK (unit_price >= 0),
  CONSTRAINT chk_order_items_unit_cost CHECK (unit_cost >= 0),
  CONSTRAINT chk_order_items_subtotal CHECK (subtotal >= 0),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id)
) ENGINE=InnoDB;

CREATE TABLE order_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('cash', 'card', 'transfer', 'nequi', 'daviplata', 'other') NOT NULL DEFAULT 'cash',
  notes VARCHAR(255) NULL,
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_order_payments_amount CHECK (amount > 0),
  CONSTRAINT fk_order_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_payments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_order_payments_order_id (order_id),
  INDEX idx_order_payments_user_id (user_id),
  INDEX idx_order_payments_paid_at (paid_at)
) ENGINE=InnoDB;

CREATE TABLE supply_purchases (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT UNSIGNED NOT NULL,
  supply_type ENUM('fabric', 'buttons', 'zippers', 'labels', 'other') NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  unit_cost DECIMAL(12, 2) NOT NULL,
  total_cost DECIMAL(12, 2) NOT NULL,
  purchase_date DATE NOT NULL,
  observations TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_supply_purchases_quantity CHECK (quantity > 0),
  CONSTRAINT chk_supply_purchases_unit_cost CHECK (unit_cost >= 0),
  CONSTRAINT chk_supply_purchases_total_cost CHECK (total_cost >= 0),
  CONSTRAINT fk_supply_purchases_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_supply_purchases_supplier_id (supplier_id),
  INDEX idx_supply_purchases_supply_type (supply_type),
  INDEX idx_supply_purchases_purchase_date (purchase_date)
) ENGINE=InnoDB;

CREATE TABLE product_supplies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  supply_purchase_id BIGINT UNSIGNED NOT NULL,
  quantity_used DECIMAL(12, 2) NOT NULL,
  CONSTRAINT chk_product_supplies_quantity_used CHECK (quantity_used > 0),
  CONSTRAINT fk_product_supplies_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_product_supplies_supply_purchase
    FOREIGN KEY (supply_purchase_id) REFERENCES supply_purchases(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_product_supplies_product_supply (product_id, supply_purchase_id),
  INDEX idx_product_supplies_supply_purchase_id (supply_purchase_id)
) ENGINE=InnoDB;

CREATE TABLE financial_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('income', 'expense') NOT NULL,
  category VARCHAR(80) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(255) NULL,
  reference_type ENUM('order', 'supply_purchase', 'manual') NOT NULL DEFAULT 'manual',
  reference_id BIGINT UNSIGNED NULL,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_financial_transactions_amount CHECK (amount > 0),
  INDEX idx_financial_transactions_type (type),
  INDEX idx_financial_transactions_category (category),
  INDEX idx_financial_transactions_transaction_date (transaction_date),
  INDEX idx_financial_transactions_reference (reference_type, reference_id)
) ENGINE=InnoDB;

INSERT INTO roles (name, description) VALUES
  ('administrator', 'Full system access'),
  ('seller', 'Sales, customers, orders and limited dashboard access'),
  ('warehouse', 'Products, inventory and stock movements')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO permissions (code, description) VALUES
  ('dashboard.read', 'View dashboard metrics'),
  ('users.manage', 'Manage internal users'),
  ('products.read', 'View products'),
  ('products.manage', 'Create, update and deactivate products'),
  ('categories.read', 'View product categories'),
  ('categories.manage', 'Create and update product categories'),
  ('suppliers.read', 'View suppliers'),
  ('suppliers.manage', 'Create and update suppliers'),
  ('inventory.read', 'View inventory'),
  ('inventory.manage', 'Register stock movements'),
  ('orders.read', 'View orders'),
  ('orders.manage', 'Create and update orders'),
  ('customers.read', 'View customers'),
  ('customers.manage', 'Create and update customers'),
  ('supplies.read', 'View supply purchases'),
  ('supplies.manage', 'Create and update supply purchases'),
  ('finances.read', 'View financial information'),
  ('finances.manage', 'Create and update financial transactions'),
  ('reports.export', 'Export PDF and Excel reports')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'administrator'
ON DUPLICATE KEY UPDATE permission_id = permission_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'dashboard.read',
  'categories.read',
  'products.read',
  'orders.read',
  'orders.manage',
  'customers.read',
  'customers.manage'
)
WHERE r.name = 'seller'
ON DUPLICATE KEY UPDATE permission_id = permission_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'dashboard.read',
  'categories.read',
  'categories.manage',
  'suppliers.read',
  'suppliers.manage',
  'products.read',
  'products.manage',
  'inventory.read',
  'inventory.manage',
  'supplies.read'
)
WHERE r.name = 'warehouse'
ON DUPLICATE KEY UPDATE permission_id = permission_id;

INSERT INTO categories (name, description) VALUES
  ('Blusas', 'Blusas y tops'),
  ('Vestidos', 'Vestidos casuales y elegantes'),
  ('Pantalones', 'Pantalones y jeans'),
  ('Faldas', 'Faldas'),
  ('Accesorios', 'Accesorios de moda')
ON DUPLICATE KEY UPDATE description = VALUES(description);

CREATE OR REPLACE VIEW vw_product_profitability AS
SELECT
  p.id,
  p.name,
  c.name AS category_name,
  p.size,
  p.color,
  p.sale_price,
  p.manufacturing_cost,
  (p.sale_price - p.manufacturing_cost) AS unit_profit,
  CASE
    WHEN p.sale_price = 0 THEN 0
    ELSE ROUND(((p.sale_price - p.manufacturing_cost) / p.sale_price) * 100, 2)
  END AS profit_margin,
  p.stock,
  p.min_stock,
  CASE WHEN p.stock <= p.min_stock THEN 1 ELSE 0 END AS is_low_stock,
  p.active
FROM products p
JOIN categories c ON c.id = p.category_id;

CREATE OR REPLACE VIEW vw_customer_summary AS
SELECT
  c.id,
  c.name,
  c.phone,
  c.instagram,
  COUNT(o.id) AS orders_count,
  COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) AS total_spent,
  MAX(o.created_at) AS last_order_at
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name, c.phone, c.instagram;

CREATE OR REPLACE VIEW vw_order_payment_summary AS
SELECT
  o.id AS order_id,
  o.customer_id,
  o.user_id,
  o.status,
  o.total,
  COALESCE(SUM(op.amount), 0) AS amount_paid,
  (o.total - COALESCE(SUM(op.amount), 0)) AS pending_amount,
  o.created_at
FROM orders o
LEFT JOIN order_payments op ON op.order_id = o.id
GROUP BY o.id, o.customer_id, o.user_id, o.status, o.total, o.created_at;

CREATE OR REPLACE VIEW vw_monthly_finances AS
SELECT
  DATE_FORMAT(transaction_date, '%Y-%m') AS month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net_profit
FROM financial_transactions
GROUP BY DATE_FORMAT(transaction_date, '%Y-%m');

CREATE OR REPLACE VIEW vw_best_selling_products AS
SELECT
  p.id AS product_id,
  p.name,
  p.size,
  p.color,
  SUM(oi.quantity) AS units_sold,
  SUM(oi.subtotal) AS sales_total,
  SUM((oi.unit_price - oi.unit_cost) * oi.quantity) AS gross_profit
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status != 'cancelled'
GROUP BY p.id, p.name, p.size, p.color;
