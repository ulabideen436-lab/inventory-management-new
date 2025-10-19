import { pool } from '../models/db.js';

export async function createPayment(req, res) {
  const { supplier_id, customer_id, amount, description, payment_method, payment_date } = req.body;

  // Validate that either supplier_id or customer_id is provided, but not both
  if (!supplier_id && !customer_id) {
    return res.status(400).json({ message: 'Either supplier_id or customer_id is required' });
  }
  if (supplier_id && customer_id) {
    return res.status(400).json({ message: 'Cannot specify both supplier_id and customer_id' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Prepare payment date (use provided date or current date)
    const paymentDateTime = payment_date ? new Date(payment_date) : new Date();
    let payment_id; // Declare payment_id at function level

    if (supplier_id) {
      // Handle supplier payment (existing logic with new fields)
      const [paymentResult] = await conn.query(
        `INSERT INTO payments (supplier_id, amount, description, payment_method, payment_date, date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [supplier_id, amount, description || null, payment_method || null, paymentDateTime, paymentDateTime]
      );
      payment_id = paymentResult.insertId; // Assign without const
      // Update supplier balance (subtract amount - payment to supplier reduces their balance)
      await conn.query(
        'UPDATE suppliers SET balance = balance - ? WHERE id = ?',
        [amount, supplier_id]
      );
      console.log('Supplier payment recorded:', { supplier_id, amount, payment_method });
    } else {
      // Handle customer payment (new logic with new fields)
      const [paymentResult] = await conn.query(
        `INSERT INTO payments (customer_id, amount, description, payment_method, payment_date, date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [customer_id, amount, description || null, payment_method || null, paymentDateTime, paymentDateTime]
      );
      payment_id = paymentResult.insertId; // Assign without const
      // Update customer balance (subtract amount - payment from customer reduces their outstanding balance)
      await conn.query(
        'UPDATE customers SET balance = balance - ? WHERE id = ?',
        [amount, customer_id]
      );
      console.log('Customer payment recorded:', { customer_id, amount });
    }

    await conn.commit();
    res.json({
      message: supplier_id ? 'Supplier payment recorded' : 'Customer payment recorded',
      id: payment_id,
      paymentId: payment_id,
      supplier_id,
      customer_id,
      amount,
      description,
      payment_method,
      payment_date: paymentDateTime
    });
  } catch (err) {
    await conn.rollback();
    console.error('Create Payment Error - Full details:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
}

export async function getPayments(req, res) {
  try {
    const { supplier_id, customer_id } = req.query;
    let query = `
      SELECT p.*, 
             s.name as supplier_name,
             c.name as customer_name
      FROM payments p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN customers c ON p.customer_id = c.id
    `;
    let params = [];

    if (supplier_id) {
      query += ' WHERE p.supplier_id = ?';
      params.push(supplier_id);
    } else if (customer_id) {
      query += ' WHERE p.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY p.date DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get Payments Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getPayment(req, res) {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.*, 
             s.name as supplier_name,
             c.name as customer_name
      FROM payments p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Get Payment Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updatePayment(req, res) {
  const { id } = req.params;
  const { amount, description } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get current payment details
    const [currentRows] = await conn.query('SELECT * FROM payments WHERE id = ?', [id]);
    if (currentRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }

    const currentPayment = currentRows[0];
    const amountDifference = parseFloat(amount) - parseFloat(currentPayment.amount);

    // Update payment record
    await conn.query(
      'UPDATE payments SET amount = ?, description = ? WHERE id = ?',
      [amount, description || null, id]
    );

    // Adjust balances based on payment type
    if (currentPayment.supplier_id) {
      // Supplier payment - adjust supplier balance
      await conn.query(
        'UPDATE suppliers SET balance = balance - ? WHERE id = ?',
        [amountDifference, currentPayment.supplier_id]
      );
      console.log('Supplier payment updated:', {
        payment_id: id,
        supplier_id: currentPayment.supplier_id,
        old_amount: currentPayment.amount,
        new_amount: amount,
        difference: amountDifference
      });
    } else if (currentPayment.customer_id) {
      // Customer payment - adjust customer balance
      await conn.query(
        'UPDATE customers SET balance = balance - ? WHERE id = ?',
        [amountDifference, currentPayment.customer_id]
      );
      console.log('Customer payment updated:', {
        payment_id: id,
        customer_id: currentPayment.customer_id,
        old_amount: currentPayment.amount,
        new_amount: amount,
        difference: amountDifference
      });
    }

    await conn.commit();
    res.json({
      message: 'Payment updated successfully',
      payment_id: id,
      amount,
      description
    });
  } catch (err) {
    await conn.rollback();
    console.error('Update Payment Error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

export async function deletePayment(req, res) {
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get payment details before deletion
    const [paymentRows] = await conn.query('SELECT * FROM payments WHERE id = ?', [id]);
    if (paymentRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = paymentRows[0];

    // Update balance based on payment type
    if (payment.supplier_id) {
      // Supplier payment - add the amount back to balance (undo payment)
      await conn.query(
        'UPDATE suppliers SET balance = balance + ? WHERE id = ?',
        [payment.amount, payment.supplier_id]
      );
    } else if (payment.customer_id) {
      // Customer payment - subtract the amount from balance (undo payment)
      await conn.query(
        'UPDATE customers SET balance = balance - ? WHERE id = ?',
        [payment.amount, payment.customer_id]
      );
    }

    // Delete the payment
    await conn.query('DELETE FROM payments WHERE id = ?', [id]);

    await conn.commit();
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Delete Payment Error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

