import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// Rate limiting for authentication attempts
const baseAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per 15 minutes (reasonable for production)
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom auth limiter that exempts admin from excessive rate limiting
export const authLimiter = (req, res, next) => {
  // For admin user, allow more attempts for testing/development
  if (req.method === 'POST' && req.url === '/login' && req.body && req.body.username === 'admin') {
    // Create a more lenient limiter for admin
    const adminLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Allow more attempts for admin user
      message: 'Too many authentication attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    return adminLimiter(req, res, next);
  }

  // Apply normal rate limiting for all other users
  return baseAuthLimiter(req, res, next);
};

// Rate limiting for general API requests  
const baseApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 requests per 15 minutes for production workload
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom API limiter with reasonable limits
export const apiLimiter = (req, res, next) => {
  // Check if this is an admin login request
  if (req.method === 'POST' && req.url === '/auth/login' && req.body && req.body.username === 'admin') {
    // Skip API rate limiting for admin login
    return next();
  }

  // Check if this is an authenticated admin making API calls
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.username === 'admin' || decoded.role === 'admin') {
        console.log('Skipping API rate limiting for authenticated admin');
        return next();
      }
    } catch (err) {
      // Token verification failed, proceed with rate limiting
      console.log('Token verification failed, applying rate limiting');
    }
  }

  // Apply rate limiting for all other requests
  return baseApiLimiter(req, res, next);
}; export function authenticateJWT(req, res, next) {
  try {
    console.log('authenticateJWT called for:', req.method, req.url);
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth failed: Missing or invalid authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token has expired'
          });
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
          });
        } else {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token verification failed'
          });
        }
      }

      // Check if token contains required fields
      if (!decoded.id || !decoded.role) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token payload'
        });
      }

      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp
      };

      console.log('Auth successful for user:', decoded.username, 'Role:', decoded.role);
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication processing failed'
    });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    try {
      console.log('authorizeRoles called with roles:', roles, 'User role:', req.user?.role);
      if (!req.user) {
        console.log('Authorization failed: User not authenticated');
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      if (!req.user.role) {
        console.log('Authorization failed: User role not found');
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User role not found'
        });
      }

      if (!roles.includes(req.user.role)) {
        console.log('Authorization failed: Role mismatch. Required:', roles, 'User has:', req.user.role);
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required roles: ${roles.join(', ')}`
        });
      }

      console.log('Authorization successful for role:', req.user.role);
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authorization processing failed'
      });
    }
  };
}

// Hash password utility
export async function hashPassword(password) {
  try {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Password hashing failed');
  }
}

// Compare password utility
export async function comparePassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Password comparison error:', error);
    throw new Error('Password comparison failed');
  }
}

// Generate JWT token utility
export function generateToken(payload, expiresIn = '24h') {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      issuer: 'inventory-management-system',
      audience: 'inventory-management-users'
    });
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Token generation failed');
  }
}

// Validate password strength
export function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize user input
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Remove HTML tags and script content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// Security headers middleware
export function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict transport security (HTTPS only)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content security policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:");

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

// Reusable password verification function for secure deletion operations
export async function verifyPassword(req, res, next) {
  const { password } = req.body;
  const userId = req.user && req.user.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!password) {
    return res.status(400).json({ message: 'Password required for deletion' });
  }

  try {
    // Get user password hash from database
    const { pool } = await import('../models/db.js');
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);

    if (!users.length) {
      return res.status(401).json({ message: 'User not found' });
    }

    const hash = users[0].password;
    const match = await bcrypt.compare(password, hash);

    if (!match) {
      return res.status(403).json({ message: 'Incorrect password' });
    }

    // Password verified, continue to deletion
    next();
  } catch (error) {
    console.error('Password verification error:', error);
    return res.status(500).json({ message: 'Server error during password verification' });
  }
}

/**
 * Middleware to require owner role for sensitive operations
 */
export const requireOwnerRole = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Check if user has owner role
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Owner role required for this operation'
      });
    }

    next();
  } catch (error) {
    console.error('Role verification error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Role verification failed'
    });
  }
};
