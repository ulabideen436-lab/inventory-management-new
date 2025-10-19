import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { setAuth } from '../utils/auth';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('Attempting login with:', { username, password: '***' });
      
      const res = await axios.post('http://localhost:5000/auth/login', { username, password });
      console.log('Login response:', res.data); // Debug log
      
      // Extract role and token from response
      const { token, user } = res.data;
      const role = user ? user.role : res.data.role; // Handle both response formats
      
      // Pass the full user object to setAuth
      setAuth(token, user || { role });
      
      console.log('Authentication set, role:', role);
      console.log('Navigating to:', role === 'cashier' ? '/cashier' : '/owner');
      
      // Small delay to ensure auth state is set before navigation
      setTimeout(() => {
        if (role === 'cashier') {
          navigate('/cashier');
        } else if (role === 'owner') {
          navigate('/owner');
        } else {
          setError('Unknown role: ' + role);
        }
      }, 100);
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorMsg = error.response.data?.message;
        
        if (status === 429) {
          setError('Too many login attempts. Please wait a few minutes before trying again.');
        } else if (status === 401) {
          setError('Invalid username or password. Please check your credentials.');
        } else {
          setError(errorMsg || `Server error: ${status}`);
        }
      } else if (error.request) {
        // Request made but no response received
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        // Something else happened
        setError('An unexpected error occurred: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>StoreFlow Login</h2>
        <div className="login-info">
          <p><strong>Demo Credentials:</strong></p>
          <p>Owner: username: <code>owner</code>, password: <code>owner123</code></p>
          <p>Cashier: username: <code>cashier</code>, password: <code>cashier123</code></p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              className="form-input"
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="form-input"
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default Login;
