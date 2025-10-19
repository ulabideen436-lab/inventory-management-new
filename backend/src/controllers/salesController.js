import { pool } from '../models/db.js';
import wsPublisher from '../utils/wsPublisher.js';

export async function createSale(req, res) {
  // Implementation for cashier/owner sale creation with discount support
  const {
    customer_id,
    customer_type,
    items,
    subtotal,
    discount_type,
    discount_value,
    discount_amount,
    total_amount,
    cashier // Accept cashier name from frontend
  } = req.body;

  const cashier_id = req.user && req.user.id;
  const cashier_name = cashier || (req.user && req.user.username) || 'Unknown'; // Use provided cashier name or fallback

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items in sale' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Server-side price validation for customer type pricing security
    console.log(`Validating prices for customer type: ${customer_type || 'retail'}`);
    for (const item of items) {
      if (item.product_id) {
        try {
          const [productRows] = await conn.query(
            'SELECT retail_price, wholesale_price, cost_price FROM products WHERE id = ?',
            [item.product_id]
          );

          if (productRows.length > 0) {
            const product = productRows[0];
            const retailPrice = parseFloat(product.retail_price) || 0;
            const wholesalePrice = parseFloat(product.wholesale_price) || 0;
            const submittedPrice = parseFloat(item.price) || 0;

            let expectedPrice;
            if (customer_type === 'longterm' || customer_type === 'wholesale') {
              expectedPrice = wholesalePrice;
            } else {
              expectedPrice = retailPrice; // Default to retail for 'retail' or null customer_type
            }

            // Allow small floating point differences (within 1 cent)
            const priceDifference = Math.abs(submittedPrice - expectedPrice);
            if (priceDifference > 0.01) {
              console.log(`Price validation failed for product ${item.product_id}: submitted=${submittedPrice}, expected=${expectedPrice}, customer_type=${customer_type}`);
              await conn.rollback();
              return res.status(400).json({
                message: `Invalid price for product ${item.product_name || item.product_id}. Expected ${customer_type === 'longterm' || customer_type === 'wholesale' ? 'wholesale' : 'retail'} price: PKR ${expectedPrice.toFixed(2)}, but received: PKR ${submittedPrice.toFixed(2)}`,
                productId: item.product_id,
                expectedPrice: expectedPrice,
                submittedPrice: submittedPrice,
                customerType: customer_type || 'retail'
              });
            }
          }
        } catch (priceValidationError) {
          console.log(`Warning: Could not validate price for product ${item.product_id}:`, priceValidationError.message);
          // Continue without validation if product not found - this allows for deleted products
        }
      }
    }
    console.log('✅ Price validation passed for all items');

    // Calculate proper totals with correct item-level discount handling
    let calculatedGrossTotal = 0;      // Total before any discounts
    let calculatedItemDiscounts = 0;   // Sum of all item-level discounts
    let calculatedSubtotal = 0;        // Total after item discounts, before sale discount

    // Calculate item-level totals correctly
    for (const item of items) {
      const quantity = Number(item.quantity) || 0;
      const originalPrice = Number(item.price) || Number(item.original_price) || 0;
      const finalPrice = Number(item.final_price) || originalPrice;
      const itemDiscountAmount = Number(item.item_discount_amount) || 0;

      // Calculate item totals
      const itemGrossTotal = quantity * originalPrice;
      const itemNetTotal = quantity * finalPrice;

      // Validate item discount calculation
      const expectedItemTotal = itemGrossTotal - itemDiscountAmount;
      if (Math.abs(itemNetTotal - expectedItemTotal) > 0.01) {
        // If item discount doesn't match, recalculate based on final price
        const correctedItemDiscount = itemGrossTotal - itemNetTotal;
        item.item_discount_amount = Math.max(0, correctedItemDiscount);
      }

      calculatedGrossTotal += itemGrossTotal;
      calculatedItemDiscounts += Number(item.item_discount_amount) || 0;
      calculatedSubtotal += itemNetTotal;
    }

    // Override subtotal if not provided or incorrect
    if (!subtotal || Math.abs(subtotal - calculatedSubtotal) > 0.01) {
      calculatedSubtotal = calculatedSubtotal;
    } else {
      calculatedSubtotal = Number(subtotal);
    }

    // Calculate sale-level discount amounts based on type
    let finalDiscountAmount = 0;
    let discountPercentage = 0;
    let finalTotal = total_amount;

    if (discount_type === 'amount' && discount_value > 0) {
      finalDiscountAmount = Number(discount_value);
      finalTotal = Math.max(0, calculatedSubtotal - finalDiscountAmount);
    } else if (discount_type === 'percentage' && discount_value > 0) {
      discountPercentage = Number(discount_value);
      finalDiscountAmount = (calculatedSubtotal * discountPercentage) / 100;
      finalTotal = Math.max(0, calculatedSubtotal - finalDiscountAmount);
    } else {
      // No sale-level discount
      finalTotal = calculatedSubtotal;
    }

    // Ensure we have a valid final total
    if (!finalTotal || finalTotal < 0) {
      finalTotal = Math.max(0, calculatedSubtotal - finalDiscountAmount);
    }

    // Insert sale with new discount columns
    const [saleResult] = await conn.query(
      `INSERT INTO sales (
        cashier_id, 
        cashier_name,
        customer_id,
        customer_type,
        subtotal,
        discount_type,
        discount_amount, 
        discount_percentage,
        total_amount, 
        status,
        date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        cashier_id,
        cashier_name,
        customer_id || null,
        customer_type || 'retail',
        calculatedSubtotal,
        discount_type || 'none',
        finalDiscountAmount,
        discountPercentage,
        finalTotal,
        'completed'
      ]
    );

    const sale_id = saleResult.insertId;

    if (!sale_id) {
      throw new Error('Failed to create sale record');
    }
    // Insert sale items with item discount support and historical data preservation
    for (const item of items) {
      // Fetch current product data to store as historical snapshot
      let historicalProductData = {
        name: item.product_name || null,
        brand: item.product_brand || null,
        category: item.product_category || null,
        uom: item.product_uom || null
      };

      // If product data wasn't provided in the item, fetch it from products table
      if (!item.product_name && item.product_id) {
        try {
          const [productRows] = await conn.query(
            'SELECT name, brand, category, uom FROM products WHERE id = ?',
            [item.product_id]
          );

          if (productRows.length > 0) {
            const product = productRows[0];
            historicalProductData = {
              name: product.name,
              brand: product.brand,
              category: product.category,
              uom: product.uom
            };
          }
        } catch (productFetchError) {
          console.log(`Warning: Could not fetch product data for ${item.product_id}:`, productFetchError.message);
        }
      }

      await conn.query(
        `INSERT INTO sale_items (
          sale_id, product_id, product_name, product_brand, product_category, product_uom,
          quantity, price, 
          item_discount_type, item_discount_value, item_discount_amount,
          original_price, final_price, discount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sale_id,
          item.product_id,
          historicalProductData.name,
          historicalProductData.brand,
          historicalProductData.category,
          historicalProductData.uom,
          item.quantity,
          item.final_price || item.price, // Use final_price if available, otherwise original price
          item.item_discount_type || 'none',
          item.item_discount_value || 0,
          item.item_discount_amount || 0,
          item.price, // Store original price
          item.final_price || item.price, // Store final price after discount
          0 // Keep legacy discount field for compatibility
        ]
      );

      // Update product stock and total sold with better error handling
      if (item.product_id && item.quantity > 0) {
        const [updateResult] = await conn.query(
          'UPDATE products SET stock_quantity = stock_quantity - ?, total_sold = total_sold + ? WHERE id = ? AND stock_quantity >= ?',
          [item.quantity, item.quantity, item.product_id, item.quantity]
        );

        if (updateResult.affectedRows === 0) {
          // Check if product exists and has sufficient stock
          const [productCheck] = await conn.query(
            'SELECT stock_quantity FROM products WHERE id = ?',
            [item.product_id]
          );

          if (productCheck.length === 0) {
            throw new Error(`Product ${item.product_id} does not exist`);
          }

          const currentStock = productCheck[0].stock_quantity;
          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${currentStock}, Required: ${item.quantity}`);
          }

          // If we get here, try the update again without stock check
          await conn.query(
            'UPDATE products SET stock_quantity = stock_quantity - ?, total_sold = total_sold + ? WHERE id = ?',
            [item.quantity, item.quantity, item.product_id]
          );
        }
      }
    }
    await conn.commit();
    // Publish sale created event to WS server so owner UI can update in real-time
    try {
      wsPublisher.send({
        event: 'sale_created',
        sale_id,
        cashier_id,
        subtotal: calculatedSubtotal,
        discount_type: discount_type || 'none',
        discount_amount: finalDiscountAmount,
        total_amount: finalTotal
      });
    } catch (e) {
      console.error('Failed to publish sale_created event', e.message);
    }
    res.json({
      message: 'Sale created',
      sale_id,
      subtotal: calculatedSubtotal,
      discount_type: discount_type || 'none',
      discount_amount: finalDiscountAmount,
      discount_percentage: discountPercentage,
      total_amount: finalTotal
    });
  } catch (err) {
    await conn.rollback();
    console.error('createSale error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
}

export async function getSoldProducts(req, res) {
  // Get sold products data with comprehensive aggregation by product
  // This now includes deleted products by using sale_items as primary source
  const { product_name, start_date, end_date, customer_name, sort_by = 'total_quantity', sort_order = 'desc' } = req.query;

  try {
    let baseQuery = `
      SELECT 
        si.product_id,
        MAX(si.product_name) as product_name,
        MAX(si.product_brand) as product_brand,
        MAX(si.product_category) as product_category,
        MAX(si.product_uom) as product_uom,
        p.retail_price as current_retail_price,
        p.wholesale_price as current_wholesale_price,
        p.cost_price as current_cost_price,
        p.stock_quantity as current_stock,
        COALESCE(p.name, MAX(si.product_name)) as display_name,
        COALESCE(p.brand, MAX(si.product_brand)) as display_brand,
        COALESCE(p.design_no, '') as display_design,
        COALESCE(p.uom, MAX(si.product_uom)) as display_uom,
        COALESCE(p.category, MAX(si.product_category)) as display_category,
        SUM(si.quantity) as total_quantity_sold,
        COUNT(DISTINCT s.id) as total_sales_transactions,
        COUNT(DISTINCT s.customer_id) as unique_customers_count,
        MIN(s.date) as first_sale_date,
        MAX(s.date) as last_sale_date,
        AVG(si.price) as average_sale_price,
        MIN(si.price) as lowest_sale_price,
        MAX(si.price) as highest_sale_price,
        SUM(si.quantity * si.price) as total_gross_revenue,
        SUM(COALESCE(si.item_discount_amount, 0)) as total_item_discounts,
        SUM(COALESCE(s.discount_amount, 0) * (si.quantity * si.price) / COALESCE(s.subtotal, si.quantity * si.price)) as total_sale_discounts,
        SUM(COALESCE(si.item_discount_amount, 0) + COALESCE(s.discount_amount, 0) * (si.quantity * si.price) / COALESCE(s.subtotal, si.quantity * si.price)) as total_discounts_given,
        SUM(si.quantity * si.price - COALESCE(si.item_discount_amount, 0) - COALESCE(s.discount_amount, 0) * (si.quantity * si.price) / COALESCE(s.subtotal, si.quantity * si.price)) as total_net_revenue,
        SUM(CASE WHEN s.customer_id IS NULL THEN si.quantity ELSE 0 END) as retail_quantity,
        SUM(CASE WHEN s.customer_id IS NOT NULL THEN si.quantity ELSE 0 END) as wholesale_quantity,
        SUM(CASE WHEN s.customer_id IS NULL THEN (si.quantity * si.price - COALESCE(si.item_discount_amount, 0) - COALESCE(s.discount_amount, 0) * (si.quantity * si.price) / COALESCE(s.subtotal, si.quantity * si.price)) ELSE 0 END) as retail_revenue,
        SUM(CASE WHEN s.customer_id IS NOT NULL THEN (si.quantity * si.price - COALESCE(si.item_discount_amount, 0) - COALESCE(s.discount_amount, 0) * (si.quantity * si.price) / COALESCE(s.subtotal, si.quantity * si.price)) ELSE 0 END) as wholesale_revenue,
        GROUP_CONCAT(DISTINCT CASE WHEN s.customer_id IS NOT NULL THEN c.name ELSE NULL END SEPARATOR ', ') as wholesale_customers,
        (SUM(si.quantity * si.price - COALESCE(si.item_discount_amount, 0) - COALESCE(s.discount_amount, 0) * (si.quantity * si.price) / COALESCE(s.subtotal, si.quantity * si.price)) - SUM(si.quantity * COALESCE(p.cost_price, 0))) as estimated_profit,
        ROUND(((SUM(si.quantity * si.price - COALESCE(si.item_discount_amount, 0) - COALESCE(s.discount_amount, 0) * (si.quantity * si.price) / COALESCE(s.subtotal, si.quantity * si.price)) - SUM(si.quantity * COALESCE(p.cost_price, 0))) / NULLIF(SUM(si.quantity * COALESCE(p.cost_price, 0)), 0)) * 100, 2) as profit_margin_percentage,
        CASE WHEN p.id IS NULL THEN 1 ELSE 0 END as is_deleted_product
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN customers c ON s.customer_id = c.id
    `;

    let wheres = [];
    let params = [];

    // Apply filters
    if (product_name) {
      wheres.push('si.product_name LIKE ?');
      params.push(`%${product_name}%`);
    }

    if (start_date) {
      wheres.push('DATE(s.date) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      wheres.push('DATE(s.date) <= ?');
      params.push(end_date);
    }

    if (customer_name) {
      wheres.push('(c.name LIKE ? OR c.brand_name LIKE ?)');
      params.push(`%${customer_name}%`, `%${customer_name}%`);
    }

    // Build WHERE clause
    let whereClause = wheres.length ? ' WHERE ' + wheres.join(' AND ') : '';

    // Group by product using product_id only (works for deleted products too)
    let groupByClause = ' GROUP BY si.product_id';

    // Build ORDER BY clause
    let orderByField;
    switch (sort_by) {
      case 'product_name':
        orderByField = 'COALESCE(p.name, si.product_name)';
        break;
      case 'total_revenue':
        orderByField = 'total_net_revenue';
        break;
      case 'total_quantity':
        orderByField = 'total_quantity_sold';
        break;
      case 'profit':
        orderByField = 'estimated_profit';
        break;
      case 'last_sale_date':
        orderByField = 'last_sale_date';
        break;
      case 'transactions_count':
        orderByField = 'total_sales_transactions';
        break;
      default:
        orderByField = 'total_quantity_sold';
    }

    let orderByClause = ` ORDER BY ${orderByField} ${sort_order.toUpperCase()}`;

    // Execute query
    let finalQuery = baseQuery + whereClause + groupByClause + orderByClause;
    const [soldProducts] = await pool.query(finalQuery, params);

    // Calculate summary statistics with detailed discount breakdown
    const totalQuantity = soldProducts.reduce((sum, item) => sum + parseInt(item.total_quantity_sold || 0), 0);
    const totalGrossRevenue = soldProducts.reduce((sum, item) => sum + parseFloat(item.total_gross_revenue || 0), 0);
    const totalItemDiscounts = soldProducts.reduce((sum, item) => sum + parseFloat(item.total_item_discounts || 0), 0);
    const totalSaleDiscounts = soldProducts.reduce((sum, item) => sum + parseFloat(item.total_sale_discounts || 0), 0);
    const totalDiscount = soldProducts.reduce((sum, item) => sum + parseFloat(item.total_discounts_given || 0), 0);
    const totalRevenue = soldProducts.reduce((sum, item) => sum + parseFloat(item.total_net_revenue || 0), 0);
    const totalProfit = soldProducts.reduce((sum, item) => sum + parseFloat(item.estimated_profit || 0), 0);
    const totalTransactions = soldProducts.reduce((sum, item) => sum + parseInt(item.total_sales_transactions || 0), 0);
    const uniqueProducts = soldProducts.length;
    const uniqueCustomersSet = new Set();

    soldProducts.forEach(product => {
      if (product.wholesale_customers) {
        product.wholesale_customers.split(', ').forEach(customer => {
          if (customer && customer !== 'null') uniqueCustomersSet.add(customer);
        });
      }
    });

    const uniqueCustomers = uniqueCustomersSet.size + (totalQuantity > soldProducts.reduce((sum, item) => sum + parseInt(item.wholesale_quantity || 0), 0) ? 1 : 0); // +1 for walk-in customers if any retail sales

    res.json({
      soldProducts,
      summary: {
        totalRecords: soldProducts.length,
        totalQuantity,
        totalGrossRevenue,
        totalItemDiscounts,
        totalSaleDiscounts,
        totalDiscount,
        totalRevenue,
        totalProfit,
        totalTransactions,
        uniqueProducts,
        uniqueCustomers,
        averageQuantityPerProduct: totalQuantity / (uniqueProducts || 1),
        averageRevenuePerProduct: totalRevenue / (uniqueProducts || 1)
      }
    });

  } catch (err) {
    console.error('getSoldProducts error:', err);
    res.status(500).json({ message: 'Server error getting sold products', error: err.message });
  }
}

export async function getSales(req, res) {
  // Fetch sales with advanced filters for owner
  const { product_name, category, start_date, end_date, customer_id } = req.query;
  let salesQuery = `SELECT s.*, 
                          s.date as sale_date,
                          CASE 
                            WHEN s.customer_id IS NULL THEN 'Walk-in Customer'
                            ELSE c.name
                          END as customer_name,
                          CASE 
                            WHEN s.customer_id IS NULL THEN NULL
                            ELSE c.brand_name
                          END as customer_brand_name
                    FROM sales s LEFT JOIN customers c ON s.customer_id = c.id`;
  let joins = '';
  let wheres = [];
  let params = [];
  // Join sale_items if filtering by product fields
  if (product_name || category) {
    joins += ' JOIN sale_items si ON s.id = si.sale_id';
  }
  if (product_name) {
    wheres.push('si.product_name LIKE ?');
    params.push(`%${product_name}%`);
  }
  if (category) {
    wheres.push('si.product_category = ?');
    params.push(category);
  }
  if (customer_id) {
    wheres.push('s.customer_id = ?');
    params.push(customer_id);
  }
  if (start_date) {
    wheres.push('DATE(s.date) >= ?');
    params.push(start_date);
  }
  if (end_date) {
    wheres.push('DATE(s.date) <= ?');
    params.push(end_date);
  }
  let whereClause = wheres.length ? ' WHERE ' + wheres.join(' AND ') : '';
  let groupBy = (product_name || category) ? ' GROUP BY s.id' : '';
  let finalQuery = salesQuery + joins + whereClause + groupBy + ' ORDER BY s.id DESC';
  try {
    const [sales] = await pool.query(finalQuery, params);

    // For each sale, fetch its items and recalculate amounts consistently
    const validSales = [];

    for (const sale of sales) {
      const [items] = await pool.query(`
        SELECT si.*, 
               p.name as current_product_name,
               p.brand as current_product_brand,
               p.category as current_product_category,
               p.uom as current_product_uom
        FROM sale_items si 
        LEFT JOIN products p ON si.product_id = p.id 
        WHERE si.sale_id = ?
      `, [sale.id]);

      // Only include sales that have items (filter out orphaned sales)
      if (items.length > 0) {
        // Map stored product details with historical integrity and change detection
        sale.items = items.map(item => {
          // Use historical data (what was stored at time of sale) as primary data
          const historicalName = item.product_name;
          const historicalBrand = item.product_brand;
          const historicalCategory = item.product_category;
          const historicalUom = item.product_uom;
          const historicalPrice = parseFloat(item.original_price || item.price);

          // Current product data (if product still exists)
          const currentName = item.current_product_name;
          const currentBrand = item.current_product_brand;
          const currentCategory = item.current_product_category;
          const currentUom = item.current_product_uom;

          // Determine display values: prefer historical, fallback to current if historical is null
          const displayName = historicalName || currentName || `Unknown Product x -${item.id}`;
          const displayBrand = historicalBrand || currentBrand;
          const displayCategory = historicalCategory || currentCategory;
          const displayUom = historicalUom || currentUom;

          // Detect changes and product status
          const productExists = currentName !== null;
          const nameChanged = productExists && historicalName && currentName && historicalName !== currentName;
          const brandChanged = productExists && historicalBrand && currentBrand && historicalBrand !== currentBrand;
          const uomChanged = productExists && historicalUom && currentUom && historicalUom !== currentUom;

          return {
            ...item,
            // Display values (what user sees)
            name: displayName,
            brand: displayBrand,
            category: displayCategory,
            uom: displayUom,

            // Historical integrity data
            historical_name: historicalName,
            historical_brand: historicalBrand,
            historical_category: historicalCategory,
            historical_uom: historicalUom,
            historical_price: historicalPrice,

            // Current product data (for comparison)
            current_name: currentName,
            current_brand: currentBrand,
            current_category: currentCategory,
            current_uom: currentUom,

            // Status indicators
            product_exists: productExists,
            product_deleted: !productExists,
            name_changed: nameChanged,
            brand_changed: brandChanged,
            uom_changed: uomChanged,
            has_changes: nameChanged || brandChanged || uomChanged
          };
        });

        // Calculate amounts using correct calculation logic
        let calculatedGrossAmount = 0;      // Total before any discounts
        let calculatedItemDiscounts = 0;    // Sum of all item-level discounts  
        let calculatedSubtotal = 0;         // After item discounts, before sale discount
        let calculatedSaleDiscount = 0;     // Sale-level discount amount
        let calculatedNetAmount = 0;        // Final amount after all discounts

        items.forEach(item => {
          const quantity = parseFloat(item.quantity) || 0;
          const originalPrice = parseFloat(item.original_price) || parseFloat(item.price) || 0;
          const finalPrice = parseFloat(item.final_price) || parseFloat(item.price) || 0;
          const itemDiscountAmount = parseFloat(item.item_discount_amount || 0);

          // Calculate correct item amounts
          const itemGrossAmount = quantity * originalPrice;
          const itemNetAmount = quantity * finalPrice;

          calculatedGrossAmount += itemGrossAmount;
          calculatedItemDiscounts += itemDiscountAmount;
          calculatedSubtotal += itemNetAmount;
        });

        // Calculate sale-level discount
        calculatedSaleDiscount = parseFloat(sale.discount_amount || 0);

        // Calculate final net amount
        calculatedNetAmount = calculatedSubtotal - calculatedSaleDiscount;

        // Update sale amounts with calculated values
        sale.calculated_gross_amount = calculatedGrossAmount;
        sale.calculated_item_discounts = calculatedItemDiscounts;
        sale.calculated_subtotal = calculatedSubtotal;
        sale.calculated_sale_discount = calculatedSaleDiscount;
        sale.calculated_net_amount = Math.max(0, calculatedNetAmount);

        // Use calculated net amount as the consistent total_amount
        sale.total_amount = sale.calculated_net_amount;

        validSales.push(sale);
      }
    }

    res.json(validSales);
  } catch (err) {
    console.error('getSales error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getSale(req, res) {
  const saleId = req.params.id;
  try {
    // Get sale details
    const [saleRows] = await pool.query(`
      SELECT s.*, 
             c.name as customer_name, 
             c.brand_name as customer_brand_name,
             c.phone as customer_phone,
             c.address as customer_address
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE s.id = ?
    `, [saleId]);

    if (saleRows.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const sale = saleRows[0];

    // Get sale items
    const [items] = await pool.query(`
      SELECT si.*, 
             p.name as current_product_name,
             p.brand as current_product_brand,
             p.category as current_product_category,
             p.uom as current_product_uom
      FROM sale_items si 
      LEFT JOIN products p ON si.product_id = p.id 
      WHERE si.sale_id = ?
    `, [saleId]);

    // Map stored product details with historical integrity and change detection
    sale.items = items.map(item => {
      // Use historical data (what was stored at time of sale) as primary data
      const historicalName = item.product_name;
      const historicalBrand = item.product_brand;
      const historicalCategory = item.product_category;
      const historicalUom = item.product_uom;
      const historicalPrice = parseFloat(item.original_price || item.price);

      // Current product data (if product still exists)
      const currentName = item.current_product_name;
      const currentBrand = item.current_product_brand;
      const currentCategory = item.current_product_category;
      const currentUom = item.current_product_uom;

      // Determine display values: prefer historical, fallback to current if historical is null
      const displayName = historicalName || currentName || 'Unknown Product';
      const displayBrand = historicalBrand || currentBrand;
      const displayCategory = historicalCategory || currentCategory;
      const displayUom = historicalUom || currentUom;

      // Detect changes and product status
      const productExists = currentName !== null;
      const nameChanged = productExists && historicalName && currentName && historicalName !== currentName;
      const brandChanged = productExists && historicalBrand && currentBrand && historicalBrand !== currentBrand;
      const uomChanged = productExists && historicalUom && currentUom && historicalUom !== currentUom;

      return {
        ...item,
        // Display values (what user sees)
        name: displayName,
        brand: displayBrand,
        category: displayCategory,
        uom: displayUom,

        // Historical integrity data
        historical_name: historicalName,
        historical_brand: historicalBrand,
        historical_category: historicalCategory,
        historical_uom: historicalUom,
        historical_price: historicalPrice,

        // Current product data (for comparison)
        current_name: currentName,
        current_brand: currentBrand,
        current_category: currentCategory,
        current_uom: currentUom,

        // Status indicators
        product_exists: productExists,
        product_deleted: !productExists,
        name_changed: nameChanged,
        brand_changed: brandChanged,
        uom_changed: uomChanged,
        has_changes: nameChanged || brandChanged || uomChanged
      };
    });

    // Apply the same calculation logic as getSales for consistency
    if (items.length > 0) {
      // Calculate amounts using correct calculation logic
      let calculatedGrossAmount = 0;      // Total before any discounts
      let calculatedItemDiscounts = 0;    // Sum of all item-level discounts  
      let calculatedSubtotal = 0;         // After item discounts, before sale discount
      let calculatedSaleDiscount = 0;     // Sale-level discount amount
      let calculatedNetAmount = 0;        // Final amount after all discounts

      items.forEach(item => {
        const quantity = parseFloat(item.quantity) || 0;
        const originalPrice = parseFloat(item.original_price) || parseFloat(item.price) || 0;
        const finalPrice = parseFloat(item.final_price) || parseFloat(item.price) || 0;
        const itemDiscountAmount = parseFloat(item.item_discount_amount || 0);

        // Calculate correct item amounts
        const itemGrossAmount = quantity * originalPrice;
        const itemNetAmount = quantity * finalPrice;

        calculatedGrossAmount += itemGrossAmount;
        calculatedItemDiscounts += itemDiscountAmount;
        calculatedSubtotal += itemNetAmount;
      });

      // Calculate sale-level discount
      calculatedSaleDiscount = parseFloat(sale.discount_amount || 0);

      // Calculate final net amount
      calculatedNetAmount = calculatedSubtotal - calculatedSaleDiscount;

      // Update sale amounts with calculated values
      sale.calculated_gross_amount = calculatedGrossAmount;
      sale.calculated_item_discounts = calculatedItemDiscounts;
      sale.calculated_subtotal = calculatedSubtotal;
      sale.calculated_sale_discount = calculatedSaleDiscount;
      sale.calculated_net_amount = Math.max(0, calculatedNetAmount);

      // Use calculated net amount as the consistent total_amount
      sale.total_amount = sale.calculated_net_amount;
    }

    // Map database discount fields to frontend expectations
    if (sale.discount_type === 'percentage') {
      sale.discount_value = sale.discount_percentage || 0;
    } else if (sale.discount_type === 'amount') {
      sale.discount_value = sale.discount_amount || 0;
    } else {
      sale.discount_value = 0;
    }

    res.json(sale);
  } catch (err) {
    console.error('getSale error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function updateSale(req, res) {
  // Allow updating sale items, status, customer assignment, but NOT customer type for security
  const saleId = req.params.id;
  const { items, customer_id, customer_type, status, discount_type, discount_value, discount_amount, total_amount } = req.body;

  console.log('updateSale received data:', {
    saleId,
    itemsCount: items?.length,
    firstItem: items?.[0],
    customer_id,
    customer_type,
    status,
    discount_type,
    discount_value,
    total_amount
  });

  // BUSINESS RULE: Prevent customer type changes during sale edits to maintain pricing integrity
  if (customer_type !== undefined) {
    return res.status(403).json({
      error: 'Customer Type Change Forbidden',
      message: 'Customer type cannot be changed when editing a sale. This ensures pricing integrity and prevents unauthorized price manipulation.',
      code: 'CUSTOMER_TYPE_IMMUTABLE'
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get original sale items for stock adjustment
    const [originalItems] = await conn.query('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

    // Update sale items if provided
    if (Array.isArray(items)) {
      // First, restore stock for original items
      for (const originalItem of originalItems) {
        await conn.query(
          'UPDATE products SET stock_quantity = stock_quantity + ?, total_sold = total_sold - ? WHERE id = ?',
          [originalItem.quantity, originalItem.quantity, originalItem.product_id]
        );
      }

      // Delete existing items
      await conn.query('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);

      // Insert updated items and adjust stock
      for (const item of items) {
        const originalPrice = item.original_price || item.price;
        const finalPrice = originalPrice * item.quantity - (item.discount_amount || 0);

        await conn.query(
          'INSERT INTO sale_items (sale_id, product_id, quantity, price, item_discount_type, item_discount_value, item_discount_amount, original_price, final_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            saleId,
            item.product_id,
            item.quantity,
            originalPrice, // Store original unit price
            item.discount_type || 'none',
            item.discount_value || 0,
            item.discount_amount || 0,
            originalPrice,
            finalPrice
          ]
        );

        // Update product stock and total sold with new quantities
        await conn.query(
          'UPDATE products SET stock_quantity = stock_quantity - ?, total_sold = total_sold + ? WHERE id = ?',
          [item.quantity, item.quantity, item.product_id]
        );
      }
    }

    // Update sale details
    const updateFields = [];
    const updateValues = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (customer_id !== undefined) {
      updateFields.push('customer_id = ?');
      updateValues.push(customer_id);
    }

    if (total_amount !== undefined) {
      updateFields.push('total_amount = ?');
      updateValues.push(total_amount);
    }

    if (discount_type !== undefined) {
      updateFields.push('discount_type = ?');
      updateValues.push(discount_type);
    }

    // Handle discount value based on type
    if (discount_value !== undefined && discount_type !== undefined) {
      if (discount_type === 'percentage') {
        updateFields.push('discount_percentage = ?');
        updateValues.push(discount_value);
        // Reset discount_amount to 0 for percentage discounts
        updateFields.push('discount_amount = ?');
        updateValues.push(0);
      } else if (discount_type === 'amount') {
        updateFields.push('discount_amount = ?');
        updateValues.push(discount_value);
        // Reset discount_percentage to 0 for amount discounts
        updateFields.push('discount_percentage = ?');
        updateValues.push(0);
      } else if (discount_type === 'none') {
        // Reset both discount fields to 0 when no discount
        updateFields.push('discount_amount = ?');
        updateValues.push(0);
        updateFields.push('discount_percentage = ?');
        updateValues.push(0);
      }
    } else if (discount_amount !== undefined) {
      updateFields.push('discount_amount = ?');
      updateValues.push(discount_amount);
    }

    if (updateFields.length > 0) {
      updateValues.push(saleId);
      await conn.query(`UPDATE sales SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    }

    // Handle customer balance update for completed sales
    if (status === 'completed' && customer_id) {
      const [[customer]] = await conn.query('SELECT type FROM customers WHERE id = ?', [customer_id]);
      if (customer && customer.type === 'long-term') {
        const finalAmount = total_amount || 0;
        await conn.query('UPDATE customers SET balance = balance + ? WHERE id = ?', [finalAmount, customer_id]);
      }
    }

    await conn.commit();
    res.json({ message: 'Sale updated successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('updateSale error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
}

// Delete sale controller
export async function deleteSale(req, res) {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Delete sale items first
    await conn.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);

    // Delete the sale
    const [result] = await conn.query('DELETE FROM sales WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Sale not found' });
    }

    await conn.commit();
    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Delete sale error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
}

