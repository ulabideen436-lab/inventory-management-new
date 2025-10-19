import { pool } from '../models/db.js';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  validatePasswordStrength,
  sanitizeInput 
} from '../middleware/auth.js';

export async function login(req, res) {
  const { username, password } = req.body;
  
  try {
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Username and password are required' 
      });
    }
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 50) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Username must be between 3 and 50 characters' 
      });
    }
    
    // Get user from database
    const [rows] = await pool.query(
      'SELECT id, username, password, role, active, last_login_attempt, failed_login_attempts FROM users WHERE username = ?', 
      [sanitizedUsername]
    );
    
    if (rows.length === 0) {
      // Don't reveal that username doesn't exist
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid credentials' 
      });
    }
    
    const user = rows[0];
    
    // Check if account is active
    if (!user.active) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Account is deactivated' 
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid credentials' 
      });
    }
    
    // Reset failed login attempts on successful login
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, last_login_attempt = NOW(), last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Generate token with user information
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    const token = generateToken(tokenPayload, '8h');
    
    // Log successful login
    console.log(`User ${user.username} (ID: ${user.id}) logged in successfully at ${new Date().toISOString()}`);
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Login processing failed' 
    });
  }
}

export async function register(req, res) {
  const { username, password, role } = req.body;
  
  try {
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Username and password are required' 
      });
    }
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedRole = sanitizeInput(role || 'cashier');
    
    // Validate username
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 50) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Username must be between 3 and 50 characters' 
      });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Username can only contain letters, numbers, and underscores' 
      });
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }
    
    // Validate role
    const allowedRoles = ['owner', 'cashier'];
    if (!allowedRoles.includes(sanitizedRole)) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid role specified' 
      });
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT username FROM users WHERE username = ?', 
      [sanitizedUsername]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'Username already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role, active, created_at) VALUES (?, ?, ?, true, NOW())', 
      [sanitizedUsername, hashedPassword, sanitizedRole]
    );
    
    // Log user creation
    console.log(`New user created: ${sanitizedUsername} (ID: ${result.insertId}) with role: ${sanitizedRole}`);
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: result.insertId,
        username: sanitizedUsername,
        role: sanitizedRole
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'User registration failed' 
    });
  }
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  
  try {
    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Current password and new password are required' 
      });
    }
    
    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'New password does not meet security requirements',
        details: passwordValidation.errors
      });
    }
    
    // Get current user
    const [rows] = await pool.query(
      'SELECT password FROM users WHERE id = ? AND active = true', 
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'User not found' 
      });
    }
    
    const user = rows[0];
    
    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Current password is incorrect' 
      });
    }
    
    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);
    
    // Update password
    await pool.query(
      'UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    // Log password change
    console.log(`User ${req.user.username} (ID: ${userId}) changed password at ${new Date().toISOString()}`);
    
    res.json({ 
      message: 'Password changed successfully' 
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Password change failed' 
    });
  }
}

export async function logout(req, res) {
  try {
    // In a more sophisticated system, you might invalidate the token
    // For now, we'll just log the logout
    console.log(`User ${req.user.username} (ID: ${req.user.id}) logged out at ${new Date().toISOString()}`);
    
    res.json({ 
      message: 'Logged out successfully' 
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Logout failed' 
    });
  }
}

export async function getUserProfile(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, role, created_at, last_login FROM users WHERE id = ? AND active = true',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'User not found' 
      });
    }
    
    const user = rows[0];
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile' 
    });
  }
}

export async function verifyPassword(req, res) {
  const { password } = req.body;
  const userId = req.user.id;
  
  try {
    // Input validation
    if (!password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Password is required' 
      });
    }
    
    // Get user from database
    const [rows] = await pool.query(
      'SELECT password FROM users WHERE id = ?', 
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'User not found' 
      });
    }
    
    const user = rows[0];
    
    // Verify password
    const isValid = await comparePassword(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid password' 
      });
    }
    
    res.json({ 
      message: 'Password verified successfully' 
    });
    
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to verify password' 
    });
  }
}