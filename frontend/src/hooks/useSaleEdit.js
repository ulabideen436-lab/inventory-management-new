import { useState } from 'react';

/**
 * Custom hook for managing sale edit modal state
 * Makes it easy to integrate the SaleEditModal anywhere in the app
 */
export const useSaleEdit = (onSaveSuccess) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSaleId, setEditingSaleId] = useState(null);

    const openEditModal = (saleId) => {
        setEditingSaleId(saleId);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingSaleId(null);
    };

    const handleSaveSuccess = () => {
        if (onSaveSuccess) {
            onSaveSuccess();
        }
        closeEditModal();
    };

    return {
        isEditModalOpen,
        editingSaleId,
        openEditModal,
        closeEditModal,
        handleSaveSuccess
    };
};

/**
 * Quick edit function that can be used directly in event handlers
 * Usage: onClick={() => quickEditSale(sale.id, refreshFunction)}
 */
export const quickEditSale = (saleId, onSaveSuccess) => {
    // This would need to be implemented with a global modal context
    // For now, it's a placeholder for future enhancement
    console.log('Quick edit sale:', saleId);
    if (onSaveSuccess) {
        onSaveSuccess();
    }
};

export default useSaleEdit;