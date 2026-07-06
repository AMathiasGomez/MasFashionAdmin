USE clothing_admin;

CREATE TABLE IF NOT EXISTS product_groups (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  supplier_id INT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_groups_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_product_groups_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_product_groups_name_category (name, category_id)
) ENGINE=InnoDB;

ALTER TABLE products
  ADD COLUMN group_id INT UNSIGNED NULL AFTER id;

ALTER TABLE products
  ADD CONSTRAINT fk_products_group
    FOREIGN KEY (group_id) REFERENCES product_groups(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD INDEX idx_products_group_id (group_id);

-- Backfill: one group per distinct (name, category_id) among existing products.
INSERT INTO product_groups (category_id, supplier_id, name)
SELECT p.category_id, MIN(p.supplier_id), p.name
FROM products p
WHERE p.group_id IS NULL
GROUP BY p.category_id, p.name;

UPDATE products p
JOIN product_groups pg
  ON pg.name = p.name AND pg.category_id = p.category_id
SET p.group_id = pg.id
WHERE p.group_id IS NULL;
