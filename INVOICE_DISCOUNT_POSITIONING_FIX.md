# Invoice Discount Positioning Fix - Summary

## Problem
The user reported that "overall discount applied should be at wright position below the total then subtract and give total" - meaning the sale-level discount wasn't positioned correctly in invoices.

## Previous Issues
1. The invoice was only showing item-level discounts
2. Sale-level discounts were not displayed separately
3. The total calculation didn't clearly show the discount breakdown

## Solution Implemented

### 1. Updated Calculation Logic
```javascript
// Old logic (only item discounts)
const totalDiscount = saleProducts.reduce((sum, p) => sum + Number(p.discount || 0), 0);
const totalNet = totalGross - totalDiscount;

// New logic (separated item and sale discounts)
const totalItemDiscount = saleProducts.reduce((sum, p) => sum + Number(p.discount || 0), 0);
const subtotal = totalGross - totalItemDiscount;
const saleDiscount = Number(sale?.discount_amount || 0);
const totalNet = subtotal - saleDiscount;
```

### 2. Updated PDF Layout
The PDF now shows:
1. **Items table** with individual item discounts
2. **Subtotal row** (after item discounts)
3. **Overall Discount row** (sale-level discount, highlighted in orange)
4. **Final Total row** (highlighted in blue)

### 3. Updated HTML Display
The HTML table now shows proper progression:
```
Items with individual discounts
└── Subtotal: PKR X.XX
└── Overall Discount: -PKR Y.YY (if applicable)
└── FINAL TOTAL: PKR Z.ZZ
```

## Example for Sale #37
Based on our previous calculations:
- Items Gross: PKR 45.00
- Item Discounts: PKR 12.00
- **Subtotal: PKR 33.00**
- **Overall Discount: -PKR 10.00**
- **FINAL TOTAL: PKR 23.00**

## Visual Improvements
1. **Subtotal** - Light gray background
2. **Overall Discount** - Light orange background with orange text
3. **Final Total** - Dark blue background with white text

## Files Modified
- `frontend/src/components/SaleInvoice.js` - Main invoice component
  - Updated calculation logic
  - Fixed PDF generation layout
  - Fixed HTML table display

## Expected User Experience
When users generate an invoice, they will now see:
1. Clear breakdown of item-level vs sale-level discounts
2. Proper positioning with overall discount below subtotal
3. Professional visual hierarchy with color coding
4. Accurate final total after all discounts

The invoice now properly shows the discount progression that users expect in professional invoicing systems.