import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { Customer } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { buildWhatsAppLink } from '../../core/utils/whatsapp';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CurrencyPipe, NgFor, NgIf, ModalComponent, PageHeaderComponent, ReactiveFormsModule],
  template: `
    <app-page-header title="Clientes" subtitle="Historial de compras y clientes frecuentes">
      <button class="btn btn-primary" type="button" (click)="showForm.set(!showForm())">
        <i class="bi bi-person-plus me-2"></i>Cliente
      </button>
    </app-page-header>

    <app-modal title="Nuevo cliente" [open]="showForm()" (closed)="showForm.set(false)">
      <form class="row g-3" [formGroup]="form" (ngSubmit)="create()">
        <div class="col-md-3"><label class="form-label">Nombre</label><input class="form-control" formControlName="name"></div>
        <div class="col-md-3"><label class="form-label">Telefono</label><input class="form-control" formControlName="phone"></div>
        <div class="col-md-3"><label class="form-label">Instagram</label><input class="form-control" formControlName="instagram"></div>
        <div class="col-md-3"><label class="form-label">Direccion</label><input class="form-control" formControlName="address"></div>
        <div class="col-12"><button class="btn btn-primary" [disabled]="form.invalid">Guardar cliente</button></div>
      </form>
    </app-modal>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Cliente</th><th>Telefono</th><th>Instagram</th><th>Compras</th><th>Total gastado</th><th class="text-end">Acciones</th></tr></thead>
          <tbody>
            <tr *ngFor="let customer of customers()">
              <td class="fw-semibold">{{ customer.name }}</td>
              <td>{{ customer.phone || '-' }}</td>
              <td>{{ customer.instagram || '-' }}</td>
              <td>{{ customer.ordersCount }}</td>
              <td>{{ customer.totalSpent | currency:'COP':'symbol':'1.0-0' }}</td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <a
                    *ngIf="customer.phone"
                    class="btn btn-outline-success"
                    title="Avisar por WhatsApp"
                    [href]="whatsAppLink(customer)"
                    target="_blank"
                    rel="noopener"
                  >
                    <i class="bi bi-whatsapp"></i>
                  </a>
                  <button class="btn btn-outline-danger" type="button" title="Eliminar" (click)="remove(customer)">
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
export class CustomersComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly customers = signal<Customer[]>([]);
  readonly showForm = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
    instagram: [''],
    address: [''],
    notes: ['']
  });

  constructor() {
    this.load();
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.api.post<Customer>('/customers', this.form.getRawValue()).subscribe(() => {
      this.form.reset({ name: '', phone: '', instagram: '', address: '', notes: '' });
      this.showForm.set(false);
      this.load();
    });
  }

  remove(customer: Customer): void {
    if (!confirm(`¿Eliminar el cliente "${customer.name}"?`)) {
      return;
    }

    this.api.delete(`/customers/${customer.id}`).subscribe({
      next: () => this.load(),
      error: () => alert('No se puede eliminar: el cliente tiene pedidos registrados.')
    });
  }

  whatsAppLink(customer: Customer): string {
    const message = `Hola ${customer.name}, te escribimos de Más Fashion para contarte que tu producto ya está disponible.`;
    return buildWhatsAppLink(customer.phone!, message);
  }

  private load(): void {
    this.api.get<PaginatedResult<Customer>>('/customers', { limit: 50 }).subscribe((result) => {
      this.customers.set(result.items);
    });
  }
}
