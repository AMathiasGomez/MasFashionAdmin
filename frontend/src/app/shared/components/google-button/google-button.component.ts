import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

import { GOOGLE_CLIENT_ID } from '../../../core/config/api.config';

declare const google: any;

@Component({
  selector: 'app-google-button',
  standalone: true,
  template: `<div #btn class="google-btn-slot"></div>`,
  styles: [
    `
      .google-btn-slot {
        display: flex;
        justify-content: center;
      }
    `
  ]
})
export class GoogleButtonComponent implements AfterViewInit {
  @ViewChild('btn', { static: true }) btnRef!: ElementRef<HTMLDivElement>;
  @Output() readonly credential = new EventEmitter<string>();

  ngAfterViewInit(): void {
    this.render();
  }

  private render(retries = 20): void {
    if (typeof google === 'undefined' || !google?.accounts?.id) {
      if (retries > 0) {
        setTimeout(() => this.render(retries - 1), 150);
      }
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => this.credential.emit(response.credential)
    });

    google.accounts.id.renderButton(this.btnRef.nativeElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
      shape: 'pill'
    });
  }
}
