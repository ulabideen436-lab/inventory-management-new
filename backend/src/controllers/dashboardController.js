import { pool } from '../models/db.js';

export const getDashboardStats = async (req, res) => {
    try {
        // Get total products count (excluding deleted)
        const [productCount] = await pool.query(
            'SELECT COUNT(*) as count FROM products WHERE deleted_at IS NULL'
        );

        // Get total customers count (excluding deleted)
        const [customerCount] = await pool.query(
            'SELECT COUNT(*) as count FROM customers WHERE deleted_at IS NULL'
        );

        // Get total sales count
        const [salesCount] = await pool.query(
            'SELECT COUNT(*) as count FROM sales'
        );

        // Get total revenue
        const [totalRevenue] = await pool.query(
            'SELECT COALESCE(SUM(total_amount), 0) as total FROM sales'
        );

        // Get today's sales
        const [todaySales] = await pool.query(
            'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales WHERE DATE(date) = CURDATE()'
        );

        // Get low stock products (stock <= 5)
        const [lowStockCount] = await pool.query(
            'SELECT COUNT(*) as count FROM products WHERE stock_quantity <= 5 AND deleted_at IS NULL'
        );

        // Get top selling products (last 30 days)
        const [topProducts] = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        SUM(si.quantity) as total_sold,
        SUM(si.quantity * si.price) as total_value
      FROM sale_items si 
      JOIN products p ON si.product_id = p.id 
      JOIN sales s ON si.sale_id = s.id 
      WHERE s.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY p.id, p.name 
      ORDER BY total_sold DESC 
      LIMIT 5
    `);

        // Get recent sales (last 10)
        const [recentSales] = await pool.query(`
      SELECT 
        s.id,
        s.total_amount,
        s.date as sale_date,
        CASE 
          WHEN s.customer_id IS NULL THEN 'Walk-in Customer'
          ELSE c.name
        END as customer_name
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      ORDER BY s.date DESC 
      LIMIT 10
    `);

        const stats = {
            total_products: productCount[0].count,
            total_customers: customerCount[0].count,
            total_sales: salesCount[0].count,
            total_revenue: parseFloat(totalRevenue[0].total) || 0,
            today_sales_count: todaySales[0].count,
            today_revenue: parseFloat(todaySales[0].revenue) || 0,
            low_stock_products: lowStockCount[0].count,
            top_products: topProducts,
            recent_sales: recentSales.map(sale => ({
                ...sale,
                total_amount: parseFloat(sale.total_amount) || 0
            }))
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};

export const getDashboardData = async (req, res) => {
    try {
        // Alternative endpoint name that might be expected
        return getDashboardStats(req, res);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};