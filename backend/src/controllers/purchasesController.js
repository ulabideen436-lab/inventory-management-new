import { pool } from '../models/db.js';

export async function createPurchase(req, res) {
  // Simplified purchase creation - only requires basic fields, no product items
  const { supplier_id, total_cost, description, supplier_invoice_id, delivery_method, purchase_date } = req.body;

  if (!supplier_id) {
    return res.status(400).json({ message: 'Supplier is required' });
  }

  if (!total_cost || total_cost <= 0) {
    return res.status(400).json({ message: 'Valid purchase amount is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Prepare purchase date (use provided date or current date)
    const purchaseDate = purchase_date ? new Date(purchase_date) : new Date();

    // Insert simplified purchase with basic fields only
    const [purchaseResult] = await conn.query(
      `INSERT INTO purchases (supplier_id, total_cost, description, supplier_invoice_id, delivery_method, date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [supplier_id, Number(total_cost), description || null, supplier_invoice_id || null, delivery_method || null, purchaseDate]
    );

    const purchase_id = purchaseResult.insertId;

    // Update supplier balance (add total_cost)
    const [updateResult] = await conn.query(
      'UPDATE suppliers SET balance = balance + ? WHERE id = ?',
      [Number(total_cost), supplier_id]
    );

    console.log('Purchase: supplier_id', supplier_id, 'total_cost', total_cost, 'updateResult', updateResult);

    await conn.commit();
    res.json({
      message: 'Purchase created successfully',
      id: purchase_id,
      purchase_id,
      supplier_id,
      total_cost,
      description,
      supplier_invoice_id,
      delivery_method,
      purchase_date: purchaseDate
    });
  } catch (err) {
    await conn.rollback();
    console.error('Create Purchase Error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

export async function getPurchases(req, res) {
  try {
    const { supplier_id } = req.query;
    let query = 'SELECT * FROM purchases';
    let params = [];
    if (supplier_id) {
      query += ' WHERE supplier_id = ?';
      params.push(supplier_id);
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get Purchases Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getPurchaseById(req, res) {
  try {
    const { id } = req.params;

    // Get purchase details
    const [purchaseRows] = await pool.query(
      'SELECT * FROM purchases WHERE id = ?',
      [id]
    );

    if (purchaseRows.length === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const purchase = purchaseRows[0];

    // Get purchase items with product details
    const [itemRows] = await pool.query(`
      SELECT 
        pi.*,
        p.name as product_name,
        p.retail_price,
        p.wholesale_price
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      WHERE pi.purchase_id = ?
    `, [id]);

    // Format the response with all fields needed for editing
    const response = {
      id: purchase.id,
      supplier_id: purchase.supplier_id,
      total_cost: purchase.total_cost,
      date: purchase.date, // Use purchase.date instead of created_at
      description: purchase.description || '',
      supplier_invoice_id: purchase.supplier_invoice_id || '',
      delivery_method: purchase.delivery_method || '',
      items: itemRows.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        cost_price: item.cost_price,
        retail_price: item.retail_price,
        wholesale_price: item.wholesale_price
      }))
    };

    res.json(response);
  } catch (err) {
    console.error('Get Purchase By ID Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updatePurchase(req, res) {
  const { id } = req.params;
  const { total_cost, description, supplier_invoice_id, delivery_method, purchase_date } = req.body;

  if (!total_cost || total_cost <= 0) {
    return res.status(400).json({ message: 'Valid purchase amount is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get current purchase details
    const [currentRows] = await conn.query('SELECT * FROM purchases WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const currentPurchase = currentRows[0];
    const costDifference = parseFloat(total_cost) - parseFloat(currentPurchase.total_cost);

    // Update purchase with simplified fields
    await conn.query(
      'UPDATE purchases SET total_cost = ?, description = ?, supplier_invoice_id = ?, delivery_method = ?, date = ? WHERE id = ?',
      [total_cost, description || currentPurchase.description, supplier_invoice_id || currentPurchase.supplier_invoice_id,
        delivery_method || currentPurchase.delivery_method, purchase_date ? new Date(purchase_date) : currentPurchase.date, id]
    );

    // Update supplier balance with the difference
    if (costDifference !== 0) {
      await conn.query(
        'UPDATE suppliers SET balance = balance + ? WHERE id = ?',
        [costDifference, currentPurchase.supplier_id]
      );
    }

    await conn.commit();
    res.json({
      message: 'Purchase updated successfully',
      purchase_id: id,
      total_cost,
      description,
      supplier_invoice_id,
      delivery_method,
      purchase_date
    });
  } catch (err) {
    await conn.rollback();
    console.error('Update Purchase Error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

export async function deletePurchase(req, res) {
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get purchase details before deletion
    const [purchaseRows] = await conn.query('SELECT * FROM purchases WHERE id = ?', [id]);
    if (purchaseRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const purchase = purchaseRows[0];

    // Update supplier balance (subtract the purchase amount)
    await conn.query(
      'UPDATE suppliers SET balance = balance - ? WHERE id = ?',
      [purchase.total_cost, purchase.supplier_id]
    );

    // Delete the purchase
    await conn.query('DELETE FROM purchases WHERE id = ?', [id]);

    await conn.commit();
    res.json({ message: 'Purchase deleted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Delete Purchase Error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

