import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { DashboardSummary, SalesForecast } from '../../core/models/business.model';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgFor, NgIf, PageHeaderComponent],
  styleUrl: './dashboard.component.scss',
  template: `
    <app-page-header title="Dashboard" subtitle="Resumen operativo y financiero del negocio" />

    <div class="row g-3 mb-4" *ngIf="summary() as data">
      <div class="col-12 col-md-6 col-xl-3" *ngFor="let metric of metrics(data)">
        <div class="app-card metric-card p-3">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <span class="text-muted metric-label">{{ metric.label }}</span>
            <span class="metric-icon-wrap" [class]="metric.tone">
              <i class="bi" [class]="metric.icon"></i>
            </span>
          </div>
          <div class="metric-value">{{ metric.value }}</div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4" *ngIf="summary()">
      <div class="col-12 col-xl-7">
        <section class="app-card p-3 h-100">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h2 class="mb-0">Ventas mensuales</h2>
            <span class="badge rounded-pill text-bg-secondary" *ngIf="forecast()?.method === 'linear_regression'">
              Proyección {{ forecast()!.trend === 'up' ? 'al alza' : 'a la baja' }}
            </span>
          </div>
          <canvas #salesChart height="120"></canvas>
          <p class="text-muted mb-0 mt-2" *ngIf="forecast()?.method === 'insufficient_history'">
            {{ forecast()!.message }}
          </p>
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
      <div class="col-12">
        <section class="app-card p-3">
          <h2>Cuentas por cobrar</h2>
          <div class="list-row" *ngFor="let item of data.tables.receivables">
            <span>
              #{{ item.id }} {{ item.customerName }}
              <span
                class="badge rounded-pill ms-2"
                [class.text-bg-danger]="item.urgency === 'overdue'"
                [class.text-bg-warning]="item.urgency === 'due_soon'"
                [class.text-bg-secondary]="item.urgency === 'upcoming' || item.urgency === 'no_date'"
              >
                {{ item.dueDate ? (item.dueDate | date:'mediumDate') : 'Sin fecha' }}
              </span>
            </span>
            <strong>{{ item.pendingAmount | currency:'COP':'symbol':'1.0-0' }}</strong>
          </div>
          <p class="text-muted mb-0" *ngIf="!data.tables.receivables.length">Sin saldos pendientes.</p>
        </section>
      </div>
    </div>
  `
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('salesChart') salesChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('productsChart') productsChartRef?: ElementRef<HTMLCanvasElement>;

  readonly summary = signal<DashboardSummary | null>(null);
  readonly forecast = signal<SalesForecast | null>(null);
  private salesChart?: Chart;
  private productsChart?: Chart;

  constructor(private readonly api: ApiService) {
    this.api.get<DashboardSummary>('/dashboard/summary').subscribe((summary) => {
      this.summary.set(summary);
      queueMicrotask(() => this.renderCharts());
    });
    this.api.get<SalesForecast>('/dashboard/forecast').subscribe((forecast) => {
      this.forecast.set(forecast);
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

  metrics(data: DashboardSummary): { label: string; value: string; icon: string; tone: string }[] {
    return [
      { label: 'Ventas del mes', value: this.money(data.cards.monthSales), icon: 'bi-graph-up-arrow', tone: 'ok' },
      { label: 'Ingresos recibidos', value: this.money(data.cards.monthIncome), icon: 'bi-wallet2', tone: 'primary' },
      { label: 'Gastos', value: this.money(data.cards.monthExpenses), icon: 'bi-arrow-down-circle', tone: 'warn' },
      { label: 'Utilidad neta', value: this.money(data.cards.monthNetProfit), icon: 'bi-cash-coin', tone: 'ok' }
    ];
  }

  private renderCharts(): void {
    const data = this.summary();

    if (!data || !this.salesChartRef || !this.productsChartRef) {
      return;
    }

    this.salesChart?.destroy();
    this.productsChart?.destroy();

    const forecast = this.forecast();
    const history = forecast?.history?.length ? forecast.history : data.charts.monthlySales;
    const projected = forecast?.projected || [];

    const labels = [...history.map((item) => item.month), ...projected.map((item) => item.month)];
    const historyValues = history.map((item) => Number(item.sales));
    const projectedValues: (number | null)[] = [
      ...history.slice(0, -1).map(() => null),
      ...(historyValues.length ? [historyValues[historyValues.length - 1]] : []),
      ...projected.map((item) => item.projectedSales)
    ];

    const salesConfig: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ventas',
            data: [...historyValues, ...projected.map(() => null)],
            borderColor: '#4A2A6B',
            backgroundColor: 'rgba(74, 42, 107, 0.14)',
            fill: true,
            tension: 0.35
          },
          {
            label: 'Proyeccion',
            data: projectedValues,
            borderColor: '#B65A78',
            borderDash: [6, 6],
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.35,
            pointStyle: 'circle'
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
            backgroundColor: '#B65A78'
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

