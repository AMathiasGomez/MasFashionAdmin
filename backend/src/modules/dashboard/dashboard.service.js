const dashboardModel = require('./dashboard.model');

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
    pendingOrders
  ] = await Promise.all([
    dashboardModel.getCards(period),
    dashboardModel.getMonthlySales(year),
    dashboardModel.getBestSellingProducts(period),
    dashboardModel.getLowStockProducts(),
    dashboardModel.getFrequentCustomers(),
    dashboardModel.getPendingOrders()
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
      pendingOrders
    }
  };
};

module.exports = {
  getSummary
};

