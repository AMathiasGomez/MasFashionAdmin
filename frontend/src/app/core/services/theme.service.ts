import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'mf-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(this.readInitial());

  constructor() {
    this.apply(this.dark());
  }

  toggle(): void {
    const next = !this.dark();
    this.dark.set(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    this.apply(next);
  }

  private readInitial(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private apply(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
