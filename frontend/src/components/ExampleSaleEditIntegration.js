import { useSaleEdit } from '../hooks/useSaleEdit';
import SaleEditModal from './SaleEditModal';

/**
 * Example component showing how to integrate the unified sale edit system
 * This can be used as a template for other components in the application
 */
function ExampleSaleEditIntegration({ sales, onDataRefresh }) {
    const {
        isEditModalOpen,
        editingSaleId,
        openEditModal,
        closeEditModal,
        handleSaveSuccess
    } = useSaleEdit(() => {
        // This callback runs when a sale is successfully saved
        console.log('Sale updated successfully!');
        if (onDataRefresh) {
            onDataRefresh();
        }
    });

    return (
        <div style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '16px'
        }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>
                🔧 Example: Unified Sale Edit Integration
            </h2>

            <p style={{ marginBottom: '2rem', color: '#64748b' }}>
                This example shows how any component in the application can easily integrate
                the unified sale edit system with just a few lines of code.
            </p>

            {/* Simple example of integration */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                marginBottom: '2rem'
            }}>
                <h3 style={{ marginBottom: '1rem', color: '#374151' }}>📋 Quick Integration Demo</h3>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <button
                        onClick={() => openEditModal(1)}
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        ✏️ Edit Sale ID 1
                    </button>

                    <span style={{ color: '#64748b' }}>
                        Click to see the unified edit modal in action
                    </span>
                </div>

                {/* Integration Code Display */}
                <div style={{
                    background: '#1e293b',
                    borderRadius: '8px',
                    padding: '1rem',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: '#e2e8f0',
                    overflow: 'auto'
                }}>
                    <div style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>
            // Three simple steps to integrate:
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        1. Import: useSaleEdit, SaleEditModal
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        2. Use hook: const {'{openEditModal, ...}'} = useSaleEdit(callback)
                    </div>
                    <div>
                        3. Add modal: &lt;SaleEditModal ... /&gt;
                    </div>
                </div>
            </div>

            {/* The Unified Sale Edit Modal */}
            <SaleEditModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                saleId={editingSaleId}
                onSaveSuccess={handleSaveSuccess}
                userRole="owner"
            />
        </div>
    );
}

export default ExampleSaleEditIntegration;