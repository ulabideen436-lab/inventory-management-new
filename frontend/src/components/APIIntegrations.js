import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function APIIntegrations() {
  const [integrations, setIntegrations] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('integrations');
  
  // Integration management states
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [integrationForm, setIntegrationForm] = useState({
    name: '',
    type: '',
    endpoint: '',
    apiKey: '',
    status: 'inactive',
    description: ''
  });
  
  // API Key management
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    permissions: [],
    expiresAt: '',
    description: ''
  });
  
  // Webhook management
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    events: [],
    secret: '',
    status: 'active'
  });
  
  // Backup management
  const [backupType, setBackupType] = useState('full');
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  
  const token = localStorage.getItem('token');

  // Predefined integration types
  const integrationTypes = [
    { id: 'quickbooks', name: 'QuickBooks', icon: '📊', description: 'Accounting software integration' },
    { id: 'shopify', name: 'Shopify', icon: '🛒', description: 'E-commerce platform sync' },
    { id: 'stripe', name: 'Stripe', icon: '💳', description: 'Payment processing' },
    { id: 'mailchimp', name: 'MailChimp', icon: '📧', description: 'Email marketing' },
    { id: 'xero', name: 'Xero', icon: '📈', description: 'Cloud accounting' },
    { id: 'woocommerce', name: 'WooCommerce', icon: '🏪', description: 'WordPress e-commerce' },
    { id: 'zapier', name: 'Zapier', icon: '⚡', description: 'Workflow automation' },
    { id: 'slack', name: 'Slack', icon: '💬', description: 'Team communication' }
  ];

  // Available webhook events
  const webhookEvents = [
    'product.created', 'product.updated', 'product.deleted',
    'sale.completed', 'sale.cancelled', 'sale.refunded',
    'customer.created', 'customer.updated',
    'inventory.low_stock', 'inventory.out_of_stock',
    'payment.received', 'payment.failed'
  ];

  // Available API permissions
  const apiPermissions = [
    'products.read', 'products.write', 'products.delete',
    'sales.read', 'sales.write', 'sales.delete',
    'customers.read', 'customers.write', 'customers.delete',
    'inventory.read', 'inventory.write',
    'reports.read', 'analytics.read'
  ];

  // Fetch all integration data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setIntegrations([
        {
          id: 1,
          name: 'QuickBooks Integration',
          type: 'quickbooks',
          status: 'active',
          lastSync: '2025-09-18T10:30:00Z',
          description: 'Sync sales and customer data with QuickBooks'
        },
        {
          id: 2,
          name: 'Shopify Store',
          type: 'shopify',
          status: 'inactive',
          lastSync: null,
          description: 'Product catalog synchronization'
        }
      ]);

      setApiKeys([
        {
          id: 1,
          name: 'Mobile App API',
          key: 'api_key_***************',
          permissions: ['products.read', 'sales.write'],
          createdAt: '2025-09-15T09:00:00Z',
          expiresAt: '2026-09-15T09:00:00Z',
          status: 'active'
        },
        {
          id: 2,
          name: 'Analytics Dashboard',
          key: 'api_key_***************',
          permissions: ['reports.read', 'analytics.read'],
          createdAt: '2025-09-10T14:20:00Z',
          expiresAt: '2025-12-10T14:20:00Z',
          status: 'active'
        }
      ]);

      setWebhooks([
        {
          id: 1,
          url: 'https://your-app.com/webhooks/inventory',
          events: ['inventory.low_stock', 'inventory.out_of_stock'],
          status: 'active',
          lastTriggered: '2025-09-18T08:15:00Z'
        },
        {
          id: 2,
          url: 'https://analytics.company.com/sales-webhook',
          events: ['sale.completed', 'sale.cancelled'],
          status: 'active',
          lastTriggered: '2025-09-18T11:45:00Z'
        }
      ]);

      setBackups([
        {
          id: 1,
          type: 'full',
          size: '245 MB',
          createdAt: '2025-09-18T02:00:00Z',
          status: 'completed',
          location: 'Cloud Storage'
        },
        {
          id: 2,
          type: 'incremental',
          size: '15 MB',
          createdAt: '2025-09-17T02:00:00Z',
          status: 'completed',
          location: 'Cloud Storage'
        }
      ]);

    } catch (err) {
      setError('Failed to fetch integration data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle form submissions
  const handleAddIntegration = async (e) => {
    e.preventDefault();
    try {
      // Mock API call
      const newIntegration = {
        id: Date.now(),
        ...integrationForm,
        lastSync: null
      };
      setIntegrations([...integrations, newIntegration]);
      setMessage('Integration added successfully!');
      setShowAddIntegration(false);
      setIntegrationForm({ name: '', type: '', endpoint: '', apiKey: '', status: 'inactive', description: '' });
    } catch (err) {
      setError('Failed to add integration');
    }
  };

  const handleAddApiKey = async (e) => {
    e.preventDefault();
    try {
      const newApiKey = {
        id: Date.now(),
        ...apiKeyForm,
        key: `api_key_${Math.random().toString(36).substr(2, 15)}`,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      setApiKeys([...apiKeys, newApiKey]);
      setMessage('API key created successfully!');
      setShowAddApiKey(false);
      setApiKeyForm({ name: '', permissions: [], expiresAt: '', description: '' });
    } catch (err) {
      setError('Failed to create API key');
    }
  };

  const handleAddWebhook = async (e) => {
    e.preventDefault();
    try {
      const newWebhook = {
        id: Date.now(),
        ...webhookForm,
        lastTriggered: null
      };
      setWebhooks([...webhooks, newWebhook]);
      setMessage('Webhook added successfully!');
      setShowAddWebhook(false);
      setWebhookForm({ url: '', events: [], secret: '', status: 'active' });
    } catch (err) {
      setError('Failed to add webhook');
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const newBackup = {
        id: Date.now(),
        type: backupType,
        size: `${Math.floor(Math.random() * 500) + 50} MB`,
        createdAt: new Date().toISOString(),
        status: 'completed',
        location: 'Cloud Storage'
      };
      setBackups([newBackup, ...backups]);
      setMessage('Backup created successfully!');
    } catch (err) {
      setError('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { backgroundColor: '#d4edda', color: '#155724' },
      inactive: { backgroundColor: '#f8d7da', color: '#721c24' },
      completed: { backgroundColor: '#d1ecf1', color: '#0c5460' }
    };
    return styles[status] || { backgroundColor: '#e2e3e5', color: '#495057' };
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>🔗 Enterprise Integration & API Platform</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={fetchData}
            disabled={loading}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: loading ? '#ccc' : '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
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
          { id: 'integrations', label: '🔗 Integrations', icon: '🔗' },
          { id: 'api-keys', label: '🔑 API Keys', icon: '🔑' },
          { id: 'webhooks', label: '🪝 Webhooks', icon: '🪝' },
          { id: 'backups', label: '💾 Backups', icon: '💾' }
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

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Third-Party Integrations</h3>
            <button 
              onClick={() => setShowAddIntegration(true)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Add Integration
            </button>
          </div>

          {/* Available Integration Types */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#495057', marginBottom: '15px' }}>Available Integration Types:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {integrationTypes.map(type => (
                <div key={type.id} style={{ 
                  padding: '15px', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px', marginRight: '10px' }}>{type.icon}</span>
                    <strong>{type.name}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>{type.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Integrations */}
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Integration</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Last Sync</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map(integration => (
                  <tr key={integration.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{integration.name}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{integration.description}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {integrationTypes.find(t => t.id === integration.type)?.icon} {integration.type}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        ...getStatusBadge(integration.status)
                      }}>
                        {integration.status === 'active' ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {integration.lastSync ? formatDate(integration.lastSync) : 'Never'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button style={{
                          padding: '4px 8px',
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
                          padding: '4px 8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          🔄 Sync
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>API Key Management</h3>
            <button 
              onClick={() => setShowAddApiKey(true)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Create API Key
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>API Key</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Permissions</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Expires</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map(apiKey => (
                  <tr key={apiKey.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{apiKey.name}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{apiKey.key}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {apiKey.permissions.map(perm => (
                          <span key={perm} style={{
                            padding: '2px 6px',
                            backgroundColor: '#e7f3ff',
                            color: '#0056b3',
                            borderRadius: '10px',
                            fontSize: '10px'
                          }}>
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{formatDate(apiKey.expiresAt)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          🗑️ Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Webhook Management</h3>
            <button 
              onClick={() => setShowAddWebhook(true)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Add Webhook
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>URL</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Events</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Last Triggered</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map(webhook => (
                  <tr key={webhook.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{webhook.url}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {webhook.events.map(event => (
                          <span key={event} style={{
                            padding: '2px 6px',
                            backgroundColor: '#f0f9ff',
                            color: '#0c4a6e',
                            borderRadius: '10px',
                            fontSize: '10px'
                          }}>
                            {event}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        ...getStatusBadge(webhook.status)
                      }}>
                        {webhook.status === 'active' ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {webhook.lastTriggered ? formatDate(webhook.lastTriggered) : 'Never'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button style={{
                          padding: '4px 8px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          🧪 Test
                        </button>
                        <button style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Backup Management</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                value={backupType} 
                onChange={(e) => setBackupType(e.target.value)}
                style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="full">Full Backup</option>
                <option value="incremental">Incremental</option>
                <option value="database">Database Only</option>
              </select>
              <button 
                onClick={handleCreateBackup}
                disabled={loading}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: loading ? '#ccc' : '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                💾 Create Backup
              </button>
            </div>
          </div>

          {/* Auto Backup Settings */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>⚙️ Automatic Backup Settings</h4>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={autoBackup} 
                  onChange={(e) => setAutoBackup(e.target.checked)}
                />
                Enable automatic backups
              </label>
              {autoBackup && (
                <select 
                  value={backupFrequency} 
                  onChange={(e) => setBackupFrequency(e.target.value)}
                  style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Size</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Location</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(backup => (
                  <tr key={backup.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {backup.type === 'full' ? '📦 Full' : backup.type === 'incremental' ? '📋 Incremental' : '🗄️ Database'}
                    </td>
                    <td style={{ padding: '12px' }}>{backup.size}</td>
                    <td style={{ padding: '12px' }}>{formatDate(backup.createdAt)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        ...getStatusBadge(backup.status)
                      }}>
                        {backup.status === 'completed' ? '✅ Completed' : '⏳ In Progress'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{backup.location}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button style={{
                          padding: '4px 8px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          📥 Download
                        </button>
                        <button style={{
                          padding: '4px 8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          🔄 Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Integration Modal */}
      {showAddIntegration && (
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
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🔗 Add New Integration</h3>
            
            <form onSubmit={handleAddIntegration}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Name:</label>
                  <input 
                    type="text" 
                    value={integrationForm.name}
                    onChange={(e) => setIntegrationForm({...integrationForm, name: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Type:</label>
                  <select 
                    value={integrationForm.type}
                    onChange={(e) => setIntegrationForm({...integrationForm, type: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="">Select Integration Type</option>
                    {integrationTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>API Endpoint:</label>
                  <input 
                    type="url" 
                    value={integrationForm.endpoint}
                    onChange={(e) => setIntegrationForm({...integrationForm, endpoint: e.target.value})}
                    placeholder="https://api.example.com/v1"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>API Key:</label>
                  <input 
                    type="password" 
                    value={integrationForm.apiKey}
                    onChange={(e) => setIntegrationForm({...integrationForm, apiKey: e.target.value})}
                    placeholder="Enter API key"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Description:</label>
                  <textarea 
                    value={integrationForm.description}
                    onChange={(e) => setIntegrationForm({...integrationForm, description: e.target.value})}
                    placeholder="Describe this integration..."
                    rows="3"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAddIntegration(false)}
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
                  Add Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add API Key Modal */}
      {showAddApiKey && (
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
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🔑 Create API Key</h3>
            
            <form onSubmit={handleAddApiKey}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Name:</label>
                  <input 
                    type="text" 
                    value={apiKeyForm.name}
                    onChange={(e) => setApiKeyForm({...apiKeyForm, name: e.target.value})}
                    required
                    placeholder="e.g., Mobile App API"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Permissions:</label>
                  <div style={{ 
                    border: '1px solid #ced4da', 
                    borderRadius: '4px', 
                    padding: '10px',
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}>
                    {apiPermissions.map(permission => (
                      <label key={permission} style={{ display: 'block', marginBottom: '5px' }}>
                        <input 
                          type="checkbox"
                          checked={apiKeyForm.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApiKeyForm({
                                ...apiKeyForm, 
                                permissions: [...apiKeyForm.permissions, permission]
                              });
                            } else {
                              setApiKeyForm({
                                ...apiKeyForm, 
                                permissions: apiKeyForm.permissions.filter(p => p !== permission)
                              });
                            }
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        {permission}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Expires At:</label>
                  <input 
                    type="datetime-local" 
                    value={apiKeyForm.expiresAt}
                    onChange={(e) => setApiKeyForm({...apiKeyForm, expiresAt: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Description:</label>
                  <textarea 
                    value={apiKeyForm.description}
                    onChange={(e) => setApiKeyForm({...apiKeyForm, description: e.target.value})}
                    placeholder="Describe the purpose of this API key..."
                    rows="2"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAddApiKey(false)}
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
                  Create API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Webhook Modal */}
      {showAddWebhook && (
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
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🪝 Add Webhook</h3>
            
            <form onSubmit={handleAddWebhook}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Webhook URL:</label>
                  <input 
                    type="url" 
                    value={webhookForm.url}
                    onChange={(e) => setWebhookForm({...webhookForm, url: e.target.value})}
                    required
                    placeholder="https://your-app.com/webhooks/endpoint"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Events:</label>
                  <div style={{ 
                    border: '1px solid #ced4da', 
                    borderRadius: '4px', 
                    padding: '10px',
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}>
                    {webhookEvents.map(event => (
                      <label key={event} style={{ display: 'block', marginBottom: '5px' }}>
                        <input 
                          type="checkbox"
                          checked={webhookForm.events.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setWebhookForm({
                                ...webhookForm, 
                                events: [...webhookForm.events, event]
                              });
                            } else {
                              setWebhookForm({
                                ...webhookForm, 
                                events: webhookForm.events.filter(e => e !== event)
                              });
                            }
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        {event}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Secret (Optional):</label>
                  <input 
                    type="password" 
                    value={webhookForm.secret}
                    onChange={(e) => setWebhookForm({...webhookForm, secret: e.target.value})}
                    placeholder="Webhook secret for verification"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAddWebhook(false)}
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
                  Add Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default APIIntegrations;