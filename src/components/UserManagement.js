import { useCallback, useEffect, useState } from 'react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  // User management states
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    status: 'active',
    permissions: [],
    department: '',
    phoneNumber: ''
  });

  // Role management
  const [showAddRole, setShowAddRole] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [],
    level: 1
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expirationDays: 90
    },
    sessionPolicy: {
      maxDuration: 8,
      idleTimeout: 30,
      maxConcurrentSessions: 3
    },
    twoFactorAuth: {
      enabled: false,
      required: false,
      methods: ['sms', 'email', 'authenticator']
    }
  });

  const token = localStorage.getItem('token');

  // Predefined roles and permissions
  const systemRoles = [
    {
      id: 'super_admin',
      name: 'Super Administrator',
      level: 5,
      description: 'Full system access with all permissions',
      color: '#dc3545'
    },
    {
      id: 'admin',
      name: 'Administrator',
      level: 4,
      description: 'Administrative access with limited system settings',
      color: '#fd7e14'
    },
    {
      id: 'manager',
      name: 'Manager',
      level: 3,
      description: 'Management access with team oversight capabilities',
      color: '#ffc107'
    },
    {
      id: 'cashier',
      name: 'Cashier',
      level: 2,
      description: 'Point of sale and customer service access',
      color: '#28a745'
    },
    {
      id: 'viewer',
      name: 'Viewer',
      level: 1,
      description: 'Read-only access to reports and data',
      color: '#6c757d'
    }
  ];

  const systemPermissions = [
    // User Management
    { category: 'User Management', permissions: ['users.view', 'users.create', 'users.edit', 'users.delete'] },
    // Product Management
    { category: 'Products', permissions: ['products.view', 'products.create', 'products.edit', 'products.delete'] },
    // Sales Management
    { category: 'Sales', permissions: ['sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.refund'] },
    // Customer Management
    { category: 'Customers', permissions: ['customers.view', 'customers.create', 'customers.edit', 'customers.delete'] },
    // Financial Management
    { category: 'Payments', permissions: ['payments.view', 'payments.create', 'payments.edit', 'payments.delete'] },
    // Reporting
    { category: 'Reports', permissions: ['reports.view', 'reports.export', 'reports.analytics'] },
    // System Administration
    { category: 'System', permissions: ['settings.view', 'settings.edit', 'backups.create', 'backups.restore'] },
    // Security
    { category: 'Security', permissions: ['audit.view', 'roles.manage', 'permissions.manage'] }
  ];

  // Fetch all user management data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setUsers([
        {
          id: 1,
          username: 'admin',
          email: 'admin@company.com',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'super_admin',
          status: 'active',
          lastLogin: '2025-09-18T09:30:00Z',
          createdAt: '2025-01-15T10:00:00Z',
          department: 'IT',
          phoneNumber: '+1-555-0101',
          permissions: ['*']
        },
        {
          id: 2,
          username: 'manager1',
          email: 'manager@company.com',
          firstName: 'John',
          lastName: 'Manager',
          role: 'manager',
          status: 'active',
          lastLogin: '2025-09-18T08:45:00Z',
          createdAt: '2025-02-20T14:30:00Z',
          department: 'Sales',
          phoneNumber: '+1-555-0102',
          permissions: ['products.view', 'sales.view', 'customers.view', 'reports.view']
        },
        {
          id: 3,
          username: 'cashier1',
          email: 'cashier@company.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'cashier',
          status: 'active',
          lastLogin: '2025-09-18T07:20:00Z',
          createdAt: '2025-03-10T11:15:00Z',
          department: 'Sales',
          phoneNumber: '+1-555-0103',
          permissions: ['sales.create', 'customers.view', 'products.view']
        }
      ]);

      setRoles(systemRoles);
      setPermissions(systemPermissions);

      setAuditLogs([
        {
          id: 1,
          userId: 1,
          username: 'admin',
          action: 'User Created',
          target: 'User: cashier1',
          timestamp: '2025-09-18T10:30:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'success'
        },
        {
          id: 2,
          userId: 2,
          username: 'manager1',
          action: 'Product Updated',
          target: 'Product: Laptop Computer',
          timestamp: '2025-09-18T10:15:00Z',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'success'
        },
        {
          id: 3,
          userId: 3,
          username: 'cashier1',
          action: 'Sale Completed',
          target: 'Sale #12345',
          timestamp: '2025-09-18T09:45:00Z',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'success'
        }
      ]);

      setSessions([
        {
          id: 1,
          userId: 1,
          username: 'admin',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          loginTime: '2025-09-18T09:30:00Z',
          lastActivity: '2025-09-18T11:45:00Z',
          status: 'active',
          location: 'New York, US'
        },
        {
          id: 2,
          userId: 2,
          username: 'manager1',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
          loginTime: '2025-09-18T08:45:00Z',
          lastActivity: '2025-09-18T11:30:00Z',
          status: 'active',
          location: 'California, US'
        }
      ]);

    } catch (err) {
      setError('Failed to fetch user management data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle form submissions
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        id: Date.now(),
        ...userForm,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      setUsers([...users, newUser]);
      setMessage('User created successfully!');
      setShowAddUser(false);
      setUserForm({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        status: 'active',
        permissions: [],
        department: '',
        phoneNumber: ''
      });
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      const newRole = {
        id: Date.now().toString(),
        ...roleForm,
        color: '#007bff'
      };
      setRoles([...roles, newRole]);
      setMessage('Role created successfully!');
      setShowAddRole(false);
      setRoleForm({ name: '', description: '', permissions: [], level: 1 });
    } catch (err) {
      setError('Failed to create role');
    }
  };

  const handleUpdateUser = (userId, updates) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, ...updates } : user
    ));
    setMessage('User updated successfully!');
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
      setMessage('User deleted successfully!');
    }
  };

  const handleTerminateSession = (sessionId) => {
    setSessions(sessions.filter(session => session.id !== sessionId));
    setMessage('Session terminated successfully!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { backgroundColor: '#d4edda', color: '#155724' },
      inactive: { backgroundColor: '#f8d7da', color: '#721c24' },
      suspended: { backgroundColor: '#fff3cd', color: '#856404' },
      success: { backgroundColor: '#d1ecf1', color: '#0c5460' }
    };
    return styles[status] || { backgroundColor: '#e2e3e5', color: '#495057' };
  };

  const getRoleBadge = (roleId) => {
    const role = systemRoles.find(r => r.id === roleId);
    return role ? { backgroundColor: role.color + '20', color: role.color } : { backgroundColor: '#e2e3e5', color: '#495057' };
  };

  return (
    <div className="page-container">
      {/* Professional Header with Analytics */}
      <div className="page-header" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '0 0 24px 24px',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '2.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              👥 User Management & Security
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Advanced user roles, permissions, and system security</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Total Users</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{users.length}</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Active Users</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{users.filter(u => u.is_active).length}</div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: loading ? '#64748b' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', fontFamily: 'Arial, sans-serif' }}>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          ✅ {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #dee2e6',
        marginBottom: '30px',
        gap: '20px'
      }}>
        {[
          { id: 'users', label: '👤 Users', icon: '👤' },
          { id: 'roles', label: '🏷️ Roles', icon: '🏷️' },
          { id: 'sessions', label: '🔐 Sessions', icon: '🔐' },
          { id: 'audit', label: '📋 Audit Logs', icon: '📋' },
          { id: 'security', label: '🛡️ Security', icon: '🛡️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #007bff' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              color: activeTab === tab.id ? '#007bff' : '#6c757d'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>User Management</h3>
            <button
              onClick={() => setShowAddUser(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Add User
            </button>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Last Login</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Department</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{user.firstName} {user.lastName}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>@{user.username}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{user.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        ...getRoleBadge(user.role)
                      }}>
                        {systemRoles.find(r => r.id === user.role)?.name || user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        ...getStatusBadge(user.status)
                      }}>
                        {user.status === 'active' ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </td>
                    <td style={{ padding: '12px' }}>{user.department}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedUser(user)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleUpdateUser(user.id, {
                            status: user.status === 'active' ? 'inactive' : 'active'
                          })}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: user.status === 'active' ? '#ffc107' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {user.status === 'active' ? '⏸️ Suspend' : '▶️ Activate'}
                        </button>
                        {user.id !== 1 && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            style={{
                              padding: '4px 8px',
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Role Management</h3>
            <button
              onClick={() => setShowAddRole(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Create Role
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {roles.map(role => (
              <div key={role.id} style={{
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: role.color }}>{role.name}</h4>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: role.color + '20',
                    color: role.color,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Level {role.level}
                  </span>
                </div>
                <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px' }}>
                  {role.description}
                </p>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}>
                    ⚙️ Configure
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}>
                    👥 {users.filter(u => u.role === role.id).length} Users
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Permissions Matrix */}
          <div style={{ marginTop: '30px' }}>
            <h4 style={{ color: '#495057', marginBottom: '15px' }}>Permission Matrix</h4>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Permission Category</th>
                    {systemRoles.map(role => (
                      <th key={role.id} style={{
                        padding: '12px',
                        textAlign: 'center',
                        borderBottom: '2px solid #dee2e6',
                        color: role.color,
                        minWidth: '100px'
                      }}>
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {systemPermissions.map(category => (
                    <tr key={category.category} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>
                        {category.category}
                        <div style={{ fontSize: '11px', color: '#6c757d', fontWeight: 'normal' }}>
                          {category.permissions.join(', ')}
                        </div>
                      </td>
                      {systemRoles.map(role => (
                        <td key={role.id} style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '18px',
                            color: role.level >= 4 || (role.level >= 3 && category.category !== 'System') ? '#28a745' :
                              role.level >= 2 && ['Products', 'Sales', 'Customers'].includes(category.category) ? '#28a745' :
                                role.level >= 1 && category.category === 'Reports' ? '#28a745' : '#dc3545'
                          }}>
                            {role.level >= 4 || (role.level >= 3 && category.category !== 'System') ? '✅' :
                              role.level >= 2 && ['Products', 'Sales', 'Customers'].includes(category.category) ? '✅' :
                                role.level >= 1 && category.category === 'Reports' ? '✅' : '❌'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Active Sessions</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{
                padding: '8px 12px',
                backgroundColor: '#e7f3ff',
                color: '#0056b3',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {sessions.length} Active Sessions
              </span>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>IP Address</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Location</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Login Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Last Activity</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{session.username}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{session.ipAddress}</td>
                    <td style={{ padding: '12px' }}>{session.location}</td>
                    <td style={{ padding: '12px' }}>{formatDate(session.loginTime)}</td>
                    <td style={{ padding: '12px' }}>{formatDate(session.lastActivity)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleTerminateSession(session.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🚫 Terminate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Audit Logs</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}>
                <option value="all">All Actions</option>
                <option value="user">User Actions</option>
                <option value="system">System Actions</option>
                <option value="security">Security Events</option>
              </select>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                📊 Export
              </button>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Timestamp</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Target</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>IP Address</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontSize: '12px' }}>{formatDate(log.timestamp)}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.username}</td>
                    <td style={{ padding: '12px' }}>{log.action}</td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>{log.target}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px' }}>{log.ipAddress}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        ...getStatusBadge(log.status)
                      }}>
                        {log.status === 'success' ? '✅ Success' : '❌ Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'security' && (
        <div>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Security Configuration</h3>

          {/* Password Policy */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔒 Password Policy</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Minimum Length:</label>
                <input
                  type="number"
                  value={securitySettings.passwordPolicy.minLength}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    passwordPolicy: { ...securitySettings.passwordPolicy, minLength: parseInt(e.target.value) }
                  })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Password Expiration (days):</label>
                <input
                  type="number"
                  value={securitySettings.passwordPolicy.expirationDays}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    passwordPolicy: { ...securitySettings.passwordPolicy, expirationDays: parseInt(e.target.value) }
                  })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { key: 'requireUppercase', label: 'Require Uppercase' },
                { key: 'requireLowercase', label: 'Require Lowercase' },
                { key: 'requireNumbers', label: 'Require Numbers' },
                { key: 'requireSpecialChars', label: 'Require Special Characters' }
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={securitySettings.passwordPolicy[item.key]}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: { ...securitySettings.passwordPolicy, [item.key]: e.target.checked }
                    })}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {/* Session Policy */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>⏱️ Session Policy</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Max Duration (hours):</label>
                <input
                  type="number"
                  value={securitySettings.sessionPolicy.maxDuration}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    sessionPolicy: { ...securitySettings.sessionPolicy, maxDuration: parseInt(e.target.value) }
                  })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Idle Timeout (minutes):</label>
                <input
                  type="number"
                  value={securitySettings.sessionPolicy.idleTimeout}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    sessionPolicy: { ...securitySettings.sessionPolicy, idleTimeout: parseInt(e.target.value) }
                  })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Max Concurrent Sessions:</label>
                <input
                  type="number"
                  value={securitySettings.sessionPolicy.maxConcurrentSessions}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    sessionPolicy: { ...securitySettings.sessionPolicy, maxConcurrentSessions: parseInt(e.target.value) }
                  })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔐 Two-Factor Authentication</h4>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={securitySettings.twoFactorAuth.enabled}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    twoFactorAuth: { ...securitySettings.twoFactorAuth, enabled: e.target.checked }
                  })}
                />
                Enable Two-Factor Authentication
              </label>

              {securitySettings.twoFactorAuth.enabled && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorAuth.required}
                    onChange={(e) => setSecuritySettings({
                      ...securitySettings,
                      twoFactorAuth: { ...securitySettings.twoFactorAuth, required: e.target.checked }
                    })}
                  />
                  Require for all users
                </label>
              )}
            </div>

            {securitySettings.twoFactorAuth.enabled && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Available Methods:</label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {[
                    { key: 'sms', label: '📱 SMS' },
                    { key: 'email', label: '📧 Email' },
                    { key: 'authenticator', label: '🔑 Authenticator App' }
                  ].map(method => (
                    <label key={method.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={securitySettings.twoFactorAuth.methods.includes(method.key)}
                        onChange={(e) => {
                          const methods = e.target.checked
                            ? [...securitySettings.twoFactorAuth.methods, method.key]
                            : securitySettings.twoFactorAuth.methods.filter(m => m !== method.key);
                          setSecuritySettings({
                            ...securitySettings,
                            twoFactorAuth: { ...securitySettings.twoFactorAuth, methods }
                          });
                        }}
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              💾 Save Security Settings
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>👤 Create New User</h3>

            <form onSubmit={handleAddUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Username:</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Email:</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>First Name:</label>
                  <input
                    type="text"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Last Name:</label>
                  <input
                    type="text"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Role:</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="">Select Role</option>
                    {systemRoles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Department:</label>
                  <input
                    type="text"
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Phone Number:</label>
                  <input
                    type="tel"
                    value={userForm.phoneNumber}
                    onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
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
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRole && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🏷️ Create Custom Role</h3>

            <form onSubmit={handleAddRole}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Role Name:</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    required
                    placeholder="e.g., Warehouse Manager"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Access Level:</label>
                  <select
                    value={roleForm.level}
                    onChange={(e) => setRoleForm({ ...roleForm, level: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value={1}>Level 1 - Read Only</option>
                    <option value={2}>Level 2 - Basic Operations</option>
                    <option value={3}>Level 3 - Management</option>
                    <option value={4}>Level 4 - Administration</option>
                    <option value={5}>Level 5 - Super Admin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Description:</label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Describe the role responsibilities..."
                    rows="3"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddRole(false)}
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
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;