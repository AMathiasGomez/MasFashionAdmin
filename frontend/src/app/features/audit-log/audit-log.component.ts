import { DatePipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { AuditLog } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

const ACTION_LABELS: Record<string, string> = {
  create: 'Creación',
  update: 'Actualización',
  delete: 'Eliminación',
  status_change: 'Cambio de estado',
  payment: 'Pago registrado'
};

const ENTITY_LABELS: Record<string, string> = {
  product: 'Producto',
  category: 'Categoría',
  supplier: 'Proveedor',
  customer: 'Cliente',
  order: 'Pedido',
  inventory_movement: 'Movimiento de inventario',
  supply_purchase: 'Compra de insumos',
  financial_transaction: 'Movimiento financiero'
};

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [DatePipe, JsonPipe, NgFor, NgIf, PageHeaderComponent, ReactiveFormsModule],
  template: `
    <app-page-header title="Bitácora de auditoría" subtitle="Historial de acciones administrativas" />

    <section class="app-card p-3 mb-3">
      <form class="row g-3" [formGroup]="filters" (ngSubmit)="load()">
        <div class="col-md-3">
          <label class="form-label">Modulo</label>
          <select class="form-select" formControlName="entityType">
            <option value="">Todos</option>
            <option *ngFor="let key of entityTypeKeys" [value]="key">{{ entityLabel(key) }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Accion</label>
          <select class="form-select" formControlName="action">
            <option value="">Todas</option>
            <option *ngFor="let key of actionKeys" [value]="key">{{ actionLabel(key) }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Desde</label>
          <input type="date" class="form-control" formControlName="from">
        </div>
        <div class="col-md-2">
          <label class="form-label">Hasta</label>
          <input type="date" class="form-control" formControlName="to">
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button class="btn btn-primary w-100" type="submit">Filtrar</button>
        </div>
      </form>
    </section>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Accion</th>
              <th>Modulo</th>
              <th>ID</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of logs()">
              <td>{{ log.createdAt | date:'short' }}</td>
              <td class="fw-semibold">{{ log.userName || 'Sistema' }}</td>
              <td><span class="badge rounded-pill text-bg-secondary">{{ actionLabel(log.action) }}</span></td>
              <td>{{ entityLabel(log.entityType) }}</td>
              <td>{{ log.entityId ?? '-' }}</td>
              <td>
                <small class="text-muted" *ngIf="log.details">{{ log.details | json }}</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-muted mb-0" *ngIf="!logs().length">Sin registros para los filtros seleccionados.</p>
    </section>
  `,
  styles: [
    `
      td small {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 360px;
      }
    `
  ]
})
export class AuditLogComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly logs = signal<AuditLog[]>([]);

  readonly entityTypeKeys = Object.keys(ENTITY_LABELS);
  readonly actionKeys = Object.keys(ACTION_LABELS);

  readonly filters = this.fb.nonNullable.group({
    entityType: [''],
    action: [''],
    from: [''],
    to: ['']
  });

  constructor() {
    this.load();
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action] || action;
  }

  entityLabel(entityType: string): string {
    return ENTITY_LABELS[entityType] || entityType;
  }

  load(): void {
    const query = Object.fromEntries(
      Object.entries(this.filters.getRawValue()).filter(([, value]) => Boolean(value))
    );

    this.api.get<PaginatedResult<AuditLog>>('/audit-logs', { ...query, limit: 50 }).subscribe((result) => {
      this.logs.set(result.items);
    });
  }
}
