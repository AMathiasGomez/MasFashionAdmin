import { NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Category } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [NgFor, NgIf, PageHeaderComponent, ReactiveFormsModule],
  template: `
    <app-page-header title="Categorias" subtitle="Clasificacion del catalogo de prendas">
      <button class="btn btn-primary" type="button" (click)="startCreate()">
        <i class="bi bi-plus-lg me-2"></i>Categoria
      </button>
    </app-page-header>

    <section class="app-card p-3 mb-3" *ngIf="showForm()">
      <form class="row g-3" [formGroup]="form" (ngSubmit)="save()">
        <div class="col-md-4">
          <label class="form-label">Nombre</label>
          <input class="form-control" formControlName="name">
        </div>
        <div class="col-md-5">
          <label class="form-label">Descripcion</label>
          <input class="form-control" formControlName="description">
        </div>
        <div class="col-md-3 d-flex align-items-end gap-2">
          <button class="btn btn-primary flex-fill" [disabled]="form.invalid">
            {{ editingId() ? 'Actualizar' : 'Guardar' }}
          </button>
          <button class="btn btn-outline-secondary icon-btn" type="button" title="Cancelar" (click)="cancel()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </form>
    </section>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let category of categories()">
              <td class="fw-semibold">{{ category.name }}</td>
              <td>{{ category.description || '-' }}</td>
              <td>
                <span class="badge rounded-pill" [class.text-bg-success]="category.active" [class.text-bg-secondary]="!category.active">
                  {{ category.active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="edit(category)">
                  <i class="bi bi-pencil"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class CategoriesComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    active: [true]
  });

  constructor() {
    this.load();
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', active: true });
    this.showForm.set(true);
  }

  edit(category: Category): void {
    this.editingId.set(category.id);
    this.form.setValue({
      name: category.name,
      description: category.description || '',
      active: Boolean(category.active)
    });
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const id = this.editingId();
    const request = id
      ? this.api.put<Category>(`/categories/${id}`, this.form.getRawValue())
      : this.api.post<Category>('/categories', this.form.getRawValue());

    request.subscribe(() => {
      this.cancel();
      this.load();
    });
  }

  private load(): void {
    this.api.get<Category[]>('/categories').subscribe((categories) => this.categories.set(categories));
  }
}

