import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { Category, Product, ProductGroupSummary, Supplier } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CurrencyPipe, NgFor, NgIf, ModalComponent, PageHeaderComponent, ReactiveFormsModule],
  template: `
    <app-page-header title="Productos" subtitle="Catalogo, precios, costos y stock">
      <div class="d-flex gap-2">
        <div class="btn-group">
          <button
            class="btn btn-sm"
            [class.btn-primary]="view() === 'grouped'"
            [class.btn-outline-secondary]="view() !== 'grouped'"
            type="button"
            (click)="view.set('grouped')"
          >
            Por variantes
          </button>
          <button
            class="btn btn-sm"
            [class.btn-primary]="view() === 'list'"
            [class.btn-outline-secondary]="view() !== 'list'"
            type="button"
            (click)="view.set('list')"
          >
            Lista
          </button>
        </div>
        <button class="btn btn-primary" type="button" (click)="startCreate()">
          <i class="bi bi-plus-lg me-2"></i>Producto
        </button>
      </div>
    </app-page-header>

    <app-modal [title]="modalTitle()" [open]="showForm()" (closed)="showForm.set(false)">
      <form class="row g-3" [formGroup]="form" (ngSubmit)="create()">
        <div class="col-md-4">
          <label class="form-label">Nombre</label>
          <input class="form-control" formControlName="name" [readonly]="!!form.controls.groupId.value">
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
    </app-modal>

    <section class="app-card p-3" *ngIf="view() === 'grouped'">
      <div class="d-flex flex-column gap-3">
        <div class="border rounded-3 p-3" *ngFor="let group of groups()">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <div class="fw-semibold">
                {{ group.groupName }}
                <span class="badge rounded-pill text-bg-secondary ms-1">{{ group.variantCount }} variantes</span>
                <span class="badge rounded-pill text-bg-danger ms-1" *ngIf="group.hasLowStock">Stock bajo</span>
              </div>
              <small class="text-muted">
                {{ group.categoryName }} · Stock total {{ group.totalStock }} ·
                {{ group.minPrice | currency:'COP':'symbol':'1.0-0' }}
                <ng-container *ngIf="group.maxPrice !== group.minPrice"> - {{ group.maxPrice | currency:'COP':'symbol':'1.0-0' }}</ng-container>
              </small>
            </div>
            <button class="btn btn-sm btn-outline-secondary" type="button" (click)="addVariant(group)">
              <i class="bi bi-plus-lg me-1"></i>Variante
            </button>
          </div>

          <div class="table-responsive mt-3">
            <table class="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Talla</th>
                  <th>Color</th>
                  <th>Precio</th>
                  <th>Utilidad</th>
                  <th>Stock</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let variant of group.variants">
                  <td>{{ variant.size }}</td>
                  <td>{{ variant.color }}</td>
                  <td>{{ variant.salePrice | currency:'COP':'symbol':'1.0-0' }}</td>
                  <td>{{ variant.profit | currency:'COP':'symbol':'1.0-0' }} · {{ variant.profitMargin }}%</td>
                  <td>
                    <span [class.text-danger]="variant.isLowStock">{{ variant.stock }}</span>
                    <small class="text-muted">/ {{ variant.minStock }}</small>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" type="button" title="Eliminar" (click)="remove(variant)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p class="text-muted mb-0" *ngIf="!groups().length">No hay productos registrados.</p>
      </div>
    </section>

    <section class="app-card p-3" *ngIf="view() === 'list'">
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
              <th class="text-end">Acciones</th>
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
              <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" type="button" title="Eliminar" (click)="remove(product)">
                  <i class="bi bi-trash"></i>
                </button>
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

  readonly view = signal<'grouped' | 'list'>('grouped');
  readonly products = signal<Product[]>([]);
  readonly groups = signal<ProductGroupSummary[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly showForm = signal(false);
  readonly activeGroupName = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    groupId: this.fb.control<number | null>(null),
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

  modalTitle(): string {
    return this.activeGroupName() ? `Nueva variante · ${this.activeGroupName()}` : 'Nuevo producto';
  }

  startCreate(): void {
    this.activeGroupName.set(null);
    this.resetForm();
    this.showForm.set(true);
  }

  addVariant(group: ProductGroupSummary): void {
    const sample = group.variants[0];
    this.activeGroupName.set(group.groupName);
    this.form.reset({
      groupId: group.groupId,
      categoryId: group.categoryId,
      supplierId: sample?.supplierId ?? null,
      name: group.groupName,
      description: '',
      size: '',
      color: '',
      salePrice: sample?.salePrice ?? 0,
      manufacturingCost: sample?.manufacturingCost ?? 0,
      stock: 0,
      minStock: sample?.minStock ?? 0
    });
    this.showForm.set(true);
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.api.post<Product>('/products', this.form.getRawValue()).subscribe(() => {
      this.resetForm();
      this.showForm.set(false);
      this.load();
    });
  }

  remove(product: Product): void {
    if (!confirm(`¿Eliminar el producto "${product.name}"?`)) {
      return;
    }

    this.api.delete(`/products/${product.id}`).subscribe(() => this.load());
  }

  private resetForm(): void {
    this.form.reset({
      groupId: null,
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
  }

  private load(): void {
    this.api.get<PaginatedResult<Product>>('/products', { limit: 50 }).subscribe((result) => {
      this.products.set(result.items);
    });
    this.api.get<ProductGroupSummary[]>('/products/groups').subscribe((groups) => {
      this.groups.set(groups);
    });
  }
}
