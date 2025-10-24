import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import authService from '../services/authService';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'cashier'
  });

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = authService.getCurrentUser();
    if (user) {
      const userData = await authService.getUserData(user.uid);
      setCurrentUser({ ...user, ...userData });
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      // Sort by creation date (newest first)
      usersList.sort((a, b) => b.createdAt - a.createdAt);
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate form
      if (newUser.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Create user using createUserByOwner (only owners can do this)
      const result = await authService.createUserByOwner(
        newUser.email,
        newUser.password,
        newUser.displayName,
        newUser.role
      );

      if (result.warning) {
        setSuccess(
          `✓ User profile created for ${newUser.displayName}!\n\n` +
          `⚠️ Next Steps:\n` +
          `1. Go to Firebase Console → Authentication → Users\n` +
          `2. Click "Add User"\n` +
          `3. Email: ${newUser.email}\n` +
          `4. Password: ${newUser.password}\n` +
          `5. The role (${newUser.role}) is already set in Firestore`
        );
      } else {
        setSuccess(`User ${newUser.displayName} created successfully as ${newUser.role}!`);
      }
      
      // Reset form
      setNewUser({
        displayName: '',
        email: '',
        password: '',
        role: 'cashier'
      });
      
      setShowAddUser(false);
      
      // Reload users list
      await loadUsers();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setError('');
      setSuccess('');
      
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });

      setSuccess('User role updated successfully!');
      await loadUsers();
    } catch (error) {
      setError('Failed to update role: ' + error.message);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      setError('');
      setSuccess('');
      
      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus
      });

      setSuccess(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      await loadUsers();
    } catch (error) {
      setError('Failed to update user status: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      await deleteDoc(doc(db, 'users', userId));
      
      setSuccess(`User ${userName} deleted successfully!`);
      await loadUsers();
    } catch (error) {
      setError('Failed to delete user: ' + error.message);
    }
  };

  const getRoleBadgeClass = (role) => {
    return role === 'owner' ? 'role-badge-owner' : 'role-badge-cashier';
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-management-container">
        <div className="loading-spinner">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div>
          <h1>👥 User Management</h1>
          <p className="subtitle">Manage system users and their roles</p>
        </div>
        <button 
          className="btn-add-user"
          onClick={() => setShowAddUser(!showAddUser)}
        >
          {showAddUser ? '✕ Cancel' : '+ Add New User'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✓ {success}
        </div>
      )}

      {showAddUser && (
        <div className="add-user-form-container">
          <div className="info-banner">
            <strong>ℹ️ Development Mode:</strong> User creation currently requires manual setup in Firebase Console.
            <br />
            <small>For production, implement Cloud Functions. See <code>USER_CREATION_GUIDE.md</code> for details.</small>
          </div>
          
          <h2>User Information</h2>
          <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
            After filling this form, you'll need to create the Firebase Auth account manually.
          </p>
          
          <form onSubmit={handleCreateUser} className="add-user-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  className="form-input"
                />
                <small className="input-hint">Minimum 6 characters</small>
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-select"
                >
                  <option value="cashier">Cashier</option>
                  <option value="owner">Owner</option>
                </select>
                <small className="input-hint">
                  {newUser.role === 'owner' 
                    ? 'Full system access' 
                    : 'POS and sales only'}
                </small>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowAddUser(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.role === 'owner').length}</div>
          <div className="stat-label">Owners</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.role === 'cashier').length}</div>
          <div className="stat-label">Cashiers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.isActive).length}</div>
          <div className="stat-label">Active Users</div>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={!user.isActive ? 'user-inactive' : ''}>
                <td>
                  <div className="user-info">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                    ) : (
                      <div className="user-avatar-placeholder">
                        {user.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <div className="user-name">{user.displayName || 'Unnamed User'}</div>
                      {currentUser?.uid === user.id && (
                        <span className="you-badge">You</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role === 'owner' ? '👑 Owner' : '💼 Cashier'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                    {user.isActive ? '✓ Active' : '✕ Inactive'}
                  </span>
                </td>
                <td>
                  {user.createdAt.toLocaleDateString()}
                </td>
                <td>
                  <div className="action-buttons">
                    {currentUser?.uid !== user.id && (
                      <>
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="cashier">Cashier</option>
                          <option value="owner">Owner</option>
                        </select>
                        
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className={`btn-toggle ${user.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? '🔒' : '🔓'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUser(user.id, user.displayName)}
                          className="btn-delete"
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    {currentUser?.uid === user.id && (
                      <span className="current-user-note">Current User</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="empty-state">
          <h3>No users found</h3>
          <p>Click "Add New User" to create your first user</p>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
