// Input validation middleware
export const validateCustomer = (req, res, next) => {
  const { name, brand_name, contact, opening_balance, address, phone, email } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Valid customer name is required' });
  }

  if (!brand_name || typeof brand_name !== 'string' || brand_name.trim().length === 0) {
    return res.status(400).json({ message: 'Valid brand name is required' });
  }

  if (!contact || typeof contact !== 'string' || contact.trim().length === 0) {
    return res.status(400).json({ message: 'Valid contact is required' });
  }

  if (opening_balance === undefined || isNaN(Number(opening_balance))) {
    return res.status(400).json({ message: 'Valid opening balance is required' });
  }

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return res.status(400).json({ message: 'Valid address is required' });
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    return res.status(400).json({ message: 'Valid phone is required' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  next();
};

export const validateProduct = (req, res, next) => {
  console.log('validateProduct called with body:', req.body);
  let { id, name, uom, retail_price, cost_price } = req.body;

  // If ID is empty, generate one following the existing pattern (e.g., zy0000000003)
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    // Generate ID with "zy" prefix and zero-padded number
    // This should ideally get the next available number from database
    // For now, using timestamp-based approach but with consistent format
    const timestamp = Date.now();
    const lastDigits = timestamp.toString().slice(-6); // Get last 6 digits
    id = `zy${lastDigits.padStart(10, '0')}`;
    req.body.id = id;
    console.log('Generated product ID:', id);
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    console.log('Validation failed: Invalid product name');
    return res.status(400).json({ message: 'Valid product name is required' });
  }

  if (!uom || typeof uom !== 'string' || uom.trim().length === 0) {
    console.log('Validation failed: Invalid unit of measure');
    return res.status(400).json({ message: 'Valid unit of measure is required' });
  }

  if (!retail_price || isNaN(Number(retail_price)) || Number(retail_price) <= 0) {
    console.log('Validation failed: Invalid retail price:', retail_price);
    return res.status(400).json({ message: 'Valid retail price is required' });
  }

  if (cost_price === undefined || cost_price === null || isNaN(Number(cost_price)) || Number(cost_price) < 0) {
    console.log('Validation failed: Invalid cost price:', cost_price);
    return res.status(400).json({ message: 'Valid cost price is required' });
  }

  console.log('Product validation successful');
  next();
};

export const validateSale = (req, res, next) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one item is required for sale' });
  }

  for (const item of items) {
    if (!item.product_id || !item.quantity || !item.price) {
      return res.status(400).json({ message: 'Each item must have product_id, quantity, and price' });
    }

    if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required for each item' });
    }

    if (isNaN(Number(item.price)) || Number(item.price) <= 0) {
      return res.status(400).json({ message: 'Valid price is required for each item' });
    }
  }

  next();
};