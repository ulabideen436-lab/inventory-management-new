# 🎯 Persistent State Usage Guide

## Quick Start for Developers

### 1. Import the Hook

```javascript
import { usePersistentState } from '../hooks/usePersistentState';
```

### 2. Use in Component

Replace regular `useState` with `usePersistentState`:

```javascript
// Before (non-persistent)
const [search, setSearch] = useState('');
const [currentPage, setCurrentPage] = useState(1);

// After (persistent)
const [search, setSearch] = usePersistentState('my_component_search', '');
const [currentPage, setCurrentPage] = usePersistentState('my_component_page', 1);
```

### 3. Naming Convention

Use a unique prefix for your component to avoid conflicts:

```javascript
// ✅ Good - Clear component prefix
'sales_filter_from'
'products_search'
'customers_selected'

// ❌ Bad - Generic names that could conflict
'from'
'search'
'selected'
```

## 📋 Complete Example

```javascript
import React, { useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';

function MyComponent() {
  // Persistent states (survive page navigation)
  const [searchTerm, setSearchTerm] = usePersistentState('mycomp_search', '');
  const [filterStatus, setFilterStatus] = usePersistentState('mycomp_status', 'all');
  const [currentPage, setCurrentPage] = usePersistentState('mycomp_page', 1);
  const [sortOrder, setSortOrder] = usePersistentState('mycomp_sort', 'desc');
  
  // Complex object state
  const [filters, setFilters] = usePersistentState('mycomp_filters', {
    category: '',
    minPrice: 0,
    maxPrice: 1000,
    inStock: true
  });

  // Non-persistent states (reset on page load)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setCurrentPage(1);
    setSortOrder('desc');
    setFilters({
      category: '',
      minPrice: 0,
      maxPrice: 1000,
      inStock: true
    });
  };

  return (
    <div>
      <input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      
      <select 
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button onClick={clearFilters}>Clear Filters</button>
      
      {/* Your component content */}
    </div>
  );
}

export default MyComponent;
```

## 🔑 Supported Data Types

The hook automatically handles JSON serialization:

```javascript
// Strings
const [name, setName] = usePersistentState('key', 'default');

// Numbers
const [count, setCount] = usePersistentState('key', 0);
const [price, setPrice] = usePersistentState('key', 99.99);

// Booleans
const [isActive, setIsActive] = usePersistentState('key', false);

// Arrays
const [items, setItems] = usePersistentState('key', []);
const [tags, setTags] = usePersistentState('key', ['tag1', 'tag2']);

// Objects
const [user, setUser] = usePersistentState('key', { name: '', age: 0 });
const [filters, setFilters] = usePersistentState('key', {
  search: '',
  category: '',
  status: 'all'
});

// Null
const [selected, setSelected] = usePersistentState('key', null);
```

## ⚠️ What NOT to Store

```javascript
// ❌ Don't store sensitive data
const [password, setPassword] = usePersistentState('pwd', ''); // Bad!
const [token, setToken] = usePersistentState('token', ''); // Bad!

// ❌ Don't store large datasets
const [allProducts, setAllProducts] = usePersistentState('products', []); // Bad!
const [transactions, setTransactions] = usePersistentState('trans', []); // Bad!

// ❌ Don't store functions or complex objects
const [handler, setHandler] = usePersistentState('handler', () => {}); // Won't work!
const [date, setDate] = usePersistentState('date', new Date()); // Will be string

// ✅ Do store UI preferences
const [viewMode, setViewMode] = usePersistentState('view', 'grid'); // Good!
const [pageSize, setPageSize] = usePersistentState('size', 20); // Good!
```

## 🧹 Clearing Persistent State

### Option 1: Use Component's Clear Function
```javascript
const clearFilters = () => {
  setSearch(''); // Automatically removes from localStorage
  setStatus('all');
  setPage(1);
};
```

### Option 2: Manual Clear (Browser Console)
```javascript
// Clear specific key
localStorage.removeItem('mycomp_search');

// Clear all keys for a component
Object.keys(localStorage)
  .filter(key => key.startsWith('mycomp_'))
  .forEach(key => localStorage.removeItem(key));

// Clear all localStorage
localStorage.clear();
```

### Option 3: Programmatic Batch Clear
```javascript
const resetAllFilters = () => {
  // Method 1: Set to defaults (recommended)
  setSearch('');
  setStatus('all');
  setFilters({ category: '', minPrice: 0, maxPrice: 1000 });
  
  // Method 2: Direct localStorage manipulation
  const keysToRemove = ['mycomp_search', 'mycomp_status', 'mycomp_filters'];
  keysToRemove.forEach(key => localStorage.removeItem(key));
};
```

