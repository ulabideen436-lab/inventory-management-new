import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function BusinessIntelligence() {
  const [analyticsData, setAnalyticsData] = useState({});
  const [predictions, setPredictions] = useState([]);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [marketTrends, setMarketTrends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Analytics settings
  const [analyticsSettings, setAnalyticsSettings] = useState({
    aiModels: {
      salesForecasting: { enabled: true, accuracy: 94.2 },
      customerSegmentation: { enabled: true, accuracy: 91.8 },
      priceOptimization: { enabled: true, accuracy: 88.5 },
      demandPrediction: { enabled: true, accuracy: 92.1 }
    },
    dataSourcees: {
      sales: true,
      inventory: true,
      customers: true,
      suppliers: true,
      external: false
    },
    reportingFrequency: 'daily',
    alertThresholds: {
      revenueDrop: 15,
      lowPerformance: 20,
      anomalyDetection: 2.5
    }
  });
  
  // Date range for analytics
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const token = localStorage.getItem('token');

  // Fetch all business intelligence data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock AI-powered analytics data
      setAnalyticsData({
        revenue: {
          current: 485640,
          previous: 423890,
          growth: 14.6,
          trend: 'up',
          forecast: 512000
        },
        profit: {
          current: 145692,
          previous: 127167,
          margin: 30.0,
          trend: 'up',
          forecast: 153600
        },
        customers: {
          total: 2847,
          new: 156,
          retention: 87.4,
          lifetime_value: 1420,
          trend: 'up'
        },
        inventory: {
          turnover: 8.2,
          value: 298450,
          optimization: 91.3,
          waste: 2.1,
          trend: 'stable'
        }
      });

      setKpis([
        {
          id: 1,
          name: 'Revenue Growth',
          value: '+14.6%',
          target: '+12%',
          status: 'excellent',
          icon: '📈',
          color: '#28a745',
          aiConfidence: 96
        },
        {
          id: 2,
          name: 'Customer Satisfaction',
          value: '4.7/5',
          target: '4.5/5',
          status: 'good',
          icon: '😊',
          color: '#28a745',
          aiConfidence: 91
        },
        {
          id: 3,
          name: 'Inventory Efficiency',
          value: '91.3%',
          target: '90%',
          status: 'excellent',
          icon: '📦',
          color: '#28a745',
          aiConfidence: 88
        },
        {
          id: 4,
          name: 'Profit Margin',
          value: '30.0%',
          target: '28%',
          status: 'excellent',
          icon: '💰',
          color: '#28a745',
          aiConfidence: 94
        },
        {
          id: 5,
          name: 'Sales Velocity',
          value: '127%',
          target: '100%',
          status: 'excellent',
          icon: '⚡',
          color: '#28a745',
          aiConfidence: 89
        },
        {
          id: 6,
          name: 'Market Share',
          value: '12.8%',
          target: '15%',
          status: 'warning',
          icon: '🎯',
          color: '#ffc107',
          aiConfidence: 85
        }
      ]);

      setPredictions([
        {
          id: 1,
          type: 'revenue',
          title: 'Q4 Revenue Forecast',
          prediction: '$1.8M - $2.1M',
          confidence: 92,
          timeframe: 'Next Quarter',
          factors: ['Seasonal trends', 'Product launches', 'Market conditions'],
          impact: 'high',
          accuracy: '94.2%'
        },
        {
          id: 2,
          type: 'customer',
          title: 'Customer Churn Risk',
          prediction: '23 customers at risk',
          confidence: 87,
          timeframe: 'Next 30 days',
          factors: ['Purchase patterns', 'Support interactions', 'Payment delays'],
          impact: 'medium',
          accuracy: '89.1%'
        },
        {
          id: 3,
          type: 'inventory',
          title: 'Stock Optimization',
          prediction: '$45K savings potential',
          confidence: 91,
          timeframe: 'Next 2 weeks',
          factors: ['Demand patterns', 'Supplier lead times', 'Seasonal adjustments'],
          impact: 'high',
          accuracy: '91.8%'
        },
        {
          id: 4,
          type: 'market',
          title: 'Price Opportunity',
          prediction: '8-12% price increase viable',
          confidence: 84,
          timeframe: 'Next month',
          factors: ['Competitor analysis', 'Demand elasticity', 'Cost changes'],
          impact: 'medium',
          accuracy: '86.3%'
        }
      ]);

      setCustomerInsights([
        {
          id: 1,
          segment: 'High-Value Customers',
          count: 245,
          revenue_share: 68,
          avg_order: 890,
          frequency: 2.3,
          characteristics: ['Enterprise clients', 'Bulk purchases', 'Loyal customers'],
          growth_trend: 'up',
          retention_rate: 94
        },
        {
          id: 2,
          segment: 'Growing Accounts',
          count: 412,
          revenue_share: 22,
          avg_order: 320,
          frequency: 1.8,
          characteristics: ['SMB clients', 'Increasing orders', 'Price sensitive'],
          growth_trend: 'up',
          retention_rate: 78
        },
        {
          id: 3,
          segment: 'At-Risk Customers',
          count: 89,
          revenue_share: 7,
          avg_order: 180,
          frequency: 0.8,
          characteristics: ['Declining orders', 'Payment delays', 'Support issues'],
          growth_trend: 'down',
          retention_rate: 45
        },
        {
          id: 4,
          segment: 'New Prospects',
          count: 156,
          revenue_share: 3,
          avg_order: 125,
          frequency: 1.2,
          characteristics: ['Recent signups', 'Trial purchases', 'Price sensitive'],
          growth_trend: 'stable',
          retention_rate: 62
        }
      ]);

      setMarketTrends([
        {
          id: 1,
          category: 'Electronics',
          trend: 'rising',
          strength: 85,
          duration: '6 weeks',
          impact: 'high',
          description: 'Strong demand for laptops and tablets, driven by remote work trends',
          recommendation: 'Increase inventory by 25%'
        },
        {
          id: 2,
          category: 'Office Supplies',
          trend: 'stable',
          strength: 62,
          duration: '3 months',
          impact: 'medium',
          description: 'Consistent demand with slight seasonal variations',
          recommendation: 'Maintain current stock levels'
        },
        {
          id: 3,
          category: 'Furniture',
          trend: 'declining',
          strength: 73,
          duration: '2 weeks',
          impact: 'medium',
          description: 'Temporary decline due to economic uncertainty',
          recommendation: 'Consider promotional pricing'
        },
        {
          id: 4,
          category: 'Accessories',
          trend: 'volatile',
          strength: 45,
          duration: '4 weeks',
          impact: 'low',
          description: 'Fluctuating demand patterns, difficult to predict',
          recommendation: 'Monitor closely and adjust quickly'
        }
      ]);

      setRecommendations([
        {
          id: 1,
          type: 'revenue',
          priority: 'high',
          title: 'Optimize Product Mix',
          description: 'Focus on high-margin electronics and reduce low-performing accessories',
          potential_impact: '+$125K revenue',
          confidence: 94,
          effort: 'medium',
          timeframe: '2-4 weeks'
        },
        {
          id: 2,
          type: 'customer',
          priority: 'high',
          title: 'Customer Retention Program',
          description: 'Implement targeted retention campaigns for at-risk high-value customers',
          potential_impact: 'Prevent $67K churn',
          confidence: 89,
          effort: 'high',
          timeframe: '1-2 weeks'
        },
        {
          id: 3,
          type: 'operations',
          priority: 'medium',
          title: 'Inventory Optimization',
          description: 'Reduce slow-moving inventory and increase fast-moving stock',
          potential_impact: '$45K cost savings',
          confidence: 91,
          effort: 'low',
          timeframe: '1 week'
        },
        {
          id: 4,
          type: 'pricing',
          priority: 'medium',
          title: 'Dynamic Pricing Strategy',
          description: 'Implement AI-driven pricing for 15 key products',
          potential_impact: '+8-12% margin',
          confidence: 86,
          effort: 'medium',
          timeframe: '3-5 weeks'
        }
      ]);

    } catch (err) {
      setError('Failed to fetch business intelligence data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper functions
  const formatCurrency = (amount) => {
    return `PKR ${new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}`;
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend) => {
    const icons = {
      up: '📈',
      down: '📉',
      stable: '➡️',
      rising: '📈',
      declining: '📉',
      volatile: '📊'
    };
    return icons[trend] || '📊';
  };

  const getTrendColor = (trend) => {
    const colors = {
      up: '#28a745',
      down: '#dc3545',
      stable: '#6c757d',
      rising: '#28a745',
      declining: '#dc3545',
      volatile: '#ffc107'
    };
    return colors[trend] || '#6c757d';
  };

  const getStatusColor = (status) => {
    const colors = {
      excellent: '#28a745',
      good: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#dc3545',
      medium: '#ffc107',
      low: '#28a745'
    };
    return colors[priority] || '#6c757d';
  };

  const getImpactColor = (impact) => {
    const colors = {
      high: '#dc3545',
      medium: '#ffc107',
      low: '#28a745'
    };
    return colors[impact] || '#6c757d';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>🧠 AI-Powered Business Intelligence</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}
          />
          <span style={{ color: '#6c757d' }}>to</span>
          <input 
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}
          />
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
            {loading ? '🔄 Analyzing...' : '🧠 Run AI Analysis'}
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

      {/* AI Model Status */}
      <div style={{ 
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d4fc',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '30px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0056b3' }}>🤖 AI Models Status</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {Object.entries(analyticsSettings.aiModels).map(([model, config]) => (
            <div key={model} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>{model.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ 
                  fontSize: '12px',
                  color: config.enabled ? '#28a745' : '#6c757d'
                }}>
                  {config.accuracy}%
                </span>
                <span style={{ fontSize: '12px' }}>{config.enabled ? '✅' : '⚪'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '2px solid #dee2e6', 
        marginBottom: '30px',
        gap: '20px'
      }}>
        {[
          { id: 'overview', label: '📊 Overview', icon: '📊' },
          { id: 'predictions', label: '🔮 AI Predictions', icon: '🔮' },
          { id: 'customers', label: '👥 Customer Intelligence', icon: '👥' },
          { id: 'market', label: '📈 Market Trends', icon: '📈' },
          { id: 'recommendations', label: '💡 AI Recommendations', icon: '💡' }
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Performance Indicators */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🎯 Key Performance Indicators</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              {kpis.map(kpi => (
                <div key={kpi.id} style={{ 
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef',
                  borderLeft: `6px solid ${kpi.color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '28px' }}>{kpi.icon}</span>
                    <span style={{ 
                      fontSize: '10px', 
                      backgroundColor: '#f8f9fa',
                      color: '#495057',
                      padding: '2px 6px', 
                      borderRadius: '10px'
                    }}>
                      AI: {kpi.aiConfidence}%
                    </span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: kpi.color, marginBottom: '5px' }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
                    {kpi.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    Target: {kpi.target}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Metrics Dashboard */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📊 Business Metrics Dashboard</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {[
                {
                  title: 'Revenue Analytics',
                  data: analyticsData.revenue,
                  icon: '💰',
                  color: '#28a745'
                },
                {
                  title: 'Profit Analysis',
                  data: analyticsData.profit,
                  icon: '📈',
                  color: '#17a2b8'
                },
                {
                  title: 'Customer Metrics',
                  data: analyticsData.customers,
                  icon: '👥',
                  color: '#ffc107'
                },
                {
                  title: 'Inventory Intelligence',
                  data: analyticsData.inventory,
                  icon: '📦',
                  color: '#6f42c1'
                }
              ].map((metric, index) => (
                <div key={index} style={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '24px', marginRight: '10px' }}>{metric.icon}</span>
                    <h4 style={{ margin: 0, color: '#495057' }}>{metric.title}</h4>
                  </div>
                  
                  {metric.data && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: metric.color }}>
                          {typeof metric.data.current === 'number' && metric.data.current > 1000 
                            ? formatCurrency(metric.data.current)
                            : metric.data.current}
                        </span>
                        <span style={{ 
                          fontSize: '12px',
                          color: metric.data.trend === 'up' ? '#28a745' : metric.data.trend === 'down' ? '#dc3545' : '#6c757d',
                          backgroundColor: metric.data.trend === 'up' ? '#d4edda' : metric.data.trend === 'down' ? '#f8d7da' : '#f8f9fa',
                          padding: '2px 6px',
                          borderRadius: '10px'
                        }}>
                          {getTrendIcon(metric.data.trend)} {metric.data.growth ? `${metric.data.growth > 0 ? '+' : ''}${metric.data.growth}%` : metric.data.trend}
                        </span>
                      </div>
                      
                      {metric.data.forecast && (
                        <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
                          Forecast: {typeof metric.data.forecast === 'number' && metric.data.forecast > 1000 
                            ? formatCurrency(metric.data.forecast)
                            : metric.data.forecast}
                        </div>
                      )}
                      
                      <div style={{ display: 'grid', gap: '5px', fontSize: '12px' }}>
                        {metric.data.previous && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Previous:</span>
                            <span>{typeof metric.data.previous === 'number' && metric.data.previous > 1000 
                              ? formatCurrency(metric.data.previous)
                              : metric.data.previous}</span>
                          </div>
                        )}
                        {metric.data.margin && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Margin:</span>
                            <span>{formatPercentage(metric.data.margin)}</span>
                          </div>
                        )}
                        {metric.data.retention && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Retention:</span>
                            <span>{formatPercentage(metric.data.retention)}</span>
                          </div>
                        )}
                        {metric.data.turnover && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Turnover:</span>
                            <span>{metric.data.turnover}x</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Predictions Tab */}
      {activeTab === 'predictions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>AI-Powered Business Predictions</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}>
                <option value="all">All Predictions</option>
                <option value="revenue">Revenue</option>
                <option value="customer">Customer</option>
                <option value="inventory">Inventory</option>
                <option value="market">Market</option>
              </select>
              <button style={{ 
                padding: '6px 12px', 
                backgroundColor: '#17a2b8', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                🔄 Refresh Predictions
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
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderLeft: `6px solid ${getImpactColor(prediction.impact)}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#495057' }}>{prediction.title}</h4>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: prediction.confidence > 90 ? '#d4edda' : prediction.confidence > 80 ? '#fff3cd' : '#f8d7da',
                      color: prediction.confidence > 90 ? '#155724' : prediction.confidence > 80 ? '#856404' : '#721c24',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {prediction.confidence}% Confidence
                    </span>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: getImpactColor(prediction.impact) + '20',
                      color: getImpactColor(prediction.impact),
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {prediction.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                    {prediction.prediction}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>
                    {prediction.timeframe} • Model Accuracy: {prediction.accuracy}
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
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}>
                    📊 View Details
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
                    📈 Track Progress
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Intelligence Tab */}
      {activeTab === 'customers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Customer Intelligence & Segmentation</h3>
            <button style={{ 
              padding: '6px 12px', 
              backgroundColor: '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              🧠 Re-analyze Segments
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {customerInsights.map(segment => (
              <div key={segment.id} style={{ 
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderLeft: `6px solid ${getTrendColor(segment.growth_trend)}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#495057' }}>{segment.segment}</h4>
                  <span style={{ 
                    fontSize: '20px'
                  }}>
                    {getTrendIcon(segment.growth_trend)}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{segment.count}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Customers</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{segment.revenue_share}%</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Revenue Share</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>${segment.avg_order}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Avg Order</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>{segment.retention_rate}%</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Retention</div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                    Key Characteristics:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {segment.characteristics.map((char, index) => (
                      <span key={index} style={{
                        padding: '4px 8px',
                        backgroundColor: '#f8f9fa',
                        color: '#495057',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}>
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}>
                    📧 Create Campaign
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}>
                    📊 Deep Analysis
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Trends Tab */}
      {activeTab === 'market' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Market Trends & Analysis</h3>
            <button style={{ 
              padding: '6px 12px', 
              backgroundColor: '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              🔄 Update Market Data
            </button>
          </div>

          <div style={{ display: 'grid', gap: '15px' }}>
            {marketTrends.map(trend => (
              <div key={trend.id} style={{ 
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderLeft: `6px solid ${getTrendColor(trend.trend)}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '24px' }}>{getTrendIcon(trend.trend)}</span>
                    <div>
                      <h4 style={{ margin: 0, color: '#495057' }}>{trend.category}</h4>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {trend.duration} trend • Strength: {trend.strength}%
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: getTrendColor(trend.trend) + '20',
                      color: getTrendColor(trend.trend),
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {trend.trend.toUpperCase()}
                    </span>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: getImpactColor(trend.impact) + '20',
                      color: getImpactColor(trend.impact),
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {trend.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px', color: '#495057' }}>
                  {trend.description}
                </div>
                
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <strong>AI Recommendation:</strong> {trend.recommendation}
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
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
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}>
                    📈 Set Alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>AI-Generated Business Recommendations</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}>
                <option value="all">All Recommendations</option>
                <option value="high">High Priority</option>
                <option value="revenue">Revenue Focus</option>
                <option value="customer">Customer Focus</option>
              </select>
              <button style={{ 
                padding: '6px 12px', 
                backgroundColor: '#17a2b8', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                🧠 Generate New
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {recommendations.map(rec => (
              <div key={rec.id} style={{ 
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderLeft: `6px solid ${getPriorityColor(rec.priority)}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#495057' }}>{rec.title}</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: getPriorityColor(rec.priority) + '20',
                      color: getPriorityColor(rec.priority),
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: '#e7f3ff',
                      color: '#0056b3',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {rec.confidence}% Confidence
                    </span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px', color: '#495057' }}>
                  {rec.description}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>{rec.potential_impact}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Potential Impact</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffc107' }}>{rec.effort}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Effort Level</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#17a2b8' }}>{rec.timeframe}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Timeframe</div>
                  </div>
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
                    ✅ Implement
                  </button>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    📊 View Analysis
                  </button>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    📅 Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessIntelligence;