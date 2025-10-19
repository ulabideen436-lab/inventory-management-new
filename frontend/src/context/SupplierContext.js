import axios from 'axios';
import { createContext, useContext, useState } from 'react';

/**
 * SupplierContext - Global state for managing supplier selection and history
 * This allows supplier information to persist across page navigation
 */
const SupplierContext = createContext();

export const useSupplierContext = () => {
    const context = useContext(SupplierContext);
    if (!context) {
        throw new Error('useSupplierContext must be used within SupplierProvider');
    }
    return context;
};

export const SupplierProvider = ({ children }) => {
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showSupplierPanel, setShowSupplierPanel] = useState(false);
    const [supplierLedger, setSupplierLedger] = useState([]);
    const [supplierHistory, setSupplierHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const token = localStorage.getItem('token');

    // Fetch supplier history and ledger
    const fetchSupplierData = async (supplierId) => {
        if (!supplierId) return;

        setIsLoading(true);
        try {
            const res = await axios.get(`http://127.0.0.1:5000/suppliers/${supplierId}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Supplier history response:', res.data);

            if (res.data.ledger && res.data.ledger.length > 0) {
                // Backend provides properly formatted ledger with running balance
                setSupplierLedger(res.data.ledger);
                setSupplierHistory(res.data.ledger);
            } else {
                setSupplierLedger([]);
                setSupplierHistory([]);
            }
        } catch (err) {
            console.error("Error fetching supplier data:", err);
            setSupplierLedger([]);
            setSupplierHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Select a supplier and show their panel
    const selectSupplier = async (supplier) => {
        setSelectedSupplier(supplier);
        setShowSupplierPanel(true);

        if (supplier?.id) {
            await fetchSupplierData(supplier.id);
        }
    };

    // Close supplier panel
    const closeSupplierPanel = () => {
        setShowSupplierPanel(false);
    };

    // Clear supplier selection completely
    const clearSupplier = () => {
        setSelectedSupplier(null);
        setShowSupplierPanel(false);
        setSupplierLedger([]);
        setSupplierHistory([]);
    };

    // Refresh supplier data
    const refreshSupplierData = async () => {
        if (selectedSupplier?.id) {
            await fetchSupplierData(selectedSupplier.id);
        }
    };

    const value = {
        selectedSupplier,
        showSupplierPanel,
        supplierLedger,
        supplierHistory,
        isLoading,
        selectSupplier,
        closeSupplierPanel,
        clearSupplier,
        refreshSupplierData
    };

    return (
        <SupplierContext.Provider value={value}>
            {children}
        </SupplierContext.Provider>
    );
};

export default SupplierContext;
