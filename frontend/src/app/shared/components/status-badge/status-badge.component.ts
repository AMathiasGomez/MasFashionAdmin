import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge rounded-pill" [class]="badgeClass">{{ label }}</span>`
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';

  get label(): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      in_production: 'En produccion',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      income: 'Ingreso',
      expense: 'Gasto',
      in: 'Entrada',
      out: 'Salida',
      sale: 'Venta',
      return: 'Devolucion',
      adjustment: 'Ajuste'
    };

    return labels[this.status] || this.status;
  }

  get badgeClass(): string {
    const classes: Record<string, string> = {
      pending: 'text-bg-warning',
      in_production: 'text-bg-info',
      shipped: 'text-bg-primary',
      delivered: 'text-bg-success',
      cancelled: 'text-bg-danger',
      income: 'text-bg-success',
      expense: 'text-bg-danger',
      in: 'text-bg-success',
      out: 'text-bg-danger',
      sale: 'text-bg-primary',
      return: 'text-bg-info',
      adjustment: 'text-bg-secondary'
    };

    return classes[this.status] || 'text-bg-secondary';
  }
}

