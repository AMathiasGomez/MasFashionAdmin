const reportModel = require('./report.model');
const { ApiError } = require('../../utils/api-error');
const { createExcelReport } = require('../../utils/excel');
const { createPdfReport } = require('../../utils/pdf');
const mailer = require('../../utils/mailer');
const env = require('../../config/env');

const reportConfig = {
  inventory: {
    title: 'Reporte de inventario',
    fetch: reportModel.getInventory,
    columns: [
      { header: 'Producto', key: 'name', width: 28 },
      { header: 'Categoria', key: 'categoryName', width: 18 },
      { header: 'Proveedor', key: 'supplierName', width: 22 },
      { header: 'Talla', key: 'size', width: 10 },
      { header: 'Color', key: 'color', width: 14 },
      { header: 'Precio venta', key: 'salePrice', width: 16 },
      { header: 'Costo fabricacion', key: 'manufacturingCost', width: 18 },
      { header: 'Utilidad', key: 'profit', width: 14 },
      { header: 'Margen %', key: 'profitMargin', width: 12 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Stock minimo', key: 'minStock', width: 14 }
    ]
  },
  orders: {
    title: 'Reporte de pedidos',
    fetch: reportModel.getOrders,
    columns: [
      { header: 'Pedido', key: 'id', width: 10 },
      { header: 'Cliente', key: 'customerName', width: 28 },
      { header: 'Vendedor', key: 'userName', width: 22 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Descuento', key: 'discount', width: 14 },
      { header: 'Total', key: 'total', width: 14 },
      { header: 'Pagado', key: 'amountPaid', width: 14 },
      { header: 'Pendiente', key: 'pendingAmount', width: 14 },
      { header: 'Estado', key: 'status', width: 18 },
      { header: 'Metodo pago', key: 'paymentMethod', width: 16 },
      { header: 'Fecha', key: 'createdAt', width: 22 }
    ]
  },
  sales: {
    title: 'Reporte de ventas',
    fetch: reportModel.getSales,
    columns: [
      { header: 'Mes', key: 'month', width: 12 },
      { header: 'Pedidos', key: 'ordersCount', width: 12 },
      { header: 'Unidades vendidas', key: 'unitsSold', width: 18 },
      { header: 'Ventas', key: 'salesTotal', width: 16 },
      { header: 'Ganancia bruta', key: 'grossProfit', width: 18 }
    ]
  },
  profits: {
    title: 'Reporte de ganancias',
    fetch: reportModel.getProfits,
    columns: [
      { header: 'Producto', key: 'productName', width: 28 },
      { header: 'Talla', key: 'size', width: 10 },
      { header: 'Color', key: 'color', width: 14 },
      { header: 'Unidades vendidas', key: 'unitsSold', width: 18 },
      { header: 'Ventas', key: 'salesTotal', width: 16 },
      { header: 'Costo total', key: 'costTotal', width: 16 },
      { header: 'Ganancia bruta', key: 'grossProfit', width: 18 }
    ]
  },
  profitability: {
    title: 'Reporte de rentabilidad por categoria',
    fetch: reportModel.getProfitabilityByCategory,
    columns: [
      { header: 'Categoria', key: 'categoryName', width: 24 },
      { header: 'Pedidos', key: 'ordersCount', width: 12 },
      { header: 'Unidades vendidas', key: 'unitsSold', width: 18 },
      { header: 'Ventas', key: 'salesTotal', width: 16 },
      { header: 'Costo total', key: 'costTotal', width: 16 },
      { header: 'Ganancia bruta', key: 'grossProfit', width: 18 },
      { header: 'Margen %', key: 'profitMargin', width: 12 }
    ]
  }
};

const exportReport = async (type, format, filters) => {
  const config = reportConfig[type];

  if (!config) {
    throw new ApiError(404, 'Report type not found');
  }

  const rows = await config.fetch(filters);
  const generatedAt = new Date();
  const baseFilename = `${type}-${generatedAt.toISOString().slice(0, 10)}`;

  if (format === 'xlsx') {
    return {
      buffer: await createExcelReport({
        title: config.title,
        columns: config.columns,
        rows,
        generatedAt
      }),
      filename: `${baseFilename}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  if (format === 'pdf') {
    return {
      buffer: await createPdfReport({
        title: config.title,
        columns: config.columns,
        rows,
        generatedAt
      }),
      filename: `${baseFilename}.pdf`,
      contentType: 'application/pdf'
    };
  }

  throw new ApiError(422, 'Report format is invalid');
};

const emailReport = async (type, format, filters, recipients) => {
  const targets = recipients?.length ? recipients : env.scheduledReport.recipients;

  if (!targets.length) {
    throw new ApiError(422, 'No recipient email addresses were provided or configured');
  }

  if (!mailer.isConfigured()) {
    throw new ApiError(500, 'Email is not configured on the server (missing SMTP settings)');
  }

  const report = await exportReport(type, format, filters);

  await mailer.sendReportEmail({
    to: targets,
    subject: `Reporte: ${type} (${new Date().toISOString().slice(0, 10)})`,
    text: 'Adjunto encontraras el reporte solicitado desde el panel administrativo.',
    attachment: {
      filename: report.filename,
      buffer: report.buffer,
      contentType: report.contentType
    }
  });

  return { sentTo: targets };
};

module.exports = {
  exportReport,
  emailReport
};

