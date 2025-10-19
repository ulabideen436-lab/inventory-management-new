// Frontend validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Allow various phone formats: +1234567890, 123-456-7890, (123) 456-7890, etc.
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

export const validateNumber = (value, options = {}) => {
  const { min = -Infinity, max = Infinity, allowDecimals = true } = options;
  
  if (!validateRequired(value)) return false;
  
  const num = Number(value);
  if (isNaN(num)) return false;
  
  if (!allowDecimals && !Number.isInteger(num)) return false;
  
  return num >= min && num <= max;
};

export const validateString = (value, options = {}) => {
  const { minLength = 0, maxLength = Infinity, pattern = null } = options;
  
  if (!validateRequired(value)) return false;
  
  const str = value.toString().trim();
  if (str.length < minLength || str.length > maxLength) return false;
  
  if (pattern && !pattern.test(str)) return false;
  
  return true;
};

// Customer validation
export const validateCustomer = (customer) => {
  const errors = {};
  
  if (!validateString(customer.name, { minLength: 2, maxLength: 100 })) {
    errors.name = 'Name must be between 2 and 100 characters';
  }
  
  if (!validateString(customer.brand_name, { minLength: 2, maxLength: 100 })) {
    errors.brand_name = 'Brand name must be between 2 and 100 characters';
  }
  
  if (!validateString(customer.contact, { minLength: 2, maxLength: 100 })) {
    errors.contact = 'Contact must be between 2 and 100 characters';
  }
  
  if (!validateNumber(customer.opening_balance)) {
    errors.opening_balance = 'Opening balance must be a valid number';
  }
  
  if (!validateString(customer.address, { minLength: 5, maxLength: 200 })) {
    errors.address = 'Address must be between 5 and 200 characters';
  }
  
  if (!validatePhone(customer.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  if (!validateEmail(customer.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Product validation
export const validateProduct = (product) => {
  const errors = {};
  
  if (!validateString(product.name, { minLength: 2, maxLength: 100 })) {
    errors.name = 'Product name must be between 2 and 100 characters';
  }
  
  if (!validateString(product.brand, { minLength: 2, maxLength: 50 })) {
    errors.brand = 'Brand must be between 2 and 50 characters';
  }
  
  if (!validateString(product.design_no, { minLength: 1, maxLength: 50 })) {
    errors.design_no = 'Design number is required (max 50 characters)';
  }
  
  if (!validateString(product.location, { minLength: 1, maxLength: 50 })) {
    errors.location = 'Location is required (max 50 characters)';
  }
  
  if (!validateString(product.uom, { minLength: 1, maxLength: 20 })) {
    errors.uom = 'Unit of measure is required (max 20 characters)';
  }
  
  if (!validateNumber(product.retail_price, { min: 0 })) {
    errors.retail_price = 'Retail price must be a positive number';
  }
  
  if (!validateNumber(product.wholesale_price, { min: 0 })) {
    errors.wholesale_price = 'Wholesale price must be a positive number';
  }
  
  if (!validateNumber(product.stock_quantity, { min: 0, allowDecimals: false })) {
    errors.stock_quantity = 'Stock quantity must be a non-negative integer';
  }
  
  if (!validateRequired(product.supplier)) {
    errors.supplier = 'Supplier is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sale validation
export const validateSale = (sale) => {
  const errors = {};
  
  if (!validateRequired(sale.customer_id)) {
    errors.customer_id = 'Customer is required';
  }
  
  if (!sale.items || !Array.isArray(sale.items) || sale.items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    sale.items.forEach((item, index) => {
      if (!validateRequired(item.product_id)) {
        errors[`item_${index}_product`] = `Product is required for item ${index + 1}`;
      }
      
      if (!validateNumber(item.quantity, { min: 0.01 })) {
        errors[`item_${index}_quantity`] = `Quantity must be greater than 0 for item ${index + 1}`;
      }
      
      if (!validateNumber(item.price, { min: 0 })) {
        errors[`item_${index}_price`] = `Price must be a positive number for item ${index + 1}`;
      }
    });
  }
  
  if (sale.discount && !validateNumber(sale.discount, { min: 0, max: 100 })) {
    errors.discount = 'Discount must be between 0 and 100';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Form field validation helpers
export const getFieldError = (fieldName, errors) => {
  return errors[fieldName] || null;
};

export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};