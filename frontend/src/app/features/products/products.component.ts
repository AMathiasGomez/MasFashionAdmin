import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { Category, Product, Supplier } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CurrencyPipe, NgFor, NgIf, PageHeaderComponent, ReactiveFormsModule],
  template: `
    <app-page-header title="Productos" subtitle="Catalogo, precios, costos y stock">
      <button class="btn btn-primary" type="button" (click)="showForm.set(!showForm())">
        <i class="bi bi-plus-lg me-2"></i>Producto
      </button>
    </app-page-header>

    <section class="app-card p-3 mb-3" *ngIf="showForm()">
      <form class="row g-3" [formGroup]="form" (ngSubmit)="create()">
        <div class="col-md-4">
          <label class="form-label">Nombre</label>
          <input class="form-control" formControlName="name">
        </div>
        <div class="col-md-3">
          <label class="form-label">Categoria</label>
          <select class="form-select" formControlName="categoryId">
            <option [ngValue]="0">Seleccionar</option>
            <option *ngFor="let category of categories()" [ngValue]="category.id">{{ category.name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Proveedor</label>
          <select class="form-select" formControlName="supplierId">
            <option [ngValue]="null">Sin proveedor</option>
            <option *ngFor="let supplier of suppliers()" [ngValue]="supplier.id">{{ supplier.name }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">Talla</label>
          <input class="form-control" formControlName="size">
        </div>
        <div class="col-md-2">
          <label class="form-label">Color</label>
          <input class="form-control" formControlName="color">
        </div>
        <div class="col-md-2">
          <label class="form-label">Stock min.</label>
          <input type="number" class="form-control" formControlName="minStock">
        </div>
        <div class="col-md-3">
          <label class="form-label">Precio venta</label>
          <input type="number" class="form-control" formControlName="salePrice">
        </div>
        <div class="col-md-3">
          <label class="form-label">Costo fabricacion</label>
          <input type="number" class="form-control" formControlName="manufacturingCost">
        </div>
        <div class="col-md-3">
          <label class="form-label">Stock inicial</label>
          <input type="number" class="form-control" formControlName="stock">
        </div>
        <div class="col-md-3 d-flex align-items-end">
          <button class="btn btn-primary w-100" [disabled]="form.invalid">Guardar</button>
        </div>
      </form>
    </section>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoria</th>
              <th>Talla</th>
              <th>Color</th>
              <th>Precio</th>
              <th>Utilidad</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of products()">
              <td class="fw-semibold">{{ product.name }}</td>
              <td>{{ product.categoryName }}</td>
              <td>{{ product.size }}</td>
              <td>{{ product.color }}</td>
              <td>{{ product.salePrice | currency:'COP':'symbol':'1.0-0' }}</td>
              <td>{{ product.profit | currency:'COP':'symbol':'1.0-0' }} · {{ product.profitMargin }}%</td>
              <td>
                <span [class.text-danger]="product.isLowStock">{{ product.stock }}</span>
                <small class="text-muted">/ {{ product.minStock }}</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class ProductsComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly showForm = signal(false);

  readonly form = this.fb.nonNullable.group({
    categoryId: [0, [Validators.required, Validators.min(1)]],
    supplierId: this.fb.control<number | null>(null),
    name: ['', Validators.required],
    description: [''],
    size: ['', Validators.required],
    color: ['', Validators.required],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    manufacturingCost: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.min(0)]],
    minStock: [0, [Validators.required, Validators.min(0)]]
  });

  constructor() {
    this.load();
    this.api.get<Category[]>('/categories', { active: true }).subscribe((categories) => this.categories.set(categories));
    this.api
      .get<PaginatedResult<Supplier>>('/suppliers', { active: true, limit: 100 })
      .subscribe((result) => this.suppliers.set(result.items));
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.api.post<Product>('/products', this.form.getRawValue()).subscribe(() => {
      this.form.reset({
        categoryId: 0,
        supplierId: null,
        name: '',
        description: '',
        size: '',
        color: '',
        salePrice: 0,
        manufacturingCost: 0,
        stock: 0,
        minStock: 0
      });
      this.showForm.set(false);
      this.load();
    });
  }

  private load(): void {
    this.api.get<PaginatedResult<Product>>('/products', { limit: 50 }).subscribe((result) => {
      this.products.set(result.items);
    });
  }
}
