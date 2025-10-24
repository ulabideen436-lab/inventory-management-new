import { forwardRef, useImperativeHandle } from 'react';

const UnifiedInvoiceView = forwardRef(({ sale, customer, products = [], onClose }, ref) => {
    // Helper function to get correct UOM from products data
    const getCorrectUOM = (item) => {
        if (!products || products.length === 0) return item.uom || 'pcs';

        // Try to find the product by ID first
        let product = products.find(p => p.id === item.product_id);

        // If not found by ID, try to find by name and brand
        if (!product && item.name) {
            product = products.find(p =>
                p.name === item.name &&
                (p.brand_name === item.brand || (!p.brand_name && !item.brand))
            );
        }

        // If still not found, try to find by name only
        if (!product && item.name) {
            product = products.find(p => p.name === item.name);
        }

        // Return the UOM from products table if found, otherwise fallback to item.uom or 'pcs'
        return product?.uom || item.uom || 'pcs';
    };

    // PDF generation handler - must be defined before any early returns
    const handlePrint = async () => {
        if (!sale) {
            alert('No sale data available for PDF generation');
            return;
        }

        try {
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
            const doc = new jsPDF();

            // Set default font
            doc.setFont('helvetica');

            // === HEADER SECTION ===
            doc.setFillColor(245, 245, 245);
            doc.rect(0, 0, 210, 35, 'F');

            // Company name
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(25, 25, 112);
            doc.text('ZAFAR YAQOOB BEDDING STORE', 105, 15, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Premium Quality Bedding Solutions', 105, 22, { align: 'center' });

            // Invoice title
            doc.setFillColor(25, 25, 112);
            doc.rect(75, 25, 60, 8, 'F');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('UNIFIED INVOICE', 105, 30.5, { align: 'center' });

            doc.setTextColor(0, 0, 0);

            // === DOCUMENT INFO SECTION ===
            const saleDate = sale?.date ? new Date(sale.date) : new Date();
            const formattedDate = saleDate.toLocaleDateString('en-GB');
            const formattedTime = saleDate.toLocaleTimeString('en-GB', { hour12: false });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Invoice #: ${sale?.id || 'N/A'}`, 15, 45);
            doc.text(`Date: ${formattedDate}`, 15, 50);
            doc.text(`Time: ${formattedTime}`, 15, 55);
            doc.text('Page 1 of 1', 160, 45);

            // === CUSTOMER SECTION ===
            doc.setFillColor(248, 248, 248);
            doc.rect(15, 62, 180, 15, 'F');
            doc.rect(15, 62, 180, 15);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('BILL TO:', 20, 69);
            doc.setFont('helvetica', 'normal');
            doc.text(`${customer?.brand_name || customer?.name || 'Walk-in Customer'}`, 20, 74);

            // === ITEMS TABLE HEADER ===
            let yPos = 85;
            doc.setFillColor(25, 25, 112);
            doc.rect(15, yPos, 180, 8, 'F');

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('S#', 18, yPos + 5);
            doc.text('Item Description', 30, yPos + 5);
            doc.text('UOM', 75, yPos + 5);
            doc.text('Qty', 90, yPos + 5);
            doc.text('Rate', 105, yPos + 5);
            doc.text('Amount', 125, yPos + 5);
            doc.text('Disc%', 145, yPos + 5);
            doc.text('Disc PKR', 160, yPos + 5);
            doc.text('Net', 180, yPos + 5);

            doc.setTextColor(0, 0, 0);
            yPos += 8;

            // === ITEMS TABLE BODY ===
            const saleProducts = sale?.items || [];
            let totalQty = 0;
            let totalGross = 0;
            let totalItemDiscount = 0;

            saleProducts.forEach((item, idx) => {
                const quantity = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                const grossAmount = quantity * price;
                const itemDiscountAmount = Number(item.item_discount_amount || 0);
                const netAmount = grossAmount - itemDiscountAmount;

                let discountPercentage = 0;
                if (grossAmount > 0 && itemDiscountAmount > 0) {
                    discountPercentage = (itemDiscountAmount / grossAmount) * 100;
                }

                totalQty += quantity;
                totalGross += grossAmount;
                totalItemDiscount += itemDiscountAmount;

                // Alternate row background
                if (idx % 2 === 0) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(15, yPos, 180, 6, 'F');
                }

                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.text((idx + 1).toString(), 18, yPos + 4);
                doc.text((item.name || item.product_name || 'Unknown Item').substring(0, 20), 25, yPos + 4);
                doc.text(getCorrectUOM(item), 75, yPos + 4);
                doc.text(quantity.toString(), 90, yPos + 4);
                doc.text(`PKR ${price.toFixed(2)}`, 105, yPos + 4);
                doc.text(`PKR ${grossAmount.toFixed(2)}`, 125, yPos + 4);
                doc.text(discountPercentage > 0 ? `${discountPercentage.toFixed(1)}%` : '-', 145, yPos + 4);
                doc.text(itemDiscountAmount > 0 ? `PKR ${itemDiscountAmount.toFixed(2)}` : '-', 160, yPos + 4);
                doc.text(`PKR ${netAmount.toFixed(2)}`, 180, yPos + 4);

                yPos += 6;
            });

            // === SUBTOTAL ROW ===
            const subtotal = totalGross - totalItemDiscount;
            doc.setFillColor(241, 245, 249);
            doc.rect(15, yPos, 180, 6, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('SUBTOTAL', 25, yPos + 4);
            doc.text(totalQty.toString(), 90, yPos + 4);
            doc.text(`PKR ${totalGross.toFixed(2)}`, 125, yPos + 4);
            doc.text(`PKR ${totalItemDiscount.toFixed(2)}`, 160, yPos + 4);
            doc.text(`PKR ${subtotal.toFixed(2)}`, 180, yPos + 4);
            yPos += 6;

            // === OVERALL DISCOUNT ROW ===
            const overallDiscountAmount = Number(sale?.discount_amount || 0);
            if (overallDiscountAmount > 0) {
                let overallDiscountPercentage = 0;
                if (subtotal > 0 && overallDiscountAmount > 0) {
                    overallDiscountPercentage = (overallDiscountAmount / subtotal) * 100;
                }

                doc.setFillColor(254, 243, 199);
                doc.rect(15, yPos, 180, 6, 'F');
                doc.setFont('helvetica', 'bold');
                doc.text('OVERALL DISCOUNT', 25, yPos + 4);
                doc.text(`${overallDiscountPercentage.toFixed(1)}%`, 145, yPos + 4);
                doc.text(`PKR ${overallDiscountAmount.toFixed(2)}`, 160, yPos + 4);
                doc.text(`-PKR ${overallDiscountAmount.toFixed(2)}`, 180, yPos + 4);
                yPos += 6;
            }

            // === FINAL TOTAL ROW ===
            const finalTotal = subtotal - overallDiscountAmount;
            doc.setFillColor(25, 25, 112);
            doc.rect(15, yPos, 180, 8, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('FINAL TOTAL', 25, yPos + 5);
            doc.text(`PKR ${finalTotal.toFixed(2)}`, 180, yPos + 5);
            yPos += 15;

            doc.setTextColor(0, 0, 0);

            // === AMOUNT IN WORDS ===
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Amount in Words:', 15, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`Rupees ${Math.floor(finalTotal)} and ${Math.round((finalTotal % 1) * 100)} Paisa Only`, 15, yPos + 5);
            yPos += 15;

            // === TERMS & CONDITIONS ===
            doc.setFont('helvetica', 'bold');
            doc.text('شرائط و ضوابط:', 15, yPos);
            yPos += 5;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('- انوائس کی تاریخ سے 7 دن کے اندر ادائیگی واجب ہے', 15, yPos);
            doc.text('- فروخت شدہ اشیاء پیشگی منظوری کے بغیر واپس نہیں ہو سکتیں', 15, yPos + 4);
            doc.text('- کوئی بھی اختلاف 7 دن کے اندر رپورٹ کرنا ضروری ہے', 15, yPos + 8);

            // === FOOTER ===
            yPos = 270;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.text('For queries: contact@inventorymanagement.com | +92-XXX-XXXXXXX', 105, yPos + 5, { align: 'center' });

            // Save PDF
            const invoiceDate = saleDate.toISOString().slice(0, 10);
            doc.save(`Unified_Invoice_${sale?.id || 'Unknown'}_${invoiceDate}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    // Expose handlePrint function - MUST be called before any early returns
    useImperativeHandle(ref, () => ({ handlePrint }));

    // Early return check AFTER hooks
    if (!sale) {
        return <div>No sale data available</div>;
    }

    // Ensure products is an array
    const saleProducts = sale?.items || [];

    // Safe date handling
    const saleDate = sale?.date ? new Date(sale.date) : new Date();
    const formattedDate = saleDate.toLocaleDateString('en-GB');
    const formattedTime = saleDate.toLocaleTimeString('en-GB', { hour12: false });

    // Enhanced calculation function for item discounts
    const calculateItemDiscount = (item) => {
        const grossAmount = Number(item.quantity || 0) * Number(item.price || 0);
        const itemDiscountAmount = Number(item.item_discount_amount || 0);

        // Calculate percentage if we have both amounts
        let discountPercentage = 0;
        if (grossAmount > 0 && itemDiscountAmount > 0) {
            discountPercentage = (itemDiscountAmount / grossAmount) * 100;
        }

        return {
            amount: itemDiscountAmount,
            percentage: discountPercentage,
            grossAmount,
            netAmount: grossAmount - itemDiscountAmount
        };
    };

    // Enhanced calculation function for overall discount
    const calculateOverallDiscount = () => {
        const discountAmount = Number(sale?.discount_amount || 0);
        const subtotal = saleProducts.reduce((sum, item) => {
            const itemCalc = calculateItemDiscount(item);
            return sum + itemCalc.netAmount;
        }, 0);

        // Calculate percentage if we have both amounts
        let discountPercentage = 0;
        if (subtotal > 0 && discountAmount > 0) {
            discountPercentage = (discountAmount / subtotal) * 100;
        }

        return {
            amount: discountAmount,
            percentage: discountPercentage,
            subtotal
        };
    };

    // Calculate totals
    const totalQty = saleProducts.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const totalGross = saleProducts.reduce((sum, p) => sum + Number(p.quantity || 0) * Number(p.price || 0), 0);
    const totalItemDiscount = saleProducts.reduce((sum, p) => sum + calculateItemDiscount(p).amount, 0);
    const overallDiscountCalc = calculateOverallDiscount();
    const subtotal = totalGross - totalItemDiscount;
    const finalTotal = subtotal - overallDiscountCalc.amount;

    // Styles
    const styles = {
        container: {
            fontFamily: "'Segoe UI', 'Noto Sans Arabic', 'Noto Sans Urdu', Tahoma, Geneva, Verdana, sans-serif",
            maxWidth: '900px',
            margin: '0 auto',
            padding: '24px',
            background: '#fff',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)',
            borderRadius: '8px'
        },
        header: {
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            color: 'white',
            padding: '24px',
            borderRadius: '8px 8px 0 0',
            textAlign: 'center',
            marginBottom: '24px'
        },
        companyName: {
            fontSize: '28px',
            fontWeight: 'bold',
            margin: '0 0 8px 0'
        },
        tagline: {
            fontSize: '14px',
            opacity: '0.9',
            margin: '0'
        },
        invoiceTitle: {
            background: '#ffffff',
            color: '#1e3a8a',
            padding: '8px 24px',
            borderRadius: '20px',
            display: 'inline-block',
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '16px'
        },
        infoSection: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '24px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px'
        },
        customerInfo: {
            background: '#e0f2fe',
            padding: '16px',
            borderRadius: '8px',
            borderLeft: '4px solid #0284c7'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '24px',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            overflow: 'hidden'
        },
        tableHeader: {
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center'
        },
        tableCell: {
            border: '1px solid #e5e7eb',
            padding: '12px 8px',
            textAlign: 'center'
        },
        alternateRow: {
            background: '#f8fafc'
        },
        subtotalRow: {
            background: '#f1f5f9',
            fontWeight: 'bold',
            borderTop: '2px solid #cbd5e1'
        },
        discountRow: {
            background: 'linear-gradient(135deg, #fef3c7, #fbbf24)',
            color: '#92400e',
            fontWeight: 'bold'
        },
        totalRow: {
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px'
        },
        summarySection: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginTop: '24px'
        },
        summaryCard: {
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
        },
        buttonSection: {
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb'
        },
        button: {
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
        },
        downloadBtn: {
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: 'white'
        },
        closeBtn: {
            background: '#6b7280',
            color: 'white'
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.companyName}>ZAFAR YAQOOB BEDDING STORE</h1>
                <p style={styles.tagline}>Premium Quality Bedding Solutions</p>
                <div style={styles.invoiceTitle}>UNIFIED INVOICE</div>
            </div>

            {/* Invoice Info */}
            <div style={styles.infoSection}>
                <div>
                    <h3 style={{ margin: '0 0 12px 0', color: '#374151' }}>Invoice Details</h3>
                    <p><strong>Invoice #:</strong> {sale?.id || 'N/A'}</p>
                    <p><strong>Date:</strong> {formattedDate}</p>
                    <p><strong>Time:</strong> {formattedTime}</p>
                    <p><strong>Cashier:</strong> {sale?.cashier_name || 'Unknown'}</p>
                </div>
                <div style={styles.customerInfo}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#0284c7' }}>Bill To</h3>
                    <p style={{ margin: '0', fontSize: '16px', fontWeight: '600' }}>
                        {customer?.brand_name || customer?.name || 'Walk-in Customer'}
                    </p>
                    {customer?.phone && <p style={{ margin: '4px 0 0 0' }}>Phone: {customer.phone}</p>}
                </div>
            </div>

            {/* Detailed Items Table */}
            <table style={styles.table}>
                <thead>
                    <tr style={styles.tableHeader}>
                        <th style={styles.tableCell}>S#</th>
                        <th style={styles.tableCell}>Item Description</th>
                        <th style={styles.tableCell}>UOM</th>
                        <th style={styles.tableCell}>Qty</th>
                        <th style={styles.tableCell}>Unit Price</th>
                        <th style={styles.tableCell}>Gross Amount</th>
                        <th style={styles.tableCell}>Discount %</th>
                        <th style={styles.tableCell}>Discount PKR</th>
                        <th style={styles.tableCell}>Net Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {saleProducts.map((item, idx) => {
                        const itemCalc = calculateItemDiscount(item);
                        return (
                            <tr key={idx} style={idx % 2 === 0 ? styles.alternateRow : {}}>
                                <td style={styles.tableCell}>{idx + 1}</td>
                                <td style={{ ...styles.tableCell, textAlign: 'left' }}>
                                    {item.name || item.product_name || 'Unknown Item'}
                                </td>
                                <td style={styles.tableCell}>{getCorrectUOM(item)}</td>
                                <td style={styles.tableCell}>{item.quantity || 0}</td>
                                <td style={styles.tableCell}>PKR {Number(item.price || 0).toFixed(2)}</td>
                                <td style={styles.tableCell}>PKR {itemCalc.grossAmount.toFixed(2)}</td>
                                <td style={styles.tableCell}>
                                    {itemCalc.percentage > 0 ? `${itemCalc.percentage.toFixed(1)}%` : '-'}
                                </td>
                                <td style={styles.tableCell}>
                                    {itemCalc.amount > 0 ? `PKR ${itemCalc.amount.toFixed(2)}` : '-'}
                                </td>
                                <td style={styles.tableCell}>PKR {itemCalc.netAmount.toFixed(2)}</td>
                            </tr>
                        );
                    })}

                    {/* Subtotal Row */}
                    <tr style={styles.subtotalRow}>
                        <td colSpan={3} style={styles.tableCell}>SUBTOTAL</td>
                        <td style={styles.tableCell}>{totalQty}</td>
                        <td style={styles.tableCell}></td>
                        <td style={styles.tableCell}>PKR {totalGross.toFixed(2)}</td>
                        <td style={styles.tableCell}></td>
                        <td style={styles.tableCell}>PKR {totalItemDiscount.toFixed(2)}</td>
                        <td style={styles.tableCell}>PKR {subtotal.toFixed(2)}</td>
                    </tr>

                    {/* Overall Discount Row */}
                    {overallDiscountCalc.amount > 0 && (
                        <tr style={styles.discountRow}>
                            <td colSpan={6} style={styles.tableCell}>OVERALL DISCOUNT</td>
                            <td style={styles.tableCell}>{overallDiscountCalc.percentage.toFixed(1)}%</td>
                            <td style={styles.tableCell}>PKR {overallDiscountCalc.amount.toFixed(2)}</td>
                            <td style={styles.tableCell}>-PKR {overallDiscountCalc.amount.toFixed(2)}</td>
                        </tr>
                    )}

                    {/* Final Total Row */}
                    <tr style={styles.totalRow}>
                        <td colSpan={8} style={styles.tableCell}>FINAL TOTAL</td>
                        <td style={styles.tableCell}>PKR {finalTotal.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Summary Section */}
            <div style={styles.summarySection}>
                <div style={styles.summaryCard}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>Amount Summary</h3>
                    <p><strong>Gross Total:</strong> PKR {totalGross.toFixed(2)}</p>
                    <p><strong>Item Discounts:</strong> PKR {totalItemDiscount.toFixed(2)}</p>
                    <p><strong>Subtotal:</strong> PKR {subtotal.toFixed(2)}</p>
                    {overallDiscountCalc.amount > 0 && (
                        <p><strong>Overall Discount:</strong> PKR {overallDiscountCalc.amount.toFixed(2)}</p>
                    )}
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a', marginTop: '12px' }}>
                        <strong>Final Total: PKR {finalTotal.toFixed(2)}</strong>
                    </p>
                </div>

                <div style={styles.summaryCard}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>Amount in Words</h3>
                    <p style={{ fontStyle: 'italic', color: '#6b7280' }}>
                        Rupees {Math.floor(finalTotal)} and {Math.round((finalTotal % 1) * 100)} Paisa Only
                    </p>

                    <div className="urdu-text" style={{
                        margin: '16px 0 8px 0',
                        color: '#374151',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>
                        <h4 style={{ margin: 0 }}>شرائط و ضوابط</h4>
                    </div>
                    <ul className="urdu-text" style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        paddingLeft: '0px',
                        paddingRight: '16px',
                        lineHeight: '1.8',
                        listStylePosition: 'inside',
                        margin: '8px 0'
                    }}>
                        <li style={{ marginBottom: '8px' }}>انوائس کی تاریخ سے ۷ دن کے اندر ادائیگی واجب ہے</li>
                        <li style={{ marginBottom: '8px' }}>فروخت شدہ اشیاء پیشگی منظوری کے بغیر واپس نہیں ہو سکتیں</li>
                        <li style={{ marginBottom: '8px' }}>کوئی بھی اختلاف ۷ دن کے اندر رپورٹ کرنا ضروری ہے</li>
                    </ul>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.buttonSection} className="no-print">
                <button
                    style={{ ...styles.button, ...styles.downloadBtn }}
                    onClick={handlePrint}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    📄 Download PDF
                </button>
                {onClose && (
                    <button
                        style={{ ...styles.button, ...styles.closeBtn }}
                        onClick={onClose}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        ✕ Close
                    </button>
                )}
            </div>
        </div>
    );
});

export default UnifiedInvoiceView;