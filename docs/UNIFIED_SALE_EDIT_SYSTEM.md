# Unified Sale Edit Component System

## Overview

The Unified Sale Edit Component provides a comprehensive, professional-grade interface for editing sales transactions with full control across the entire application. This system replaces all previous edit functionality with a single, powerful, and consistent editing experience.

## Components

### 1. SaleEditModal Component
**Location**: `src/components/SaleEditModal.js`

A comprehensive modal component that provides full editing capabilities for sales transactions.

#### Features:
- **Full Sale Control**: Edit all aspects of a sale including customer, items, discounts, status, and metadata
- **Real-time Calculations**: Automatic calculation of totals, discounts, and final amounts
- **Professional UI**: Modern, responsive design with professional styling
- **Item Management**: Add, remove, and modify sale items with full discount control
- **Customer Management**: Search and assign customers with live search
- **Role-based Access**: Configurable permissions based on user role
- **Validation**: Comprehensive input validation and error handling
- **Responsive Design**: Works perfectly on all screen sizes

#### Props:
```javascript
{
  isOpen: boolean,          // Controls modal visibility
  onClose: function,        // Callback when modal is closed
  saleId: string|number,    // ID of the sale to edit
  onSaveSuccess: function,  // Callback when save is successful
  userRole: string          // User role for permission control ('owner', 'manager', 'cashier')
}
```

#### Usage Example:
```javascript
import SaleEditModal from './components/SaleEditModal';

function MyComponent() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);

  const handleEditSale = (saleId) => {
    setEditingSaleId(saleId);
    setShowEditModal(true);
  };

  return (
    <>
      <button onClick={() => handleEditSale(123)}>Edit Sale</button>
      
      <SaleEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        saleId={editingSaleId}
        onSaveSuccess={() => {
          // Refresh your data here
          fetchSalesData();
        }}
        userRole="owner"
      />
    </>
  );
}
```

### 2. useSaleEdit Hook
**Location**: `src/hooks/useSaleEdit.js`

A custom React hook that simplifies state management for the sale edit modal.

#### Features:
- **State Management**: Handles all modal state automatically
- **Simple API**: Easy-to-use functions for opening/closing modal
- **Callback Integration**: Built-in support for save success callbacks

#### Usage Example:
```javascript
import { useSaleEdit } from '../hooks/useSaleEdit';
import SaleEditModal from '../components/SaleEditModal';

function SalesTable() {
  const {
    isEditModalOpen,
    editingSaleId,
    openEditModal,
    closeEditModal,
    handleSaveSuccess
  } = useSaleEdit(() => {
    // This runs when save is successful
    fetchSalesData();
  });

  return (
    <>
      <table>
        {sales.map(sale => (
          <tr key={sale.id}>
            <td>{sale.bill_number}</td>
            <td>
              <button onClick={() => openEditModal(sale.id)}>
                Edit
              </button>
            </td>
          </tr>
        ))}
      </table>

      <SaleEditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        saleId={editingSaleId}
        onSaveSuccess={handleSaveSuccess}
        userRole="owner"
      />
    </>
  );
}
```

## Integration Guide

### Step 1: Import the Component
```javascript
import SaleEditModal from './components/SaleEditModal';
// Optional: Use the hook for easier state management
import { useSaleEdit } from './hooks/useSaleEdit';
```

### Step 2: Add State Management
```javascript
// Option A: Manual state management
const [showEditModal, setShowEditModal] = useState(false);
const [editingSaleId, setEditingSaleId] = useState(null);

// Option B: Using the hook (recommended)
const {
  isEditModalOpen,
  editingSaleId,
  openEditModal,
  closeEditModal,
  handleSaveSuccess
} = useSaleEdit(onSaveSuccessCallback);
```

### Step 3: Add Edit Triggers
```javascript
// In your table, list, or card components
<button onClick={() => openEditModal(sale.id)}>
  Edit Sale
</button>
```

### Step 4: Add the Modal Component
```javascript
<SaleEditModal
  isOpen={isEditModalOpen}
  onClose={closeEditModal}
  saleId={editingSaleId}
  onSaveSuccess={handleSaveSuccess}
  userRole={currentUserRole}
/>
```

## Implementation Examples

### 1. Sales Management Page
```javascript
// Already implemented in src/components/Sales.js
import SaleEditModal from './SaleEditModal';

// In the component:
const handleEditTransaction = (sale) => {
  setEditingSaleId(sale.id);
  setShowEditModal(true);
};

// In action buttons:
<button onClick={() => handleEditTransaction(sale)}>
  ✏️ Edit
</button>
```

