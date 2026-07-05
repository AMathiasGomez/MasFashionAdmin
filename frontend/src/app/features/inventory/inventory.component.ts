import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { InventoryMovement, Product } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [DatePipe, NgFor, NgIf, PageHeaderComponent, ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <app-page-header title="Inventario" subtitle="Movimientos, responsables y trazabilidad de stock">
      <button class="btn btn-primary" type="button" (click)="showForm.set(!showForm())">
        <i class="bi bi-plus-lg me-2"></i>Movimiento
      </button>
    </app-page-header>

    <section class="app-card p-3 mb-3" *ngIf="showForm()">
      <form class="row g-3" [formGroup]="form" (ngSubmit)="create()">
        <div class="col-md-5">
          <label class="form-label">Producto</label>
          <select class="form-select" formControlName="productId">
            <option [ngValue]="0">Seleccionar</option>
            <option *ngFor="let product of products()" [ngValue]="product.id">
              {{ product.name }} · stock {{ product.stock }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Tipo</label>
          <select class="form-select" formControlName="movementType">
            <option value="in">Entrada</option>
            <option value="out">Salida</option>
            <option value="adjustment">Ajuste</option>
            <option value="return">Devolucion</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Cantidad</label>
          <input type="number" class="form-control" formControlName="quantity">
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button class="btn btn-primary w-100" [disabled]="form.invalid">Guardar</button>
        </div>
        <div class="col-12">
          <label class="form-label">Motivo</label>
          <input class="form-control" formControlName="reason">
        </div>
      </form>
    </section>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Antes</th><th>Despues</th><th>Responsable</th><th>Fecha</th></tr></thead>
          <tbody>
            <tr *ngFor="let movement of movements()">
              <td class="fw-semibold">{{ movement.productName }}</td>
              <td><app-status-badge [status]="movement.movementType" /></td>
              <td>{{ movement.quantity }}</td>
              <td>{{ movement.previousStock }}</td>
              <td>{{ movement.newStock }}</td>
              <td>{{ movement.userName }}</td>
              <td>{{ movement.createdAt | date:'short' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class InventoryComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly movements = signal<InventoryMovement[]>([]);
  readonly products = signal<Product[]>([]);
  readonly showForm = signal(false);

  readonly form = this.fb.nonNullable.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    movementType: ['in', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: ['']
  });

  constructor() {
    this.load();
    this.loadProducts();
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.api.post<InventoryMovement>('/inventory/movements', this.form.getRawValue()).subscribe(() => {
      this.form.reset({ productId: 0, movementType: 'in', quantity: 1, reason: '' });
      this.showForm.set(false);
      this.load();
      this.loadProducts();
    });
  }

  private load(): void {
    this.api.get<PaginatedResult<InventoryMovement>>('/inventory/movements', { limit: 50 }).subscribe((result) => {
      this.movements.set(result.items);
    });
  }

  private loadProducts(): void {
    this.api.get<PaginatedResult<Product>>('/products', { active: true, limit: 100 }).subscribe((result) => {
      this.products.set(result.items);
    });
  }
}

