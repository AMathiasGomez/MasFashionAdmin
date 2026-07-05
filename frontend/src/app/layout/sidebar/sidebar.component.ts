import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  permission: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, RouterLink, RouterLinkActive],
  styleUrl: './sidebar.component.scss',
  template: `
    <div class="sidebar-backdrop d-lg-none" *ngIf="open" (click)="closed.emit()"></div>

    <aside class="sidebar" [ngClass]="{ 'is-open': open }">
      <div class="brand">
        <div class="brand-mark">A</div>
        <div>
          <div class="brand-title">Atelier Admin</div>
          <small>Inventario y ventas</small>
        </div>
      </div>

      <nav class="nav-list">
        <a
          *ngFor="let item of visibleItems"
          class="nav-link"
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
          (click)="closed.emit()"
        >
          <i class="bi" [ngClass]="item.icon"></i>
          <span>{{ item.label }}</span>
        </a>
      </nav>
    </aside>
  `
})
export class SidebarComponent {
  @Input() open = false;
  @Output() readonly closed = new EventEmitter<void>();

  readonly items: NavItem[] = [
    { label: 'Dashboard', icon: 'bi-speedometer2', path: '/dashboard', permission: 'dashboard.read' },
    { label: 'Productos', icon: 'bi-bag-heart', path: '/products', permission: 'products.read' },
    { label: 'Categorias', icon: 'bi-tags', path: '/categories', permission: 'categories.read' },
    { label: 'Proveedores', icon: 'bi-truck', path: '/suppliers', permission: 'suppliers.read' },
    { label: 'Inventario', icon: 'bi-box-seam', path: '/inventory', permission: 'inventory.read' },
    { label: 'Pedidos', icon: 'bi-receipt', path: '/orders', permission: 'orders.read' },
    { label: 'Clientes', icon: 'bi-people', path: '/customers', permission: 'customers.read' },
    { label: 'Insumos', icon: 'bi-scissors', path: '/supplies', permission: 'supplies.read' },
    { label: 'Finanzas', icon: 'bi-cash-coin', path: '/finances', permission: 'finances.read' },
    { label: 'Reportes', icon: 'bi-file-earmark-arrow-down', path: '/reports', permission: 'reports.export' }
  ];

  constructor(private readonly auth: AuthService) {}

  get visibleItems(): NavItem[] {
    return this.items.filter((item) => this.auth.hasPermission(item.permission));
  }
}
