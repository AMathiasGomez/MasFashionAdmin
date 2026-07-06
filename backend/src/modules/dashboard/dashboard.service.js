const dashboardModel = require('./dashboard.model');
const { urgencyOf } = require('../../utils/receivables');

const getSummary = async (filters) => {
  const year = Number(filters.year || new Date().getFullYear());
  const month = Number(filters.month || new Date().getMonth() + 1);
  const period = `${year}-${String(month).padStart(2, '0')}`;

  const [
    cards,
    monthlySales,
    bestSellingProducts,
    lowStockProducts,
    frequentCustomers,
    pendingOrders,
    receivables
  ] = await Promise.all([
    dashboardModel.getCards(period),
    dashboardModel.getMonthlySales(year),
    dashboardModel.getBestSellingProducts(period),
    dashboardModel.getLowStockProducts(),
    dashboardModel.getFrequentCustomers(),
    dashboardModel.getPendingOrders(),
    dashboardModel.getReceivables()
  ]);

  return {
    period,
    cards,
    charts: {
      monthlySales,
      bestSellingProducts
    },
    tables: {
      lowStockProducts,
      frequentCustomers,
      pendingOrders,
      receivables: receivables.map((item) => ({ ...item, urgency: urgencyOf(item.dueDate) }))
    }
  };
};

const MIN_HISTORY_POINTS = 3;
const FORECAST_MONTHS = 3;

const addMonths = (yearMonth, offset) => {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const linearRegression = (values) => {
  const n = values.length;
  const sumX = values.reduce((sum, _, i) => sum + i, 0);
  const sumY = values.reduce((sum, v) => sum + v, 0);
  const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
  const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

const getSalesForecast = async () => {
  const history = await dashboardModel.getSalesHistory(12);

  if (history.length < MIN_HISTORY_POINTS) {
    return {
      history,
      projected: [],
      method: 'insufficient_history',
      message: 'Se necesitan al menos 3 meses de ventas para proyectar.'
    };
  }

  const values = history.map((item) => Number(item.sales));
  const { slope, intercept } = linearRegression(values);
  const lastMonth = history[history.length - 1].month;

  const projected = Array.from({ length: FORECAST_MONTHS }, (_, i) => {
    const index = values.length + i;
    const projectedSales = Math.max(0, Math.round(slope * index + intercept));

    return {
      month: addMonths(lastMonth, i + 1),
      projectedSales
    };
  });

  return {
    history,
    projected,
    method: 'linear_regression',
    trend: slope >= 0 ? 'up' : 'down'
  };
};

module.exports = {
  getSummary,
  getSalesForecast
};

