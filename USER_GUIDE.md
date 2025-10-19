# Inventory Management System - User Guide

## How to Access the Application

### 1. **Start the Application**
1. Open two terminals
2. In the first terminal, go to the `backend` folder and run: `npm start`
3. In the second terminal, go to the `frontend` folder and run: `npm start`
4. The application will open in your browser at `http://localhost:3000`

### 2. **Login Process**
1. **Navigate to Login**: The application will redirect you to `/login`
2. **Login Credentials**: Use your username and password
3. **Role-based Access**: After login, you'll be redirected based on your role:
   - **Owner**: Access to `/owner` - Full access to all features
   - **Cashier**: Access to `/cashier` - Limited access

### 3. **Accessing Customer Management**
1. **Login Required**: You must be logged in to access customer data
2. **Owner Access**: Go to `/owner` after logging in
3. **Customer Page**: Navigate to the Customers section

## Customer Management Features

### **View Customers**
- See all customers with their closing balances
- Balance displays as:
  - `₹X Dr` - Customer owes money (Debit balance)
  - `₹X Cr` - We owe customer money (Credit balance)

### **Generate Customer Ledger**
1. Select a customer from the list
2. Click "Generate Ledger" button
3. View detailed transaction history with:
   - Opening balance (Debit/Credit type)
   - All sales (increases customer debt)
   - All payments (reduces customer debt)
   - Running balance calculations

### **Export Ledger to PDF**
1. Generate a customer ledger first
2. Click "Export to PDF" button
3. PDF will be downloaded with customer details and transaction history

## Accounting Logic

### **Opening Balance Types**
- **Debit Opening Balance**: Customer owes money from the start
- **Credit Opening Balance**: We owe money to customer from the start

### **Transaction Types**
- **Sales**: Increase customer debt (Debit to customer account)
- **Payments**: Reduce customer debt (Credit to customer account)

### **Balance Calculation**
- Closing Balance = Opening Balance + Sales - Payments
- If Debit Opening: Add opening amount
- If Credit Opening: Subtract opening amount

## Troubleshooting

### **"Failed to fetch customers" Error**
**Cause**: Not logged in or session expired
**Solution**: 
1. Click the "Go to Login" button in the error message
2. Or manually navigate to `/login`
3. Enter your credentials and log in

### **"Session expired" Error**
**Cause**: Your login session has expired
**Solution**: 
1. You'll be automatically redirected to login after 2 seconds
2. Or click the "Go to Login" button
3. Log in again with your credentials

### **API Connection Issues**
**Cause**: Backend server not running
**Solution**:
1. Ensure backend server is running on port 5000
2. Check terminal for any backend errors
3. Restart the backend server if needed

## Quick Start Steps

1. **Start both servers** (backend on port 5000, frontend on port 3000)
2. **Go to** `http://localhost:3000`
3. **Login** at `/login` with your credentials
4. **Navigate** to `/owner` (if you're an owner)
5. **Access** Customers section
6. **Select customer** and generate ledger
7. **Export to PDF** if needed

## Important Notes

- Always log in before accessing customer data
- The application uses JWT tokens for authentication
- Sessions may expire after a period of inactivity
- Customer balances are calculated in real-time based on all transactions
- PDF export includes complete transaction history and balance calculations