import axios from 'axios';
import { createContext, useContext, useState } from 'react';

/**
 * CustomerContext - Global state for managing customer selection and history
 * This allows customer information to persist across page navigation
 */
const CustomerContext = createContext();

export const useCustomerContext = () => {
    const context = useContext(CustomerContext);
    if (!context) {
        throw new Error('useCustomerContext must be used within CustomerProvider');
    }
    return context;
};

export const CustomerProvider = ({ children }) => {
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerPanel, setShowCustomerPanel] = useState(false);
    const [customerLedger, setCustomerLedger] = useState([]);
    const [customerHistory, setCustomerHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const token = localStorage.getItem('token');

    // Fetch customer ledger
    const fetchCustomerLedger = async (customerId) => {
        if (!customerId) return;

        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/customers/${customerId}/ledger`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomerLedger(res.data);
        } catch (err) {
            console.error("Error fetching ledger:", err);
            setCustomerLedger([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch customer history
    const fetchCustomerHistory = async (customerId, filters = {}) => {
        if (!customerId) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const res = await axios.get(
                `http://localhost:5000/customers/${customerId}/history?${params.toString()}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCustomerHistory(res.data);
        } catch (err) {
            console.error("Error fetching history:", err);
            setCustomerHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Select a customer and show their panel
    const selectCustomer = async (customer) => {
        setSelectedCustomer(customer);
        setShowCustomerPanel(true);

        if (customer?.id) {
            await Promise.all([
                fetchCustomerLedger(customer.id),
                fetchCustomerHistory(customer.id)
            ]);
        }
    };

    // Close customer panel
    const closeCustomerPanel = () => {
        setShowCustomerPanel(false);
    };

    // Clear customer selection completely
    const clearCustomer = () => {
        setSelectedCustomer(null);
        setShowCustomerPanel(false);
        setCustomerLedger([]);
        setCustomerHistory([]);
    };

    // Refresh customer data
    const refreshCustomerData = async () => {
        if (selectedCustomer?.id) {
            await Promise.all([
                fetchCustomerLedger(selectedCustomer.id),
                fetchCustomerHistory(selectedCustomer.id)
            ]);
        }
    };

    // Update customer balance
    const updateCustomerBalance = (newBalance) => {
        if (selectedCustomer) {
            setSelectedCustomer(prev => ({
                ...prev,
                balance: newBalance
            }));
        }
    };

    const value = {
        selectedCustomer,
        showCustomerPanel,
        customerLedger,
        customerHistory,
        isLoading,
        selectCustomer,
        closeCustomerPanel,
        clearCustomer,
        refreshCustomerData,
        updateCustomerBalance,
        fetchCustomerLedger,
        fetchCustomerHistory
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
};

export default CustomerContext;
