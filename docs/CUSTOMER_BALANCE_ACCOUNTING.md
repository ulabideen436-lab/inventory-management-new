# Customer Balance Accounting Logic

## Overview
The customer balance calculation follows proper accounting principles, considering the opening balance type (debit/credit) to determine the correct closing balance.

## Accounting Rules

### Opening Balance Types
- **Debit (Dr)**: Customer owes money to the business
- **Credit (Cr)**: Customer has overpaid or has credit with the business

### Closing Balance Calculation

```
If Opening Balance Type = 'debit':
    Closing Balance = Opening Balance + Total Sales - Total Payments

If Opening Balance Type = 'credit':
    Closing Balance = -Opening Balance + Total Sales - Total Payments
```

### Transaction Effects
- **Sales**: Always increase customer debt (debit to customer account)
- **Payments**: Always reduce customer debt (credit to customer account)

## Examples

### Example 1: Debit Opening Balance
- Opening Balance: ₹1,000 Dr
- Sales: ₹500
- Payments: ₹300
- **Closing Balance: ₹1,000 + ₹500 - ₹300 = ₹1,200 Dr**

### Example 2: Credit Opening Balance
- Opening Balance: ₹500 Cr
- Sales: ₹800
- Payments: ₹200
- **Closing Balance: -₹500 + ₹800 - ₹200 = ₹100 Dr**

### Example 3: Credit Opening Balance with High Payments
- Opening Balance: ₹200 Cr
- Sales: ₹300
- Payments: ₹600
- **Closing Balance: -₹200 + ₹300 - ₹600 = -₹500 = ₹500 Cr**

## Display Format
- Positive balances are shown as **Dr** (customer owes money)
- Negative balances are shown as **Cr** (customer has credit)
- Colors: Green for Dr, Red for Cr

## Database Schema
```sql
customers table:
- opening_balance: DECIMAL(10,2) - The amount
- opening_balance_type: ENUM('debit', 'credit') - The type
- closing_balance: DECIMAL(10,2) - Calculated field
```

## Implementation Notes
- The backend calculates closing balance dynamically for each customer
- Frontend displays absolute value with Dr/Cr indicator
- All calculations maintain precision to 2 decimal places
- Error handling ensures fallback to opening balance if calculation fails