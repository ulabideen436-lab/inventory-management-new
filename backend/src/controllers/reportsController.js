import { pool } from '../models/db.js';

export async function getReports(req, res) {
  // Implementation for owner to get sales, supplier balances, purchase summaries


  try {
    // Sales summary: total sales, completed sales, pending sales, total amount
    const [salesSummary] = await pool.query(`
      SELECT status, COUNT(*) as count, SUM(total_amount) as total_amount
      FROM sales
      GROUP BY status
    `);

    // Customer type breakdown: retail vs wholesale sales
    const [customerTypeSummary] = await pool.query(`
      SELECT 
        customer_type,
        COUNT(*) as count, 
        SUM(total_amount) as total_amount
      FROM sales
      WHERE status = 'completed'
      GROUP BY customer_type
    `);

    // Purchase summary: total purchases, total amount
    const [purchaseSummary] = await pool.query(`
      SELECT COUNT(*) as count, SUM(total_cost) as total_amount
      FROM purchases
    `);

    // Supplier balances: id, name, balance
    const [supplierBalances] = await pool.query(`
      SELECT id, name, balance
      FROM suppliers
    `);

    res.json({
      sales_summary: salesSummary,
      customer_type_summary: customerTypeSummary,
      purchase_summary: purchaseSummary,
      supplier_balances: supplierBalances
    });
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function getDashboardStats(req, res) {
  try {
    // Get basic dashboard statistics
    const [totalProducts] = await pool.query('SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL');
    const [totalCustomers] = await pool.query('SELECT COUNT(*) as count FROM customers WHERE deleted_at IS NULL');
    const [totalSuppliers] = await pool.query('SELECT COUNT(*) as count FROM suppliers WHERE deleted_at IS NULL');
    const [totalSales] = await pool.query('SELECT COUNT(*) as count, SUM(total_amount) as revenue FROM sales WHERE deleted_at IS NULL');
    const [lowStockProducts] = await pool.query('SELECT COUNT(*) as count FROM products WHERE stock_quantity < 10 AND deleted_at IS NULL');

    res.json({
      products: totalProducts[0].count,
      customers: totalCustomers[0].count,
      suppliers: totalSuppliers[0].count,
      sales: totalSales[0].count,
      revenue: totalSales[0].revenue || 0,
      lowStock: lowStockProducts[0].count
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function getSalesReport(req, res) {
  try {
    const { start_date, end_date, date_from, date_to } = req.query;

    // Support both parameter naming conventions
    const startDate = start_date || date_from;
    const endDate = end_date || date_to;

    let query = `
      SELECT s.*, 
             s.date as sale_date,
             WHEN s.customer_id IS NULL THEN 'Walk-in Customer'
             ELSE c.name
           END as customer_name,
           COALESCE(s.cashier_name, u.username, 'Unknown') as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.cashier_id = u.id
    `;
    const params = [];
    const whereConditions = [];

    if (startDate) {
      whereConditions.push('DATE(s.date) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(s.date) <= ?');
      params.push(endDate);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY s.date DESC';

    const [sales] = await pool.query(query, params);

    // Calculate summary with proper error handling
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => {
      const amount = parseFloat(sale.total_amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Sales by day summary
    const salesByDay = {};
    sales.forEach(sale => {
      const day = sale.sale_date ? sale.sale_date.toISOString().split('T')[0] : 'Unknown';
      if (!salesByDay[day]) {
        salesByDay[day] = { count: 0, revenue: 0 };
      }
      salesByDay[day].count++;
      salesByDay[day].revenue += parseFloat(sale.total_amount) || 0;
    });

    res.json({
      success: true,
      data: {
        sales: sales.map(sale => ({
          ...sale,
          total_amount: parseFloat(sale.total_amount) || 0
        })),
        summary: {
          totalSales,
          totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
          averageSale: Math.round(averageSale * 100) / 100,
          period: {
            start_date: startDate,
            end_date: endDate,
            date_from: startDate,
            date_to: endDate
          }
        },
        salesByDay
      }
    });
  } catch (err) {
    console.error('getSalesReport error:', err);
    res.status(500).json({
      success: false,
      message: 'Error generating sales report',
      error: err.message
    });
  }
}

export async function getInventoryReport(req, res) {
  try {
    const [products] = await pool.query(`
      SELECT 
        id, name, brand, design_no, location, uom,
        retail_price, wholesale_price, cost_price,
        stock_quantity,
        (stock_quantity * cost_price) as inventory_value,
        CASE 
          WHEN stock_quantity <= 0 THEN 'Out of Stock'
          WHEN stock_quantity < 10 THEN 'Low Stock'
          WHEN stock_quantity < 50 THEN 'Medium Stock'
          ELSE 'Good Stock'
        END as stock_status
      FROM products 
      WHERE deleted_at IS NULL
      ORDER BY stock_quantity ASC
    `);

    // Calculate summary
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + parseFloat(product.inventory_value || 0), 0);
    const outOfStock = products.filter(p => p.stock_quantity <= 0).length;
    const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length;

    res.json({
      products,
      summary: {
        totalProducts,
        totalValue,
        outOfStock,
        lowStock
      }
    });
  } catch (err) {
    console.error('getInventoryReport error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
