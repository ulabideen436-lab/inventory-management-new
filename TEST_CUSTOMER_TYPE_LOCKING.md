# 🧪 Customer Type Locking - Comprehensive Test Guide

## Test Date: October 19, 2025

## 📋 Overview
This document tests all features related to customer type locking in sale editing.

---

## ✅ Test 1: Database Cleanup
**Objective:** Verify all retail customers are deleted

### Steps:
1. Open MySQL/Database tool
2. Run query: `SELECT * FROM customers WHERE type = 'retail';`

**Expected Result:** 
- ✅ Should return 0 rows (no retail customers)

**Actual Result:** 
- [ ] PASS
- [ ] FAIL - Details: _______________

---

## ✅ Test 2: Customer List Check
**Objective:** Verify only wholesale customers exist

### Steps:
1. Navigate to Customers page
2. Check all customer types

**Expected Result:**
- ✅ All customers should be type "long-term" or "wholesale"
- ✅ No retail type customers visible

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Details: _______________

---

## ✅ Test 3: Sales List - Type Column
**Objective:** Verify new "Type" column displays correctly

### Steps:
1. Navigate to Sales page
2. Observe the table columns
3. Check the Type column values

**Expected Result:**
- ✅ New "🏪 Type" column exists after "Brand" column
- ✅ Sales with customers show "🏪 Wholesale" (green badge)
- ✅ Sales without customers show "🚶 Retail" (blue badge)

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Details: _______________

---

## ✅ Test 4: Edit Wholesale Sale - Customer Selection
**Objective:** Verify customer selection works for wholesale sales

### Steps:
1. Find a sale with a customer (Wholesale type)
2. Click Edit
3. Check the customer section
4. Click in the customer search box
5. Type to search for customers

**Expected Result:**
- ✅ Badge shows "🏪 Wholesale Only"
- ✅ Customer search box is enabled
- ✅ Clicking in search box shows dropdown
- ✅ Dropdown shows only wholesale customers
- ✅ Can select different wholesale customer
- ✅ Message: "You can change to another wholesale customer, but cannot switch to retail"

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Details: _______________

**Console Output:**
```
Check browser console (F12) for:
🔍 Customer Search Debug: { totalCustomers: X, ... }
📋 Fetched customers: X customers
```

---

## ✅ Test 5: Edit Retail Sale - Customer Blocked
**Objective:** Verify customers cannot be added to retail sales

### Steps:
1. Find a sale WITHOUT a customer (Retail/Walk-in type)
2. Click Edit
3. Check the customer section
4. Try to click in the customer search box

**Expected Result:**
- ✅ Badge shows "🚶 Retail Only"
- ✅ Customer search box is enabled but...
- ✅ No customers should appear in dropdown
- ✅ OR dropdown shows: "🚫 Cannot add customer to retail sale"
- ✅ Message: "Retail sales cannot add customers. Customer type is locked to Retail."

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Details: _______________

---

## ✅ Test 6: Customer Type Dropdown Locked
**Objective:** Verify Customer Type dropdown is disabled

### Steps:
1. Open any sale for editing (wholesale or retail)
2. Scroll to "Sale Settings" section
3. Try to click "Customer Type" dropdown

**Expected Result:**
- ✅ Customer Type dropdown is disabled (grayed out)
- ✅ Shows 🔒 lock icon
- ✅ Cursor shows "not-allowed"
- ✅ Message: "🔒 Customer type is locked and cannot be changed"

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Details: _______________

---

## ✅ Test 7: Save Wholesale Sale with Different Customer
**Objective:** Verify can save sale with different wholesale customer

### Steps:
1. Edit a wholesale sale
2. Change to a different wholesale customer
3. Click "Save Changes"
4. Check if sale updates successfully

**Expected Result:**
- ✅ Can select different customer
- ✅ Save succeeds
- ✅ Success message: "Sale updated successfully!"
- ✅ Modal closes after save
- ✅ Sales list refreshes
- ✅ Sale still shows as Wholesale type

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Details: _______________

---

## ✅ Test 8: Backend API Protection
**Objective:** Verify backend rejects customer_type changes

### Steps:
1. Open browser DevTools (F12) → Network tab
2. Edit any sale
3. Make any change (quantity, etc.)
4. Click Save
5. Check the PUT request payload

