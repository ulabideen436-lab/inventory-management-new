import { useEffect, useState } from 'react';

/**
 * Custom hook for persisting state in localStorage
 * Automatically saves state changes to localStorage and restores them on mount
 * 
 * @param {string} key - Unique key for localStorage
 * @param {*} defaultValue - Default value if no stored value exists
 * @returns {[*, function]} - State value and setter function
 */
export const usePersistentState = (key, defaultValue) => {
    // Initialize state from localStorage or use default
    const [state, setState] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    // Save to localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.warn(`Error saving localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
};

/**
 * Custom hook for persisting multiple filter states as a single object
 * 
 * @param {string} key - Unique key for localStorage
 * @param {object} defaultFilters - Default filter values
 * @returns {[object, function, function]} - Filters object, setter function, and reset function
 */
export const usePersistentFilters = (key, defaultFilters) => {
    const [filters, setFilters] = usePersistentState(key, defaultFilters);

    // Reset function to clear all filters back to defaults
    const resetFilters = () => {
        setFilters(defaultFilters);
    };

    return [filters, setFilters, resetFilters];
};

export default usePersistentState;
