import { pool } from '../models/db.js';
import { softDeleteItem } from '../services/deletedItemsService.js';
import { validateProduct } from '../utils/validation.js';

export async function getProducts(req, res) {
  try {
    const { search, include_deleted } = req.query;
    let query = 'SELECT * FROM products';
    let params = [];
    let whereClauses = [];

    // Exclude deleted products by default (unless include_deleted is true)
    if (include_deleted !== 'true') {
      whereClauses.push('deleted_at IS NULL');
    }

    // Build search condition
    if (search) {
      whereClauses.push('(id LIKE ? OR name LIKE ?)');
      params = [`%${search}%`, `%${search}%`];
    }

    // Add WHERE clause if there are conditions
    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Order by most recently added (assuming id is sequential or use created_at if available)
    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get Products Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function addProduct(req, res) {
  console.log('addProduct called with body:', req.body);

  // Validate and sanitize input
  const validation = validateProduct(req.body);
  if (validation.errors.length > 0) {
    console.log('Validation failed:', validation.errors);
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  const { id, name, brand, design_no, location, uom, retail_price, wholesale_price, cost_price, stock_quantity, supplier } = validation.sanitized;

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check if product ID already exists
      const [existing] = await conn.query('SELECT id FROM products WHERE id = ?', [id]);
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Product ID already exists' });
      }

      await conn.query(
        'INSERT INTO products (id, name, brand, design_no, location, uom, retail_price, wholesale_price, cost_price, stock_quantity, total_sold, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, brand || null, design_no || null, location || null, uom, retail_price, wholesale_price || null, cost_price || null, stock_quantity || 0, 0, supplier || null]
      );

      await conn.commit();
      console.log(`Product added successfully: ${name} (ID: ${id})`);
      res.status(201).json({
        message: 'Product added successfully',
        productId: id
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error adding product:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sql: err.sql
    });
    res.status(500).json({
      message: 'Failed to add product',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, brand, design_no, location, uom, retail_price, wholesale_price, cost_price, stock_quantity, supplier } = req.body;

  try {
    console.log('📝 Update Product Request:', {
      id,
      body: req.body,
      user: req.user?.username || 'unknown'
    });

    // Input validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Product name is required' });
    }

    if (!uom || uom.trim() === '') {
      return res.status(400).json({ message: 'Unit of measure is required' });
    }

    // Validate numeric fields
    const validateNumber = (value, fieldName) => {
      // Handle empty strings, null, undefined
      if (value === null || value === undefined || value === '' || value === 'null') {
        return null;
      }

      // Convert to string first, then parse
      const stringValue = String(value).trim();
      if (stringValue === '') {
        return null;
      }

      const parsed = parseFloat(stringValue);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error(`${fieldName} must be a valid positive number`);
      }
      return parsed;
    };

    const validatedRetailPrice = validateNumber(retail_price, 'Retail price');
    const validatedWholesalePrice = validateNumber(wholesale_price, 'Wholesale price');
    const validatedCostPrice = validateNumber(cost_price, 'Cost price');
    const validatedStockQuantity = validateNumber(stock_quantity, 'Stock quantity');

    // Check if product exists
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [result] = await pool.query(
      `UPDATE products SET 
        name=?, 
        brand=?, 
        design_no=?, 
        location=?, 
        uom=?, 
        retail_price=?, 
        wholesale_price=?, 
        cost_price=?, 
        stock_quantity=?, 
        supplier=?
       WHERE id=?`,
      [
        name.trim(),
        brand || null,
        design_no || null,
        location || null,
        uom.trim(),
        validatedRetailPrice,
        validatedWholesalePrice,
        validatedCostPrice,
        validatedStockQuantity,
        supplier || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found or no changes made' });
    }

    // Return the updated product
    const [updatedProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    console.log('✅ Product updated successfully:', {
      id,
      affectedRows: result.affectedRows,
      updatedProduct: updatedProduct[0]?.name || 'unknown'
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct[0]
    });
  } catch (err) {
    console.error('Update Product Error:', err);
    if (err.message.includes('must be a valid positive number')) {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
}

export async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    // Check if product exists
    const [existingProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existingProduct.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product has sales history
    const [salesCount] = await pool.query('SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?', [id]);
    if (salesCount[0].count > 0) {
      return res.status(400).json({
        message: `Cannot delete product. This product has ${salesCount[0].count} sales record(s) associated with it. You can deactivate the product instead of deleting.`,
        hasAssociatedData: true,
        associatedRecords: salesCount[0].count,
        dataType: 'sales'
      });
    }

    // Use soft delete
    await softDeleteItem('products', id, req.user.id, 'Product deleted by user');

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Get Product By ID Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
