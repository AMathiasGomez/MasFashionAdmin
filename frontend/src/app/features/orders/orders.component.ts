import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { Customer, Order, Product } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgFor, NgIf, PageHeaderComponent, ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <app-page-header title="Pedidos" subtitle="Seguimiento de ventas, estados y saldos">
      <button class="btn btn-primary" type="button" (click)="showForm.set(!showForm())">
        <i class="bi bi-plus-lg me-2"></i>Pedido
      </button>
    </app-page-header>

    <section class="app-card p-3 mb-3" *ngIf="showForm()">
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
    </section>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Pagado</th><th>Pendiente</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            <tr *ngFor="let order of orders()">
              <td class="fw-semibold">#{{ order.id }}</td>
              <td>{{ order.customerName }}</td>
              <td>{{ order.total | currency:'COP':'symbol':'1.0-0' }}</td>
              <td>{{ order.amountPaid | currency:'COP':'symbol':'1.0-0' }}</td>
              <td>{{ order.pendingAmount | currency:'COP':'symbol':'1.0-0' }}</td>
              <td><app-status-badge [status]="order.status" /></td>
              <td>{{ order.createdAt | date:'mediumDate' }}</td>
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

    this.api.post<Order>('/orders', this.form.getRawValue()).subscribe(() => {
      this.form.reset({ customerId: 0, paymentMethod: 'cash', discount: 0, amountPaid: 0 });
      this.items.clear();
      this.addItem();
      this.showForm.set(false);
      this.load();
    });
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

