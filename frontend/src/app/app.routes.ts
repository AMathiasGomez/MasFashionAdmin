import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

export const appRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then((m) => m.ProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then((m) => m.CategoriesComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/suppliers/suppliers.component').then((m) => m.SuppliersComponent)
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory.component').then((m) => m.InventoryComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders.component').then((m) => m.OrdersComponent)
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customers.component').then((m) => m.CustomersComponent)
      },
      {
        path: 'supplies',
        loadComponent: () =>
          import('./features/supplies/supplies.component').then((m) => m.SuppliesComponent)
      },
      {
        path: 'finances',
        loadComponent: () =>
          import('./features/finances/finances.component').then((m) => m.FinancesComponent)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent)
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./features/audit-log/audit-log.component').then((m) => m.AuditLogComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
