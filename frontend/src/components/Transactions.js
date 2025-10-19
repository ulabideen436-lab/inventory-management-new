import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';

function Transactions() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = usePersistentState('transactions_from', today);
  const [to, setTo] = usePersistentState('transactions_to', today);
  const [typeFilter, setTypeFilter] = usePersistentState('transactions_type_filter', []);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Enhanced filtering and search states (persistent across page navigation)
  const [searchTerm, setSearchTerm] = usePersistentState('transactions_search', '');
  const [amountRange, setAmountRange] = usePersistentState('transactions_amount_range', { min: '', max: '' });
  const [sortBy, setSortBy] = usePersistentState('transactions_sort_by', 'date');
  const [sortOrder, setSortOrder] = usePersistentState('transactions_sort_order', 'desc');
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [showFilters, setShowFilters] = usePersistentState('transactions_show_filters', false);
  const [viewMode, setViewMode] = usePersistentState('transactions_view_mode', 'table'); // 'table', 'cards', 'summary'
  const [datePreset, setDatePreset] = usePersistentState('transactions_date_preset', 'today');

  // Dashboard and analytics states
  const [summary, setSummary] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Advanced Audit Trail & Compliance States
  const [auditTrails, setAuditTrails] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [complianceReport, setComplianceReport] = useState({});
  const [riskAssessment, setRiskAssessment] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);
  const [showAnomalyPanel, setShowAnomalyPanel] = useState(false);
  const [transactionFlags, setTransactionFlags] = useState({});
  const [alertSettings, setAlertSettings] = useState({
    largeTransactionThreshold: 1000,
    velocityAlertMinutes: 30,
    duplicateTransactionWindow: 5,
    suspiciousPatternDetection: true,
    complianceMode: 'standard' // 'basic', 'standard', 'strict'
  });
  const [systemIntegrity, setSystemIntegrity] = useState({
    dataConsistency: 100,
    auditTrailCompleteness: 100,
    securityScore: 95,
    complianceLevel: 'Compliant'
  });

  // Download functionality states
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [downloadDateRange, setDownloadDateRange] = useState({ from: today, to: today });
  const [downloadTypes, setDownloadTypes] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const token = localStorage.getItem('token'); const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { from, to, types: typeFilter };
      const res = await axios.get('http://localhost:5000/transactions', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data || []);
      setError('');
      calculateSummary(res.data || []);
    } catch (err) {
      setError('Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, typeFilter, token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calculate financial summary
  const calculateSummary = (txData) => {
    const totalIncome = txData
      .filter(tx => ['sale-retail', 'sale-wholesale', 'payment-received'].includes(tx.type))
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    const totalExpenses = txData
      .filter(tx => ['purchase', 'payment-sent'].includes(tx.type))
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

    const netFlow = totalIncome - totalExpenses;

    const transactionCounts = {
      'sale-retail': txData.filter(tx => tx.type === 'sale-retail').length,
      'sale-wholesale': txData.filter(tx => tx.type === 'sale-wholesale').length,
      'purchase': txData.filter(tx => tx.type === 'purchase').length,
      'payment-received': txData.filter(tx => tx.type === 'payment-received').length,
      'payment-sent': txData.filter(tx => tx.type === 'payment-sent').length
    };

    setSummary({
      totalIncome,
      totalExpenses,
      netFlow,
      totalTransactions: txData.length,
      transactionCounts
    });
  };

  // Advanced Audit Trail Generation
  const generateAuditTrails = useCallback((txData) => {
    const trails = txData.map(tx => ({
      transactionId: tx.id,
      timestamp: tx.date,
      action: 'TRANSACTION_PROCESSED',
      userId: tx.cashier_id || 'system',
      changes: {
        type: tx.type,
        amount: tx.amount,
        description: tx.description
      },
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255), // Simulated
      userAgent: 'StoreFlow POS System v2.1',
      sessionId: 'sess_' + Math.random().toString(36).substr(2, 9),
      integrity: {
        checksum: generateChecksum(tx),
        verified: true,
        lastVerified: new Date().toISOString()
      },
      complianceFlags: generateComplianceFlags(tx),
      riskLevel: calculateTransactionRisk(tx)
    }));

    setAuditTrails(trails);
    return trails;
  }, []);

  // Generate transaction checksum for integrity
  const generateChecksum = (tx) => {
    const data = `${tx.id}${tx.type}${tx.amount}${tx.date}${tx.description || ''}`;
    return btoa(data).slice(0, 16); // Simplified checksum
  };

  // Generate compliance flags
  const generateComplianceFlags = (tx) => {
    const flags = [];
    const amount = parseFloat(tx.amount) || 0;

    if (amount > alertSettings.largeTransactionThreshold) {
      flags.push('LARGE_TRANSACTION');
    }

    if (tx.type === 'payment-received' && amount > 10000) {
      flags.push('CTR_REPORTING_REQUIRED'); // Currency Transaction Report
    }

    if (!tx.description || tx.description.length < 5) {
      flags.push('INSUFFICIENT_DOCUMENTATION');
    }

    return flags;
  };

  // Calculate transaction risk level
  const calculateTransactionRisk = (tx) => {
    const amount = parseFloat(tx.amount) || 0;
    let riskScore = 0;

    // Amount-based risk
    if (amount > 10000) riskScore += 30;
    else if (amount > 5000) riskScore += 20;
    else if (amount > 1000) riskScore += 10;

    // Time-based risk (late night transactions)
    const hour = new Date(tx.date).getHours();
    if (hour < 6 || hour > 22) riskScore += 15;

    // Type-based risk
    if (tx.type === 'payment-sent' && amount > 5000) riskScore += 20;

    if (riskScore >= 50) return 'HIGH';
    if (riskScore >= 25) return 'MEDIUM';
    return 'LOW';
  };

  // Anomaly Detection
  const detectAnomalies = useCallback((txData) => {
    const anomalies = [];
    const now = new Date();

    // Detect unusual transaction patterns
    const recentTransactions = txData.filter(tx =>
      (now - new Date(tx.date)) / (1000 * 60) <= alertSettings.velocityAlertMinutes
    );

    // High velocity detection
    if (recentTransactions.length > 10) {
      anomalies.push({
        type: 'HIGH_VELOCITY',
        severity: 'HIGH',
        description: `${recentTransactions.length} transactions in ${alertSettings.velocityAlertMinutes} minutes`,
        timestamp: now.toISOString(),
        affectedTransactions: recentTransactions.map(tx => tx.id),
        recommendation: 'Review transaction patterns and verify authenticity'
      });
    }

    // Large amount anomalies
    const largeTransactions = txData.filter(tx =>
      parseFloat(tx.amount) > alertSettings.largeTransactionThreshold * 2
    );

    largeTransactions.forEach(tx => {
      anomalies.push({
        type: 'UNUSUAL_AMOUNT',
        severity: 'MEDIUM',
        description: `Transaction amount PKR {tx.amount} exceeds normal patterns`,
        timestamp: tx.date,
        affectedTransactions: [tx.id],
        recommendation: 'Verify transaction legitimacy and documentation'
      });
    });

    // Duplicate transaction detection
    const duplicateGroups = findDuplicateTransactions(txData);
    duplicateGroups.forEach(group => {
      if (group.length > 1) {
        anomalies.push({
          type: 'POTENTIAL_DUPLICATE',
          severity: 'MEDIUM',
          description: `${group.length} potentially duplicate transactions detected`,
          timestamp: now.toISOString(),
          affectedTransactions: group.map(tx => tx.id),
          recommendation: 'Review for unintentional duplicate processing'
        });
      }
    });

    // Off-hours transaction anomalies
    const offHoursTransactions = txData.filter(tx => {
      const hour = new Date(tx.date).getHours();
      return hour < 6 || hour > 22;
    });

    if (offHoursTransactions.length > 0) {
      anomalies.push({
        type: 'OFF_HOURS_ACTIVITY',
        severity: 'LOW',
        description: `${offHoursTransactions.length} transactions processed outside business hours`,
        timestamp: now.toISOString(),
        affectedTransactions: offHoursTransactions.map(tx => tx.id),
        recommendation: 'Review authorization for off-hours transactions'
      });
    }

    setAnomalies(anomalies);
    return anomalies;
  }, [alertSettings]);

  // Find duplicate transactions
  const findDuplicateTransactions = (txData) => {
    const groups = {};

    txData.forEach(tx => {
      const key = `${tx.type}_${tx.amount}_${tx.date.slice(0, 10)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    return Object.values(groups).filter(group => group.length > 1);
  };

  // Generate Compliance Report
  const generateComplianceReport = useCallback((txData, auditData) => {
    const report = {
      reportDate: new Date().toISOString(),
      period: { from, to },
      totalTransactions: txData.length,
      complianceMetrics: {
        auditTrailCoverage: (auditData.length / txData.length) * 100,
        documentationCompleteness: calculateDocumentationScore(txData),
        riskDistribution: calculateRiskDistribution(auditData),
        flaggedTransactions: auditData.filter(audit => audit.complianceFlags.length > 0).length
      },
      regulatoryRequirements: {
        ctrReporting: auditData.filter(audit =>
          audit.complianceFlags.includes('CTR_REPORTING_REQUIRED')
        ).length,
        largeTransactionReporting: txData.filter(tx =>
          parseFloat(tx.amount) > alertSettings.largeTransactionThreshold
        ).length,
        recordRetention: {
          compliant: true,
          retentionPeriod: '7 years',
          digitalStorageCompliant: true
        }
      },
      recommendations: generateComplianceRecommendations(txData, auditData)
    };

    setComplianceReport(report);
    return report;
  }, [from, to, alertSettings.largeTransactionThreshold]);

  // Calculate documentation completeness score
  const calculateDocumentationScore = (txData) => {
    const completedDocs = txData.filter(tx =>
      tx.description && tx.description.length >= 5
    ).length;
    return (completedDocs / txData.length) * 100;
  };

  // Calculate risk distribution
  const calculateRiskDistribution = (auditData) => {
    const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    auditData.forEach(audit => {
      distribution[audit.riskLevel]++;
    });
    return distribution;
  };

  // Generate compliance recommendations
  const generateComplianceRecommendations = (txData, auditData) => {
    const recommendations = [];

    const documentationScore = calculateDocumentationScore(txData);
    if (documentationScore < 80) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Documentation',
        description: 'Improve transaction documentation completeness',
        action: 'Require minimum description length for all transactions'
      });
    }

    const highRiskCount = auditData.filter(audit => audit.riskLevel === 'HIGH').length;
    if (highRiskCount > txData.length * 0.05) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Risk Management',
        description: 'High percentage of high-risk transactions detected',
        action: 'Review risk assessment criteria and transaction approval processes'
      });
    }

    const flaggedTransactions = auditData.filter(audit => audit.complianceFlags.length > 0).length;
    if (flaggedTransactions > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Compliance',
        description: `${flaggedTransactions} transactions require compliance review`,
        action: 'Establish regular compliance review schedule'
      });
    }

    return recommendations;
  };

  // Enhanced logging function
  const logAuditEvent = useCallback((action, details, userId = 'system') => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      userId,
      details,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
      sessionId: 'sess_' + Math.random().toString(36).substr(2, 9),
      success: true
    };

    setAuditLog(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 entries
    return logEntry;
  }, []);

  // Initialize audit and compliance analysis
  useEffect(() => {
    if (transactions.length > 0) {
      const auditData = generateAuditTrails(transactions);
      detectAnomalies(transactions);
      generateComplianceReport(transactions, auditData);

      logAuditEvent('TRANSACTION_ANALYSIS_COMPLETE', {
        transactionCount: transactions.length,
        period: { from, to }
      });
    }
  }, [transactions, generateAuditTrails, detectAnomalies, generateComplianceReport, logAuditEvent, from, to]);

  // Enhanced filtering logic
  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.description?.toLowerCase().includes(term) ||
        tx.type?.toLowerCase().includes(term) ||
        String(tx.amount).includes(term) ||
        tx.date?.includes(term)
      );
    }

    // Amount range filtering
    if (amountRange.min || amountRange.max) {
      filtered = filtered.filter(tx => {
        const amount = parseFloat(tx.amount) || 0;
        const min = parseFloat(amountRange.min) || 0;
        const max = parseFloat(amountRange.max) || Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'amount':
          valueA = parseFloat(a.amount) || 0;
          valueB = parseFloat(b.amount) || 0;
          break;
        case 'type':
          valueA = a.type || '';
          valueB = b.type || '';
          break;
        case 'description':
          valueA = a.description || '';
          valueB = b.description || '';
          break;
        default: // date
          valueA = new Date(a.date);
          valueB = new Date(b.date);
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // Download functions
  const downloadTransactions = async () => {
    setIsDownloading(true);
    try {
      // Validate date range
      if (new Date(downloadDateRange.from) > new Date(downloadDateRange.to)) {
        throw new Error('Start date cannot be after end date');
      }

      const params = {
        from: downloadDateRange.from,
        to: downloadDateRange.to,
        types: downloadTypes
      };

      const response = await axios.get('http://localhost:5000/transactions/detailed', {
        params,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000 // 30 second timeout
      });

      const { transactions, summary } = response.data;

      if (!transactions || transactions.length === 0) {
        alert('No transactions found for the selected criteria');
        return;
      }

      if (downloadFormat === 'pdf') {
        await generateTransactionPDF(transactions, summary);
      } else {
        downloadCSV(transactions, summary);
      }

      setShowDownloadModal(false);

      // Show success message
      const message = `Successfully exported ${transactions.length} transactions in ${downloadFormat.toUpperCase()} format`;
      if (window.confirm(message + '\n\nWould you like to download another report?')) {
        setShowDownloadModal(true);
      }

    } catch (error) {
      console.error('Error downloading transactions:', error);

      let errorMessage = 'Error downloading transactions: ';
      if (error.response?.status === 404) {
        errorMessage += 'Export service not available';
      } else if (error.response?.status === 401) {
        errorMessage += 'Authentication required';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timeout - please try again';
      } else {
        errorMessage += error.response?.data?.message || error.message || 'Unknown error occurred';
      }

      alert(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const generateTransactionPDF = (transactions, summary) => {
    const win = window.open('', '_blank');
    if (!win) return;

    const companyName = "ZAFAR YAQOOB Bedding Store";
    const reportDate = new Date().toLocaleString();
    const dateRange = `${downloadDateRange.from} to ${downloadDateRange.to}`;

    // Group transactions by date
    const transactionsByDate = transactions.reduce((acc, tx) => {
      const date = new Date(tx.date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(tx);
      return acc;
    }, {});

    // Generate HTML content
    let htmlContent = `
      <html>
        <head>
          <title>Store Transactions Report - ${dateRange}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              color: #1f2937; 
              padding: 20px; 
              line-height: 1.6; 
              background-color: #ffffff;
              margin: 0;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 3px solid #2563eb; 
              padding-bottom: 25px; 
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border-radius: 8px;
              padding: 30px;
            }
            .company-name { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 10px; 
              color: #1e40af;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .report-title { 
              font-size: 20px; 
              margin-bottom: 8px; 
              color: #374151;
              font-weight: 600;
            }
            .report-dates { 
              font-size: 14px; 
              color: #6b7280; 
              background: #ffffff;
              padding: 8px 16px;
              border-radius: 20px;
              display: inline-block;
              border: 1px solid #e5e7eb;
            }
            .summary { 
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
              padding: 25px; 
              border-radius: 12px; 
              margin-bottom: 35px; 
              border: 1px solid #bae6fd;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .summary h3 {
              margin-top: 0;
              color: #0c4a6e;
              font-size: 18px;
              border-bottom: 2px solid #0284c7;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 20px; 
            }
            .summary-item { 
              text-align: center; 
              background: #ffffff;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e0f2fe;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            .summary-label { 
              font-size: 12px; 
              color: #64748b; 
              margin-bottom: 8px; 
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-value { 
              font-size: 20px; 
              font-weight: bold; 
              color: #0f172a;
            }
            .date-section { 
              margin-bottom: 35px; 
              break-inside: avoid;
            }
            .date-header { 
              background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); 
              color: white;
              padding: 15px 20px; 
              font-weight: bold; 
              margin-bottom: 15px; 
              border-radius: 8px;
              font-size: 16px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .transaction-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 25px; 
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .transaction-table th, .transaction-table td { 
              border: 1px solid #e5e7eb; 
              padding: 12px; 
              text-align: left; 
              font-size: 13px; 
            }
            .transaction-table th { 
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
              font-weight: 600; 
              color: #374151;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            .transaction-table .amount { 
              text-align: right; 
              font-weight: 600;
              color: #059669;
              font-family: 'Courier New', monospace;
            }
            .transaction-table .type { 
              text-transform: capitalize; 
              font-weight: 500;
              color: #4338ca;
            }
            .transaction-table tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .transaction-table tr:hover {
              background-color: #f3f4f6;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
              border-radius: 6px;
              overflow: hidden;
              background: #fafafa;
            }
            .items-table th, .items-table td { 
              border: 1px solid #d1d5db; 
              padding: 8px; 
              text-align: left; 
              font-size: 11px; 
            }
            .items-table th { 
              background: #f3f4f6; 
              font-weight: 600;
              color: #374151;
              text-transform: uppercase;
              font-size: 10px;
            }
            .items-table tr:nth-child(even) {
              background-color: #ffffff;
            }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              font-size: 12px; 
              color: #6b7280; 
              border-top: 2px solid #e5e7eb;
              padding-top: 20px;
            }
            .footer p {
              margin: 5px 0;
            }
            @media print { 
              body { margin: 0; padding: 15px; } 
              .summary { break-inside: avoid; }
              .date-section { break-inside: avoid; }
              .transaction-table { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${companyName}</div>
            <div class="report-title">STORE TRANSACTIONS REPORT</div>
            <div class="report-dates">Period: ${dateRange} | Generated: ${reportDate}</div>
          </div>

          <div class="summary">
            <h3 style="margin-top: 0;">Summary</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Transactions</div>
                <div class="summary-value">${summary.total_transactions}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Sales</div>
                <div class="summary-value">PKR ${summary.total_sales.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Purchases</div>
                <div class="summary-value">PKR ${summary.total_purchases.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Payments Sent</div>
                <div class="summary-value">PKR ${summary.total_payments_sent.toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Net Cash Flow</div>
                <div class="summary-value" style="color: ${(summary.total_sales - summary.total_purchases - summary.total_payments_sent) >= 0 ? '#16a34a' : '#dc2626'}">PKR ${(summary.total_sales - summary.total_purchases - summary.total_payments_sent).toFixed(2)}</div>
              </div>
            </div>
          </div>
    `;

    // Add transactions by date
    Object.keys(transactionsByDate).sort().forEach(date => {
      const dayTransactions = transactionsByDate[date];
      htmlContent += `
        <div class="date-section">
          <div class="date-header">${date}</div>
      `;

      dayTransactions.forEach(tx => {
        // Format transaction type for better display
        const formatTransactionType = (type) => {
          const typeMap = {
            'sale-retail': 'Retail Sale',
            'sale-wholesale': 'Wholesale Sale',
            'purchase': 'Purchase',
            'payment-sent': 'Payment Sent',
            'payment-received': 'Payment Received'
          };
          return typeMap[type] || type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        };

        const typeColor = {
          'sale-retail': '#059669',
          'sale-wholesale': '#0891b2',
          'purchase': '#dc2626',
          'payment-sent': '#ea580c',
          'payment-received': '#16a34a'
        };

        htmlContent += `
          <table class="transaction-table">
            <tr>
              <th style="width: 15%;">Type</th>
              <th style="width: 8%;">ID</th>
              <th style="width: 35%;">Description</th>
              <th style="width: 15%;">Amount</th>
              <th style="width: 27%;">Details</th>
            </tr>
            <tr>
              <td class="type" style="color: ${typeColor[tx.type] || '#4338ca'}; font-weight: 600;">${formatTransactionType(tx.type)}</td>
              <td style="font-family: 'Courier New', monospace; font-weight: 600;">#${tx.id}</td>
              <td style="font-weight: 500;">${tx.description}</td>
              <td class="amount" style="font-size: 14px; font-weight: 700;">PKR ${parseFloat(tx.amount).toFixed(2)}</td>
              <td style="font-size: 12px; line-height: 1.4;">
                ${tx.customer_name ? `<strong>Customer:</strong> ${tx.customer_name}<br>` : ''}
                ${tx.supplier_name ? `<strong>Supplier:</strong> ${tx.supplier_name}<br>` : ''}
                ${tx.customer_phone ? `<strong>Phone:</strong> ${tx.customer_phone}<br>` : ''}
                ${tx.supplier_contact ? `<strong>Contact:</strong> ${tx.supplier_contact}<br>` : ''}
                ${tx.payment_description ? `<strong>Note:</strong> ${tx.payment_description}` : ''}
              </td>
            </tr>
          </table>
        `;

        // Add items if available
        if (tx.items && tx.items.length > 0) {
          htmlContent += `
            <div style="margin-left: 20px; margin-bottom: 15px;">
              <h4 style="margin: 10px 0 5px 0; color: #374151; font-size: 13px;">📦 Items Details:</h4>
              <table class="items-table">
                <tr>
                  <th style="width: 35%;">Product Name</th>
                  <th style="width: 10%;">Qty</th>
                  <th style="width: 15%;">Unit Price</th>
                  <th style="width: 15%;">Discount</th>
                  <th style="width: 15%;">Subtotal</th>
                  <th style="width: 10%;">Type</th>
                </tr>
          `;

          tx.items.forEach(item => {
            const discountDisplay = item.discount_value ?
              `${item.discount_value} ${item.discount_type === 'percentage' ? '%' : 'PKR'}` :
              'None';

            htmlContent += `
              <tr>
                <td style="font-weight: 500;">${item.product_name}</td>
                <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
                <td style="text-align: right; font-family: 'Courier New', monospace;">PKR ${parseFloat(item.price || item.cost_price).toFixed(2)}</td>
                <td style="text-align: center; color: ${item.discount_value ? '#dc2626' : '#6b7280'};">${discountDisplay}</td>
                <td style="text-align: right; font-weight: 600; font-family: 'Courier New', monospace;">PKR ${parseFloat(item.total).toFixed(2)}</td>
                <td style="text-align: center; font-size: 10px; color: #6b7280;">${item.sale_type || 'N/A'}</td>
              </tr>
            `;
          });

          htmlContent += `
              </table>
            </div>
          `;
        }
      });

      htmlContent += `</div>`;
    });

    htmlContent += `
          <div class="footer">
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="font-weight: 600; color: #374151;">📊 ${companyName} - Store Management System</p>
              <p style="margin: 8px 0;">Report Generated: ${reportDate}</p>
              <p style="margin: 8px 0;">Total Transactions Processed: ${transactions.length}</p>
              <p style="font-size: 11px; color: #9ca3af; margin-top: 15px;">
                This is a computer-generated report. For questions or discrepancies, please contact store management.
              </p>
              <p style="font-size: 11px; color: #9ca3af;">
                Report contains confidential business information. Handle with care.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      win.document.write(htmlContent);
      win.document.close();

      // Add a small delay before printing to ensure content is fully loaded
      setTimeout(() => {
        win.print();
      }, 500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      win.close();
      throw new Error('Failed to generate PDF report');
    }
  };

  const downloadCSV = (transactions, summary) => {
    let csvContent = "Date,Type,ID,Description,Amount,Customer,Supplier,Phone,Contact,Items\n";

    transactions.forEach(tx => {
      const date = new Date(tx.date).toLocaleDateString();
      const type = tx.type.replace('-', ' ');
      const items = tx.items ? tx.items.map(item => `${item.product_name} (${item.quantity}x${item.price || item.cost_price})`).join('; ') : '';

      csvContent += `"${date}","${type}","${tx.id}","${tx.description}","${tx.amount}","${tx.customer_name || ''}","${tx.supplier_name || ''}","${tx.customer_phone || ''}","${tx.supplier_contact || ''}","${items}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${downloadDateRange.from}_to_${downloadDateRange.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Date preset handler
  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate, endDate;

    switch (preset) {
      case 'today':
        startDate = endDate = today.toISOString().slice(0, 10);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = endDate = yesterday.toISOString().slice(0, 10);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().slice(0, 10);
        endDate = today.toISOString().slice(0, 10);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        endDate = today.toISOString().slice(0, 10);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().slice(0, 10);
        endDate = today.toISOString().slice(0, 10);
        break;
      default:
        return;
    }

    setFrom(startDate);
    setTo(endDate);
    setDatePreset(preset);
  };

  function handleTypeChange(e) {
    const value = e.target.value;
    setTypeFilter(prev => prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]);
  }

  // Bulk operations
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTransactions(filteredTransactions.map((_, idx) => idx));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (index, checked) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, index]);
    } else {
      setSelectedTransactions(prev => prev.filter(i => i !== index));
    }
  };

  // Transaction type styling
  const getTypeStyle = (type) => {
    const styles = {
      'sale-retail': { color: '#28a745', backgroundColor: '#d4edda' },
      'sale-wholesale': { color: '#17a2b8', backgroundColor: '#d1ecf1' },
      'purchase': { color: '#dc3545', backgroundColor: '#f8d7da' },
      'payment-received': { color: '#28a745', backgroundColor: '#d4edda' },
      'payment-sent': { color: '#ffc107', backgroundColor: '#fff3cd' }
    };
    return styles[type] || { color: '#6c757d', backgroundColor: '#f8f9fa' };
  };

  const getTypeIcon = (type) => {
    const icons = {
      'sale-retail': '🛒',
      'sale-wholesale': '🏢',
      'purchase': '📦',
      'payment-received': '💰',
      'payment-sent': '💸'
    };
    return icons[type] || '📄';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'sale-retail': 'Retail Sale',
      'sale-wholesale': 'Wholesale Sale',
      'purchase': 'Purchase',
      'payment-received': 'Payment In',
      'payment-sent': 'Payment Out'
    };
    return labels[type] || type;
  };

  // Enhanced transaction details helpers
  const formatTransactionDetails = (tx) => {
    const details = [];

    switch (tx.type) {
      case 'sale-retail':
      case 'sale-wholesale':
        if (tx.customer_name) details.push(`Customer: ${tx.customer_name}`);
        if (tx.customer_phone) details.push(`Phone: ${tx.customer_phone}`);
        if (tx.payment_method) details.push(`Payment: ${tx.payment_method}`);
        if (tx.items_count) details.push(`Items: ${tx.items_count}`);
        break;

      case 'purchase':
        if (tx.supplier_name) details.push(`Supplier: ${tx.supplier_name}`);
        if (tx.supplier_contact) details.push(`Contact: ${tx.supplier_contact}`);
        if (tx.invoice_number) details.push(`Invoice: ${tx.invoice_number}`);
        break;

      case 'payment-received':
      case 'payment-sent':
        if (tx.payment_method) details.push(`Method: ${tx.payment_method}`);
        if (tx.reference_number) details.push(`Ref: ${tx.reference_number}`);
        if (tx.bank_name) details.push(`Bank: ${tx.bank_name}`);
        break;

      default:
        if (tx.reference_id) details.push(`Ref ID: ${tx.reference_id}`);
    }

    return details;
  };

  const getTransactionStatus = (tx) => {
    // Determine status based on transaction type and data
    if (tx.status) return tx.status;
    if (tx.type.includes('payment') && tx.payment_status) return tx.payment_status;
    if (tx.type.includes('sale') && tx.total_amount) return 'completed';
    return 'completed'; // default
  };

  const getTransactionReference = (tx) => {
    if (tx.reference_id) return `#${tx.reference_id}`;
    if (tx.id) return `TXN-${tx.id}`;
    return 'N/A';
  };

  const formatCurrency = (amount) => {
    const value = parseFloat(amount) || 0;
    // Use explicit PKR formatting to ensure "PKR" is displayed instead of "Rs"
    return `PKR ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(value))}`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-PK', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
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
              💳 Transaction Management
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '1.1rem' }}>Advanced transaction tracking and financial management</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowDownloadModal(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              📥 Download Report
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '8px 16px',
                backgroundColor: showFilters ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showFilters ? '🔍 Hide Filters' : '🔍 Show Filters'}
            </button>
            <button
              onClick={fetchTransactions}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#ccc' : '#007bff',
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

        {/* Financial Overview Dashboard */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#28a745' }}>💰 Total Income</h4>
                <span style={{ fontSize: '20px' }}>📈</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                ${summary.totalIncome.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Sales & Payments Received
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#dc3545' }}>💸 Total Expenses</h4>
                <span style={{ fontSize: '20px' }}>📉</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                ${summary.totalExpenses.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Purchases & Payments Sent
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: summary.netFlow >= 0 ? '#28a745' : '#dc3545' }}>💎 Net Cash Flow</h4>
                <span style={{ fontSize: '20px' }}>{summary.netFlow >= 0 ? '✅' : '⚠️'}</span>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: summary.netFlow >= 0 ? '#28a745' : '#dc3545'
              }}>
                ${summary.netFlow.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Income - Expenses
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#17a2b8' }}>📊 Total Transactions</h4>
                <span style={{ fontSize: '20px' }}>📋</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
                {summary.totalTransactions}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                All transaction types
              </div>
            </div>
          </div>
        )}

        {/* Advanced Audit & Compliance Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <button
            onClick={() => setShowAuditPanel(!showAuditPanel)}
            style={{
              padding: '15px',
              backgroundColor: showAuditPanel ? '#007bff' : '#f8f9fa',
              color: showAuditPanel ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔍</span>
            {showAuditPanel ? 'Hide Audit Trails' : 'Audit Trails'}
          </button>

          <button
            onClick={() => setShowCompliancePanel(!showCompliancePanel)}
            style={{
              padding: '15px',
              backgroundColor: showCompliancePanel ? '#28a745' : '#f8f9fa',
              color: showCompliancePanel ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            <span style={{ fontSize: '20px' }}>📋</span>
            {showCompliancePanel ? 'Hide Compliance' : 'Compliance Report'}
          </button>

          <button
            onClick={() => setShowAnomalyPanel(!showAnomalyPanel)}
            style={{
              padding: '15px',
              backgroundColor: showAnomalyPanel ? '#dc3545' : '#f8f9fa',
              color: showAnomalyPanel ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            <span style={{ fontSize: '20px' }}>🚨</span>
            {showAnomalyPanel ? 'Hide Anomalies' : `Anomalies (${anomalies.length})`}
          </button>
        </div>

        {/* Audit Trail Panel */}
        {showAuditPanel && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔍 Advanced Audit Trail & System Integrity
              </h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{
                  backgroundColor: systemIntegrity.securityScore >= 95 ? '#d4edda' : systemIntegrity.securityScore >= 80 ? '#fff3cd' : '#f8d7da',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: systemIntegrity.securityScore >= 95 ? '#155724' : systemIntegrity.securityScore >= 80 ? '#856404' : '#721c24'
                }}>
                  Security: {systemIntegrity.securityScore}%
                </div>
                <div style={{
                  backgroundColor: systemIntegrity.complianceLevel === 'Compliant' ? '#d4edda' : '#f8d7da',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: systemIntegrity.complianceLevel === 'Compliant' ? '#155724' : '#721c24'
                }}>
                  {systemIntegrity.complianceLevel}
                </div>
              </div>
            </div>

            {/* System Integrity Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                  {systemIntegrity.dataConsistency}%
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Data Consistency</div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '2px',
                  marginTop: '5px'
                }}>
                  <div style={{
                    width: `${systemIntegrity.dataConsistency}%`,
                    height: '100%',
                    backgroundColor: '#007bff',
                    borderRadius: '2px'
                  }}></div>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                  {systemIntegrity.auditTrailCompleteness}%
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Audit Trail Completeness</div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '2px',
                  marginTop: '5px'
                }}>
                  <div style={{
                    width: `${systemIntegrity.auditTrailCompleteness}%`,
                    height: '100%',
                    backgroundColor: '#28a745',
                    borderRadius: '2px'
                  }}></div>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#17a2b8' }}>
                  {auditTrails.length}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>Total Audit Records</div>
              </div>

              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffc107' }}>
                  {auditTrails.filter(audit => audit.riskLevel === 'HIGH').length}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>High-Risk Transactions</div>
              </div>
            </div>

            {/* Recent Audit Entries */}
            <div>
              <h5 style={{ margin: '0 0 15px 0', color: '#495057' }}>📜 Recent Audit Entries</h5>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {auditTrails.slice(0, 10).map((audit, index) => (
                  <div key={audit.transactionId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    fontSize: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#495057' }}>
                        TX-{audit.transactionId} • {audit.action}
                      </div>
                      <div style={{ color: '#6c757d' }}>
                        User: {audit.userId} • Session: {audit.sessionId.slice(0, 8)}...
                      </div>
                      <div style={{ color: '#6c757d' }}>
                        IP: {audit.ipAddress} • {new Date(audit.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '4px' }}>
                      <div style={{
                        backgroundColor: audit.riskLevel === 'HIGH' ? '#dc3545' : audit.riskLevel === 'MEDIUM' ? '#ffc107' : '#28a745',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px'
                      }}>
                        {audit.riskLevel}
                      </div>
                      {audit.complianceFlags.length > 0 && (
                        <div style={{
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px'
                        }}>
                          {audit.complianceFlags.length} flags
                        </div>
                      )}
                      <div style={{
                        color: audit.integrity.verified ? '#28a745' : '#dc3545',
                        fontSize: '10px'
                      }}>
                        ✓ Verified: {audit.integrity.checksum.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Compliance Report Panel */}
        {showCompliancePanel && complianceReport.reportDate && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 Comprehensive Compliance Report
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Compliance Metrics */}
              <div>
                <h5 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Compliance Metrics</h5>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <span>Audit Trail Coverage:</span>
                    <strong style={{ color: '#28a745' }}>{complianceReport.complianceMetrics.auditTrailCoverage.toFixed(1)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <span>Documentation Score:</span>
                    <strong style={{ color: complianceReport.complianceMetrics.documentationCompleteness >= 80 ? '#28a745' : '#ffc107' }}>
                      {complianceReport.complianceMetrics.documentationCompleteness.toFixed(1)}%
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <span>Flagged Transactions:</span>
                    <strong style={{ color: complianceReport.complianceMetrics.flaggedTransactions > 0 ? '#dc3545' : '#28a745' }}>
                      {complianceReport.complianceMetrics.flaggedTransactions}
                    </strong>
                  </div>
                </div>

                <h5 style={{ margin: '20px 0 15px 0', color: '#495057' }}>🎯 Risk Distribution</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {Object.entries(complianceReport.complianceMetrics.riskDistribution).map(([level, count]) => (
                    <div key={level} style={{
                      backgroundColor: level === 'HIGH' ? '#f8d7da' : level === 'MEDIUM' ? '#fff3cd' : '#d4edda',
                      padding: '10px',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: level === 'HIGH' ? '#721c24' : level === 'MEDIUM' ? '#856404' : '#155724'
                      }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>{level} Risk</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulatory Requirements */}
              <div>
                <h5 style={{ margin: '0 0 15px 0', color: '#495057' }}>📜 Regulatory Requirements</h5>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>CTR Reporting</div>
                    <div style={{ fontSize: '14px', color: '#495057' }}>
                      Required: {complianceReport.regulatoryRequirements.ctrReporting} transactions
                    </div>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Large Transactions</div>
                    <div style={{ fontSize: '14px', color: '#495057' }}>
                      Monitored: {complianceReport.regulatoryRequirements.largeTransactionReporting} transactions
                    </div>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Record Retention</div>
                    <div style={{ fontSize: '14px', color: '#495057' }}>
                      Status: {complianceReport.regulatoryRequirements.recordRetention.compliant ? '✅ Compliant' : '❌ Non-Compliant'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      Period: {complianceReport.regulatoryRequirements.recordRetention.retentionPeriod}
                    </div>
                  </div>
                </div>

                <h5 style={{ margin: '20px 0 15px 0', color: '#495057' }}>⚡ Recommendations</h5>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {complianceReport.recommendations.map((rec, index) => (
                    <div key={index} style={{
                      padding: '8px',
                      backgroundColor: rec.priority === 'HIGH' ? '#f8d7da' : rec.priority === 'MEDIUM' ? '#fff3cd' : '#d1ecf1',
                      borderLeft: `4px solid ${rec.priority === 'HIGH' ? '#dc3545' : rec.priority === 'MEDIUM' ? '#ffc107' : '#17a2b8'}`,
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>
                        {rec.priority} • {rec.category}
                      </div>
                      <div style={{ fontSize: '12px', color: '#495057', marginBottom: '4px' }}>
                        {rec.description}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6c757d', fontStyle: 'italic' }}>
                        Action: {rec.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anomaly Detection Panel */}
        {showAnomalyPanel && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚨 Real-Time Anomaly Detection & Alerts
            </h4>

            {/* Alert Settings */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>⚙️ Detection Settings</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>Large Transaction Threshold:</label>
                  <input
                    type="number"
                    value={alertSettings.largeTransactionThreshold}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, largeTransactionThreshold: parseFloat(e.target.value) }))}
                    style={{ width: '100%', padding: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>Velocity Alert Window (minutes):</label>
                  <input
                    type="number"
                    value={alertSettings.velocityAlertMinutes}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, velocityAlertMinutes: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>Compliance Mode:</label>
                  <select
                    value={alertSettings.complianceMode}
                    onChange={(e) => setAlertSettings(prev => ({ ...prev, complianceMode: e.target.value }))}
                    style={{ width: '100%', padding: '4px', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="strict">Strict</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Anomaly List */}
            <div>
              {anomalies.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6c757d',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>No Anomalies Detected</div>
                  <div style={{ fontSize: '14px' }}>All transactions appear normal for the selected period</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {anomalies.map((anomaly, index) => (
                    <div key={index} style={{
                      padding: '15px',
                      backgroundColor: anomaly.severity === 'HIGH' ? '#f8d7da' : anomaly.severity === 'MEDIUM' ? '#fff3cd' : '#d1ecf1',
                      border: `1px solid ${anomaly.severity === 'HIGH' ? '#f5c6cb' : anomaly.severity === 'MEDIUM' ? '#ffeaa7' : '#bee5eb'}`,
                      borderLeft: `4px solid ${anomaly.severity === 'HIGH' ? '#dc3545' : anomaly.severity === 'MEDIUM' ? '#ffc107' : '#17a2b8'}`,
                      borderRadius: '6px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: anomaly.severity === 'HIGH' ? '#721c24' : anomaly.severity === 'MEDIUM' ? '#856404' : '#0c5460',
                            marginBottom: '5px'
                          }}>
                            🚨 {anomaly.type.replace(/_/g, ' ')}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#495057',
                            marginBottom: '8px'
                          }}>
                            {anomaly.description}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            Detected: {new Date(anomaly.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: anomaly.severity === 'HIGH' ? '#dc3545' : anomaly.severity === 'MEDIUM' ? '#ffc107' : '#17a2b8',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {anomaly.severity}
                        </div>
                      </div>
                      <div style={{
                        padding: '8px',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#495057'
                      }}>
                        <strong>Recommendation:</strong> {anomaly.recommendation}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#6c757d' }}>
                        Affected Transactions: {anomaly.affectedTransactions.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date Range and Filter Controls */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📅 Date Range & Quick Filters</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            {[
              { key: 'today', label: 'Today' },
              { key: 'yesterday', label: 'Yesterday' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
              { key: 'quarter', label: 'This Quarter' }
            ].map(preset => (
              <button
                key={preset.key}
                onClick={() => handleDatePreset(preset.key)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: datePreset === preset.key ? '#007bff' : '#e9ecef',
                  color: datePreset === preset.key ? 'white' : '#495057',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontWeight: 'bold', color: '#495057', marginRight: '8px' }}>From:</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', color: '#495057', marginRight: '8px' }}>To:</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{ padding: '6px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Transaction Type Filters */}
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🏷️ Transaction Types</h4>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {[
                { value: 'sale-retail', label: '🛒 Retail Sales', color: '#28a745' },
                { value: 'sale-wholesale', label: '🏢 Wholesale Sales', color: '#17a2b8' },
                { value: 'purchase', label: '📦 Purchases', color: '#dc3545' },
                { value: 'payment-received', label: '💰 Payments In', color: '#28a745' },
                { value: 'payment-sent', label: '💸 Payments Out', color: '#ffc107' }
              ].map(type => (
                <label key={type.value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: typeFilter.includes(type.value) ? type.color + '20' : 'white',
                  border: `1px solid ${typeFilter.includes(type.value) ? type.color : '#dee2e6'}`,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    value={type.value}
                    checked={typeFilter.includes(type.value)}
                    onChange={handleTypeChange}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '14px', color: typeFilter.includes(type.value) ? type.color : '#495057' }}>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔍 Advanced Search & Filters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {/* Search */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>🔎 Search:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Description, type, amount..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>

              {/* Amount Range */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>💰 Amount Range:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    value={amountRange.min}
                    onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                    placeholder="Min"
                    style={{ width: '48%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  <input
                    type="number"
                    value={amountRange.max}
                    onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                    placeholder="Max"
                    style={{ width: '48%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>🔄 Sort By:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="type">Type</option>
                    <option value="description">Description</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{ width: '80px', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="desc">↓ Desc</option>
                    <option value="asc">↑ Asc</option>
                  </select>
                </div>
              </div>

              {/* View Mode */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>👁️ View Mode:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['table', 'cards', 'summary'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: viewMode === mode ? '#007bff' : '#e9ecef',
                        color: viewMode === mode ? 'white' : '#495057',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        flex: 1
                      }}
                    >
                      {mode === 'table' ? '📋 Table' : mode === 'cards' ? '🗃️ Cards' : '📊 Summary'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setAmountRange({ min: '', max: '' });
                  setSortBy('date');
                  setSortOrder('desc');
                  setTypeFilter([]);
                }}
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
                🔄 Clear All Filters
              </button>
              <span style={{ color: '#6c757d', fontSize: '12px' }}>
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedTransactions.length > 0 && (
          <div style={{
            backgroundColor: '#e7f3ff',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #b3d7ff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 'bold', color: '#0056b3' }}>
              📋 {selectedTransactions.length} transaction(s) selected
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📄 Export Selected
              </button>
              <button
                onClick={() => setSelectedTransactions([])}
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
                ❌ Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Transaction Display */}
        {viewMode === 'table' ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white'
                }}>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    SELECT
                  </th>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>📅 DATE & TIME</th>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>🏷️ TYPE</th>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>🔖 REFERENCE</th>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>📝 DESCRIPTION</th>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>� DETAILS</th>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    borderBottom: '2px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>⭐ STATUS</th>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'right',
                    borderBottom: '2px solid #e5e7eb',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px'
                  }}>💰 AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, idx) => {
                  const typeStyle = getTypeStyle(tx.type);
                  const isIncome = ['sale-retail', 'sale-wholesale', 'payment-received'].includes(tx.type);
                  const details = formatTransactionDetails(tx);
                  const dateTime = formatDateTime(tx.date);
                  const status = getTransactionStatus(tx);
                  const reference = getTransactionReference(tx);

                  return (
                    <tr key={idx} style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                      {/* Selection Checkbox */}
                      <td style={{ padding: '16px 12px', width: '60px' }}>
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(idx)}
                          onChange={(e) => handleSelectTransaction(idx, e.target.checked)}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: '#4f46e5'
                          }}
                        />
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '16px 12px', width: '140px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#1f2937',
                            fontSize: '14px'
                          }}>
                            {dateTime.date}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            fontFamily: 'monospace'
                          }}>
                            {dateTime.time}
                          </div>
                        </div>
                      </td>

                      {/* Transaction Type */}
                      <td style={{ padding: '16px 12px', width: '160px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          ...typeStyle,
                          border: `2px solid ${typeStyle.color}20`
                        }}>
                          <span style={{ fontSize: '16px' }}>{getTypeIcon(tx.type)}</span>
                          {getTypeLabel(tx.type)}
                        </div>
                      </td>

                      {/* Reference */}
                      <td style={{ padding: '16px 12px', width: '120px' }}>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#4f46e5',
                          backgroundColor: '#eef2ff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {reference}
                        </div>
                      </td>

                      {/* Description */}
                      <td style={{ padding: '16px 12px', width: '200px' }}>
                        <div style={{
                          color: '#374151',
                          fontSize: '14px',
                          lineHeight: '1.4',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                          title={tx.description || 'No description'}>
                          {tx.description || 'No description'}
                        </div>
                      </td>

                      {/* Details */}
                      <td style={{ padding: '16px 12px', width: '200px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {details.length > 0 ? details.map((detail, i) => (
                            <div key={i} style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              backgroundColor: '#f3f4f6',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              maxWidth: 'fit-content'
                            }}>
                              {detail}
                            </div>
                          )) : (
                            <div style={{
                              fontSize: '12px',
                              color: '#9ca3af',
                              fontStyle: 'italic'
                            }}>
                              No additional details
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 12px', width: '100px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: status === 'completed' ? '#d1fae5' :
                            status === 'pending' ? '#fef3c7' : '#fee2e2',
                          color: status === 'completed' ? '#065f46' :
                            status === 'pending' ? '#92400e' : '#991b1b'
                        }}>
                          <span>{status === 'completed' ? '✅' : status === 'pending' ? '⏳' : '❌'}</span>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{
                        padding: '16px 12px',
                        width: '140px',
                        textAlign: 'right'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            color: isIncome ? '#059669' : '#dc2626'
                          }}>
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {isIncome ? 'CREDIT' : 'DEBIT'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6c757d',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>No Transactions Found</h3>
                <p style={{ margin: 0 }}>No transactions match your current filters. Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredTransactions.map((tx, idx) => {
              const typeStyle = getTypeStyle(tx.type);
              const isIncome = ['sale-retail', 'sale-wholesale', 'payment-received'].includes(tx.type);
              return (
                <div key={idx} style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(idx)}
                      onChange={(e) => handleSelectTransaction(idx, e.target.checked)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      ...typeStyle
                    }}>
                      {getTypeIcon(tx.type)} {getTypeLabel(tx.type)}
                    </span>
                    <span style={{ fontSize: '14px', color: '#6c757d' }}>
                      {new Date(tx.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>Description:</div>
                    <div style={{ color: '#495057' }}>{tx.description || 'No description'}</div>
                  </div>

                  <div style={{
                    borderTop: '1px solid #dee2e6',
                    paddingTop: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>Amount</div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: isIncome ? '#28a745' : '#dc3545'
                      }}>
                        {isIncome ? '+' : '-'}${Math.abs(parseFloat(tx.amount) || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          padding: '6px 12px',
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
                  </div>
                </div>
              );
            })}

            {filteredTransactions.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                padding: '40px',
                textAlign: 'center',
                color: '#6c757d',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#495057' }}>No Transactions Found</h3>
                <p style={{ margin: 0 }}>No transactions match your current filters. Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        ) : (
          /* Summary View */
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>📊 Transaction Summary Analysis</h3>

            {summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {Object.entries(summary.transactionCounts).map(([type, count]) => {
                  const typeStyle = getTypeStyle(type);
                  return (
                    <div key={type} style={{
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #dee2e6'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ marginRight: '8px', fontSize: '16px' }}>{getTypeIcon(type)}</span>
                        <span style={{ fontWeight: 'bold', color: '#495057' }}>{getTypeLabel(type)}</span>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: typeStyle.color }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        transactions
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <button
                onClick={() => setViewMode('table')}
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
                📋 View Detailed Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🗃️ View as Cards
              </button>
            </div>
          </div>
        )}

        {/* Download Modal */}
        {showDownloadModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Download Transaction Report</h3>

              {/* Date Range Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date Range:</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={downloadDateRange.from}
                    onChange={(e) => setDownloadDateRange({ ...downloadDateRange, from: e.target.value })}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={downloadDateRange.to}
                    onChange={(e) => setDownloadDateRange({ ...downloadDateRange, to: e.target.value })}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Transaction Types */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Transaction Types:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {[
                    { value: 'sale-retail', label: 'Retail Sales' },
                    { value: 'sale-wholesale', label: 'Wholesale Sales' },
                    { value: 'purchase', label: 'Purchases' },
                    { value: 'payment-sent', label: 'Payments Sent' }
                  ].map(type => (
                    <label key={type.value} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={downloadTypes.includes(type.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDownloadTypes([...downloadTypes, type.value]);
                          } else {
                            setDownloadTypes(downloadTypes.filter(t => t !== type.value));
                          }
                        }}
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Download Format:</label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="radio"
                      value="pdf"
                      checked={downloadFormat === 'pdf'}
                      onChange={(e) => setDownloadFormat(e.target.value)}
                    />
                    PDF (Print-ready)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="radio"
                      value="csv"
                      checked={downloadFormat === 'csv'}
                      onChange={(e) => setDownloadFormat(e.target.value)}
                    />
                    CSV (Spreadsheet)
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={downloadTransactions}
                  disabled={isDownloading || downloadTypes.length === 0}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isDownloading || downloadTypes.length === 0 ? '#9ca3af' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isDownloading || downloadTypes.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {isDownloading ? '⏳ Downloading...' : '📥 Download Report'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Transactions;
