import { pool } from '../models/db.js';

export async function getTransactions(req, res) {
  const { from, to, types } = req.query;
  let startDate = from || new Date().toISOString().slice(0, 10);
  let endDate = to || new Date().toISOString().slice(0, 10);
  let typeArr = Array.isArray(types) ? types : (types ? [types] : []);
  const results = [];

  // Sales
  if (typeArr.length === 0 || typeArr.includes('sale-retail') || typeArr.includes('sale-wholesale')) {
    let saleTypeFilter = '';
    if (typeArr.includes('sale-retail') && !typeArr.includes('sale-wholesale')) saleTypeFilter = "AND s.status = 'completed'";
    if (typeArr.includes('sale-wholesale') && !typeArr.includes('sale-retail')) saleTypeFilter = "AND s.status = 'pending'";
    // If both retail and wholesale selected, no filter (show all)
    const [sales] = await pool.query(
      `SELECT s.date, 'sale' as type, s.id as ref_id, s.total_amount as amount, c.name as customer, s.status
       FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
       WHERE DATE(s.date) >= ? AND DATE(s.date) <= ? ${saleTypeFilter}
       ORDER BY s.date DESC`,
      [startDate, endDate]
    );
    for (const sale of sales) {
      results.push({
        date: sale.date,
        type: sale.status === 'pending' ? 'sale-wholesale' : 'sale-retail',
        description: `Sale to ${sale.customer || 'N/A'} (ID: ${sale.ref_id})`,
        amount: sale.amount,
        ref_id: sale.ref_id
      });
    }
  }

  // Purchases
  if (typeArr.length === 0 || typeArr.includes('purchase')) {
    const [purchases] = await pool.query(
      `SELECT p.date, 'purchase' as type, p.id as ref_id, p.total_cost as amount, s.name as supplier
       FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE DATE(p.date) >= ? AND DATE(p.date) <= ?
       ORDER BY p.date DESC`,
      [startDate, endDate]
    );
    for (const purchase of purchases) {
      results.push({
        date: purchase.date,
        type: 'purchase',
        description: `Purchase from ${purchase.supplier || 'N/A'} (ID: ${purchase.ref_id})`,
        amount: purchase.amount,
        ref_id: purchase.ref_id
      });
    }
  }

  // Payments received from customers
  if (typeArr.length === 0 || typeArr.includes('payment-received')) {
    const [payments] = await pool.query(
      `SELECT pay.date, 'payment-received' as type, pay.id as ref_id, pay.amount, c.name as customer
       FROM payments pay LEFT JOIN customers c ON pay.customer_id = c.id
       WHERE DATE(pay.date) >= ? AND DATE(pay.date) <= ?
       ORDER BY pay.date DESC`,
      [startDate, endDate]
    );
    for (const payment of payments) {
      results.push({
        date: payment.date,
        type: 'payment-received',
        description: `Payment received from ${payment.customer || 'N/A'} (ID: ${payment.ref_id})`,
        amount: payment.amount,
        ref_id: payment.ref_id
      });
    }
  }

  // Payments sent to suppliers
  if (typeArr.length === 0 || typeArr.includes('payment-sent')) {
    const [payments] = await pool.query(
      `SELECT pay.date, 'payment-sent' as type, pay.id as ref_id, pay.amount, s.name as supplier
       FROM payments pay LEFT JOIN suppliers s ON pay.supplier_id = s.id
       WHERE DATE(pay.date) >= ? AND DATE(pay.date) <= ?
       ORDER BY pay.date DESC`,
      [startDate, endDate]
    );
    for (const payment of payments) {
      results.push({
        date: payment.date,
        type: 'payment-sent',
        description: `Payment sent to ${payment.supplier || 'N/A'} (ID: ${payment.ref_id})`,
        amount: payment.amount,
        ref_id: payment.ref_id
      });
    }
  }

  res.json(results);
}

