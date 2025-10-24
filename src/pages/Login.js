import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        const userData = await authService.getUserData(user.uid);
        if (userData) {
          // Store user data in localStorage for app compatibility
          localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || userData.displayName,
            role: userData.role
          }));
          
          // Navigate based on role
          if (userData.role === 'owner') {
            navigate('/owner');
          } else {
            navigate('/cashier');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { user, userData } = await authService.signIn(email, password);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: userData.role
      }));

      setSuccess('Login successful!');
      
      // Navigate based on role
      setTimeout(() => {
        if (userData.role === 'owner') {
          navigate('/owner');
        } else {
          navigate('/cashier');
        }
      }, 500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { user, userData } = await authService.signUp(email, password, displayName, 'cashier');
      
      // Store user data
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: userData.role
      }));

      setSuccess('Account created successfully!');
      
      // Navigate to cashier dashboard
      setTimeout(() => {
        navigate('/cashier');
      }, 500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { user, userData } = await authService.signInWithGoogle();
      
      // Store user data
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: userData.role
      }));

      setSuccess('Signed in with Google successfully!');
      
      // Navigate based on role
      setTimeout(() => {
        if (userData.role === 'owner') {
          navigate('/owner');
        } else {
          navigate('/cashier');
        }
      }, 500);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      await authService.resetPassword(email);
      setSuccess('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
      }, 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  if (showForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Reset Password</h2>
          <p className="subtitle">Enter your email to receive a password reset link</p>
          
          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="your.email@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="form-input"
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button 
              type="button" 
              className="toggle-mode-button"
              onClick={() => setShowForgotPassword(false)}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🛒 StoreFlow {isSignUp ? 'Sign Up' : 'Login'}</h2>
        <p className="subtitle">
          {isSignUp 
            ? 'Create your account to get started' 
            : 'Sign in to manage your inventory'}
        </p>
        
        <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="login-form">
          {isSignUp && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
                required 
                className="form-input"
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="your.email@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="form-input"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="form-input"
              minLength={6}
            />
            {isSignUp && (
              <small className="input-hint">At least 6 characters</small>
            )}
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button 
          type="button" 
          className="google-button" 
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {!isSignUp && (
          <button 
            type="button" 
            className="forgot-password-button"
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot Password?
          </button>
        )}

        <div className="toggle-mode">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={toggleMode} className="toggle-mode-button">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        {!isSignUp && (
          <div className="demo-info">
            <p><strong>🎯 Demo Credentials:</strong></p>
            <p>Email: <code>owner@storeflow.com</code> / Password: <code>owner123</code></p>
            <p>Email: <code>cashier@storeflow.com</code> / Password: <code>cashier123</code></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
