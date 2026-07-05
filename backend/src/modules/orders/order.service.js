const orderModel = require('./order.model');
const { withTransaction } = require('../../config/database');
const { ApiError } = require('../../utils/api-error');

const listOrders = async (filters) => {
  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 10), 100);
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    orderModel.findAll({ ...filters, limit, offset }),
    orderModel.countAll(filters)
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getOrderById = async (id) => {
  const order = await orderModel.findById(id);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return order;
};

const createOrder = async (payload, user) =>
  withTransaction(async (connection) => {
    const customer = await orderModel.findCustomerById(payload.customerId, connection);

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    const items = [];

    for (const item of payload.items) {
      const product = await orderModel.findProductForUpdate(item.productId, connection);

      if (!product) {
        throw new ApiError(404, `Product not found: ${item.productId}`);
      }

      const quantity = Number(item.quantity);

      if (product.stock < quantity) {
        throw new ApiError(409, `Insufficient stock for product: ${product.name}`);
      }

      items.push({
        product,
        quantity,
        unitPrice: Number(product.sale_price),
        unitCost: Number(product.manufacturing_cost),
        subtotal: Number(product.sale_price) * quantity
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = Number(payload.discount || 0);

    if (discount > subtotal) {
      throw new ApiError(422, 'Discount cannot be greater than subtotal');
    }

    const total = subtotal - discount;
    const orderId = await orderModel.createOrder(
      {
        customerId: payload.customerId,
        userId: user.id,
        subtotal,
        discount,
        total,
        status: payload.status || 'pending',
        paymentMethod: payload.paymentMethod,
        deliveryAddress: payload.deliveryAddress || customer.address,
        observations: payload.observations || null
      },
      connection
    );

    for (const item of items) {
      await orderModel.createOrderItem(
        {
          orderId,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          subtotal: item.subtotal
        },
        connection
      );

      const previousStock = Number(item.product.stock);
      const newStock = previousStock - item.quantity;

      await orderModel.updateProductStock(item.product.id, newStock, connection);
      await orderModel.createInventoryMovement(
        {
          productId: item.product.id,
          userId: user.id,
          movementType: 'sale',
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Order #${orderId}`,
          referenceType: 'order',
          referenceId: orderId
        },
        connection
      );
    }

    const amountPaid = Number(payload.amountPaid || 0);

    if (amountPaid > total) {
      throw new ApiError(422, 'Initial payment cannot be greater than order total');
    }

    if (amountPaid > 0) {
      await orderModel.createPayment(
        {
          orderId,
          userId: user.id,
          amount: amountPaid,
          paymentMethod: payload.paymentMethod,
          notes: 'Initial payment'
        },
        connection
      );

      await orderModel.createFinancialTransaction(
        {
          type: 'income',
          category: 'sales',
          amount: amountPaid,
          description: `Initial payment for order #${orderId}`,
          referenceType: 'order',
          referenceId: orderId,
          transactionDate: new Date()
        },
        connection
      );
    }

    return orderModel.findById(orderId, connection);
  });

const updateStatus = async (id, status, user) =>
  withTransaction(async (connection) => {
    const order = await orderModel.findById(id, connection);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.status === status) {
      return order;
    }

    if (order.status === 'cancelled') {
      throw new ApiError(409, 'Cancelled orders cannot change status');
    }

    if (status === 'cancelled') {
      if (Number(order.amountPaid) > 0) {
        throw new ApiError(409, 'Orders with registered payments cannot be cancelled without a refund process');
      }

      for (const item of order.items) {
        const product = await orderModel.findProductForUpdate(item.productId, connection);

        if (!product) {
          throw new ApiError(404, `Product not found: ${item.productId}`);
        }

        const previousStock = Number(product.stock);
        const newStock = previousStock + Number(item.quantity);

        await orderModel.updateProductStock(item.productId, newStock, connection);
        await orderModel.createInventoryMovement(
          {
            productId: item.productId,
            userId: user.id,
            movementType: 'return',
            quantity: Number(item.quantity),
            previousStock,
            newStock,
            reason: `Cancelled order #${id}`,
            referenceType: 'order',
            referenceId: id
          },
          connection
        );
      }
    }

    await orderModel.updateStatus(id, status, connection);
    return orderModel.findById(id, connection);
  });

const addPayment = async (id, payload, user) =>
  withTransaction(async (connection) => {
    const order = await orderModel.findById(id, connection);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.status === 'cancelled') {
      throw new ApiError(409, 'Cannot add payments to a cancelled order');
    }

    const amount = Number(payload.amount);

    if (amount > Number(order.pendingAmount)) {
      throw new ApiError(422, 'Payment cannot be greater than pending amount');
    }

    await orderModel.createPayment(
      {
        orderId: id,
        userId: user.id,
        amount,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes || null
      },
      connection
    );

    await orderModel.createFinancialTransaction(
      {
        type: 'income',
        category: 'sales',
        amount,
        description: `Payment for order #${id}`,
        referenceType: 'order',
        referenceId: id,
        transactionDate: new Date()
      },
      connection
    );

    return orderModel.findById(id, connection);
  });

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateStatus,
  addPayment
};