### 2. Dashboard Quick Edit
```javascript
function Dashboard() {
  const { openEditModal, ... } = useSaleEdit(() => refreshDashboard());

  return (
    <div className="recent-sales">
      {recentSales.map(sale => (
        <div key={sale.id} className="sale-card">
          <span>#{sale.bill_number}</span>
          <button onClick={() => openEditModal(sale.id)}>
            Quick Edit
          </button>
        </div>
      ))}
      
      <SaleEditModal {...modalProps} />
    </div>
  );
}
```

### 3. Customer Profile - Customer Sales
```javascript
function CustomerProfile({ customerId }) {
  const { openEditModal, ... } = useSaleEdit(() => fetchCustomerSales());

  return (
    <div className="customer-sales">
      <h3>Customer Sales History</h3>
      {customerSales.map(sale => (
        <div key={sale.id} className="sale-row">
          <span>{sale.date}</span>
          <span>{sale.total}</span>
          <button onClick={() => openEditModal(sale.id)}>
            Edit
          </button>
        </div>
      ))}
      
      <SaleEditModal {...modalProps} userRole="manager" />
    </div>
  );
}
```

### 4. Invoice View with Edit Option
```javascript
function InvoiceView({ saleId }) {
  const { openEditModal, ... } = useSaleEdit(() => refreshInvoice());

  return (
    <div className="invoice">
      <div className="invoice-header">
        <h2>Invoice #{billNumber}</h2>
        <button onClick={() => openEditModal(saleId)}>
          ✏️ Edit Sale
        </button>
      </div>
      
      {/* Invoice content */}
      
      <SaleEditModal {...modalProps} />
    </div>
  );
}
```

## User Role Permissions

The component supports role-based access control:

### Owner Role
- **Full Access**: Can edit all aspects of any sale
- **Advanced Features**: Access to all editing capabilities
- **Financial Control**: Can modify prices, discounts, and totals

### Manager Role
- **Most Access**: Can edit sales within their scope
- **Limited Financial**: May have restrictions on large discounts
- **Staff Oversight**: Can edit sales by their team

### Cashier Role
- **Basic Access**: Can edit their own sales
- **Limited Time**: May only edit recent sales
- **Restricted Financial**: Cannot modify prices beyond set limits

## API Integration

The component automatically integrates with your existing API endpoints:

### Required Endpoints:
- `GET /sales/{id}` - Fetch sale details for editing
- `PUT /sales/{id}` - Update sale with modifications
- `GET /customers` - Fetch customers for selection
- `GET /products` - Fetch products for adding to sale

### Request/Response Format:
The component expects standard JSON responses and handles all API communication automatically.

## Styling and Theming

The component uses inline styles for maximum compatibility but can be customized:

### Color Scheme:
- Primary: Blue gradients for main actions
- Secondary: Purple gradients for edit actions
- Success: Green for completed actions
- Warning: Amber for pending states
- Danger: Red for delete/cancel actions

### Responsive Design:
- Desktop: Two-column layout with full features
- Tablet: Adapted layout with collapsed sections
- Mobile: Single-column stacked layout

## Best Practices

### 1. Error Handling
```javascript
const handleSaveSuccess = () => {
  try {
    await fetchSalesData();
    showSuccessNotification('Sale updated successfully');
  } catch (error) {
    showErrorNotification('Failed to refresh data');
  }
};
```

### 2. Loading States
```javascript
const [isRefreshing, setIsRefreshing] = useState(false);

const handleSaveSuccess = async () => {
  setIsRefreshing(true);
  await fetchSalesData();
  setIsRefreshing(false);
};
```

### 3. Optimistic Updates
```javascript
const handleSaveSuccess = () => {
  // Update local state immediately for better UX
  updateLocalSaleData(editingSaleId, newData);
  // Then refresh from server
  fetchSalesData();
};
```

## Migration from Old Edit System

### Before (Old System):
```javascript
// Multiple different edit modals and components
// Inconsistent styling and behavior
// Limited functionality
// Difficult to maintain
```

### After (Unified System):
```javascript
// Single powerful edit component
// Consistent professional styling
// Full editing capabilities
// Easy to maintain and extend
```

## Future Enhancements

1. **Bulk Edit**: Edit multiple sales at once
2. **Templates**: Save and apply edit templates
3. **Audit Trail**: Track all changes with user attribution
4. **Advanced Permissions**: More granular role-based controls
5. **Offline Support**: Edit sales when offline
6. **Integration**: Connect with external accounting systems

## Support and Maintenance

The unified sale edit system is designed to be:
- **Self-contained**: Minimal dependencies
- **Well-documented**: Comprehensive documentation
- **Type-safe**: Full TypeScript support (when converted)
- **Tested**: Comprehensive test coverage
- **Accessible**: WCAG 2.1 AA compliance

For support or feature requests, refer to the development team or project documentation.