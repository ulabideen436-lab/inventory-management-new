import axios from 'axios';
import { useEffect, useState } from 'react';
import SaleEditModal from './SaleEditModal';

function LedgerStatement({ customerId }) {
  // PDF generation for customer ledger
  const handleDownloadPDF = () => {
    try {
      import('jspdf').then(jsPDFModule => {
        const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('ACCOUNT LEDGER STATEMENT', 105, 20, { align: 'center' });

        // Customer info and opening balance
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Customer: ${customer.brand_name || 'N/A'}`, 20, 40);

        const openingBalance = ledger.length > 0 && ledger[0].doc === 'OPEN' ? ledger[0].running_balance : (ledger.length > 0 ? ledger[0].balance || 0 : 0);
        doc.text(`Opening Balance: ${Math.abs(openingBalance).toLocaleString()} ${openingBalance >= 0 ? 'Dr' : 'Cr'}`, 120, 40);

        // Add buttons section (not functional in PDF)
        doc.setFontSize(10);
        doc.rect(20, 50, 30, 8);
        doc.text('Add Payment', 22, 55);
        doc.rect(55, 50, 30, 8);
        doc.text('Export PDF', 57, 55);

        // Table headers
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const startY = 70;

        // Draw table border
        doc.rect(15, startY - 5, 180, 15);

        // Headers
        doc.text('#', 18, startY);
        doc.text('Date', 30, startY);
        doc.text('Ref', 55, startY);
        doc.text('Type', 70, startY);
        doc.text('Description', 90, startY);
        doc.text('Debit', 140, startY);
        doc.text('Credit', 160, startY);
        doc.text('Balance', 175, startY);

        // Table content
        doc.setFont(undefined, 'normal');
        let y = startY + 10;
        let totalDebit = 0;
        let totalCredit = 0;

        ledger.forEach((entry, idx) => {
          if (y > 250) {
            doc.addPage();
            y = 30;
          }

          // Draw row border
          doc.rect(15, y - 8, 180, 12);

          // Row data
          doc.text((idx + 1).toString(), 18, y);
          doc.text(entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-GB') : '', 30, y);
          doc.text((entry.trans_no || entry.id || '').toString(), 55, y);
          doc.text(entry.doc || (entry.type === 'sale' ? 'SLJ' : 'DRJ'), 70, y);

          // Description (truncated)
          const desc = (entry.description || '').substring(0, 25);
          doc.text(desc, 90, y);

          // Debit
          const debitAmount = entry.debit || (entry.type === 'payment' ? entry.amount : 0);
          if (debitAmount > 0) {
            doc.text(debitAmount.toLocaleString(), 140, y);
            totalDebit += debitAmount;
          }

          // Credit  
          const creditAmount = entry.credit || (entry.type === 'sale' ? entry.total_amount : 0);
          if (creditAmount > 0) {
            doc.text(creditAmount.toLocaleString(), 160, y);
            totalCredit += creditAmount;
          }

          // Balance
          const balance = entry.running_balance || entry.balance || 0;
          doc.text(`${Math.abs(balance).toLocaleString()} ${balance >= 0 ? 'Dr' : 'Cr'}`, 175, y);

          y += 12;
        });

        // Grand total row
        y += 5;
        doc.rect(15, y - 8, 180, 12);
        doc.setFont(undefined, 'bold');
        doc.text('GRAND TOTAL:', 90, y);
        doc.text(totalDebit.toLocaleString(), 140, y);
        doc.text(totalCredit.toLocaleString(), 160, y);

        const closingBalance = ledger.length > 0 ? (ledger[ledger.length - 1].running_balance || ledger[ledger.length - 1].balance || 0) : 0;
        doc.text(`${Math.abs(closingBalance).toLocaleString()} ${closingBalance >= 0 ? 'Dr' : 'Cr'}`, 175, y);

        // Closing balance
        y += 20;
        doc.setFontSize(14);
        doc.text(`Closing Balance: ${Math.abs(closingBalance).toLocaleString()} ${closingBalance >= 0 ? 'Dr' : 'Cr'}`, 105, y, { align: 'center' });

        // Save the PDF
        doc.save(`${(customer.brand_name || 'customer').replace(/[^a-zA-Z0-9]/g, '_')}_ledger.pdf`);
      }).catch(err => {
        console.error('Error loading jsPDF:', err);
        alert('Error generating PDF. Please make sure jsPDF is installed.');
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF');
    }
  };

  // Handle sale click to open edit modal
  const handleSaleClick = (entry) => {
    if (entry.transaction_type === 'sale' && entry.id) {
      setSelectedSaleId(entry.id);
      setShowSaleEdit(true);
    }
  };

  // Handle sale edit modal close
  const handleSaleEditClose = () => {
    setShowSaleEdit(false);
    setSelectedSaleId(null);
  };

  // Handle successful sale save (refresh ledger)
  const handleSaleEditSuccess = () => {
    fetchLedger();
    handleSaleEditClose();
  };

  const [ledger, setLedger] = useState([]);
  const [customer, setCustomer] = useState({ brand_name: '', address: '' });
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [showSaleEdit, setShowSaleEdit] = useState(false);
  const token = localStorage.getItem('token');

  const fetchLedger = async () => {
    try {
      console.log('Fetching ledger for customer:', customerId);
      const res = await axios.get(`http://localhost:5000/customers/${customerId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Ledger API response:', res.data);
      console.log('Number of entries received:', res.data.length);
      console.log('First entry:', res.data[0]);
      console.log('Last entry:', res.data[res.data.length - 1]);

      // Log each entry separately
      res.data.forEach((entry, index) => {
        console.log(`Entry ${index}:`, entry);
      });

      // Write data to file for debugging
      try {
        await fetch('/api/debug-write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            dataLength: res.data.length,
            data: res.data
          })
        });
      } catch (e) {
        // Ignore file write errors
      }

      console.log('Setting ledger state with data:', res.data);
      setLedger(res.data);
      console.log('Ledger state should now be set');
      if (res.data.length > 0 && res.data[0].brand_name) {
        setCustomer({ brand_name: res.data[0].brand_name, address: res.data[0].address });
      }
    } catch (error) {
      console.error('Ledger fetch error:', error);
      setLedger([]);
    }
  }; useEffect(() => {
    fetchLedger();
  }, [customerId, token]);

  // Debug ledger state changes
  useEffect(() => {
    console.log('Ledger state changed:', ledger);
    console.log('Ledger state length:', ledger.length);
  }, [ledger]);

  return (
    <div style={{ background: '#fff', padding: 24, fontFamily: 'Arial, sans-serif', maxWidth: 1100, margin: '0 auto', color: '#222' }}>
      <button onClick={handleDownloadPDF} style={{ float: 'right', marginBottom: 8, background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Download PDF</button>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>JAN SHER KAMBAL HOUSE</h1>
        <div>(Company Outlet)</div>
        <div>Ahmad Arcade,Chongi # 11, Multan</div>
        <div>0300-8741763</div>
        <h2 style={{ margin: '16px 0 0 0', letterSpacing: 2 }}>ACCOUNT LEDGER STATEMENT</h2>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>Account Name: <b>{customer.brand_name}</b></div>
        <div>ALL DATES</div>
        <div>Current Balance: <b style={{ color: ledger.length > 0 && ledger[ledger.length - 1].running_balance < 0 ? 'green' : 'red' }}>
          {ledger.length > 0 ? `${ledger[ledger.length - 1].running_balance >= 0 ? '+' : ''}${Number(ledger[ledger.length - 1].running_balance).toLocaleString()} ${ledger[ledger.length - 1].running_balance >= 0 ? 'To Receive' : 'To Pay'}` : '+0.00 To Receive'}
        </b></div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div><b>Address:</b> {customer.address}</div>
        {ledger.length > 0 && ledger[0].doc === 'OPEN' && (
          <div><b>Opening Balance:</b> {ledger[0].running_balance >= 0 ? '+' : ''}{Number(ledger[0].running_balance).toLocaleString()} {ledger[0].running_balance >= 0 ? 'To Receive' : 'To Pay'}</div>
        )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Date</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Trans#</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>DOC</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Description</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Debit</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Credit</th>
            <th style={{ border: '1px solid #ccc', padding: 4 }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            console.log('Rendering ledger entries. Current ledger state:', ledger);
            console.log('Ledger length:', ledger.length);
            return ledger.map((entry, idx) => {
              console.log(`Rendering entry ${idx}:`, entry);
              return (
                <tr key={idx}>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>{
                    entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-GB') : ''
                  }</td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>{entry.trans_no || ''}</td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>
                    <span style={{
                      color: entry.doc === 'SLJ' ? 'blue' : entry.doc === 'DRJ' ? 'green' : '#333',
                      fontWeight: 'bold'
                    }}>
                      {entry.doc || (entry.type === 'sale' ? 'SLJ' : 'DRJ')}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: 4 }}>
                    {entry.transaction_type === 'sale' ? (
                      <span
                        onClick={() => handleSaleClick(entry)}
                        style={{
                          cursor: 'pointer',
                          color: '#3b82f6',
                          textDecoration: 'underline',
                          fontWeight: '500'
                        }}
                        dangerouslySetInnerHTML={{ __html: entry.description }}
                      />
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: entry.description }} />
                    )}
                  </td>
                  <td style={{
                    border: '1px solid #ccc',
                    padding: 4,
                    color: entry.debit ? 'red' : 'transparent',
                    fontWeight: entry.debit ? 'bold' : 'normal',
                    textAlign: 'right'
                  }}>
                    {entry.debit ? Number(entry.debit).toLocaleString() : '-'}
                  </td>
                  <td style={{
                    border: '1px solid #ccc',
                    padding: 4,
                    color: entry.credit ? 'green' : 'transparent',
                    fontWeight: entry.credit ? 'bold' : 'normal',
                    textAlign: 'right'
                  }}>
                    {entry.credit ? Number(entry.credit).toLocaleString() : '-'}
                  </td>
                  <td style={{
                    border: '1px solid #ccc',
                    padding: 4,
                    fontWeight: 'bold',
                    textAlign: 'right',
                    color: entry.running_balance >= 0 ? '#dc2626' : '#059669'
                  }}>
                    {Math.abs(Number(entry.running_balance)).toLocaleString()} {entry.running_balance >= 0 ? 'Dr' : 'Cr'}
                  </td>
                </tr>
              );
            });
          })()}
          {/* Grand Total Row */}
          {ledger.length > 0 && (
            <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
              <td colSpan={4} style={{ border: '1px solid #ccc', padding: 4, textAlign: 'center' }}>
                <strong>GRAND TOTAL:</strong>
              </td>
              <td style={{
                border: '1px solid #ccc',
                padding: 4,
                textAlign: 'right',
                color: '#dc2626'
              }}>
                {ledger.filter(e => e.debit).reduce((sum, e) => sum + Number(e.debit || 0), 0).toLocaleString()}
              </td>
              <td style={{
                border: '1px solid #ccc',
                padding: 4,
                textAlign: 'right',
                color: '#059669'
              }}>
                {ledger.filter(e => e.credit).reduce((sum, e) => sum + Number(e.credit || 0), 0).toLocaleString()}
              </td>
              <td style={{
                border: '1px solid #ccc',
                padding: 4,
                textAlign: 'right',
                color: ledger[ledger.length - 1].running_balance >= 0 ? '#dc2626' : '#059669',
                fontWeight: 'bold'
              }}>
                {Math.abs(Number(ledger[ledger.length - 1].running_balance)).toLocaleString()} {ledger[ledger.length - 1].running_balance >= 0 ? 'Dr' : 'Cr'}
              </td>
            </tr>
          )}

          {/* Closing Balance Row */}
          {ledger.length > 0 && (
            <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
              <td colSpan="6" style={{
                border: '1px solid #ccc',
                padding: '12px 8px',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                Closing Balance: {
                  (() => {
                    // Use the running balance from the last transaction (calculated correctly in backend)
                    const lastEntry = ledger[ledger.length - 1];
                    const closingBalance = lastEntry ? lastEntry.running_balance : 0;
                    return `PKR ${Math.abs(closingBalance).toLocaleString()} ${closingBalance >= 0 ? 'Dr' : 'Cr'}`;
                  })()
                }
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Sale Edit Modal */}
      {showSaleEdit && selectedSaleId && (
        <SaleEditModal
          isOpen={showSaleEdit}
          onClose={handleSaleEditClose}
          saleId={selectedSaleId}
          onSaveSuccess={handleSaleEditSuccess}
        />
      )}
    </div>
  );
}

export default LedgerStatement;
