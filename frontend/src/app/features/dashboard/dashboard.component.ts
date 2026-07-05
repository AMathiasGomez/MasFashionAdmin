import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { DashboardSummary } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, NgFor, NgIf, PageHeaderComponent],
  styleUrl: './dashboard.component.scss',
  template: `
    <app-page-header title="Dashboard" subtitle="Resumen operativo y financiero del negocio" />

    <div class="row g-3 mb-4" *ngIf="summary() as data">
      <div class="col-12 col-md-6 col-xl-3" *ngFor="let metric of metrics(data)">
        <div class="app-card metric-card p-3">
          <div class="d-flex align-items-center justify-content-between">
            <span class="text-muted">{{ metric.label }}</span>
            <i class="bi fs-5" [class]="metric.icon"></i>
          </div>
          <div class="metric-value mt-3">{{ metric.value }}</div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4" *ngIf="summary()">
      <div class="col-12 col-xl-7">
        <section class="app-card p-3 h-100">
          <h2>Ventas mensuales</h2>
          <canvas #salesChart height="120"></canvas>
        </section>
      </div>
      <div class="col-12 col-xl-5">
        <section class="app-card p-3 h-100">
          <h2>Productos mas vendidos</h2>
          <canvas #productsChart height="180"></canvas>
        </section>
      </div>
    </div>

    <div class="row g-3" *ngIf="summary() as data">
      <div class="col-12 col-xl-4">
        <section class="app-card p-3">
          <h2>Stock bajo</h2>
          <div class="list-row" *ngFor="let item of data.tables.lowStockProducts">
            <span>{{ item.name }}</span>
            <strong>{{ item.stock }}/{{ item.minStock }}</strong>
          </div>
          <p class="text-muted mb-0" *ngIf="!data.tables.lowStockProducts.length">Sin alertas.</p>
        </section>
      </div>
      <div class="col-12 col-xl-4">
        <section class="app-card p-3">
          <h2>Clientes frecuentes</h2>
          <div class="list-row" *ngFor="let item of data.tables.frequentCustomers">
            <span>{{ item.name }}</span>
            <strong>{{ item.totalSpent | currency:'COP':'symbol':'1.0-0' }}</strong>
          </div>
          <p class="text-muted mb-0" *ngIf="!data.tables.frequentCustomers.length">Sin compras registradas.</p>
        </section>
      </div>
      <div class="col-12 col-xl-4">
        <section class="app-card p-3">
          <h2>Pedidos pendientes</h2>
          <div class="list-row" *ngFor="let item of data.tables.pendingOrders">
            <span>#{{ item.id }} {{ item.customerName }}</span>
            <strong>{{ item.total | currency:'COP':'symbol':'1.0-0' }}</strong>
          </div>
          <p class="text-muted mb-0" *ngIf="!data.tables.pendingOrders.length">Todo al dia.</p>
        </section>
      </div>
    </div>
  `
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('salesChart') salesChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('productsChart') productsChartRef?: ElementRef<HTMLCanvasElement>;

  readonly summary = signal<DashboardSummary | null>(null);
  private salesChart?: Chart;
  private productsChart?: Chart;

  constructor(private readonly api: ApiService) {
    this.api.get<DashboardSummary>('/dashboard/summary').subscribe((summary) => {
      this.summary.set(summary);
      queueMicrotask(() => this.renderCharts());
    });
  }

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.salesChart?.destroy();
    this.productsChart?.destroy();
  }

  metrics(data: DashboardSummary): { label: string; value: string; icon: string }[] {
    return [
      { label: 'Ventas del mes', value: this.money(data.cards.monthSales), icon: 'bi-bag-check text-success' },
      { label: 'Ingresos recibidos', value: this.money(data.cards.monthIncome), icon: 'bi-cash text-success' },
      { label: 'Gastos', value: this.money(data.cards.monthExpenses), icon: 'bi-arrow-down-circle text-danger' },
      { label: 'Utilidad neta', value: this.money(data.cards.monthNetProfit), icon: 'bi-graph-up-arrow text-primary' }
    ];
  }

  private renderCharts(): void {
    const data = this.summary();

    if (!data || !this.salesChartRef || !this.productsChartRef) {
      return;
    }

    this.salesChart?.destroy();
    this.productsChart?.destroy();

    const salesConfig: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.charts.monthlySales.map((item) => item.month),
        datasets: [
          {
            label: 'Ventas',
            data: data.charts.monthlySales.map((item) => item.sales),
            borderColor: '#2f6f64',
            backgroundColor: 'rgba(47, 111, 100, 0.16)',
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    };

    const productsConfig: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.charts.bestSellingProducts.map((item) => item.name),
        datasets: [
          {
            label: 'Unidades',
            data: data.charts.bestSellingProducts.map((item) => item.unitsSold),
            backgroundColor: '#c87c5a'
          }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    };

    this.salesChart = new Chart(this.salesChartRef.nativeElement, salesConfig);
    this.productsChart = new Chart(this.productsChartRef.nativeElement, productsConfig);
  }

  private money(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value || 0);
  }
}

