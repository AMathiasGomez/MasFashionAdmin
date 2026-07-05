# Backend

REST API para el sistema administrativo del negocio de ropa femenina.

## Requisitos

- Node.js 20 o superior
- MySQL 8 o superior

## Configuracion inicial

1. Crear la base de datos ejecutando `database/schema.sql`.
2. Copiar `.env.example` como `.env`.
3. Ajustar credenciales de MySQL y `JWT_SECRET`.
4. Instalar dependencias.
5. Iniciar el servidor.

```bash
npm install
npm run dev
```

Crear usuario administrador inicial en PowerShell:

```powershell
$env:ADMIN_NAME="Administrador"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="Admin12345"
npm run create:admin
```

En Bash:

```bash
ADMIN_NAME="Administrador" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="Admin12345" npm run create:admin
```

La API queda disponible en:

```txt
http://localhost:3000/api
```

## Endpoints iniciales

```txt
GET  /api/health
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/categories
POST /api/categories
PUT  /api/categories/:id
GET  /api/customers
GET  /api/customers/frequent
GET  /api/customers/:id
POST /api/customers
PUT  /api/customers/:id
GET  /api/dashboard/summary
GET  /api/orders
GET  /api/orders/:id
POST /api/orders
PATCH /api/orders/:id/status
POST /api/orders/:id/payments
GET  /api/products
GET  /api/products/:id
POST /api/products
PUT  /api/products/:id
PATCH /api/products/:id/status
GET  /api/inventory/low-stock
GET  /api/inventory/movements
POST /api/inventory/movements
GET  /api/supplies
GET  /api/supplies/monthly-expenses
GET  /api/supplies/:id
POST /api/supplies
PUT  /api/supplies/:id
GET  /api/suppliers
GET  /api/suppliers/:id
POST /api/suppliers
PUT  /api/suppliers/:id
PATCH /api/suppliers/:id/status
GET  /api/finances/summary
GET  /api/finances/transactions
POST /api/finances/transactions
GET  /api/reports/:type/:format
```
