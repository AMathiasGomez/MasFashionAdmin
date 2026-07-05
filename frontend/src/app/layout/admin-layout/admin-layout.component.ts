import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet, SidebarComponent],
  styleUrl: './admin-layout.component.scss',
  template: `
    <div class="admin-shell">
      <app-sidebar [open]="sidebarOpen()" (closed)="sidebarOpen.set(false)" />
      <div class="admin-main">
        <app-navbar (menuClicked)="sidebarOpen.set(true)" />
        <main class="admin-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  readonly sidebarOpen = signal(false);
}

