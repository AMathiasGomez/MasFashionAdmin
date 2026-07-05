import { NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface ReportOption {
  type: 'inventory' | 'orders' | 'sales' | 'profits';
  label: string;
  description: string;
  icon: string;
  supportsDates: boolean;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [NgFor, NgIf, PageHeaderComponent, ReactiveFormsModule],
  template: `
    <app-page-header title="Reportes" subtitle="Exportaciones PDF y Excel" />

    <section class="app-card p-3 mb-3">
      <form class="row g-3" [formGroup]="filters">
        <div class="col-md-3">
          <label class="form-label">Desde</label>
          <input type="date" class="form-control" formControlName="from">
        </div>
        <div class="col-md-3">
          <label class="form-label">Hasta</label>
          <input type="date" class="form-control" formControlName="to">
        </div>
      </form>
    </section>

    <section class="row g-3">
      <div class="col-md-6 col-xl-3" *ngFor="let report of reports">
        <article class="app-card p-3 h-100 report-card">
          <i class="bi fs-2 mb-3 d-block" [class]="report.icon"></i>
          <h2>{{ report.label }}</h2>
          <p class="text-muted">{{ report.description }}</p>
          <div class="d-grid gap-2 mt-auto">
            <button class="btn btn-outline-secondary" type="button" (click)="download(report, 'xlsx')" [disabled]="loading()">
              <i class="bi bi-file-earmark-spreadsheet me-2"></i>Excel
            </button>
            <button class="btn btn-outline-secondary" type="button" (click)="download(report, 'pdf')" [disabled]="loading()">
              <i class="bi bi-file-earmark-pdf me-2"></i>PDF
            </button>
          </div>
        </article>
      </div>
    </section>

    <div class="alert alert-danger mt-3" *ngIf="error()">{{ error() }}</div>
  `,
  styles: [
    `
      .report-card {
        display: flex;
        flex-direction: column;
        min-height: 260px;
      }

      h2 {
        font-size: 1rem;
        font-weight: 800;
      }
    `
  ]
})
export class ReportsComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly filters = this.fb.nonNullable.group({
    from: [''],
    to: ['']
  });

  readonly reports: ReportOption[] = [
    {
      type: 'inventory',
      label: 'Inventario',
      description: 'Productos, precios, costos, margen y stock actual.',
      icon: 'bi-box-seam text-success',
      supportsDates: false
    },
    {
      type: 'orders',
      label: 'Pedidos',
      description: 'Pedidos, clientes, pagos, saldos y estados.',
      icon: 'bi-receipt text-primary',
      supportsDates: true
    },
    {
      type: 'sales',
      label: 'Ventas',
      description: 'Ventas mensuales, unidades vendidas y ganancia bruta.',
      icon: 'bi-graph-up-arrow text-success',
      supportsDates: true
    },
    {
      type: 'profits',
      label: 'Ganancias',
      description: 'Rentabilidad agrupada por producto vendido.',
      icon: 'bi-cash-coin text-warning',
      supportsDates: true
    }
  ];

  download(report: ReportOption, format: 'xlsx' | 'pdf'): void {
    this.loading.set(true);
    this.error.set('');

    const query = report.supportsDates ? this.filters.getRawValue() : {};

    this.api.download(`/reports/${report.type}/${format}`, query).subscribe({
      next: (blob) => {
        this.saveBlob(blob, `${report.type}.${format}`);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo generar el reporte.');
        this.loading.set(false);
      }
    });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

