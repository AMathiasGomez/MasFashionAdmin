import { NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { GoogleButtonComponent } from '../../../shared/components/google-button/google-button.component';

const passwordsMatch = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [GoogleButtonComponent, NgIf, ReactiveFormsModule, RouterLink],
  styleUrl: '../login/login.component.scss',
  template: `
    <main class="login-page">
      <section class="login-panel">
        <div class="brand-mark mb-4"><i class="bi bi-bag-heart"></i></div>
        <h1>Crear cuenta</h1>
        <p class="text-muted mb-4">Regístrate para acceder al panel de gestión.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="d-grid gap-3">
          <div>
            <label class="form-label">Nombre completo</label>
            <input type="text" class="form-control" formControlName="name" autocomplete="name">
          </div>

          <div>
            <label class="form-label">Correo</label>
            <input type="email" class="form-control" formControlName="email" autocomplete="email">
          </div>

          <div>
            <label class="form-label">Contraseña</label>
            <input type="password" class="form-control" formControlName="password" autocomplete="new-password">
          </div>

          <div>
            <label class="form-label">Confirmar contraseña</label>
            <input type="password" class="form-control" formControlName="confirmPassword" autocomplete="new-password">
          </div>

          <div class="alert alert-danger py-2 mb-0" *ngIf="form.errors?.['passwordMismatch'] && form.controls.confirmPassword.touched">
            Las contrasenas no coinciden.
          </div>

          <div class="alert alert-danger py-2 mb-0" *ngIf="error()">{{ error() }}</div>

          <button type="submit" class="btn btn-primary w-100" [disabled]="form.invalid || loading()">
            <span *ngIf="!loading()">Crear cuenta</span>
            <span *ngIf="loading()">Creando...</span>
          </button>
        </form>

        <div class="divider my-3"><span>o</span></div>

        <app-google-button (credential)="submitGoogle($event)" />

        <div class="alert alert-danger py-2 mt-3 mb-0" *ngIf="googleError()">{{ googleError() }}</div>

        <p class="register-hint mt-4 mb-0 text-center">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a>
        </p>
      </section>
    </main>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly googleError = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { name, email, password } = this.form.getRawValue();

    this.auth.register({ name, email, password }).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (err) => {
        this.error.set(err?.error?.message === 'An account with this email already exists'
          ? 'Ya existe una cuenta con este correo.'
          : 'No se pudo crear la cuenta. Intenta nuevamente.');
        this.loading.set(false);
      }
    });
  }

  submitGoogle(credential: string): void {
    this.googleError.set('');

    this.auth.loginWithGoogle(credential).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: () => this.googleError.set('No se pudo continuar con Google.')
    });
  }
}
