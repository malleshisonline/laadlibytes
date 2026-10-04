import { Category } from '../category/category.model.js';
import { Enquiry } from '../enquiry/enquiry.model.js';
import { Order, ORDER_STATUSES } from '../order/order.model.js';
import { Product } from '../product/product.model.js';
import { User } from '../user/user.model.js';

/** Where "running low" starts, unless the caller sets its own line. */
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

/** Data access + business rules. Controllers stay free of Mongoose. */
export const adminService = {
  /**
   * The counts a dashboard home screen shows. Every figure is a countDocuments, so this stays one
   * round trip regardless of catalogue size — no documents are loaded.
   *
   * Out-of-stock and low-stock look at active products only: a soft-deleted product having no
   * stock is not something anyone needs to act on.
   */
  async summary({ lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD } = {}) {
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      outOfStockProducts,
      lowStockProducts,
      totalCategories,
      activeCategories,
      totalUsers,
      adminUsers,
      totalEnquiries,
      newEnquiries,
      ordersByStatus,
      unpaidOrders,
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, isFeatured: true }),
      Product.countDocuments({ isActive: true, stock: 0 }),
      Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: lowStockThreshold } }),
      Category.countDocuments({}),
      Category.countDocuments({ isActive: true }),
      User.countDocuments({}),
      User.countDocuments({ role: 'admin' }),
      Enquiry.countDocuments({}),
      Enquiry.countDocuments({ status: 'new' }),
      // One group per status rather than six countDocuments.
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      // Voided orders take no payment, so they are not waiting for one.
      Order.countDocuments({ status: { $ne: 'voided' }, paymentStatus: { $ne: 'paid' } }),
    ]);

    // Every status is present, at 0 when no order has it, so the dashboard need not guess.
    const orderCounts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
    ordersByStatus.forEach(({ _id, count }) => {
      orderCounts[_id] = count;
    });

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        // Inactive is both "unpublished" and "soft-deleted": isActive carries the two meanings.
        inactive: totalProducts - activeProducts,
        featured: featuredProducts,
        outOfStock: outOfStockProducts,
        lowStock: lowStockProducts,
        lowStockThreshold,
      },
      categories: {
        total: totalCategories,
        active: activeCategories,
        inactive: totalCategories - activeCategories,
      },
      users: {
        total: totalUsers,
        admins: adminUsers,
        customers: totalUsers - adminUsers,
      },
      enquiries: {
        total: totalEnquiries,
        new: newEnquiries,
      },
      orders: {
        total: Object.values(orderCounts).reduce((sum, count) => sum + count, 0),
        byStatus: orderCounts,
        unpaid: unpaidOrders,
      },
    };
  },
};

export default adminService;