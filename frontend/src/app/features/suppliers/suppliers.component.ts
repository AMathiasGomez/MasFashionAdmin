import { NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { Supplier } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [NgFor, NgIf, PageHeaderComponent, ReactiveFormsModule],
  template: `
    <app-page-header title="Proveedores" subtitle="Contactos para productos e insumos">
      <button class="btn btn-primary" type="button" (click)="startCreate()">
        <i class="bi bi-plus-lg me-2"></i>Proveedor
      </button>
    </app-page-header>

    <section class="app-card p-3 mb-3" *ngIf="showForm()">
      <form class="row g-3" [formGroup]="form" (ngSubmit)="save()">
        <div class="col-md-3">
          <label class="form-label">Nombre</label>
          <input class="form-control" formControlName="name">
        </div>
        <div class="col-md-2">
          <label class="form-label">Telefono</label>
          <input class="form-control" formControlName="phone">
        </div>
        <div class="col-md-3">
          <label class="form-label">Correo</label>
          <input class="form-control" formControlName="email">
        </div>
        <div class="col-md-4">
          <label class="form-label">Direccion</label>
          <input class="form-control" formControlName="address">
        </div>
        <div class="col-12">
          <label class="form-label">Notas</label>
          <textarea class="form-control" rows="2" formControlName="notes"></textarea>
        </div>
        <div class="col-12 d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" type="button" (click)="cancel()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="form.invalid">
            {{ editingId() ? 'Actualizar proveedor' : 'Guardar proveedor' }}
          </button>
        </div>
      </form>
    </section>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Telefono</th>
              <th>Correo</th>
              <th>Direccion</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let supplier of suppliers()">
              <td class="fw-semibold">{{ supplier.name }}</td>
              <td>{{ supplier.phone || '-' }}</td>
              <td>{{ supplier.email || '-' }}</td>
              <td>{{ supplier.address || '-' }}</td>
              <td>
                <span class="badge rounded-pill" [class.text-bg-success]="supplier.active" [class.text-bg-secondary]="!supplier.active">
                  {{ supplier.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" type="button" title="Editar" (click)="edit(supplier)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-secondary" type="button" title="Cambiar estado" (click)="toggleStatus(supplier)">
                    <i class="bi" [class.bi-toggle-on]="supplier.active" [class.bi-toggle-off]="!supplier.active"></i>
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
export class SuppliersComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly suppliers = signal<Supplier[]>([]);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
    email: [''],
    address: [''],
    notes: [''],
    active: [true]
  });

  constructor() {
    this.load();
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', phone: '', email: '', address: '', notes: '', active: true });
    this.showForm.set(true);
  }

  edit(supplier: Supplier): void {
    this.editingId.set(supplier.id);
    this.form.setValue({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: '',
      active: Boolean(supplier.active)
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
      ? this.api.put<Supplier>(`/suppliers/${id}`, this.form.getRawValue())
      : this.api.post<Supplier>('/suppliers', this.form.getRawValue());

    request.subscribe(() => {
      this.cancel();
      this.load();
    });
  }

  toggleStatus(supplier: Supplier): void {
    this.api
      .patch<Supplier>(`/suppliers/${supplier.id}/status`, { active: !supplier.active })
      .subscribe(() => this.load());
  }

  private load(): void {
    this.api.get<PaginatedResult<Supplier>>('/suppliers', { limit: 100 }).subscribe((result) => {
      this.suppliers.set(result.items);
    });
  }
}

