import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerContext } from '../context/CustomerContext';

/**
 * FloatingCustomerPanel - A draggable, resizable panel that shows customer info
 * This panel can stay open while navigating between pages
 */
const FloatingCustomerPanel = () => {
    const {
        selectedCustomer,
        showCustomerPanel,
        customerLedger,
        customerHistory,
        isLoading,
        closeCustomerPanel,
        clearCustomer,
        refreshCustomerData
    } = useCustomerContext();

    const navigate = useNavigate();
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' or 'history'

    if (!showCustomerPanel || !selectedCustomer) {
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

    const handleNavigateToSales = () => {
        navigate('/owner');
    };

    const handleNavigateToCustomers = () => {
        navigate('/customers');
    };

    return (
        <div style={{
            position: 'fixed',
            top: isMinimized ? 'auto' : '80px',
            bottom: isMinimized ? '20px' : 'auto',
            right: '20px',
            width: isMinimized ? '320px' : '450px',
            maxHeight: isMinimized ? '60px' : '80vh',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid #3b82f6',
            transition: 'all 0.3s ease'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'move',
                userSelect: 'none'
            }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: '600' }}>
                        👤 {selectedCustomer.name}
                        {selectedCustomer.brand_name && (
                            <span style={{ fontSize: '0.875rem', opacity: 0.9, marginLeft: '8px' }}>
                                ({selectedCustomer.brand_name})
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
                                Balance: <strong>{formatCurrency(selectedCustomer.balance)}</strong>
                            </span>
                            {selectedCustomer.credit_limit && (
                                <span>
                                    Limit: <strong>{formatCurrency(selectedCustomer.credit_limit)}</strong>
                                </span>
                            )}
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
                        onClick={closeCustomerPanel}
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
                            onClick={handleNavigateToSales}
                            style={{
                                background: '#10b981',
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
                            🛒 New Sale
                        </button>
                        <button
                            onClick={handleNavigateToCustomers}
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
                            👥 Manage Customer
                        </button>
                        <button
                            onClick={refreshCustomerData}
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
                                borderBottom: activeTab === 'ledger' ? '2px solid #3b82f6' : 'none',
                                color: activeTab === 'ledger' ? '#3b82f6' : '#6b7280',
                                fontWeight: activeTab === 'ledger' ? '600' : '400',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                marginBottom: '-2px'
                            }}
                        >
                            📊 Ledger ({customerLedger.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: activeTab === 'history' ? 'white' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'history' ? '2px solid #3b82f6' : 'none',
                                color: activeTab === 'history' ? '#3b82f6' : '#6b7280',
                                fontWeight: activeTab === 'history' ? '600' : '400',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                marginBottom: '-2px'
                            }}
                        >
                            📜 History ({customerHistory.length})
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
                            // Ledger View
                            <div>
                                {customerLedger.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
                                        <div>No ledger entries found</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {customerLedger.map((entry, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    background: entry.type === 'debit' ? '#fef3c7' : '#d1fae5',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${entry.type === 'debit' ? '#fbbf24' : '#10b981'}`
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                                        {entry.type === 'debit' ? '🔴 Debit' : '🟢 Credit'}
                                                    </span>
                                                    <span style={{
                                                        fontWeight: '700',
                                                        color: entry.type === 'debit' ? '#b45309' : '#065f46',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {formatCurrency(entry.amount)}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                                                    {formatDate(entry.date)}
                                                </div>
                                                {entry.description && (
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: '#6b7280',
                                                        marginTop: '4px',
                                                        fontStyle: 'italic'
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
                                {customerHistory.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📜</div>
                                        <div>No transaction history found</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {customerHistory.map((item, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    background: '#f3f4f6',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #d1d5db'
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                                        {item.type === 'sale' ? '🛒 Sale' : '💰 Payment'}
                                                    </span>
                                                    <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>
                                                        {formatCurrency(item.amount)}
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
                </>
            )}
        </div>
    );
};

export default FloatingCustomerPanel;
