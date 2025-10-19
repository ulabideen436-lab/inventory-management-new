// Test function to replace the problematic getSupplierHistory temporarily
export async function getSupplierHistory(req, res) {
    try {
        const { id } = req.params;
        console.log('🔍 Getting supplier history for ID:', id);

        // Get supplier info
        const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);

        if (suppliers.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const supplier = suppliers[0];

        // Simple response to test
        res.json({
            supplier: supplier,
            ledger: [
                {
                    id: 0,
                    date: '1970-01-01',
                    type: 'opening',
                    description: 'Opening Balance',
                    debit: 0,
                    credit: 0,
                    running_balance: 0,
                    doc_type: 'OP'
                }
            ],
            totals: {
                totalDebits: 0,
                totalCredits: 0,
                calculatedBalance: 0,
                currentBalance: 0
            },
            currentBalance: 0,
            openingBalance: 0
        });
    } catch (error) {
        console.error('Error fetching supplier history:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}