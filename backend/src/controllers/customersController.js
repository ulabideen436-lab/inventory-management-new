import { pool } from '../models/db.js';
import { softDeleteItem } from '../services/deletedItemsService.js';
import { validateCustomer } from '../utils/validation.js';

export async function addCustomerPayment(req, res) {
  const { id } = req.params;
  const { amount, description } = req.body;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Invalid payment amount' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert payment record into customer_payments table
    await conn.query(
      'INSERT INTO customer_payments (customer_id, amount, description, payment_date, created_at) VALUES (?, ?, ?, NOW(), NOW())',
      [id, amount, description || 'Payment received']
    );

    // Update customer's closing balance: Current balance - payment amount
    await conn.query(
      'UPDATE customers SET balance = balance - ? WHERE id = ?',
      [amount, id]
    );

    await conn.commit();
    res.json({ message: 'Payment recorded and balance updated' });
  } catch (err) {
    await conn.rollback();
    console.error('Customer payment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
}
export async function getCustomerById(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getCustomers(req, res) {
  try {
    // Basic filters
    const { search, include_deleted } = req.query;
    let where = '';
    let params = [];

    // Always exclude soft-deleted customers unless specifically requested
    if (include_deleted !== 'true') {
      where = ' WHERE deleted_at IS NULL';
    }

    if (search) {
      const searchCondition = where ? ' AND' : ' WHERE';
      where += `${searchCondition} (name LIKE ? OR brand_name LIKE ? OR phone LIKE ?)`;
      const term = `%${search}%`;
      params = [term, term, term];
    }

    // Get customers with calculated closing balance exactly like ledger
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.brand_name, c.contact, c.phone, c.email, c.address,
              c.opening_balance,
              c.opening_balance_type,
              c.credit_limit,
              c.type,
              c.created_at
       FROM customers c
       ${where}
       ORDER BY c.id DESC`,
      params
    );

    // Calculate balance for each customer exactly like ledger does
    const customersWithBalance = await Promise.all(rows.map(async (customer) => {
      // Start with opening balance
      let runningBalance = 0;

      // Handle opening balance based on type
      if (customer.opening_balance && customer.opening_balance > 0) {
        if (customer.opening_balance_type === 'credit') {
          runningBalance = -customer.opening_balance; // Credit balance is negative
        } else {
          runningBalance = customer.opening_balance; // Debit balance is positive
        }
      }

      // Add all sales (debits - customer owes money)
      const [sales] = await pool.query(
        'SELECT COALESCE(SUM(total_amount), 0) as total_sales FROM sales WHERE customer_id = ?',
        [customer.id]
      );
      runningBalance += sales[0].total_sales;

      // Subtract all payments (credits - customer paid money)
      const [payments] = await pool.query(
        'SELECT COALESCE(SUM(amount), 0) as total_payments FROM customer_payments WHERE customer_id = ?',
        [customer.id]
      );
      runningBalance -= payments[0].total_payments;

      return {
        ...customer,
        balance: runningBalance
      };
    }));

    // Format the results with proper balance display
    const reverseMapBalanceType = (type) => {
      if (type === 'debit') return 'Dr';
      if (type === 'credit') return 'Cr';
      return 'Dr'; // default
    };

    const sanitized = customersWithBalance.map(r => ({
      ...r,
      openingBalance: r.opening_balance,
      balanceType: reverseMapBalanceType(r.opening_balance_type),
      opening_balance_type: reverseMapBalanceType(r.opening_balance_type), // Ensure both fields are consistent
      // Format balance with proper sign and type - positive = Dr, negative = Cr
      formattedBalance: `PKR ${Math.abs(r.balance).toFixed(2)} ${r.balance >= 0 ? 'Dr' : 'Cr'}`
    }));

    res.json(sanitized);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function addCustomer(req, res) {
  // Validate and sanitize input
  const validation = validateCustomer(req.body);
  if (validation.errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  const { name, brand_name, contact, opening_balance, opening_balance_type, address, phone, email, credit_limit } = validation.sanitized; try {
    // Map frontend balance type abbreviations to database enum values
    const mapBalanceType = (type) => {
      if (type === 'Dr' || type === 'dr' || type === 'DR') return 'debit';
      if (type === 'Cr' || type === 'cr' || type === 'CR') return 'credit';
      if (type === 'debit' || type === 'credit') return type;
      return 'debit'; // default to debit
    };

    const [result] = await pool.query(
      `INSERT INTO customers (name, brand_name, contact, opening_balance, opening_balance_type, address, phone, email, credit_limit) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, brand_name || '', contact, opening_balance || 0, mapBalanceType(opening_balance_type), address || '', phone, email || '', credit_limit || null]
    );
    res.status(201).json({ message: 'Customer added', id: result.insertId });
  } catch (err) {
    console.error('Error adding customer:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Get customer ledger (transactions with running balance)
export async function getCustomerLedger(req, res) {
  const { id } = req.params;
  try {
    // Get customer details for opening balance
    const [customerRows] = await pool.query('SELECT opening_balance, opening_balance_type FROM customers WHERE id = ?', [id]);
    if (customerRows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = customerRows[0];
    const ledger = [];

    // Add opening balance entry
    if (parseFloat(customer.opening_balance || 0) > 0) {
      ledger.push({
        date: 'Opening',
        description: 'Opening Balance',
        type: customer.opening_balance_type === 'debit' ? 'Dr' : 'Cr',
        amount: parseFloat(customer.opening_balance)
      });
    }

    // Get all sales for this customer (debit entries - customer owes money)
    const [sales] = await pool.query(
      'SELECT id, DATE_FORMAT(date, "%Y-%m-%d") as date, total_amount as amount FROM sales WHERE customer_id = ? ORDER BY date',
      [id]
    );

    // Fetch items for each sale and format description
    for (const sale of sales) {
      // Get sale items
      const [saleItems] = await pool.query(
        `SELECT si.quantity, si.price,
                COALESCE(si.product_name, p.name, CONCAT('Unknown Product - [', si.product_id, ']')) as product_name
         FROM sale_items si
         LEFT JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?
         ORDER BY si.id`,
        [sale.id]
      );

      // Format items description
      let description = `Sale #${sale.id}`;
      if (saleItems.length > 0) {
        const itemsList = saleItems.map(item =>
          `${item.product_name} (${item.quantity} x PKR ${parseFloat(item.price).toFixed(2)})`
        ).join(', ');
        description = `Sale #${sale.id}: ${itemsList}`;
      }

      ledger.push({
        date: sale.date,
        description: description,
        type: 'Dr', // Sales are debit to customer (customer owes money)
        amount: parseFloat(sale.amount)
      });
    }    // Get all payments for this customer (credit entries - customer paid money)
    const [payments] = await pool.query(
      'SELECT DATE_FORMAT(created_at, "%Y-%m-%d") as date, description, amount FROM customer_payments WHERE customer_id = ? ORDER BY created_at',
      [id]
    );

    payments.forEach(payment => {
      ledger.push({
        date: payment.date,
        description: payment.description,
        type: 'Cr', // Payments are credit to customer (customer paid money)
        amount: parseFloat(payment.amount)
      });
    });

    // Sort ledger by date
    ledger.sort((a, b) => {
      if (a.date === 'Opening') return -1;
      if (b.date === 'Opening') return 1;
      return new Date(a.date) - new Date(b.date);
    });

    res.json(ledger);
  } catch (err) {
    console.error('Error fetching customer ledger:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Get customer payments 
export async function getCustomerPayments(req, res) {
  const { id } = req.params;
  try {
    const [payments] = await pool.query('SELECT * FROM customer_payments WHERE customer_id = ? ORDER BY payment_date DESC', [id]);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getCustomerPayment(req, res) {
  const { id, paymentId } = req.params;
  try {
    const [payments] = await pool.query('SELECT * FROM customer_payments WHERE id = ? AND customer_id = ?', [paymentId, id]);
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payments[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateCustomerPayment(req, res) {
  const { id, paymentId } = req.params;
  const { amount, description } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Invalid payment amount' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get current payment details
    const [currentRows] = await conn.query('SELECT * FROM customer_payments WHERE id = ? AND customer_id = ?', [paymentId, id]);
    if (currentRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }

    const currentPayment = currentRows[0];
    const amountDifference = parseFloat(amount) - parseFloat(currentPayment.amount);

    // Update payment record
    await conn.query(
      'UPDATE customer_payments SET amount = ?, description = ? WHERE id = ? AND customer_id = ?',
      [amount, description || 'Payment received', paymentId, id]
    );

    // Adjust customer balance: subtract the difference (negative difference increases balance)
    await conn.query(
      'UPDATE customers SET balance = balance - ? WHERE id = ?',
      [amountDifference, id]
    );

    console.log('Customer payment updated:', {
      payment_id: paymentId,
      customer_id: id,
      old_amount: currentPayment.amount,
      new_amount: amount,
      difference: amountDifference
    });

    await conn.commit();
    res.json({
      message: 'Payment updated successfully',
      payment_id: paymentId,
      amount,
      description
    });
  } catch (err) {
    await conn.rollback();
    console.error('Update Customer Payment Error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
}

// Comprehensive: get customer history with running balance calculation
export async function getCustomerHistory(req, res) {
  try {
    const { id } = req.params;

    // Get customer with opening balance
    const [customer] = await pool.query('SELECT id, name, brand_name, address, opening_balance, opening_balance_type FROM customers WHERE id = ?', [id]);
    if (customer.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    console.log(`Customer ${id} raw data:`, customer[0]);

    const history = [];

    // Start with opening balance calculation
    let runningBalance = 0;
    const openingAmount = parseFloat(customer[0].opening_balance || 0);
    const reverseMapBalanceType = (type) => {
      if (type === 'debit') return 'Dr';
      if (type === 'credit') return 'Cr';
      return 'Dr'; // default
    };

    const openingType = reverseMapBalanceType(customer[0].opening_balance_type);

    // Calculate initial running balance
    if (openingAmount !== 0) {
      if (openingType === 'Cr') {
        runningBalance = -openingAmount; // Credit is negative
      } else {
        runningBalance = openingAmount; // Debit is positive  
      }
    }

    // ALWAYS add opening balance entry
    history.push({
      date: '',
      created_at: '1900-01-01',
      trans_no: 'OPENING',
      doc: 'OPEN',
      description: 'Opening Balance',
      debit: openingType === 'Dr' ? openingAmount : 0,
      credit: openingType === 'Cr' ? openingAmount : 0,
      running_balance: runningBalance,
      transaction_type: 'opening'
    });

    console.log(`Opening balance: ${openingAmount} ${openingType}, running: ${runningBalance}`);

    // Get all sales (no date filtering for now)
    const [sales] = await pool.query(
      'SELECT id, date, total_amount FROM sales WHERE customer_id = ? ORDER BY date ASC',
      [id]
    );

    // Get all payments (no date filtering for now)
    const [payments] = await pool.query(
      'SELECT id, payment_date as date, amount, description FROM customer_payments WHERE customer_id = ? ORDER BY payment_date ASC',
      [id]
    );

    console.log(`Customer ${id}: Found ${sales.length} sales, ${payments.length} payments`);

    // Create transaction array
    const allTransactions = [];

    // Add sales with items details
    for (const sale of sales) {
      // Get sale items for this sale
      const [saleItems] = await pool.query(
        `SELECT si.quantity, si.price,
                COALESCE(si.product_name, p.name, CONCAT('Unknown Product - [', si.product_id, ']')) as product_name
         FROM sale_items si
         LEFT JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?
         ORDER BY si.id`,
        [sale.id]
      );

      // Format items description
      let itemsDescription = '';
      if (saleItems.length > 0) {
        const itemsList = saleItems.map(item =>
          `${item.product_name} (${item.quantity} x PKR ${parseFloat(item.price).toFixed(2)})`
        ).join(', ');
        itemsDescription = `Sale #${sale.id}: ${itemsList}`;
      } else {
        itemsDescription = `Sale #${sale.id}`;
      }

      allTransactions.push({
        id: sale.id,
        date: sale.date,
        created_at: sale.date,
        transaction_type: 'sale',
        debit: parseFloat(sale.total_amount),
        credit: 0,
        description: itemsDescription,
        items: saleItems // Include items array for potential frontend use
      });
    }    // Add payments
    payments.forEach(payment => {
      allTransactions.push({
        id: payment.id,
        date: payment.date,
        created_at: payment.date,
        transaction_type: 'payment',
        debit: 0,
        credit: parseFloat(payment.amount),
        description: payment.description || 'Payment received'
      });
    });

    // Sort by date
    allTransactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    console.log(`Processing ${allTransactions.length} transactions`);

    // Calculate running balance for each transaction
    allTransactions.forEach(transaction => {
      if (transaction.debit > 0) {
        runningBalance += transaction.debit; // Sales increase what customer owes
      }
      if (transaction.credit > 0) {
        runningBalance -= transaction.credit; // Payments reduce what customer owes
      }

      transaction.running_balance = runningBalance;
      transaction.trans_no = transaction.transaction_type === 'sale' ? `SALE-${transaction.id}` : `PAY-${transaction.id}`;
      transaction.doc = transaction.transaction_type === 'sale' ? 'SLJ' : 'DRJ';

      history.push(transaction);

      console.log(`Added transaction: ${transaction.transaction_type} #${transaction.id}, running balance: ${runningBalance}`);
    });

    console.log(`Total history entries: ${history.length}`);
    console.log(`Final running balance: ${runningBalance}`);

    res.json(history);
  } catch (error) {
    console.error('Error fetching customer history:', error);
    res.status(500).json({ message: 'Error fetching customer history' });
  }
}
// ...existing code...
// ...existing code...

export const recalculateCustomerBalance = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const [customer] = await pool.query('SELECT id, name, balance as original_balance, opening_balance, opening_balance_type FROM customers WHERE id = ?', [id]);

    if (customer.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Start with opening balance
    let runningBalance = 0;

    // Handle opening balance based on type
    if (customer[0].opening_balance && customer[0].opening_balance > 0) {
      if (customer[0].opening_balance_type === 'credit') {
        runningBalance = -customer[0].opening_balance; // Credit balance is negative
      } else {
        runningBalance = customer[0].opening_balance; // Debit balance is positive
      }
    }

    // Add all sales (debits - customer owes money)
    const [sales] = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total_sales FROM sales WHERE customer_id = ?',
      [id]
    );
    runningBalance += sales[0].total_sales;

    // Subtract all payments (credits - customer paid money)
    const [payments] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_payments FROM customer_payments WHERE customer_id = ?',
      [id]
    );
    runningBalance -= payments[0].total_payments;

    // Update customer balance
    await pool.query('UPDATE customers SET balance = ? WHERE id = ?', [runningBalance, id]);

    res.json({
      message: 'Customer balance recalculated successfully',
      customer: customer[0].name,
      originalBalance: customer[0].original_balance,
      newBalance: runningBalance,
      openingBalance: customer[0].opening_balance,
      openingBalanceType: customer[0].opening_balance_type,
      totalSales: sales[0].total_sales,
      totalPayments: payments[0].total_payments
    });

  } catch (error) {
    console.error('Error recalculating customer balance:', error);
    res.status(500).json({ message: 'Error recalculating customer balance', error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    console.log('updateCustomer called with params:', req.params);
    console.log('updateCustomer called with body:', req.body);
    console.log('updateCustomer called with user:', req.user);

    const { id } = req.params;
    const {
      name,
      brand_name,
      contact,
      phone,
      email,
      address,
      credit_limit,
      opening_balance,
      opening_balance_type
    } = req.body;

    // Basic validation - allow empty name to be updated if it's being set to a non-empty value
    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({ message: 'Customer name cannot be empty' });
    }

    // Map frontend balance type abbreviations to database enum values
    const mapBalanceType = (type) => {
      if (!type) return null; // Let COALESCE handle null values
      if (type === 'Dr' || type === 'dr' || type === 'DR') return 'debit';
      if (type === 'Cr' || type === 'cr' || type === 'CR') return 'credit';
      if (type === 'debit' || type === 'credit') return type;
      return 'debit'; // default to debit
    };

    // Convert empty strings to null for numeric fields
    const sanitizeNumericField = (value) => {
      if (value === '' || value === null || value === undefined) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const [existingCustomer] = await pool.query('SELECT id, name FROM customers WHERE id = ?', [id]);
    if (existingCustomer.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Only check for duplicate names if name is being updated
    if (name && name !== existingCustomer[0].name) {
      const [duplicateName] = await pool.query('SELECT id FROM customers WHERE name = ? AND id != ?', [name, id]);
      if (duplicateName.length > 0) {
        return res.status(400).json({ message: 'Customer name already exists' });
      }
    }

    await pool.query(
      `UPDATE customers 
       SET 
         name = ?,
         brand_name = COALESCE(?, brand_name),
         contact = COALESCE(?, contact),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         address = COALESCE(?, address),
         credit_limit = COALESCE(?, credit_limit),
         opening_balance = COALESCE(?, opening_balance),
         opening_balance_type = COALESCE(?, opening_balance_type)
       WHERE id = ?`,
      [
        name,
        brand_name,
        contact,
        phone,
        email,
        address,
        sanitizeNumericField(credit_limit),
        sanitizeNumericField(opening_balance),
        mapBalanceType(opening_balance_type),
        id
      ]
    );

    const [updatedCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);

    // Convert database format back to frontend format
    const reverseMapBalanceType = (type) => {
      if (type === 'debit') return 'Dr';
      if (type === 'credit') return 'Cr';
      return type;
    };

    const customerData = updatedCustomer[0];
    const convertedBalanceType = reverseMapBalanceType(customerData.opening_balance_type);
    customerData.opening_balance_type = convertedBalanceType;
    customerData.balanceType = convertedBalanceType; // For backward compatibility
    customerData.openingBalance = customerData.opening_balance; // For backward compatibility

    res.json({ message: 'Customer updated successfully', customer: customerData });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer' });
  }
};

// Delete customer controller
export async function deleteCustomer(req, res) {
  const { id } = req.params;
  try {
    // Check if customer exists
    const [existingCustomer] = await pool.query('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL', [id]);
    if (existingCustomer.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check for related sales before deleting
    const [sales] = await pool.query('SELECT id FROM sales WHERE customer_id = ?', [id]);
    if (sales.length > 0) {
      return res.status(400).json({
        message: `Cannot delete customer. This customer has ${sales.length} sales record(s) associated with them. You can deactivate the customer instead of deleting.`,
        hasAssociatedData: true,
        associatedRecords: sales.length,
        dataType: 'sales'
      });
    }

    // Use soft delete
    await softDeleteItem('customers', id, req.user.id, 'Customer deleted by user');

    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
