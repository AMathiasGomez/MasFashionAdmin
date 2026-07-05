import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { Product, Supplier, SupplyPurchase } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-supplies',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgFor, NgIf, PageHeaderComponent, ReactiveFormsModule],
  template: `
    <app-page-header title="Insumos" subtitle="Compras de tela, cierres, botones, etiquetas y otros materiales">
      <button class="btn btn-primary" type="button" (click)="showForm.set(!showForm())">
        <i class="bi bi-plus-lg me-2"></i>Compra
      </button>
    </app-page-header>

    <section class="app-card p-3 mb-3" *ngIf="showForm()">
      <form [formGroup]="form" (ngSubmit)="create()" class="d-grid gap-3">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Proveedor</label>
            <select class="form-select" formControlName="supplierId">
              <option [ngValue]="0">Seleccionar</option>
              <option *ngFor="let supplier of suppliers()" [ngValue]="supplier.id">{{ supplier.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Tipo</label>
            <select class="form-select" formControlName="supplyType">
              <option value="fabric">Tela</option>
              <option value="buttons">Botones</option>
              <option value="zippers">Cierres</option>
              <option value="labels">Etiquetas</option>
              <option value="other">Otros</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Cantidad</label>
            <input type="number" class="form-control" formControlName="quantity">
          </div>
          <div class="col-md-2">
            <label class="form-label">Costo unit.</label>
            <input type="number" class="form-control" formControlName="unitCost">
          </div>
          <div class="col-md-2">
            <label class="form-label">Fecha</label>
            <input type="date" class="form-control" formControlName="purchaseDate">
          </div>
        </div>

        <div formArrayName="products" class="d-grid gap-2">
          <div class="row g-2 align-items-end" *ngFor="let item of productLinks.controls; let i = index" [formGroupName]="i">
            <div class="col-md-8">
              <label class="form-label">Producto relacionado</label>
              <select class="form-select" formControlName="productId">
                <option [ngValue]="0">Seleccionar</option>
                <option *ngFor="let product of products()" [ngValue]="product.id">{{ product.name }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Cantidad usada</label>
              <input type="number" class="form-control" formControlName="quantityUsed">
            </div>
            <div class="col-md-1">
              <button class="btn btn-outline-danger w-100" type="button" (click)="removeProductLink(i)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <button class="btn btn-outline-secondary" type="button" (click)="addProductLink()">
            <i class="bi bi-link-45deg me-2"></i>Relacionar producto
          </button>
          <div class="fw-bold">Total: {{ totalCost() | currency:'COP':'symbol':'1.0-0' }}</div>
          <button class="btn btn-primary" [disabled]="form.invalid">Guardar compra</button>
        </div>
      </form>
    </section>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Proveedor</th><th>Tipo</th><th>Cantidad</th><th>Costo unitario</th><th>Total</th><th>Fecha</th></tr></thead>
          <tbody>
            <tr *ngFor="let purchase of purchases()">
              <td class="fw-semibold">{{ purchase.supplierName }}</td>
              <td>{{ purchase.supplyType }}</td>
              <td>{{ purchase.quantity }}</td>
              <td>{{ purchase.unitCost | currency:'COP':'symbol':'1.0-0' }}</td>
              <td>{{ purchase.totalCost | currency:'COP':'symbol':'1.0-0' }}</td>
              <td>{{ purchase.purchaseDate | date:'mediumDate' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class SuppliesComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly purchases = signal<SupplyPurchase[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly products = signal<Product[]>([]);
  readonly showForm = signal(false);

  readonly form = this.fb.nonNullable.group({
    supplierId: [0, [Validators.required, Validators.min(1)]],
    supplyType: ['fabric', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.01)]],
    unitCost: [0, [Validators.required, Validators.min(0)]],
    purchaseDate: [new Date().toISOString().slice(0, 10), Validators.required],
    observations: [''],
    products: this.fb.array([])
  });

  constructor() {
    this.load();
    this.api.get<PaginatedResult<Supplier>>('/suppliers', { active: true, limit: 100 }).subscribe((result) => this.suppliers.set(result.items));
    this.api.get<PaginatedResult<Product>>('/products', { active: true, limit: 100 }).subscribe((result) => this.products.set(result.items));
  }

  get productLinks(): FormArray {
    return this.form.controls.products;
  }

  addProductLink(): void {
    this.productLinks.push(
      this.fb.nonNullable.group({
        productId: [0, [Validators.required, Validators.min(1)]],
        quantityUsed: [1, [Validators.required, Validators.min(0.01)]]
      })
    );
  }

  removeProductLink(index: number): void {
    this.productLinks.removeAt(index);
  }

  totalCost(): number {
    return Number(this.form.controls.quantity.value || 0) * Number(this.form.controls.unitCost.value || 0);
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.api.post<SupplyPurchase>('/supplies', this.form.getRawValue()).subscribe(() => {
      this.form.reset({
        supplierId: 0,
        supplyType: 'fabric',
        quantity: 1,
        unitCost: 0,
        purchaseDate: new Date().toISOString().slice(0, 10),
        observations: ''
      });
      this.productLinks.clear();
      this.showForm.set(false);
      this.load();
    });
  }

  private load(): void {
    this.api.get<PaginatedResult<SupplyPurchase>>('/supplies', { limit: 50 }).subscribe((result) => {
      this.purchases.set(result.items);
    });
  }
}