**Expected Result:**
- ✅ Request payload should NOT include "customer_type" field
- ✅ Response status: 200 OK
- ✅ If customer_type was sent, backend would return 403 Forbidden

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Details: _______________

**Request Payload:**
```json
{
  "customer_id": ...,
  // "customer_type": ... ← Should NOT be present
  "status": "...",
  "items": [...],
  ...
}
```

---

## ✅ Test 9: Customer Search Filtering
**Objective:** Verify search filters customers correctly

### Steps:
1. Edit a wholesale sale
2. Click customer search box (should show all wholesale customers)
3. Type part of a customer name
4. Verify filtered results

**Expected Result:**
- ✅ Empty search shows all wholesale customers
- ✅ Typing filters customers by name
- ✅ Typing filters customers by brand name
- ✅ Only shows wholesale customers (if editing wholesale sale)

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Details: _______________

---

## ✅ Test 10: Modal State Reset
**Objective:** Verify modal clears data between sales

### Steps:
1. Edit Sale #1 (e.g., Sale #47)
2. Note the customer and items
3. Close modal
4. Edit Sale #2 (different sale)
5. Verify no data from Sale #1 appears

**Expected Result:**
- ✅ Modal shows fresh data for Sale #2
- ✅ No leftover items from Sale #1
- ✅ No leftover customer from Sale #1
- ✅ Console shows: "✅ Loaded products: X" and "📝 Loading sale ID: Y"

**Actual Result:**
- [ ] PASS
- [ ] FAIL - Details: _______________

---

## 🐛 Known Issues / Notes

1. **Issue:** _________________________________
   - **Severity:** High / Medium / Low
   - **Steps to Reproduce:** _________________
   - **Workaround:** ________________________

2. **Issue:** _________________________________
   - **Severity:** High / Medium / Low
   - **Steps to Reproduce:** _________________
   - **Workaround:** ________________________

---

## 📊 Test Summary

**Total Tests:** 10
**Passed:** _____ / 10
**Failed:** _____ / 10
**Pass Rate:** _____ %

**Overall Status:** 
- [ ] ✅ All tests passed
- [ ] ⚠️ Some tests failed (see details above)
- [ ] ❌ Critical failures

---

## 🎯 Tested Features Summary

### ✅ Implemented Features:
- [x] Deleted all retail customers from database
- [x] Added "Type" column to sales list
- [x] Customer type dropdown disabled in edit mode
- [x] Customer selection enabled for wholesale sales
- [x] Customer selection blocked for retail sales
- [x] Customer filtering by type in edit mode
- [x] Backend API protection against type changes
- [x] Modal state cleanup between sales
- [x] Customer search with filtering
- [x] Visual indicators (badges, icons, messages)

### 🎨 UI Enhancements:
- [x] Color-coded sale type badges (Wholesale=green, Retail=blue)
- [x] Lock icons on disabled fields
- [x] Contextual help messages
- [x] Warning messages for restrictions
- [x] Debug console logging

---

## 🔧 Developer Notes

### Console Debugging:
```javascript
// Expected console logs when opening edit modal:
📋 Fetched customers: X customers
✅ Loaded products: Y
📝 Loading sale ID: Z
🔍 Customer Search Debug: {...}
🔍 Customer Type Matching: {...}
```

### Database State:
```sql
-- Check customers
SELECT type, COUNT(*) FROM customers GROUP BY type;
-- Expected: Only 'long-term' or 'longterm' or 'wholesale'

-- Check sales
SELECT customer_type, COUNT(*) FROM sales GROUP BY customer_type;
-- Expected: 'retail' and 'longterm'

-- Check orphaned sales
SELECT COUNT(*) FROM sales s 
LEFT JOIN customers c ON s.customer_id = c.id 
WHERE s.customer_id IS NOT NULL AND c.id IS NULL;
-- Expected: 0
```

---

## 📝 Test Conducted By

**Name:** _________________________
**Date:** _________________________
**Time:** _________________________
**Environment:** Production / Staging / Development

---

## ✅ Sign-off

- [ ] All critical tests passed
- [ ] Known issues documented
- [ ] Ready for production

**Signature:** _____________________ **Date:** __________