// Migration function to add customer_type column to sales table
export async function addCustomerTypeColumn(req, res) {
  try {
    // Check if column already exists
    const [columns] = await pool.query("SHOW COLUMNS FROM sales LIKE 'customer_type'");

    if (columns.length > 0) {
      return res.json({ message: 'customer_type column already exists', success: true });
    }

    // Add the column
    await pool.query("ALTER TABLE sales ADD COLUMN customer_type ENUM('retail', 'long-term') DEFAULT 'retail' AFTER customer_id");

    // Update existing sales to have customer_type based on customer data
    // For walk-in customers, set as retail
    await pool.query("UPDATE sales SET customer_type = 'retail' WHERE customer_id IS NULL OR customer_id = 'Walk-in'");

    // For existing customers, check their type and update accordingly
    await pool.query(`
      UPDATE sales s 
      JOIN customers c ON s.customer_id = c.id 
      SET s.customer_type = CASE 
        WHEN c.type = 'long-term' THEN 'long-term' 
        ELSE 'retail' 
      END 
      WHERE s.customer_type IS NULL
    `);

    // Set any remaining nulls to retail
    await pool.query("UPDATE sales SET customer_type = 'retail' WHERE customer_type IS NULL");

    res.json({
      message: 'customer_type column added successfully and existing sales updated',
      success: true
    });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      message: 'Error adding customer_type column',
      error: error.message,
      success: false
    });
  }
}
