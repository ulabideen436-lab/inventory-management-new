import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function SmartInventory() {
  const [products, setProducts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [demandForecast, setDemandForecast] = useState([]);
  const [supplierRecommendations, setSupplierRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Automation rule states
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    trigger: '',
    condition: '',
    action: '',
    threshold: '',
    enabled: true
  });
  
  // Smart settings
  const [smartSettings, setSmartSettings] = useState({
    autoReorder: {
      enabled: true,
      leadTime: 7,
      safetyStock: 20,
      demandVariability: 0.2
    },
    priceOptimization: {
      enabled: true,
      competitorTracking: true,
      dynamicPricing: false,
      profitMargin: 0.3
    },
    demandForecasting: {
      enabled: true,
      algorithm: 'machine_learning',
      seasonalAdjustment: true,
      historicalPeriod: 12
    }
  });
  
  const token = localStorage.getItem('token');

  // Trigger types for automation rules
  const triggerTypes = [
    { id: 'low_stock', name: 'Low Stock Alert', description: 'Trigger when stock falls below threshold' },
    { id: 'high_demand', name: 'High Demand Detected', description: 'Trigger when demand increases significantly' },
    { id: 'price_change', name: 'Price Change Alert', description: 'Trigger when supplier prices change' },
    { id: 'seasonal_pattern', name: 'Seasonal Pattern', description: 'Trigger based on seasonal trends' },
    { id: 'supplier_issue', name: 'Supplier Issue', description: 'Trigger when supplier has problems' },
    { id: 'expiration_warning', name: 'Expiration Warning', description: 'Trigger when products near expiration' }
  ];

  // Action types for automation rules
  const actionTypes = [
    { id: 'auto_reorder', name: 'Automatic Reorder', description: 'Place order with preferred supplier' },
    { id: 'adjust_price', name: 'Adjust Price', description: 'Modify product pricing automatically' },
    { id: 'send_alert', name: 'Send Alert', description: 'Notify relevant team members' },
    { id: 'update_status', name: 'Update Status', description: 'Change product or inventory status' },
    { id: 'create_promotion', name: 'Create Promotion', description: 'Generate promotional campaign' },
    { id: 'schedule_audit', name: 'Schedule Audit', description: 'Plan inventory audit or check' }
  ];

  // Fetch all smart inventory data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual AI-powered API calls
      setProducts([
        {
          id: 1,
          name: 'Laptop Computer',
          sku: 'LAP001',
          currentStock: 45,
          optimalStock: 60,
          predictedDemand: 15,
          reorderPoint: 25,
          leadTime: 7,
          supplier: 'Tech Supplies Inc.',
          avgDemand: 12,
          stockVelocity: 'high',
          profitability: 'high',
          riskLevel: 'low'
        },
        {
          id: 2,
          name: 'Wireless Mouse',
          sku: 'MSE001',
          currentStock: 8,
          optimalStock: 50,
          predictedDemand: 25,
          reorderPoint: 15,
          leadTime: 3,
          supplier: 'Peripheral Pro',
          avgDemand: 20,
          stockVelocity: 'high',
          profitability: 'medium',
          riskLevel: 'high'
        },
        {
          id: 3,
          name: 'Office Chair',
          sku: 'CHR001',
          currentStock: 12,
          optimalStock: 20,
          predictedDemand: 3,
          reorderPoint: 8,
          leadTime: 14,
          supplier: 'Furniture World',
          avgDemand: 4,
          stockVelocity: 'medium',
          profitability: 'high',
          riskLevel: 'medium'
        }
      ]);

      setPredictions([
        {
          id: 1,
          productId: 1,
          productName: 'Laptop Computer',
          period: 'Next 30 Days',
          predictedSales: 38,
          confidence: 92,
          factors: ['Seasonal increase', 'Back-to-school period', 'New model release'],
          recommendation: 'Increase stock by 25%'
        },
        {
          id: 2,
          productId: 2,
          productName: 'Wireless Mouse',
          period: 'Next 7 Days',
          predictedSales: 22,
          confidence: 88,
          factors: ['High current demand', 'Low competition', 'Promotion effect'],
          recommendation: 'Immediate reorder required'
        }
      ]);

      setAlerts([
        {
          id: 1,
          type: 'critical',
          title: 'Stock Out Warning',
          message: 'Wireless Mouse (MSE001) will run out in 2 days',
          productId: 2,
          priority: 'high',
          timestamp: '2025-09-18T10:30:00Z',
          status: 'active',
          action: 'Reorder 100 units'
        },
        {
          id: 2,
          type: 'optimization',
          title: 'Price Optimization Opportunity',
          message: 'Office Chair pricing can be increased by 15% based on competitor analysis',
          productId: 3,
          priority: 'medium',
          timestamp: '2025-09-18T09:15:00Z',
          status: 'active',
          action: 'Review pricing'
        },
        {
          id: 3,
          type: 'demand',
          title: 'Demand Surge Detected',
          message: 'Laptop Computer demand increased by 40% this week',
          productId: 1,
          priority: 'medium',
          timestamp: '2025-09-18T08:45:00Z',
          status: 'acknowledged',
          action: 'Monitor trend'
        }
      ]);

      setAutomationRules([
        {
          id: 1,
          name: 'Auto Reorder Low Stock',
          trigger: 'low_stock',
          condition: 'stock < reorder_point',
          action: 'auto_reorder',
          threshold: 'reorder_point',
          enabled: true,
          lastTriggered: '2025-09-17T14:30:00Z',
          successRate: 95
        },
        {
          id: 2,
          name: 'Dynamic Pricing Adjustment',
          trigger: 'price_change',
          condition: 'competitor_price_change > 5%',
          action: 'adjust_price',
          threshold: '5%',
          enabled: true,
          lastTriggered: '2025-09-16T11:20:00Z',
          successRate: 87
        }
      ]);

      setDemandForecast([
        {
          period: 'Week 1',
          laptops: 15,
          mice: 25,
          chairs: 3,
          confidence: 88
        },
        {
          period: 'Week 2',
          laptops: 18,
          mice: 22,
          chairs: 4,
          confidence: 85
        },
        {
          period: 'Week 3',
          laptops: 22,
          mice: 20,
          chairs: 5,
          confidence: 82
        },
        {
          period: 'Week 4',
          laptops: 20,
          mice: 28,
          chairs: 3,
          confidence: 79
        }
      ]);

      setSupplierRecommendations([
        {
          id: 1,
          productId: 2,
          productName: 'Wireless Mouse',
          currentSupplier: 'Peripheral Pro',
          recommendedSupplier: 'Tech Direct',
          costSaving: 15,
          qualityScore: 92,
          deliveryTime: 2,
          reliability: 96,
          reason: 'Better pricing and faster delivery'
        },
        {
          id: 2,
          productId: 1,
          productName: 'Laptop Computer',
          currentSupplier: 'Tech Supplies Inc.',
          recommendedSupplier: 'Computer World',
          costSaving: 8,
          qualityScore: 94,
          deliveryTime: 5,
          reliability: 91,
          reason: 'Higher quality products available'
        }
      ]);

    } catch (err) {
      setError('Failed to fetch smart inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle automation rule creation
  const handleAddRule = async (e) => {
    e.preventDefault();
    try {
      const newRule = {
        id: Date.now(),
        ...ruleForm,
        lastTriggered: null,
        successRate: 0
      };
      setAutomationRules([...automationRules, newRule]);
      setMessage('Automation rule created successfully!');
      setShowAddRule(false);
      setRuleForm({
        name: '',
        trigger: '',
        condition: '',
        action: '',
        threshold: '',
        enabled: true
      });
    } catch (err) {
      setError('Failed to create automation rule');
    }
  };

  const toggleRule = (ruleId) => {
    setAutomationRules(automationRules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
    setMessage('Automation rule updated successfully!');
  };

  const acknowledgeAlert = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ));
  };

  const dismissAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getAlertIcon = (type) => {
    const icons = {
      critical: '🚨',
      optimization: '💡',
      demand: '📈',
      supplier: '🏭',
      price: '💰'
    };
    return icons[type] || '📋';
  };

  const getAlertColor = (priority) => {
    const colors = {
      high: '#dc3545',
      medium: '#ffc107',
      low: '#28a745'
    };
    return colors[priority] || '#6c757d';
  };

  const getRiskColor = (risk) => {
    const colors = {
      high: '#dc3545',
      medium: '#ffc107',
      low: '#28a745'
    };
    return colors[risk] || '#6c757d';
  };

  const getVelocityColor = (velocity) => {
    const colors = {
      high: '#28a745',
      medium: '#ffc107',
      low: '#dc3545'
    };
    return colors[velocity] || '#6c757d';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>🤖 Smart Inventory Automation</h2>
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
            {loading ? '🔄 Loading...' : '🔄 Refresh AI Analysis'}
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
          { id: 'dashboard', label: '📊 AI Dashboard', icon: '📊' },
          { id: 'predictions', label: '🔮 Predictions', icon: '🔮' },
          { id: 'automation', label: '⚙️ Automation', icon: '⚙️' },
          { id: 'alerts', label: '🚨 Smart Alerts', icon: '🚨' },
          { id: 'suppliers', label: '🏭 Suppliers', icon: '🏭' }
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

      {/* AI Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {[
              { title: 'AI Accuracy', value: '94.2%', icon: '🎯', color: '#28a745', trend: '+2.1%' },
              { title: 'Cost Savings', value: '$12,450', icon: '💰', color: '#17a2b8', trend: '+$1,230' },
              { title: 'Stock Optimization', value: '87%', icon: '📈', color: '#ffc107', trend: '+5%' },
              { title: 'Automation Success', value: '91%', icon: '🤖', color: '#6f42c1', trend: '+3%' }
            ].map((metric, index) => (
              <div key={index} style={{ 
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '28px' }}>{metric.icon}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#28a745', 
                    backgroundColor: '#d4edda', 
                    padding: '2px 6px', 
                    borderRadius: '10px'
                  }}>
                    {metric.trend}
                  </span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: metric.color, marginBottom: '5px' }}>
                  {metric.value}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>{metric.title}</div>
              </div>
            ))}
          </div>

          {/* Smart Inventory Overview */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            overflow: 'hidden',
            marginBottom: '30px'
          }}>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderBottom: '1px solid #dee2e6' 
            }}>
              <h4 style={{ margin: 0, color: '#495057' }}>🎯 Smart Inventory Analysis</h4>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Current Stock</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Optimal Stock</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Predicted Demand</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Velocity</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Risk Level</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>AI Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>SKU: {product.sku}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: product.currentStock < product.reorderPoint ? '#dc3545' : '#28a745'
                      }}>
                        {product.currentStock}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{product.optimalStock}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: product.predictedDemand > product.avgDemand ? '#ffc107' : '#28a745'
                      }}>
                        {product.predictedDemand}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: getVelocityColor(product.stockVelocity) + '20',
                        color: getVelocityColor(product.stockVelocity)
                      }}>
                        {product.stockVelocity}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: getRiskColor(product.riskLevel) + '20',
                        color: getRiskColor(product.riskLevel)
                      }}>
                        {product.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {product.currentStock < product.reorderPoint ? (
                        <span style={{ color: '#dc3545', fontWeight: 'bold' }}>🔄 Reorder Now</span>
                      ) : product.currentStock > product.optimalStock ? (
                        <span style={{ color: '#ffc107', fontWeight: 'bold' }}>📉 Reduce Stock</span>
                      ) : (
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ Optimal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Demand Forecast Chart */}
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#495057' }}>📈 AI Demand Forecast (Next 4 Weeks)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              {demandForecast.map((forecast, index) => (
                <div key={index} style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#495057' }}>
                    {forecast.period}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
                    Confidence: {forecast.confidence}%
                  </div>
                  <div style={{ display: 'grid', gap: '5px' }}>
                    <div>💻 Laptops: <strong>{forecast.laptops}</strong></div>
                    <div>🖱️ Mice: <strong>{forecast.mice}</strong></div>
                    <div>🪑 Chairs: <strong>{forecast.chairs}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>AI-Powered Predictions</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}>
                <option value="all">All Products</option>
                <option value="high_risk">High Risk Only</option>
                <option value="trending">Trending Items</option>
              </select>
              <button style={{ 
                padding: '6px 12px', 
                backgroundColor: '#17a2b8', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                🔄 Update Predictions
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {predictions.map(prediction => (
              <div key={prediction.id} style={{ 
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#495057' }}>{prediction.productName}</h4>
                  <span style={{ 
                    padding: '4px 8px',
                    backgroundColor: prediction.confidence > 90 ? '#d4edda' : prediction.confidence > 80 ? '#fff3cd' : '#f8d7da',
                    color: prediction.confidence > 90 ? '#155724' : prediction.confidence > 80 ? '#856404' : '#721c24',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {prediction.confidence}% Confidence
                  </span>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
                    {prediction.period}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#007bff' }}>
                    {prediction.predictedSales} units
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                    Key Factors:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {prediction.factors.map((factor, index) => (
                      <span key={index} style={{
                        padding: '4px 8px',
                        backgroundColor: '#e7f3ff',
                        color: '#0056b3',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}>
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  <strong>AI Recommendation:</strong> {prediction.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Automation Rules</h3>
            <button 
              onClick={() => setShowAddRule(true)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Create Rule
            </button>
          </div>

          {/* Smart Settings */}
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#495057' }}>⚙️ Smart Settings</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Auto Reorder Settings */}
              <div style={{ 
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px'
              }}>
                <h5 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔄 Auto Reorder</h5>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input 
                    type="checkbox"
                    checked={smartSettings.autoReorder.enabled}
                    onChange={(e) => setSmartSettings({
                      ...smartSettings,
                      autoReorder: { ...smartSettings.autoReorder, enabled: e.target.checked }
                    })}
                  />
                  Enable Auto Reorder
                </label>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6c757d' }}>Lead Time (days):</label>
                    <input 
                      type="number"
                      value={smartSettings.autoReorder.leadTime}
                      onChange={(e) => setSmartSettings({
                        ...smartSettings,
                        autoReorder: { ...smartSettings.autoReorder, leadTime: parseInt(e.target.value) }
                      })}
                      style={{ width: '100%', padding: '4px', border: '1px solid #ced4da', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#6c757d' }}>Safety Stock (%):</label>
                    <input 
                      type="number"
                      value={smartSettings.autoReorder.safetyStock}
                      onChange={(e) => setSmartSettings({
                        ...smartSettings,
                        autoReorder: { ...smartSettings.autoReorder, safetyStock: parseInt(e.target.value) }
                      })}
                      style={{ width: '100%', padding: '4px', border: '1px solid #ced4da', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Price Optimization */}
              <div style={{ 
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px'
              }}>
                <h5 style={{ margin: '0 0 15px 0', color: '#495057' }}>💰 Price Optimization</h5>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input 
                    type="checkbox"
                    checked={smartSettings.priceOptimization.enabled}
                    onChange={(e) => setSmartSettings({
                      ...smartSettings,
                      priceOptimization: { ...smartSettings.priceOptimization, enabled: e.target.checked }
                    })}
                  />
                  Enable Price Optimization
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input 
                    type="checkbox"
                    checked={smartSettings.priceOptimization.dynamicPricing}
                    onChange={(e) => setSmartSettings({
                      ...smartSettings,
                      priceOptimization: { ...smartSettings.priceOptimization, dynamicPricing: e.target.checked }
                    })}
                  />
                  Dynamic Pricing
                </label>
              </div>

              {/* Demand Forecasting */}
              <div style={{ 
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px'
              }}>
                <h5 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔮 Demand Forecasting</h5>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input 
                    type="checkbox"
                    checked={smartSettings.demandForecasting.enabled}
                    onChange={(e) => setSmartSettings({
                      ...smartSettings,
                      demandForecasting: { ...smartSettings.demandForecasting, enabled: e.target.checked }
                    })}
                  />
                  Enable AI Forecasting
                </label>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>Algorithm:</label>
                  <select 
                    value={smartSettings.demandForecasting.algorithm}
                    onChange={(e) => setSmartSettings({
                      ...smartSettings,
                      demandForecasting: { ...smartSettings.demandForecasting, algorithm: e.target.value }
                    })}
                    style={{ width: '100%', padding: '4px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="machine_learning">Machine Learning</option>
                    <option value="time_series">Time Series</option>
                    <option value="regression">Regression</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Automation Rules List */}
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Rule Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Trigger</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Success Rate</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {automationRules.map(rule => (
                  <tr key={rule.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{rule.name}</td>
                    <td style={{ padding: '12px' }}>
                      {triggerTypes.find(t => t.id === rule.trigger)?.name || rule.trigger}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {actionTypes.find(a => a.id === rule.action)?.name || rule.action}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: rule.successRate > 90 ? '#28a745' : rule.successRate > 80 ? '#ffc107' : '#dc3545'
                      }}>
                        {rule.successRate}%
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: rule.enabled ? '#d4edda' : '#f8d7da',
                        color: rule.enabled ? '#155724' : '#721c24'
                      }}>
                        {rule.enabled ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => toggleRule(rule.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: rule.enabled ? '#ffc107' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {rule.enabled ? '⏸️ Disable' : '▶️ Enable'}
                        </button>
                        <button style={{
                          padding: '4px 8px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          ⚙️ Edit
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

      {/* Smart Alerts Tab */}
      {activeTab === 'alerts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Smart Alerts & Notifications</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ 
                padding: '8px 12px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {alerts.filter(a => a.status === 'active').length} Active Alerts
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {alerts.map(alert => (
              <div key={alert.id} style={{ 
                backgroundColor: 'white',
                border: `2px solid ${getAlertColor(alert.priority)}20`,
                borderLeft: `6px solid ${getAlertColor(alert.priority)}`,
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{getAlertIcon(alert.type)}</span>
                    <div>
                      <h4 style={{ margin: 0, color: '#495057' }}>{alert.title}</h4>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {formatDate(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: getAlertColor(alert.priority) + '20',
                      color: getAlertColor(alert.priority)
                    }}>
                      {alert.priority.toUpperCase()}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: alert.status === 'active' ? '#f8d7da' : '#d1ecf1',
                      color: alert.status === 'active' ? '#721c24' : '#0c5460'
                    }}>
                      {alert.status}
                    </span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px', color: '#495057' }}>
                  {alert.message}
                </div>
                
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <strong>Recommended Action:</strong> {alert.action}
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {alert.status === 'active' && (
                    <button 
                      onClick={() => acknowledgeAlert(alert.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      👍 Acknowledge
                    </button>
                  )}
                  <button 
                    onClick={() => dismissAlert(alert.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ Dismiss
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}>
                    📊 View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>AI Supplier Recommendations</h3>
            <button style={{ 
              padding: '6px 12px', 
              backgroundColor: '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              🔄 Analyze Suppliers
            </button>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {supplierRecommendations.map(rec => (
              <div key={rec.id} style={{ 
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#495057' }}>{rec.productName}</h4>
                  <span style={{ 
                    padding: '4px 8px',
                    backgroundColor: rec.costSaving > 10 ? '#d4edda' : '#fff3cd',
                    color: rec.costSaving > 10 ? '#155724' : '#856404',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {rec.costSaving}% Cost Saving
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 10px 0', color: '#6c757d' }}>Current Supplier</h5>
                    <div style={{ fontWeight: 'bold' }}>{rec.currentSupplier}</div>
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Recommended Supplier</h5>
                    <div style={{ fontWeight: 'bold', color: '#28a745' }}>{rec.recommendedSupplier}</div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Quality Score</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>{rec.qualityScore}%</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Delivery Time</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>{rec.deliveryTime} days</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Reliability</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#17a2b8' }}>{rec.reliability}%</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Cost Saving</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>{rec.costSaving}%</div>
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <strong>AI Analysis:</strong> {rec.reason}
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    ✅ Switch Supplier
                  </button>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    📊 Compare Details
                  </button>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    📧 Contact Supplier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRule && (
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
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>⚙️ Create Automation Rule</h3>
            
            <form onSubmit={handleAddRule}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Rule Name:</label>
                  <input 
                    type="text" 
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({...ruleForm, name: e.target.value})}
                    required
                    placeholder="e.g., Auto Reorder Electronics"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Trigger:</label>
                  <select 
                    value={ruleForm.trigger}
                    onChange={(e) => setRuleForm({...ruleForm, trigger: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="">Select Trigger</option>
                    {triggerTypes.map(trigger => (
                      <option key={trigger.id} value={trigger.id}>{trigger.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Action:</label>
                  <select 
                    value={ruleForm.action}
                    onChange={(e) => setRuleForm({...ruleForm, action: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="">Select Action</option>
                    {actionTypes.map(action => (
                      <option key={action.id} value={action.id}>{action.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Condition:</label>
                  <input 
                    type="text" 
                    value={ruleForm.condition}
                    onChange={(e) => setRuleForm({...ruleForm, condition: e.target.value})}
                    placeholder="e.g., stock < 10 OR demand > avg * 1.5"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Threshold:</label>
                  <input 
                    type="text" 
                    value={ruleForm.threshold}
                    onChange={(e) => setRuleForm({...ruleForm, threshold: e.target.value})}
                    placeholder="e.g., 10, 15%, $100"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAddRule(false)}
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
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartInventory;