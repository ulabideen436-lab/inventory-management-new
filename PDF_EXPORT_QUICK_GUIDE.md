# 📄 PDF Export Feature - Quick Guide

## How to Use

### Step 1: Navigate to Products Page
Go to the Products section in your inventory management system.

### Step 2: Apply Filters (Optional)
- Use the search box to filter products by name, brand, or ID
- Select a specific supplier from the dropdown
- Choose stock filter (All, In Stock, Low Stock, Out of Stock)

### Step 3: Click Export PDF Button
Look for the green **"📄 Export PDF"** button in the top right corner of the products table (next to "Columns" button).

### Step 4: Select Columns
A modal will open showing all available columns:

```
┌─────────────────────────────────────────────┐
│  📄 Export Stock Details to PDF            │
│  Select the columns you want to include    │
├─────────────────────────────────────────────┤
│  ☑ ID                    ☑ Supplier        │
│  ☑ Product Name          ☑ Location        │
│  ☑ Brand                 ☑ UOM             │
│  ☑ Design Number         ☑ Retail Price    │
│  ☑ Wholesale Price       ☑ Cost Price      │
│  ☑ Stock Quantity                          │
├─────────────────────────────────────────────┤
│  📊 Products to export: 150                │
│  ✅ Selected columns: 11                   │
├─────────────────────────────────────────────┤
│              [Cancel]  [📥 Download PDF]   │
└─────────────────────────────────────────────┘
```

### Step 5: Download PDF
Click the **"📥 Download PDF"** button to generate and download your PDF report.

---

## 🎯 Features

### ✅ What Gets Exported
- Only **filtered/searched products** (not all products)
- Only **selected columns**
- Formatted with proper headers and styling
- Includes generation date and product count

### 📊 Column Options
1. **ID** - Product unique identifier
2. **Product Name** - Full product name
3. **Brand** - Product brand
4. **Design Number** - Model/Design code
5. **Supplier** - Supplier company name
6. **Location** - Storage location
7. **UOM** - Unit of measure
8. **Retail Price** - Selling price (PKR)
9. **Wholesale Price** - Bulk price (PKR)
10. **Cost Price** - Purchase cost (PKR)
11. **Stock Quantity** - Current inventory count

### 🎨 PDF Styling
- **Landscape orientation** for better column fit
- **Blue header** (#2563eb) with white text
- **Alternating row colors** for readability
- **Auto-sized columns** to fit content
- **Formatted prices** with PKR prefix
- **Professional layout** suitable for printing

---

## 💡 Common Use Cases

### 1. Quick Stock Check
**Columns to Select**: ID, Product Name, Stock Quantity
**Purpose**: Simple inventory count

### 2. Pricing Report
**Columns to Select**: Product Name, Retail Price, Wholesale Price, Cost Price
**Purpose**: Price comparison and analysis

### 3. Full Inventory Report
**Columns to Select**: All columns
**Purpose**: Comprehensive stock documentation

### 4. Supplier-Specific Report
**Steps**: 
1. Filter by specific supplier
2. Select: Product Name, Design Number, Stock Quantity, Cost Price
3. Export PDF
**Purpose**: Supplier-specific inventory

### 5. Low Stock Alert
**Steps**:
1. Filter by "Low Stock"
2. Select: Product Name, Supplier, Stock Quantity
3. Export PDF
**Purpose**: Reorder report

---

## 🔧 Tips & Tricks

### Tip 1: Default Selection
All columns are selected by default. Uncheck ones you don't need.

### Tip 2: Filtered Export
The export respects your current filters. Filter first, then export!

### Tip 3: File Naming
PDF files are auto-named with the date: `stock-details-2025-10-19.pdf`

### Tip 4: Column Selection
You must select at least ONE column to download. The button is disabled otherwise.

### Tip 5: Large Datasets
Exporting works fast even with 1000+ products due to client-side processing.

---

## ⚡ Keyboard Shortcuts (Future)
Currently no keyboard shortcuts, but you can:
- Tab through the checkboxes
- Space to toggle checkboxes
- Enter to download (when Download button is focused)

---

## 🖨️ Printing the PDF
After downloading:
1. Open the PDF file
2. Press Ctrl+P (or Cmd+P on Mac)
3. Select printer
4. Click Print

The landscape format is optimized for standard paper sizes.

---

## 📱 Mobile/Tablet Support
The PDF export works on mobile devices too:
- Modal is responsive
- Touch-friendly checkboxes
- PDF downloads to device
- Can be shared via email/apps

---

## 🆘 Troubleshooting

### PDF doesn't download
**Solution**: Check if your browser is blocking popups. Allow popups for this site.

### Some data shows as "-"
**Explanation**: This means the field was empty in the database. It's normal for optional fields.

### Supplier shows as "N/A"
**Possible Cause**: Product has no supplier assigned
**Solution**: Assign a supplier to the product

### Wrong products in PDF
**Check**: Make sure you applied the correct filters before exporting

### Can't click Download button
**Reason**: No columns selected
**Solution**: Select at least one column

---

## 📊 Example PDF Output

```
╔═══════════════════════════════════════════════════════╗
║                 Stock Details Report                  ║
║         Generated: 10/19/2025, 10:30:45 AM           ║
║              Total Products: 150                      ║
╠═══════════════════════════════════════════════════════╣
║ ID │ Product Name  │ Brand │ Stock │ Retail Price    ║
╠════╪═══════════════╪═══════╪═══════╪═════════════════╣
║ 1  │ Widget A      │ ABC   │ 100   │ PKR 1,500.00   ║
║ 2  │ Widget B      │ XYZ   │ 50    │ PKR 2,000.00   ║
║ 3  │ Gadget C      │ ABC   │ 25    │ PKR 750.00     ║
║ ...                                                   ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎓 Best Practices

1. **Filter First**: Apply filters before exporting for targeted reports
2. **Select Wisely**: Choose only needed columns for cleaner output
3. **Regular Exports**: Export weekly/monthly for record keeping
4. **Organize Files**: Rename PDFs with descriptive names after download
5. **Backup**: Keep exported PDFs as inventory snapshots

---

## 🔄 Updates & Improvements

### Version 1.0.0 (Current)
- ✅ Basic PDF export with column selection
- ✅ Landscape orientation
- ✅ Formatted pricing
- ✅ Supplier name resolution
- ✅ Professional styling

### Planned Features
- 📅 Date range filters in PDF header
- 🎨 Custom color themes
- 📧 Email PDF directly
- 💾 Save column preferences
- 📊 Include charts/graphs
- 🏢 Company logo support

---

**Need Help?** Contact your system administrator or refer to the main documentation.

**Last Updated**: October 19, 2025  
**Feature Version**: 1.0.0
