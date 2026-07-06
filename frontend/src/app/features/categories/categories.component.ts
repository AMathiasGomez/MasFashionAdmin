import { NgFor } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Category } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [NgFor, ModalComponent, PageHeaderComponent, ReactiveFormsModule],
  template: `
    <app-page-header title="Categorias" subtitle="Clasificacion del catalogo de prendas">
      <button class="btn btn-primary" type="button" (click)="startCreate()">
        <i class="bi bi-plus-lg me-2"></i>Categoria
      </button>
    </app-page-header>

    <app-modal [title]="editingId() ? 'Editar categoria' : 'Nueva categoria'" [open]="showForm()" (closed)="cancel()">
      <form class="row g-3" [formGroup]="form" (ngSubmit)="save()">
        <div class="col-md-6">
          <label class="form-label">Nombre</label>
          <input class="form-control" formControlName="name">
        </div>
        <div class="col-md-6">
          <label class="form-label">Descripcion</label>
          <input class="form-control" formControlName="description">
        </div>
        <div class="col-12 d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" type="button" (click)="cancel()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="form.invalid">
            {{ editingId() ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
      </form>
    </app-modal>

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
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" type="button" title="Editar" (click)="edit(category)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger" type="button" title="Eliminar" (click)="remove(category)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
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

  remove(category: Category): void {
    if (!confirm(`¿Eliminar la categoria "${category.name}"?`)) {
      return;
    }

    this.api.delete(`/categories/${category.id}`).subscribe(() => this.load());
  }

  private load(): void {
    this.api.get<Category[]>('/categories').subscribe((categories) => this.categories.set(categories));
  }
}

