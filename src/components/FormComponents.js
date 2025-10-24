import React from 'react';

// Styled input component with validation feedback
export const FormInput = ({ 
  label, 
  error, 
  required = false, 
  ...props 
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `2px solid ${error ? '#e74c3c' : '#ddd'}`,
          borderRadius: '4px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.3s',
          boxSizing: 'border-box'
        }}
        {...props}
      />
      {error && (
        <div style={{ 
          color: '#e74c3c', 
          fontSize: '12px', 
          marginTop: '4px' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

// Styled select component with validation feedback
export const FormSelect = ({ 
  label, 
  error, 
  required = false, 
  children,
  ...props 
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: '4px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
      )}
      <select
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `2px solid ${error ? '#e74c3c' : '#ddd'}`,
          borderRadius: '4px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.3s',
          boxSizing: 'border-box',
          backgroundColor: 'white'
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <div style={{ 
          color: '#e74c3c', 
          fontSize: '12px', 
          marginTop: '4px' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

// Loading button component
export const LoadingButton = ({ 
  loading, 
  children, 
  disabled,
  ...props 
}) => {
  return (
    <button
      disabled={disabled || loading}
      style={{
        padding: '10px 20px',
        backgroundColor: disabled || loading ? '#bdc3c7' : '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.3s',
        position: 'relative'
      }}
      {...props}
    >
      {loading ? (
        <>
          <span style={{ opacity: 0.6 }}>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Message display component
export const Message = ({ type, children, onClose }) => {
  const styles = {
    success: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb'
    },
    error: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    },
    warning: {
      backgroundColor: '#fff3cd',
      color: '#856404',
      border: '1px solid #ffeaa7'
    },
    info: {
      backgroundColor: '#d1ecf1',
      color: '#0c5460',
      border: '1px solid #bee5eb'
    }
  };

  return (
    <div style={{
      ...styles[type],
      padding: '12px 16px',
      borderRadius: '4px',
      marginBottom: '16px',
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span>{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: 'inherit',
            marginLeft: '8px'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

// Form container with consistent styling
export const FormContainer = ({ title, children, ...props }) => {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }} {...props}>
      {title && (
        <h2 style={{ 
          marginBottom: '24px', 
          color: '#2c3e50',
          borderBottom: '2px solid #3498db',
          paddingBottom: '8px'
        }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

// Data table component
export const DataTable = ({ columns, data, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#7f8c8d'
      }}>
        Loading...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: '#7f8c8d'
      }}>
        No data found
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            {columns.map((col, index) => (
              <th key={index} style={{
                padding: '12px 16px',
                textAlign: 'left',
                borderBottom: '2px solid #dee2e6',
                fontWeight: 'bold',
                color: '#495057'
              }}>
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                borderBottom: '2px solid #dee2e6',
                fontWeight: 'bold',
                color: '#495057'
              }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} style={{
              borderBottom: '1px solid #dee2e6',
              ':hover': { backgroundColor: '#f8f9fa' }
            }}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f39c12',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};