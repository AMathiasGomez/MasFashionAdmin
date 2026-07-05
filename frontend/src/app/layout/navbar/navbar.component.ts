import { Component, EventEmitter, Output } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

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

      <div class="ms-auto d-flex align-items-center gap-3">
        <div class="text-end d-none d-sm-block">
          <div class="fw-semibold">{{ auth.user()?.name }}</div>
          <small class="text-muted">{{ roleLabel }}</small>
        </div>
        <button type="button" class="btn btn-outline-secondary icon-btn" title="Cerrar sesion" (click)="auth.logout()">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </header>
  `
})
export class NavbarComponent {
  @Output() readonly menuClicked = new EventEmitter<void>();

  constructor(readonly auth: AuthService) {}

  get roleLabel(): string {
    const role = this.auth.user()?.role;
    const labels = {
      administrator: 'Administrador',
      seller: 'Vendedor',
      warehouse: 'Bodega'
    };

    return role ? labels[role] : '';
  }
}

