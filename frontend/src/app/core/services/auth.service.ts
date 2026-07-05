import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { ApiService } from './api.service';
import { LoginRequest, LoginResponse, UserSession } from '../models/auth.model';

const TOKEN_KEY = 'clothing_admin_token';
const USER_KEY = 'clothing_admin_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<UserSession | null>(this.readUser());

  constructor(
    private readonly api: ApiService,
    private readonly router: Router
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        this.user.set(response.user);
      })
    );
  }

  logout(): void {
    this.api.post('/auth/logout', {}).subscribe({ error: () => undefined });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  hasPermission(permission: string): boolean {
    return this.user()?.permissions.includes(permission) ?? false;
  }

  private readUser(): UserSession | null {
    const rawUser = localStorage.getItem(USER_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as UserSession;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}

