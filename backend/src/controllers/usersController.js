import bcrypt from 'bcryptjs';
import { pool } from '../models/db.js';
import { softDeleteItem } from '../services/deletedItemsService.js';

// Get all users (owner only)
export async function getUsers(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const { include_deleted } = req.query;
        let query = `
            SELECT id, username, email, full_name, role, active, created_at, last_login, deleted_at
            FROM users 
        `;

        if (include_deleted !== 'true') {
            query += ' WHERE deleted_at IS NULL';
        }

        query += ' ORDER BY created_at DESC';

        const [users] = await pool.query(query);

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Create new user (owner only)
export async function createUser(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const { username, password, email, full_name, role } = req.body;

        // Validate required fields
        if (!username || !password || !role) {
            return res.status(400).json({ message: 'Username, password, and role are required' });
        }

        // Validate role
        const validRoles = ['cashier', 'manager', 'owner'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Check if username already exists
        const [existingUser] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Check if email already exists (if provided)
        if (email) {
            const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existingEmail.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const [result] = await pool.query(`
      INSERT INTO users (username, password, email, full_name, role, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [username, hashedPassword, email || null, full_name || null, role]);

        res.status(201).json({
            message: 'User created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Delete user (owner only)
export async function deleteUser(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const { userId } = req.params;

        // Check if user exists
        const [user] = await pool.query('SELECT id, role FROM users WHERE id = ? AND deleted_at IS NULL', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting owner accounts
        if (user[0].role === 'owner') {
            return res.status(400).json({ message: 'Cannot delete owner accounts' });
        }

        // Prevent self-deletion
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        // Check if user has associated sales records
        const [salesCount] = await pool.query('SELECT COUNT(*) as count FROM sales WHERE cashier_id = ?', [userId]);
        if (salesCount[0].count > 0) {
            return res.status(400).json({
                message: `Cannot delete user. This user has ${salesCount[0].count} sales record(s) associated with them. You can deactivate the user instead of deleting.`,
                hasAssociatedData: true,
                associatedRecords: salesCount[0].count,
                dataType: 'sales'
            });
        }

        // Use soft delete
        await softDeleteItem('users', userId, req.user.id, 'User deleted by owner');

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Deactivate user (owner only) - alternative to deletion for users with associated data
export async function deactivateUser(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const { userId } = req.params;

        // Check if user exists
        const [user] = await pool.query('SELECT id, role, active FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deactivating owner accounts
        if (user[0].role === 'owner') {
            return res.status(400).json({ message: 'Cannot deactivate owner accounts' });
        }

        // Prevent self-deactivation
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'Cannot deactivate your own account' });
        }

        // Check if user is already inactive
        if (user[0].active === 0) {
            return res.status(400).json({ message: 'User is already deactivated' });
        }

        // Deactivate user
        await pool.query('UPDATE users SET active = 0 WHERE id = ?', [userId]);

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Reactivate user (owner only)
export async function reactivateUser(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const { userId } = req.params;

        // Check if user exists
        const [user] = await pool.query('SELECT id, role, active FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already active
        if (user[0].active === 1) {
            return res.status(400).json({ message: 'User is already active' });
        }

        // Reactivate user
        await pool.query('UPDATE users SET active = 1 WHERE id = ?', [userId]);

        res.json({ message: 'User reactivated successfully' });
    } catch (error) {
        console.error('Error reactivating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update user (owner only)
export async function updateUser(req, res) {
    try {
        // Check if user is owner
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: 'Access denied. Owner privileges required.' });
        }

        const { userId } = req.params;
        const { username, email, full_name, role, password } = req.body;

        // Check if user exists
        const [user] = await pool.query('SELECT id, role FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent changing owner role
        if (user[0].role === 'owner' && role && role !== 'owner') {
            return res.status(400).json({ message: 'Cannot change owner role' });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (username) {
            // Check if new username already exists
            const [existingUser] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
            if (existingUser.length > 0) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            updateFields.push('username = ?');
            updateValues.push(username);
        }

        if (email) {
            // Check if new email already exists
            const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (existingEmail.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            updateFields.push('email = ?');
            updateValues.push(email);
        }

        if (full_name) {
            updateFields.push('full_name = ?');
            updateValues.push(full_name);
        }

        if (role && ['cashier', 'manager', 'owner'].includes(role)) {
            updateFields.push('role = ?');
            updateValues.push(role);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        updateValues.push(userId);

        await pool.query(`
      UPDATE users SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Get current user profile
export async function getUserProfile(req, res) {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, full_name, role, active, created_at, last_login FROM users WHERE id = ? AND deleted_at IS NULL',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Update current user profile
export async function updateUserProfile(req, res) {
    try {
        const { email, full_name } = req.body;
        const updateFields = [];
        const updateValues = [];

        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }

        if (full_name !== undefined) {
            updateFields.push('full_name = ?');
            updateValues.push(full_name);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        updateValues.push(req.user.id);

        await pool.query(`
            UPDATE users SET ${updateFields.join(', ')} WHERE id = ?
        `, updateValues);

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}