import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

function Settings() {
    // User Management States
    const [users, setUsers] = useState([]);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        role: 'cashier',
        email: '',
        full_name: ''
    });

    // System Settings States
    const [systemSettings, setSystemSettings] = useState({
        business_name: '',
        business_address: '',
        business_phone: '',
        business_email: '',
        tax_rate: '',
        currency: 'PKR',
        low_stock_threshold: '',
        backup_frequency: 'daily'
    });

    // Loading and Message States
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('users');

    // Deleted Items States
    const [deletedItems, setDeletedItems] = useState([]);
    const [deletedItemsLoading, setDeletedItemsLoading] = useState(false);
    const [deletionStats, setDeletionStats] = useState({ by_type: [], totals: {} });
    const [deletedItemsFilters, setDeletedItemsFilters] = useState({
        item_type: '',
        search: '',
        can_restore: 'true',
        start_date: '',
        end_date: ''
    });

    // Deleted Items Functions
    const fetchDeletedItems = useCallback(async () => {
        setDeletedItemsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            Object.entries(deletedItemsFilters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await axios.get(`http://localhost:5000/deleted-items?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeletedItems(response.data);
        } catch (err) {
            setError('Failed to fetch deleted items');
            console.error('Error fetching deleted items:', err);
        } finally {
            setDeletedItemsLoading(false);
        }
    }, [deletedItemsFilters]);

    const fetchDeletionStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/deleted-items/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeletionStats(response.data);
        } catch (err) {
            console.error('Error fetching deletion stats:', err);
        }
    }, []);

    // Load users and settings on component mount
    useEffect(() => {
        fetchUsers();
        fetchSystemSettings();
        if (activeTab === 'deleted-items') {
            fetchDeletedItems();
            fetchDeletionStats();
        }
    }, [activeTab, fetchDeletedItems, fetchDeletionStats]);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching users with token:', token ? 'Present' : 'Missing');

            const response = await axios.get('http://localhost:5000/users', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Users fetched successfully:', response.data.length);
            setUsers(response.data);
            setError(''); // Clear any previous errors
        } catch (err) {
            console.error('Error fetching users:', err.response?.status, err.response?.data?.message || err.message);

            if (err.response?.status === 429) {
                setError('Too many requests. Please wait a moment and try again.');
            } else if (err.response?.status === 401) {
                setError('Authentication failed. Please login again.');
            } else {
                setError('Failed to fetch users');
            }
        }
    };

    const fetchSystemSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
                setSystemSettings(prev => ({ ...prev, ...response.data }));
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            // Don't show error for settings as they might not exist yet
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/users', newUser, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('User created successfully!');
            setNewUser({
                username: '',
                password: '',
                role: 'cashier',
                email: '',
                full_name: ''
            });
            setShowAddUser(false);

            // Add small delay to prevent race conditions
            setTimeout(() => {
                fetchUsers();
            }, 500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('User deleted successfully!');
            fetchUsers();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete user';

            // If user has associated data, suggest deactivation instead
            if (err.response?.data?.hasAssociatedData) {
                setError(`${errorMessage}\n\nTip: You can deactivate the user instead to preserve data integrity.`);
            } else {
                setError(errorMessage);
            }
        }
    };

    const handleDeactivateUser = async (userId) => {
        if (!window.confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/users/${userId}/deactivate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('User deactivated successfully!');
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to deactivate user');
        }
    };

    const handleReactivateUser = async (userId) => {
        if (!window.confirm('Are you sure you want to reactivate this user?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/users/${userId}/reactivate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('User reactivated successfully!');
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reactivate user');
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/settings', systemSettings, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('Settings updated successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/export/data', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `storeflow-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setMessage('Data exported successfully!');
        } catch (err) {
            setError('Failed to export data');
        }
    };

    const handleBackupDatabase = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/backup/database', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage('Database backup created successfully!');
        } catch (err) {
            setError('Failed to create backup');
        }
    };

    const handleRestoreItem = async (deletedItemId) => {
        const password = prompt('Enter your password to confirm restoration:');
        if (!password) return;

        if (!window.confirm('Are you sure you want to restore this item?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/deleted-items/${deletedItemId}/restore`,
                { password },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('Item restored successfully!');
            fetchDeletedItems();
            fetchDeletionStats();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to restore item');
        }
    };

    const handlePermanentDelete = async (deletedItemId) => {
        const password = prompt('Enter your password to confirm permanent deletion:');
        if (!password) return;

        if (!window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone!')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/deleted-items/${deletedItemId}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { password }
            });

            setMessage('Item permanently deleted!');
            fetchDeletedItems();
            fetchDeletionStats();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to permanently delete item');
        }
    };

    const handleFilterChange = (key, value) => {
        setDeletedItemsFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        fetchDeletedItems();
    };

    const resetFilters = () => {
        setDeletedItemsFilters({
            item_type: '',
            search: '',
            can_restore: 'true',
            start_date: '',
            end_date: ''
        });
        setTimeout(fetchDeletedItems, 100);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{
                backgroundColor: '#2c3e50',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
                    ⚙️ Settings & Administration
                </h1>
                <p style={{ margin: 0, color: '#bdc3c7' }}>
                    Manage users, system settings, and administrative functions
                </p>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                borderBottom: '2px solid #e1e5e9',
                marginBottom: '20px'
            }}>
                {[
                    { id: 'users', label: '👥 User Management', icon: '👥' },
                    { id: 'deleted-items', label: '🗑️ Deleted Items', icon: '🗑️' },
                    { id: 'system', label: '🏢 Business Settings', icon: '🏢' },
                    { id: 'backup', label: '💾 Backup & Export', icon: '💾' },
                    { id: 'security', label: '🔒 Security', icon: '🔒' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 20px',
                            border: 'none',
                            backgroundColor: activeTab === tab.id ? '#3498db' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#2c3e50',
                            cursor: 'pointer',
                            borderRadius: '8px 8px 0 0',
                            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                            marginRight: '5px'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Messages */}
            {message && (
                <div style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    border: '1px solid #c3e6cb'
                }}>
                    ✅ {message}
                </div>
            )}

            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb'
                }}>
                    ❌ {error}
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'users' && (
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{ margin: 0, color: '#2c3e50' }}>User Management</h2>
                        <button
                            onClick={() => setShowAddUser(!showAddUser)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            ➕ Add New User
                        </button>
                    </div>

                    {/* Add User Form */}
                    {showAddUser && (
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #e9ecef'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Create New User</h3>
                            <form onSubmit={handleAddUser}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.full_name}
                                            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Username *
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Role *
                                        </label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <option value="cashier">Cashier</option>
                                            <option value="owner">Owner</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '15px' }}>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            marginRight: '10px'
                                        }}
                                    >
                                        {loading ? 'Creating...' : 'Create User'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddUser(false)}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Users List */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                                        👤 User
                                    </th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                                        📧 Email
                                    </th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                                        🎭 Role
                                    </th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                                        � Status
                                    </th>
                                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                                        �📅 Created
                                    </th>
                                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                                        ⚡ Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                                        <td style={{ padding: '15px' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                                    {user.full_name || user.username}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                                    @{user.username}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px', color: '#495057' }}>
                                            {user.email || '-'}
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                backgroundColor: user.role === 'owner' ? '#e8f5e8' : '#cce7ff',
                                                color: user.role === 'owner' ? '#2d5a2d' : '#004085'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                backgroundColor: user.active ? '#d4edda' : '#f8d7da',
                                                color: user.active ? '#155724' : '#721c24'
                                            }}>
                                                {user.active ? '✅ Active' : '❌ Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', color: '#6c757d' }}>
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            {user.role !== 'owner' && (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    {user.active ? (
                                                        <button
                                                            onClick={() => handleDeactivateUser(user.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#ffc107',
                                                                color: '#212529',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            ⏸️ Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleReactivateUser(user.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            ▶️ Reactivate
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'deleted-items' && (
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{ margin: 0, color: '#2c3e50' }}>Deleted Items History</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={fetchDeletedItems}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        padding: '20px',
                        marginBottom: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📊 Deletion Statistics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                                    {deletionStats.totals.total_deleted_items || 0}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Deleted Items</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                                    {deletionStats.totals.total_restorable || 0}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6c757d' }}>Restorable Items</div>
                            </div>
                            {deletionStats.by_type.map(stat => (
                                <div key={stat.item_type} style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                                        {stat.total_deleted}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#6c757d', textTransform: 'capitalize' }}>
                                        {stat.item_type}s Deleted
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        padding: '20px',
                        marginBottom: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🔍 Filters</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                                    Item Type:
                                </label>
                                <select
                                    value={deletedItemsFilters.item_type}
                                    onChange={(e) => handleFilterChange('item_type', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <option value="">All Types</option>
                                    <option value="product">Products</option>
                                    <option value="customer">Customers</option>
                                    <option value="supplier">Suppliers</option>
                                    <option value="user">Users</option>
                                    <option value="sale">Sales</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                                    Status:
                                </label>
                                <select
                                    value={deletedItemsFilters.can_restore}
                                    onChange={(e) => handleFilterChange('can_restore', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <option value="">All Items</option>
                                    <option value="true">Restorable</option>
                                    <option value="false">Not Restorable</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                                    Search:
                                </label>
                                <input
                                    type="text"
                                    value={deletedItemsFilters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    placeholder="Search in item data..."
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                                    From Date:
                                </label>
                                <input
                                    type="date"
                                    value={deletedItemsFilters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                                    To Date:
                                </label>
                                <input
                                    type="date"
                                    value={deletedItemsFilters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                            <button
                                onClick={applyFilters}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                🔍 Apply Filters
                            </button>
                            <button
                                onClick={resetFilters}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                🔄 Reset
                            </button>
                        </div>
                    </div>

                    {/* Deleted Items Table */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
                            🗑️ Deleted Items ({deletedItems.length})
                        </h3>

                        {deletedItemsLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                                <div style={{ fontSize: '18px' }}>⏳ Loading deleted items...</div>
                            </div>
                        ) : deletedItems.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                                <div style={{ fontSize: '18px' }}>🎉 No deleted items found</div>
                                <div style={{ fontSize: '14px', marginTop: '5px' }}>This is good - nothing has been deleted!</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>Type</th>
                                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>Item Details</th>
                                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>Deleted By</th>
                                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>Deleted At</th>
                                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50', fontWeight: 'bold' }}>Reason</th>
                                            <th style={{ padding: '15px', textAlign: 'center', color: '#2c3e50', fontWeight: 'bold' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deletedItems.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        backgroundColor: item.item_type === 'product' ? '#e3f2fd' :
                                                            item.item_type === 'customer' ? '#f3e5f5' :
                                                                item.item_type === 'supplier' ? '#fff3e0' :
                                                                    item.item_type === 'user' ? '#e8f5e8' : '#f5f5f5',
                                                        color: item.item_type === 'product' ? '#1976d2' :
                                                            item.item_type === 'customer' ? '#7b1fa2' :
                                                                item.item_type === 'supplier' ? '#f57c00' :
                                                                    item.item_type === 'user' ? '#388e3c' : '#616161'
                                                    }}>
                                                        {item.item_type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                        {item.item_type === 'product' ? `${item.original_data.name} (${item.original_data.id})` :
                                                            item.item_type === 'customer' ? `${item.original_data.name} - ${item.original_data.brand_name}` :
                                                                item.item_type === 'supplier' ? `${item.original_data.name}` :
                                                                    item.item_type === 'user' ? `${item.original_data.username} (${item.original_data.role})` :
                                                                        `ID: ${item.item_id}`}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                                        {item.item_type === 'product' && `Brand: ${item.original_data.brand || 'N/A'}, Price: PKR ${item.original_data.retail_price}`}
                                                        {item.item_type === 'customer' && `Contact: ${item.original_data.contact}, Balance: PKR ${item.original_data.balance || 0}`}
                                                        {item.item_type === 'supplier' && `Contact: ${item.original_data.contact_info || 'N/A'}, Balance: PKR ${item.original_data.balance || 0}`}
                                                        {item.item_type === 'user' && `Email: ${item.original_data.email || 'N/A'}, Created: ${new Date(item.original_data.created_at).toLocaleDateString()}`}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px', color: '#6c757d' }}>
                                                    {item.deleted_by_username}
                                                </td>
                                                <td style={{ padding: '15px', color: '#6c757d' }}>
                                                    {new Date(item.deleted_at).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '15px', color: '#6c757d' }}>
                                                    {item.deletion_reason || 'No reason provided'}
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                        {item.can_restore ? (
                                                            <button
                                                                onClick={() => handleRestoreItem(item.id)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: '#28a745',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                🔄 Restore
                                                            </button>
                                                        ) : (
                                                            <span style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#6c757d',
                                                                color: 'white',
                                                                borderRadius: '4px',
                                                                fontSize: '12px'
                                                            }}>
                                                                ✅ Restored
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => handlePermanentDelete(item.id)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#dc3545',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            🗑️ Delete Forever
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div>
                    <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Business Settings</h2>
                    <form onSubmit={handleUpdateSettings}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        value={systemSettings.business_name}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, business_name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Business Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={systemSettings.business_phone}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, business_phone: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Business Address
                                    </label>
                                    <textarea
                                        value={systemSettings.business_address}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, business_address: e.target.value })}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Business Email
                                    </label>
                                    <input
                                        type="email"
                                        value={systemSettings.business_email}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, business_email: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Tax Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={systemSettings.tax_rate}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, tax_rate: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Currency
                                    </label>
                                    <select
                                        value={systemSettings.currency}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        <option value="PKR">PKR - Pakistani Rupee</option>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="GBP">GBP - British Pound</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Low Stock Threshold
                                    </label>
                                    <input
                                        type="number"
                                        value={systemSettings.low_stock_threshold}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, low_stock_threshold: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {loading ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'backup' && (
                <div>
                    <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Backup & Export</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>💾 Data Export</h3>
                            <p style={{ color: '#6c757d', marginBottom: '15px' }}>
                                Export all your data in JSON format for backup purposes.
                            </p>
                            <button
                                onClick={handleExportData}
                                style={{
                                    padding: '12px 20px',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                📥 Export Data
                            </button>
                        </div>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>🗄️ Database Backup</h3>
                            <p style={{ color: '#6c757d', marginBottom: '15px' }}>
                                Create a complete backup of your database.
                            </p>
                            <button
                                onClick={handleBackupDatabase}
                                style={{
                                    padding: '12px 20px',
                                    backgroundColor: '#6f42c1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                🔄 Create Backup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div>
                    <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Security Settings</h2>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>🔐 Password Policy</h3>
                            <div style={{ color: '#6c757d' }}>
                                <p>• Minimum 8 characters required</p>
                                <p>• Must contain at least one uppercase letter</p>
                                <p>• Must contain at least one number</p>
                                <p>• Passwords expire every 90 days</p>
                            </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>🕒 Session Management</h3>
                            <div style={{ color: '#6c757d' }}>
                                <p>• Session timeout: 8 hours</p>
                                <p>• Automatic logout on browser close</p>
                                <p>• Maximum concurrent sessions: 3</p>
                            </div>
                        </div>
                        <div>
                            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>📊 Audit Logging</h3>
                            <div style={{ color: '#6c757d' }}>
                                <p>• All user actions are logged</p>
                                <p>• Sales transactions are tracked</p>
                                <p>• System changes are recorded</p>
                                <p>• Logs retained for 1 year</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;
