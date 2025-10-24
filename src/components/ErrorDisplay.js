
const ErrorDisplay = ({ error, onRetry, context = 'operation' }) => {
    if (!error) return null;

    const getErrorIcon = () => {
        if (error.includes('Network') || error.includes('connection')) return '🌐';
        if (error.includes('Unauthorized') || error.includes('login')) return '🔐';
        if (error.includes('Access denied') || error.includes('permissions')) return '🚫';
        if (error.includes('not found')) return '🔍';
        if (error.includes('validation') || error.includes('required')) return '📝';
        return '⚠️';
    };

    const getErrorSeverity = () => {
        if (error.includes('Server error') || error.includes('500')) return 'critical';
        if (error.includes('Network') || error.includes('connection')) return 'warning';
        if (error.includes('Unauthorized') || error.includes('Access denied')) return 'auth';
        return 'info';
    };

    const getSeverityStyle = () => {
        const severity = getErrorSeverity();
        const baseStyle = {
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            lineHeight: '1.5'
        };

        switch (severity) {
            case 'critical':
                return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
            case 'warning':
                return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
            case 'auth':
                return { ...baseStyle, backgroundColor: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe' };
            default:
                return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' };
        }
    };

    const getTroubleshootingTips = () => {
        if (error.includes('Network') || error.includes('connection')) {
            return [
                'Check your internet connection',
                'Verify the server is running',
                'Try refreshing the page'
            ];
        }
        if (error.includes('Unauthorized') || error.includes('login')) {
            return [
                'Please login again',
                'Check if your session has expired',
                'Verify your credentials'
            ];
        }
        if (error.includes('Access denied') || error.includes('permissions')) {
            return [
                'Contact your administrator',
                'Check if you have the required permissions',
                'You may need owner privileges for this action'
            ];
        }
        if (error.includes('validation') || error.includes('required')) {
            return [
                'Check all required fields are filled',
                'Verify numeric fields contain valid numbers',
                'Ensure text fields are not empty'
            ];
        }
        if (error.includes('not found')) {
            return [
                'The item may have been deleted',
                'Try refreshing the page',
                'Check if the item exists'
            ];
        }
        return [
            'Try the operation again',
            'Refresh the page if the issue persists',
            'Contact support if the problem continues'
        ];
    };

    return (
        <div style={getSeverityStyle()}>
            <div style={{ fontSize: '20px' }}>{getErrorIcon()}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {context.charAt(0).toUpperCase() + context.slice(1)} Failed
                </div>
                <div style={{ marginBottom: '12px' }}>{error}</div>

                <details style={{ marginTop: '8px' }}>
                    <summary style={{
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        opacity: 0.8
                    }}>
                        💡 Troubleshooting Tips
                    </summary>
                    <ul style={{
                        marginTop: '8px',
                        marginBottom: '0',
                        paddingLeft: '16px',
                        fontSize: '12px',
                        opacity: 0.9
                    }}>
                        {getTroubleshootingTips().map((tip, index) => (
                            <li key={index}>{tip}</li>
                        ))}
                    </ul>
                </details>

                {onRetry && (
                    <button
                        onClick={onRetry}
                        style={{
                            marginTop: '12px',
                            padding: '6px 12px',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            border: '1px solid rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorDisplay;