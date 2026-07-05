import { NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
  styleUrl: './login.component.scss',
  template: `
    <main class="login-page">
      <section class="login-panel">
        <div class="brand-mark mb-4">A</div>
        <h1>Atelier Admin</h1>
        <p class="text-muted mb-4">Ingresa para administrar ventas, inventario y finanzas.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="d-grid gap-3">
          <div>
            <label class="form-label">Correo</label>
            <input type="email" class="form-control" formControlName="email" autocomplete="email">
          </div>

          <div>
            <label class="form-label">Contrasena</label>
            <input type="password" class="form-control" formControlName="password" autocomplete="current-password">
          </div>

          <div class="alert alert-danger py-2 mb-0" *ngIf="error()">{{ error() }}</div>

          <button type="submit" class="btn btn-primary w-100" [disabled]="form.invalid || loading()">
            <span *ngIf="!loading()">Entrar</span>
            <span *ngIf="loading()">Validando...</span>
          </button>
        </form>
      </section>
    </main>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: () => {
        this.error.set('Correo o contrasena incorrectos.');
        this.loading.set(false);
      }
    });
  }
}
