import { pool } from '../models/db.js';
import { softDeleteItem } from '../services/deletedItemsService.js';

export async function deleteSupplier(req, res) {
  const supplierId = req.params.id;

  try {
    // Check if supplier exists
    const [existingSupplier] = await pool.query('SELECT * FROM suppliers WHERE id = ? AND deleted_at IS NULL', [supplierId]);
    if (existingSupplier.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Check for related data
    const [purchasesCount] = await pool.query('SELECT COUNT(*) as count FROM purchases WHERE supplier_id = ?', [supplierId]);
    const [paymentsCount] = await pool.query('SELECT COUNT(*) as count FROM payments WHERE supplier_id = ?', [supplierId]);

    if (purchasesCount[0].count > 0 || paymentsCount[0].count > 0) {
      return res.status(400).json({
        message: `Cannot delete supplier. This supplier has ${purchasesCount[0].count} purchase(s) and ${paymentsCount[0].count} payment(s) associated with them. You can deactivate the supplier instead of deleting.`,
        hasAssociatedData: true,
        associatedRecords: purchasesCount[0].count + paymentsCount[0].count,
        dataType: 'purchases and payments'
      });
    }

    // Use soft delete
    await softDeleteItem('suppliers', supplierId, req.user.id, 'Supplier deleted by user');

    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error('Error in deleteSupplier:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function getSuppliers(req, res) {
  try {
    console.log('getSuppliers called');
    const { include_deleted } = req.query;

    let query = 'SELECT * FROM suppliers';
    if (include_deleted !== 'true') {
      query += ' WHERE deleted_at IS NULL';
    }

    const [rows] = await pool.query(query);
    console.log('Raw suppliers data:', rows);
    // For each supplier, calculate closing_balance properly
    const suppliersWithClosing = await Promise.all(rows.map(async (supplier) => {
      // Get opening balance (already stored with correct sign: negative for credit, positive for debit)
      const openingBalance = Number(supplier.opening_balance || 0);

      // Get total purchases (increases what we owe)
      const [purchases] = await pool.query('SELECT COALESCE(SUM(total_cost), 0) as total FROM purchases WHERE supplier_id = ?', [supplier.id]);
      const totalPurchases = Number(purchases[0].total || 0);

      // Get total payments (decreases what we owe)
      const [payments] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE supplier_id = ?', [supplier.id]);
      const totalPayments = Number(payments[0].total || 0);

      // Closing balance = Opening Balance + Purchases - Payments
      const closing_balance = openingBalance + totalPurchases - totalPayments;
      // Optionally update supplier.balance in DB
      await pool.query('UPDATE suppliers SET balance = ? WHERE id = ?', [closing_balance, supplier.id]);
      return {
        ...supplier,
        closing_balance,
      };
    }));
    console.log('Suppliers with closing balance:', suppliersWithClosing);
    res.json(suppliersWithClosing);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function addSupplier(req, res) {
  const { name, brand_name, contact_info, balance, opening_balance, opening_balance_type } = req.body;
  try {
    // Use opening_balance if provided, otherwise fall back to balance
    const openingBal = opening_balance !== undefined ? opening_balance : balance || 0;
    const balanceType = opening_balance_type || 'debit';

    // Convert opening balance based on type  
    // For suppliers: Debit = positive (we owe supplier), Credit = negative (supplier owes us)
    const adjustedOpeningBalance = balanceType === 'credit' ? -Math.abs(openingBal) : Math.abs(openingBal);

    const [result] = await pool.query('INSERT INTO suppliers (name, brand_name, opening_balance, opening_balance_type, contact_info, balance) VALUES (?, ?, ?, ?, ?, ?)',
      [name, brand_name, adjustedOpeningBalance, balanceType, contact_info, adjustedOpeningBalance]);

    console.log(`Supplier added: ${name} with opening balance: ${adjustedOpeningBalance} (${balanceType})`);

    // Return the created supplier data
    const [newSupplier] = await pool.query('SELECT id, name, brand_name, contact_info, balance FROM suppliers WHERE id = ?', [result.insertId]);
    res.status(201).json({
      message: 'Supplier added',
      id: result.insertId,
      name: newSupplier[0].name,
      brand_name: newSupplier[0].brand_name,
      contact_info: newSupplier[0].contact_info,
      balance: newSupplier[0].balance
    });
  } catch (err) {
    console.error('Error adding supplier:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Get supplier ledger history with opening balance and proper accounting
export async function getSupplierHistory(req, res) {
  try {
    const { id } = req.params;
    console.log('🔍 Getting supplier history for ID:', id, 'at', new Date().toISOString());

    // Get supplier info including opening balance
    const [suppliers] = await pool.query('SELECT opening_balance, opening_balance_type, balance, name, brand_name, contact_info FROM suppliers WHERE id = ?', [id]);
    console.log('✅ Supplier query result:', suppliers);

    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const supplier = suppliers[0];
    console.log('Supplier found:', supplier);

    const openingBalance = Number(supplier.opening_balance || 0);
    const openingBalanceType = supplier.opening_balance_type || 'debit';

    // Get all purchases for this supplier with full details
    const [purchases] = await pool.query(`
      SELECT id, date, total_cost as amount, 'purchase' as type, date as created_at,
             description, supplier_invoice_id, delivery_method
      FROM purchases 
      WHERE supplier_id = ? 
      ORDER BY date ASC
    `, [id]);

    // Add purchase items details to descriptions if no description exists
    for (const purchase of purchases) {
      // Get items for this purchase
      const [purchaseItems] = await pool.query(
        `SELECT pi.quantity, pi.cost_price as price,
                COALESCE(p.name, CONCAT('Unknown Product - [', pi.product_id, ']')) as product_name
         FROM purchase_items pi
         LEFT JOIN products p ON pi.product_id = p.id
         WHERE pi.purchase_id = ?
         ORDER BY pi.id`,
        [purchase.id]
      );

      // Keep the original description, or create one from items, or use default
      if (!purchase.description || purchase.description.trim() === '') {
        if (purchaseItems.length > 0) {
          // If no description but has items, show items
          const itemsList = purchaseItems.map(item =>
            `${item.product_name} (${item.quantity} x PKR ${parseFloat(item.price).toFixed(2)})`
          ).join(', ');
          purchase.description = `Purchase #${purchase.id}: ${itemsList}`;
        } else {
          // No description and no items
          purchase.description = `Purchase #${purchase.id}`;
        }
      }
      // Keep supplier_invoice_id and delivery_method as is
      purchase.items = purchaseItems;
    }

    // Get all payments for this supplier (basic columns only)
    const [payments] = await pool.query(`
      SELECT id, date, amount, 'payment' as type, date as created_at,
             'Payment to supplier' as description
      FROM payments 
      WHERE supplier_id = ? 
      ORDER BY date ASC
    `, [id]);

    // Build ledger starting with opening balance
    const ledger = [];

    // Add opening balance entry if non-zero
    if (openingBalance !== 0) {
      ledger.push({
        id: 0,
        date: '1970-01-01',
        type: 'opening',
        description: 'Opening Balance',
        amount: openingBalance, // Show actual amount with correct sign
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        balance: openingBalance,
        running_balance: openingBalance,
        doc_type: 'OP'
      });
    }

    // Combine and sort all transactions
    const allTransactions = [...purchases, ...payments].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() === dateB.getTime()) {
        return new Date(a.date) - new Date(b.date); // Use date instead of created_at
      }
      return dateA - dateB;
    });

    // Process transactions and calculate running balance
    let runningBalance = openingBalance;

    allTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount || 0);

      if (transaction.type === 'purchase') {
        runningBalance += amount; // Purchases increase what we owe (debit)
        ledger.push({
          ...transaction,
          debit: amount,
          credit: 0,
          running_balance: runningBalance,
          doc_type: 'PUR'
        });
      } else if (transaction.type === 'payment') {
        runningBalance -= amount; // Payments decrease what we owe (credit)
        ledger.push({
          ...transaction,
          debit: 0,
          credit: amount,
          running_balance: runningBalance,
          doc_type: 'PAY'
        });
      }
    });

    // Calculate totals
    const totalDebits = purchases.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) + (openingBalance > 0 ? openingBalance : 0);
    const totalCredits = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) + (openingBalance < 0 ? Math.abs(openingBalance) : 0);
    const calculatedBalance = openingBalance + purchases.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) - payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Update the supplier's balance in the database to match calculated balance
    await pool.query('UPDATE suppliers SET balance = ? WHERE id = ?', [calculatedBalance, id]);

    console.log(`Supplier ${id} - Opening: ${openingBalance}, Calculated: ${calculatedBalance}, Current: ${supplier.balance}`);

    res.json({
      supplier: {
        ...supplier,
        opening_balance: openingBalance,
        balance: calculatedBalance // Use calculated balance
      },
      ledger,
      totals: {
        totalDebits,
        totalCredits,
        calculatedBalance,
        currentBalance: calculatedBalance // Use calculated balance
      },
      // Add these for backward compatibility with tests
      currentBalance: calculatedBalance, // Use calculated balance
      openingBalance: openingBalance
    });
  } catch (error) {
    console.error('Error fetching supplier history:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function updateSupplier(req, res) {
  const { id } = req.params;
  const { name, brand_name, contact_info, opening_balance, balance, opening_balance_type } = req.body;

  try {
    // Use opening_balance if provided, otherwise fall back to balance
    const balanceToSet = opening_balance !== undefined ? opening_balance : balance;

    // Convert balance based on type (same logic as addSupplier)
    const balanceType = opening_balance_type || 'debit';
    const adjustedBalance = balanceType === 'credit' ? -Math.abs(balanceToSet || 0) : Math.abs(balanceToSet || 0);

    const [result] = await pool.query(
      'UPDATE suppliers SET name = ?, brand_name = ?, contact_info = ?, balance = ?, opening_balance = ?, opening_balance_type = ? WHERE id = ?',
      [name, brand_name, contact_info, adjustedBalance, adjustedBalance, opening_balance_type, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Fetch updated supplier data
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}