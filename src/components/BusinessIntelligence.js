// BusinessIntelligence.js - Basic Business Intelligence Dashboard
import React, { useState, useEffect } from 'react';

const BusinessIntelligence = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0
  });

  useEffect(() => {
    // Placeholder for future Firebase integration
    // This will be connected to Firebase services later
    setStats({
      totalSales: 0,
      totalRevenue: 0,
      totalProducts: 0,
      lowStockProducts: 0
    });
  }, []);

  return (
    <div className="business-intelligence">
      <h2>Business Intelligence Dashboard</h2>
      
      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        <div className="stat-card" style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>Total Sales</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>{stats.totalSales}</p>
        </div>
        
        <div className="stat-card" style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>Total Revenue</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>PKR {stats.totalRevenue}</p>
        </div>
        
        <div className="stat-card" style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#17a2b8', margin: '0 0 10px 0' }}>Total Products</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>{stats.totalProducts}</p>
        </div>
        
        <div className="stat-card" style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>Low Stock Alert</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>{stats.lowStockProducts}</p>
        </div>
      </div>
      
      <div className="placeholder-message" style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#e9ecef',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3>🔥 Firebase Integration Coming Soon!</h3>
        <p>This dashboard will show real-time analytics once Firebase is configured.</p>
        <p>Features coming soon:</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>📊 Real-time sales analytics</li>
          <li>📈 Revenue trends and charts</li>
          <li>⚠️ Inventory alerts</li>
          <li>👥 Customer insights</li>
        </ul>
      </div>
    </div>
  );
};

export default BusinessIntelligence;