import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierContext } from '../context/SupplierContext';

/**
 * FloatingSupplierPanel - A draggable, resizable panel that shows supplier info
 * This panel can stay open while navigating between pages
 */
const FloatingSupplierPanel = () => {
    const {
        selectedSupplier,
        showSupplierPanel,
        supplierLedger,
        supplierHistory,
        isLoading,
        closeSupplierPanel,
        clearSupplier,
        refreshSupplierData
    } = useSupplierContext();

    const navigate = useNavigate();
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' or 'history'
    const [editingTransaction, setEditingTransaction] = useState(null);

    const token = localStorage.getItem('token');

    if (!showSupplierPanel || !selectedSupplier) {
        return null;
    }

    const formatCurrency = (amount) => {
        return `PKR ${parseFloat(amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleNavigateToSuppliers = () => {
        navigate('/suppliers');
    };

    const handleEditTransaction = (transaction) => {
        setEditingTransaction(transaction);
    };

    const handleSaveTransaction = async () => {
        if (!editingTransaction) return;

        try {
            if (editingTransaction.type === 'purchase') {
                // Navigate to purchases page or open purchase editor
                alert('Purchase editing: Navigate to Purchases page to edit purchase details');
                // Could implement inline purchase editing here
            } else if (editingTransaction.type === 'payment') {
                await axios.put(
                    `http://127.0.0.1:5000/payments/${editingTransaction.id}`,
                    {
                        amount: editingTransaction.amount,
                        description: editingTransaction.description
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Payment updated successfully');
                setEditingTransaction(null);
                await refreshSupplierData();
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            alert('Error updating transaction: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCancelEdit = () => {
        setEditingTransaction(null);
    };

    return (
        <div style={{
            position: 'fixed',
            top: isMinimized ? 'auto' : '80px',
            bottom: isMinimized ? '20px' : 'auto',
            right: '20px',
            width: isMinimized ? '320px' : '500px',
            maxHeight: isMinimized ? '60px' : '85vh',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid #10b981',
            transition: 'all 0.3s ease'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'move',
                userSelect: 'none'
            }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: '600' }}>
                        🏢 {selectedSupplier.name}
                        {selectedSupplier.brand_name && (
                            <span style={{ fontSize: '0.875rem', opacity: 0.9, marginLeft: '8px' }}>
                                ({selectedSupplier.brand_name})
                            </span>
                        )}
                    </h3>
                    {!isMinimized && (
                        <div style={{
                            fontSize: '0.875rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span>
                                Balance: <strong>{formatCurrency(selectedSupplier.balance)}</strong>
                                <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>
                                    {parseFloat(selectedSupplier.balance || 0) > 0 ? 'Dr (We Owe)' :
                                        parseFloat(selectedSupplier.balance || 0) < 0 ? 'Cr (Owes Us)' : ''}
                                </span>
                            </span>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                        title={isMinimized ? 'Maximize' : 'Minimize'}
                    >
                        {isMinimized ? '▲' : '▼'}
                    </button>
                    <button
                        onClick={closeSupplierPanel}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                        title="Hide Panel"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Quick Actions */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={handleNavigateToSuppliers}
                            style={{
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            🏢 Manage Supplier
                        </button>
                        <button
                            onClick={refreshSupplierData}
                            disabled={isLoading}
                            style={{
                                background: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                opacity: isLoading ? 0.6 : 1
                            }}
                        >
                            {isLoading ? '⏳' : '🔄'} Refresh
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '2px solid #e5e7eb',
                        background: '#f9fafb'
                    }}>
                        <button
                            onClick={() => setActiveTab('ledger')}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: activeTab === 'ledger' ? 'white' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'ledger' ? '2px solid #10b981' : 'none',
                                color: activeTab === 'ledger' ? '#10b981' : '#6b7280',
                                fontWeight: activeTab === 'ledger' ? '600' : '400',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                marginBottom: '-2px'
                            }}
                        >
                            📊 Ledger ({supplierLedger.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: activeTab === 'history' ? 'white' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'history' ? '2px solid #10b981' : 'none',
                                color: activeTab === 'history' ? '#10b981' : '#6b7280',
                                fontWeight: activeTab === 'history' ? '600' : '400',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                marginBottom: '-2px'
                            }}
                        >
                            📜 History ({supplierHistory.length})
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '16px'
                    }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
                                <div>Loading data...</div>
                            </div>
                        ) : activeTab === 'ledger' ? (
                            // Ledger View with Running Balance
                            <div>
                                {supplierLedger.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
                                        <div>No ledger entries found</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {supplierLedger.map((entry, index) => (
                                            <div
                                                key={index}
                                                onClick={() => entry.type !== 'opening' && handleEditTransaction(entry)}
                                                style={{
                                                    background: entry.type === 'opening' ? '#f3f4f6' :
                                                        entry.debit > 0 ? '#fef3c7' : '#d1fae5',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${entry.type === 'opening' ? '#d1d5db' :
                                                            entry.debit > 0 ? '#fbbf24' : '#10b981'
                                                        }`,
                                                    cursor: entry.type !== 'opening' ? 'pointer' : 'default',
                                                    transition: 'transform 0.1s, box-shadow 0.1s',
                                                    ':hover': entry.type !== 'opening' ? {
                                                        transform: 'scale(1.02)',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                                    } : {}
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '6px'
                                                }}>
                                                    <div style={{ flex: 1 }}>
                                                        <span style={{ fontWeight: '600', fontSize: '0.875rem', display: 'block' }}>
                                                            {entry.type === 'opening' ? '🔵 Opening' :
                                                                entry.type === 'purchase' ? '📦 Purchase' :
                                                                    '💵 Payment'}
                                                            <span style={{
                                                                marginLeft: '8px',
                                                                color: '#6b7280',
                                                                fontWeight: '400',
                                                                fontSize: '0.75rem'
                                                            }}>
                                                                {entry.doc_type}
                                                            </span>
                                                        </span>
                                                        <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '2px' }}>
                                                            {formatDate(entry.date)}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        {entry.debit > 0 && (
                                                            <div style={{
                                                                fontWeight: '700',
                                                                color: '#b45309',
                                                                fontSize: '0.875rem'
                                                            }}>
                                                                Dr {formatCurrency(entry.debit)}
                                                            </div>
                                                        )}
                                                        {entry.credit > 0 && (
                                                            <div style={{
                                                                fontWeight: '700',
                                                                color: '#065f46',
                                                                fontSize: '0.875rem'
                                                            }}>
                                                                Cr {formatCurrency(entry.credit)}
                                                            </div>
                                                        )}
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: '#6b7280',
                                                            marginTop: '2px',
                                                            fontWeight: '600'
                                                        }}>
                                                            Bal: {formatCurrency(Math.abs(entry.running_balance || 0))}
                                                            {entry.running_balance > 0 ? ' Dr' : entry.running_balance < 0 ? ' Cr' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                {entry.description && (
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#6b7280',
                                                        marginTop: '4px',
                                                        paddingTop: '4px',
                                                        borderTop: '1px solid rgba(0,0,0,0.1)'
                                                    }}>
                                                        {entry.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // History View
                            <div>
                                {supplierHistory.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📜</div>
                                        <div>No transaction history found</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {supplierHistory.map((item, index) => (
                                            <div
                                                key={index}
                                                onClick={() => item.type !== 'opening' && handleEditTransaction(item)}
                                                style={{
                                                    background: '#f3f4f6',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #d1d5db',
                                                    cursor: item.type !== 'opening' ? 'pointer' : 'default',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (item.type !== 'opening') {
                                                        e.currentTarget.style.transform = 'scale(1.02)';
                                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                                        {item.type === 'opening' ? '🔵 Opening' :
                                                            item.type === 'purchase' ? '📦 Purchase' :
                                                                '💵 Payment'}
                                                    </span>
                                                    <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>
                                                        {item.debit > 0 ? `Dr ${formatCurrency(item.debit)}` :
                                                            item.credit > 0 ? `Cr ${formatCurrency(item.credit)}` :
                                                                formatCurrency(item.amount || 0)}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                                                    {formatDate(item.date)}
                                                </div>
                                                {item.description && (
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#6b7280',
                                                        marginTop: '4px'
                                                    }}>
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Edit Transaction Modal */}
                    {editingTransaction && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 10000
                        }}>
                            <div style={{
                                background: 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                maxWidth: '500px',
                                width: '90%',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                            }}>
                                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937' }}>
                                    Edit {editingTransaction.type === 'purchase' ? 'Purchase' : 'Payment'}
                                </h3>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: '500' }}>
                                        Amount (PKR)
                                    </label>
                                    <input
                                        type="number"
                                        value={editingTransaction.amount || editingTransaction.debit || editingTransaction.credit || 0}
                                        onChange={(e) => setEditingTransaction({
                                            ...editingTransaction,
                                            amount: parseFloat(e.target.value)
                                        })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: '500' }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={editingTransaction.description || ''}
                                        onChange={(e) => setEditingTransaction({
                                            ...editingTransaction,
                                            description: e.target.value
                                        })}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleCancelEdit}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#6b7280',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveTransaction}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FloatingSupplierPanel;
