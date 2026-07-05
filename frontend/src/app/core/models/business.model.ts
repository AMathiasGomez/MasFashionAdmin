export interface MetricCards {
  monthSales: number;
  monthIncome: number;
  monthExpenses: number;
  monthNetProfit: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export interface DashboardSummary {
  period: string;
  cards: MetricCards;
  charts: {
    monthlySales: MonthlySales[];
    bestSellingProducts: BestSellingProduct[];
  };
  tables: {
    lowStockProducts: LowStockProduct[];
    frequentCustomers: FrequentCustomer[];
    pendingOrders: PendingOrder[];
  };
}

export interface MonthlySales {
  month: string;
  sales: number;
  orders: number;
}

export interface BestSellingProduct {
  id: number;
  name: string;
  size: string;
  color: string;
  unitsSold: number;
  salesTotal: number;
  grossProfit: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  categoryName: string;
  size: string;
  color: string;
  stock: number;
  minStock: number;
}

export interface FrequentCustomer {
  id: number;
  name: string;
  phone: string | null;
  instagram: string | null;
  ordersCount: number;
  totalSpent: number;
}

export interface PendingOrder {
  id: number;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  supplierId: number | null;
  supplierName: string | null;
  name: string;
  size: string;
  color: string;
  salePrice: number;
  manufacturingCost: number;
  profit: number;
  profitMargin: number;
  stock: number;
  minStock: number;
  isLowStock: number;
  active: number;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  active: number;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  instagram: string | null;
  address: string | null;
  ordersCount: number;
  totalSpent: number;
}

export interface Order {
  id: number;
  customerName: string;
  total: number;
  amountPaid: number;
  pendingAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: number;
  productName: string;
  userName: string;
  movementType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdAt: string;
}

export interface SupplyPurchase {
  id: number;
  supplierName: string;
  supplyType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  purchaseDate: string;
}

export interface FinancialTransaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string | null;
  transactionDate: string;
}
