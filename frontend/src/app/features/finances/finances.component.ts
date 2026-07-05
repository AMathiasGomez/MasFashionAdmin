import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaginatedResult } from '../../core/models/api-response.model';
import { FinancialTransaction } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgFor, NgIf, PageHeaderComponent, ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <app-page-header title="Finanzas" subtitle="Ingresos, gastos y utilidad del negocio">
      <button class="btn btn-primary" type="button" (click)="showForm.set(!showForm())">
        <i class="bi bi-plus-lg me-2"></i>Movimiento
      </button>
    </app-page-header>

    <section class="app-card p-3 mb-3" *ngIf="showForm()">
      <form class="row g-3" [formGroup]="form" (ngSubmit)="create()">
        <div class="col-md-2">
          <label class="form-label">Tipo</label>
          <select class="form-select" formControlName="type">
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Categoria</label>
          <input class="form-control" formControlName="category" placeholder="arriendo, publicidad, venta extra">
        </div>
        <div class="col-md-2">
          <label class="form-label">Monto</label>
          <input type="number" class="form-control" formControlName="amount">
        </div>
        <div class="col-md-2">
          <label class="form-label">Fecha</label>
          <input type="date" class="form-control" formControlName="transactionDate">
        </div>
        <div class="col-md-3">
          <label class="form-label">Descripcion</label>
          <input class="form-control" formControlName="description">
        </div>
        <div class="col-12">
          <button class="btn btn-primary" [disabled]="form.invalid">Guardar movimiento</button>
        </div>
      </form>
    </section>

    <section class="app-card p-3">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Tipo</th><th>Categoria</th><th>Monto</th><th>Descripcion</th><th>Fecha</th></tr></thead>
          <tbody>
            <tr *ngFor="let item of transactions()">
              <td><app-status-badge [status]="item.type" /></td>
              <td class="fw-semibold">{{ item.category }}</td>
              <td>{{ item.amount | currency:'COP':'symbol':'1.0-0' }}</td>
              <td>{{ item.description || '-' }}</td>
              <td>{{ item.transactionDate | date:'mediumDate' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class FinancesComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly transactions = signal<FinancialTransaction[]>([]);
  readonly showForm = signal(false);

  readonly form = this.fb.nonNullable.group({
    type: ['expense', Validators.required],
    category: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    description: [''],
    transactionDate: [new Date().toISOString().slice(0, 10), Validators.required]
  });

  constructor() {
    this.load();
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.api.post<FinancialTransaction>('/finances/transactions', this.form.getRawValue()).subscribe(() => {
      this.form.reset({
        type: 'expense',
        category: '',
        amount: 0,
        description: '',
        transactionDate: new Date().toISOString().slice(0, 10)
      });
      this.showForm.set(false);
      this.load();
    });
  }

  private load(): void {
    this.api.get<PaginatedResult<FinancialTransaction>>('/finances/transactions', { limit: 50 }).subscribe((result) => {
      this.transactions.set(result.items);
    });
  }
}