## 🔍 Debugging

### Check Current Stored Values
```javascript
// In browser console
console.log(localStorage);

// Get specific value
console.log(localStorage.getItem('sales_filter_from'));

// Get all sales filters
Object.keys(localStorage)
  .filter(key => key.startsWith('sales_'))
  .forEach(key => {
    console.log(`${key}:`, localStorage.getItem(key));
  });
```

### Monitor Changes
```javascript
// Add in your component
useEffect(() => {
  console.log('Search changed:', searchTerm);
  console.log('localStorage value:', localStorage.getItem('mycomp_search'));
}, [searchTerm]);
```

## 🎨 Best Practices

### 1. **Use Descriptive Keys**
```javascript
// ✅ Good
'sales_filter_customer_name'
'products_current_page'
'transactions_date_range'

// ❌ Bad
'filter'
'page'
'date'
```

### 2. **Group Related States**
```javascript
// ✅ Good - Single object for related filters
const [filters, setFilters] = usePersistentState('mycomp_filters', {
  search: '',
  status: '',
  category: ''
});

// Also acceptable - Separate for frequently updated items
const [search, setSearch] = usePersistentState('mycomp_search', '');
const [status, setStatus] = usePersistentState('mycomp_status', '');
```

### 3. **Provide Sensible Defaults**
```javascript
// ✅ Good - Clear defaults
const [itemsPerPage, setItemsPerPage] = usePersistentState('items_per_page', 20);
const [sortOrder, setSortOrder] = usePersistentState('sort_order', 'desc');

// ❌ Bad - Unclear defaults
const [itemsPerPage, setItemsPerPage] = usePersistentState('items_per_page', 0);
const [sortOrder, setSortOrder] = usePersistentState('sort_order', '');
```

### 4. **Handle UI-Only State Separately**
```javascript
// Persistent (user preferences)
const [showFilters, setShowFilters] = usePersistentState('show_filters', false);

// Non-persistent (temporary UI state)
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [showModal, setShowModal] = useState(false);
```

## 🚀 Performance Tips

### 1. **Don't Overuse**
Only persist state that genuinely improves user experience.

```javascript
// ✅ Good - Persist filters users set
const [filters, setFilters] = usePersistentState('filters', {...});

// ❌ Bad - Don't persist loading states
const [loading, setLoading] = usePersistentState('loading', false);
```

### 2. **Batch Updates for Objects**
```javascript
// ✅ Good - Single update
setFilters(prev => ({
  ...prev,
  search: 'new value',
  status: 'active'
}));

// ❌ Bad - Multiple updates
setFilters(prev => ({ ...prev, search: 'new value' }));
setFilters(prev => ({ ...prev, status: 'active' }));
```

### 3. **Keep Stored Data Small**
```javascript
// ✅ Good - Store IDs only
const [selectedIds, setSelectedIds] = usePersistentState('selected', [1, 2, 3]);

// ❌ Bad - Store full objects
const [selectedItems, setSelectedItems] = usePersistentState('selected', [
  { id: 1, name: '...', description: '...', ... },
  // ... huge objects
]);
```

## 📱 Browser Compatibility

The persistent state hook works in all modern browsers that support localStorage:

- ✅ Chrome 4+
- ✅ Firefox 3.5+
- ✅ Safari 4+
- ✅ Edge (all versions)
- ✅ Opera 10.5+
- ✅ iOS Safari 3.2+
- ✅ Android Browser 2.1+

### Fallback for Older Browsers
The hook includes error handling that falls back to in-memory state if localStorage is unavailable.

## 🎓 Advanced Usage

### Custom Hook Extension
```javascript
// Create a specialized hook for your needs
export const useFilterState = (componentKey, defaultFilters) => {
  const [filters, setFilters] = usePersistentState(
    `${componentKey}_filters`,
    defaultFilters
  );

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  return { filters, setFilters, updateFilter, clearAllFilters };
};

// Usage
const { filters, updateFilter, clearAllFilters } = useFilterState('sales', {
  search: '',
  status: 'all',
  dateRange: []
});
```

## ✅ Checklist for New Components

When adding persistent state to a new component:

- [ ] Import `usePersistentState` hook
- [ ] Choose unique key prefix for component
- [ ] Identify which states should persist
- [ ] Replace `useState` with `usePersistentState`
- [ ] Provide sensible default values
- [ ] Add clear/reset functionality
- [ ] Test navigation (leave and return)
- [ ] Verify localStorage is updated
- [ ] Check for key naming conflicts
- [ ] Update this documentation if needed

## 🎉 You're Ready!

You now have everything you need to implement persistent state in any component. Happy coding! 🚀