export async function getDetailedTransactions(req, res) {
  const { from, to, types } = req.query;
  let startDate = from || new Date().toISOString().slice(0, 10);
  let endDate = to || new Date().toISOString().slice(0, 10);
  let typeArr = Array.isArray(types) ? types : (types ? [types] : []);
  const results = [];

  try {
    // Sales with detailed items
    if (typeArr.length === 0 || typeArr.includes('sale-retail') || typeArr.includes('sale-wholesale')) {
      let saleTypeFilter = '';
      if (typeArr.includes('sale-retail') && !typeArr.includes('sale-wholesale')) saleTypeFilter = "AND s.status = 'completed'";
      if (typeArr.includes('sale-wholesale') && !typeArr.includes('sale-retail')) saleTypeFilter = "AND s.status = 'pending'";

      const [sales] = await pool.query(
        `SELECT s.id, s.date, s.total_amount, s.status, c.name as customer_name, c.phone as customer_phone
         FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
         WHERE DATE(s.date) >= ? AND DATE(s.date) <= ? ${saleTypeFilter}
         ORDER BY s.date DESC`,
        [startDate, endDate]
      );

      for (const sale of sales) {
        // Get sale items
        const [items] = await pool.query(`
          SELECT si.quantity, si.price, si.item_discount_value, si.item_discount_type, p.name as product_name, p.id as product_id
          FROM sale_items si 
          LEFT JOIN products p ON si.product_id = p.id 
          WHERE si.sale_id = ?
        `, [sale.id]);

        results.push({
          id: sale.id,
          date: sale.date,
          type: sale.status === 'pending' ? 'sale-wholesale' : 'sale-retail',
          description: `Sale to ${sale.customer_name || 'Walk-in Customer'}`,
          amount: sale.total_amount,
          customer_name: sale.customer_name,
          customer_phone: sale.customer_phone,
          status: sale.status,
          items: items.map(item => ({
            product_name: item.product_name,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            discount_value: item.item_discount_value,
            discount_type: item.item_discount_type,
            total: (item.quantity * item.price) - (item.item_discount_value || 0)
          }))
        });
      }
    }

    // Purchases with detailed items
    if (typeArr.length === 0 || typeArr.includes('purchase')) {
      const [purchases] = await pool.query(
        `SELECT p.id, p.date, p.total_cost, s.name as supplier_name, s.contact_info as supplier_contact
         FROM purchases p LEFT JOIN suppliers s ON p.supplier_id = s.id
         WHERE DATE(p.date) >= ? AND DATE(p.date) <= ?
         ORDER BY p.date DESC`,
        [startDate, endDate]
      );

      for (const purchase of purchases) {
        // Get purchase items
        const [items] = await pool.query(`
          SELECT pi.quantity, pi.cost_price, p.name as product_name, p.id as product_id
          FROM purchase_items pi 
          LEFT JOIN products p ON pi.product_id = p.id 
          WHERE pi.purchase_id = ?
        `, [purchase.id]);

        results.push({
          id: purchase.id,
          date: purchase.date,
          type: 'purchase',
          description: `Purchase from ${purchase.supplier_name || 'Unknown Supplier'}`,
          amount: purchase.total_cost,
          supplier_name: purchase.supplier_name,
          supplier_contact: purchase.supplier_contact,
          items: items.map(item => ({
            product_name: item.product_name,
            product_id: item.product_id,
            quantity: item.quantity,
            cost_price: item.cost_price,
            total: item.quantity * item.cost_price
          }))
        });
      }
    }

    // Payments sent to suppliers (only type available in current schema)
    if (typeArr.length === 0 || typeArr.includes('payment-sent')) {
      const [payments] = await pool.query(
        `SELECT pay.id, pay.date, pay.amount, pay.description, s.name as supplier_name, s.contact_info as supplier_contact
         FROM payments pay LEFT JOIN suppliers s ON pay.supplier_id = s.id
         WHERE DATE(pay.date) >= ? AND DATE(pay.date) <= ?
         ORDER BY pay.date DESC`,
        [startDate, endDate]
      );

      for (const payment of payments) {
        results.push({
          id: payment.id,
          date: payment.date,
          type: 'payment-sent',
          description: `Payment sent to ${payment.supplier_name || 'Unknown Supplier'}`,
          amount: payment.amount,
          supplier_name: payment.supplier_name,
          supplier_contact: payment.supplier_contact,
          payment_description: payment.description || 'Payment to supplier'
        });
      }
    }

    // Sort by date (newest first)
    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      transactions: results,
      summary: {
        total_transactions: results.length,
        total_sales: results.filter(t => t.type.includes('sale')).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        total_purchases: results.filter(t => t.type === 'purchase').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        total_payments_sent: results.filter(t => t.type === 'payment-sent').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        date_range: { from: startDate, to: endDate }
      }
    });
  } catch (error) {
    console.error('Error fetching detailed transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
}