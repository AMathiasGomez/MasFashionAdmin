import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { Customer, Order, Product } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { buildWhatsAppLink } from '../../core/utils/whatsapp';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgFor, NgIf, ModalComponent, PageHeaderComponent, ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <app-page-header title="Pedidos" subtitle="Seguimiento de ventas, estados y saldos">
      <button class="btn btn-primary" type="button" (click)="showForm.set(!showForm())">
        <i class="bi bi-plus-lg me-2"></i>Pedido
      </button>
    </app-page-header>

    <app-modal title="Nuevo pedido" [open]="showForm()" (closed)="showForm.set(false)">
      <form [formGroup]="form" (ngSubmit)="create()" class="d-grid gap-3">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Cliente</label>
            <select class="form-select" formControlName="customerId">
              <option [ngValue]="0">Seleccionar</option>
              <option *ngFor="let customer of customers()" [ngValue]="customer.id">{{ customer.name }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Metodo de pago</label>
            <select class="form-select" formControlName="paymentMethod">
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="nequi">Nequi</option>
              <option value="daviplata">Daviplata</option>
              <option value="card">Tarjeta</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Descuento</label>
            <input type="number" class="form-control" formControlName="discount">
          </div>
          <div class="col-md-3">
            <label class="form-label">Abono inicial</label>
            <input type="number" class="form-control" formControlName="amountPaid">
          </div>
          <div class="col-md-3">
            <label class="form-label">Fecha limite de pago</label>
            <input type="date" class="form-control" formControlName="dueDate">
          </div>
        </div>

        <div formArrayName="items" class="d-grid gap-2">
          <div class="row g-2 align-items-end" *ngFor="let item of items.controls; let i = index" [formGroupName]="i">
            <div class="col-md-7">
              <label class="form-label">Producto</label>
              <select class="form-select" formControlName="productId">
                <option [ngValue]="0">Seleccionar</option>
                <option *ngFor="let product of products()" [ngValue]="product.id">
                  {{ product.name }} · {{ product.size }} · stock {{ product.stock }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Cantidad</label>
              <input type="number" class="form-control" formControlName="quantity">
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-danger w-100" type="button" (click)="removeItem(i)" [disabled]="items.length === 1">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <button class="btn btn-outline-secondary" type="button" (click)="addItem()">
            <i class="bi bi-plus-lg me-2"></i>Agregar producto
          </button>
          <div class="fw-bold">Total estimado: {{ estimatedTotal() | currency:'COP':'symbol':'1.0-0' }}</div>
          <button class="btn btn-primary" [disabled]="form.invalid">Crear pedido</button>
        </div>
      </form>
    </app-modal>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Pagado</th><th>Pendiente</th><th>Estado</th><th>Fecha</th><th>Vence</th><th class="text-end">Acciones</th></tr></thead>
          <tbody>
            <tr *ngFor="let order of orders()">
              <td class="fw-semibold">#{{ order.id }}</td>
              <td>{{ order.customerName }}</td>
              <td>{{ order.total | currency:'COP':'symbol':'1.0-0' }}</td>
              <td>{{ order.amountPaid | currency:'COP':'symbol':'1.0-0' }}</td>
              <td>{{ order.pendingAmount | currency:'COP':'symbol':'1.0-0' }}</td>
              <td><app-status-badge [status]="order.status" /></td>
              <td>{{ order.createdAt | date:'mediumDate' }}</td>
              <td>
                <ng-container *ngIf="order.dueDate; else noDate">
                  <span
                    class="badge rounded-pill"
                    [class.text-bg-danger]="isOverdue(order)"
                    [class.text-bg-warning]="isDueSoon(order)"
                    [class.text-bg-secondary]="!isOverdue(order) && !isDueSoon(order)"
                  >
                    {{ order.dueDate | date:'mediumDate' }}
                  </span>
                </ng-container>
                <ng-template #noDate>-</ng-template>
              </td>
              <td class="text-end">
                <a
                  *ngIf="order.customerPhone"
                  class="btn btn-sm btn-outline-success"
                  title="Enviar por WhatsApp"
                  [href]="whatsAppLink(order)"
                  target="_blank"
                  rel="noopener"
                >
                  <i class="bi bi-whatsapp"></i>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class OrdersComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly orders = signal<Order[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly products = signal<Product[]>([]);
  readonly showForm = signal(false);

  readonly form = this.fb.nonNullable.group({
    customerId: [0, [Validators.required, Validators.min(1)]],
    paymentMethod: ['cash', Validators.required],
    discount: [0, [Validators.min(0)]],
    amountPaid: [0, [Validators.min(0)]],
    dueDate: [''],
    items: this.fb.array([this.createItemGroup()])
  });

  constructor() {
    this.load();
    this.api.get<PaginatedResult<Customer>>('/customers', { limit: 100 }).subscribe((result) => this.customers.set(result.items));
    this.api.get<PaginatedResult<Product>>('/products', { active: true, limit: 100 }).subscribe((result) => this.products.set(result.items));
  }

  get items(): FormArray {
    return this.form.controls.items;
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  estimatedTotal(): number {
    const subtotal = this.items.controls.reduce((sum, control) => {
      const product = this.products().find((item) => item.id === control.value.productId);
      return sum + (product?.salePrice || 0) * Number(control.value.quantity || 0);
    }, 0);

    return Math.max(subtotal - Number(this.form.controls.discount.value || 0), 0);
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    const payload = { ...this.form.getRawValue(), dueDate: this.form.controls.dueDate.value || null };

    this.api.post<Order>('/orders', payload).subscribe(() => {
      this.form.reset({ customerId: 0, paymentMethod: 'cash', discount: 0, amountPaid: 0, dueDate: '' });
      this.items.clear();
      this.addItem();
      this.showForm.set(false);
      this.load();
    });
  }

  isOverdue(order: Order): boolean {
    if (!order.dueDate || Number(order.pendingAmount) <= 0) {
      return false;
    }

    return new Date(order.dueDate) < this.startOfToday();
  }

  isDueSoon(order: Order): boolean {
    if (!order.dueDate || Number(order.pendingAmount) <= 0 || this.isOverdue(order)) {
      return false;
    }

    const diffDays = Math.round((new Date(order.dueDate).getTime() - this.startOfToday().getTime()) / 86400000);
    return diffDays <= 3;
  }

  whatsAppLink(order: Order): string {
    const statusLabels: Record<string, string> = {
      pending: 'pendiente',
      in_production: 'en producción',
      shipped: 'enviado',
      delivered: 'entregado',
      cancelled: 'cancelado'
    };

    const money = (value: number) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

    let message = `Hola ${order.customerName}, tu pedido #${order.id} está ${statusLabels[order.status] || order.status}. Total: ${money(order.total)}.`;

    if (Number(order.pendingAmount) > 0) {
      message += ` Saldo pendiente: ${money(order.pendingAmount)}.`;
    }

    return buildWhatsAppLink(order.customerPhone!, message);
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private load(): void {
    this.api.get<PaginatedResult<Order>>('/orders', { limit: 50 }).subscribe((result) => {
      this.orders.set(result.items);
    });
  }

  private createItemGroup() {
    return this.fb.nonNullable.group({
      productId: [0, [Validators.required, Validators.min(1)]],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }
}

