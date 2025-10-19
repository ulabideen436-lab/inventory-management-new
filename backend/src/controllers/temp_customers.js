import { pool } from '../models/db.js';

// Simple customer history function for testing
export async function getCustomerHistorySimple(req, res) {
    try {
        const { id } = req.params;

        // Get customer with opening balance
        const [customer] = await pool.query('SELECT id, name, brand_name, address, opening_balance, opening_balance_type FROM customers WHERE id = ?', [id]);
        if (customer.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log(`Customer ${id} data:`, customer[0]);

        const history = [];

        // Start with opening balance - ALWAYS add opening balance entry
        let runningBalance = 0;
        const openingAmount = parseFloat(customer[0].opening_balance || 0);
        const openingType = customer[0].opening_balance_type || 'Dr';

        if (openingAmount > 0) {
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

        console.log(`Opening balance: ${openingAmount} ${openingType}, running balance: ${runningBalance}`);

        // Get sales (debits)
        const [sales] = await pool.query(
            'SELECT id, date, total_amount FROM sales WHERE customer_id = ? ORDER BY date ASC',
            [id]
        );

        // Get payments (credits)
        const [payments] = await pool.query(
            'SELECT id, payment_date as date, amount, description FROM customer_payments WHERE customer_id = ? ORDER BY payment_date ASC',
            [id]
        );

        console.log(`Found ${sales.length} sales, ${payments.length} payments`);

        // Process all transactions
        const allTransactions = [];

        // Add sales
        sales.forEach(sale => {
            allTransactions.push({
                id: sale.id,
                date: sale.date,
                created_at: sale.date,
                transaction_type: 'sale',
                debit: parseFloat(sale.total_amount),
                credit: 0,
                description: `Sale #${sale.id}`
            });
        });

        // Add payments  
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
        });

        console.log(`Total history entries: ${history.length}`);

        res.json(history);
    } catch (error) {
        console.error('Error fetching customer history:', error);
        res.status(500).json({ message: 'Error fetching customer history' });
    }
}