USE clothing_admin;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(30) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_audit_logs_entity (entity_type, entity_id),
  INDEX idx_audit_logs_created_at (created_at),
  INDEX idx_audit_logs_user_id (user_id)
) ENGINE=InnoDB;

INSERT INTO permissions (code, description) VALUES
  ('audit.read', 'View the administrative audit log')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'administrator' AND p.code = 'audit.read'
ON DUPLICATE KEY UPDATE permission_id = permission_id;
