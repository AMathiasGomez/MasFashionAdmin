import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [NgIf],
  styleUrl: './modal.component.scss',
  template: `
    <div class="modal-backdrop-custom" *ngIf="open" (click)="close()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h2>{{ title }}</h2>
          <button type="button" class="btn btn-outline-secondary icon-btn" title="Cerrar" (click)="close()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <ng-content />
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() readonly closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
