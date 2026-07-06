import { Component, EventEmitter, Output } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  styleUrl: './navbar.component.scss',
  template: `
    <header class="topbar">
      <button
        type="button"
        class="btn btn-light icon-btn d-lg-none"
        title="Abrir menu"
        (click)="menuClicked.emit()"
      >
        <i class="bi bi-list"></i>
      </button>

      <div class="d-none d-md-block">
        <div class="fw-semibold">Panel administrativo</div>
        <small class="text-muted">Ropa femenina</small>
      </div>

      <div class="search-box d-none d-lg-flex">
        <i class="bi bi-search"></i>
        <input placeholder="Buscar productos, pedidos, clientes…" />
      </div>

      <div class="ms-auto d-flex align-items-center gap-2">
        <button
          type="button"
          class="btn btn-outline-secondary icon-btn"
          title="Cambiar tema"
          (click)="theme.toggle()"
        >
          <i class="bi" [class.bi-moon]="!theme.dark()" [class.bi-sun]="theme.dark()"></i>
        </button>

        <div class="text-end d-none d-sm-block me-1">
          <div class="fw-semibold">{{ auth.user()?.name }}</div>
          <small class="text-muted">{{ roleLabel }}</small>
        </div>
        <div class="avatar">{{ initials }}</div>
        <button type="button" class="btn btn-outline-secondary icon-btn" title="Cerrar sesion" (click)="auth.logout()">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </header>
  `
})
export class NavbarComponent {
  @Output() readonly menuClicked = new EventEmitter<void>();

  constructor(readonly auth: AuthService, readonly theme: ThemeService) {}

  get roleLabel(): string {
    const role = this.auth.user()?.role;
    const labels = {
      administrator: 'Administrador',
      seller: 'Vendedor',
      warehouse: 'Bodega'
    };

    return role ? labels[role] : '';
  }

  get initials(): string {
    const name = this.auth.user()?.name || '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
}
