import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function getRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

export function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      exp: payload.exp
    };
  } catch {
    return null;
  }
}

export function isTokenValid() {
  const user = getUser();
  if (!user) return false;
  
  // Check if token is expired
  const currentTime = Date.now() / 1000;
  return user.exp > currentTime;
}

export function isAuthenticated() {
  const token = localStorage.getItem('token');
  return token && isTokenValid();
}

export function hasRole(requiredRole) {
  const userRole = getRole();
  if (!userRole) return false;
  
  // Define role hierarchy
  const roleHierarchy = {
    'owner': 2,
    'cashier': 1
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

export function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Set up auto-logout when token expires
  const tokenUser = getUser();
  if (tokenUser && tokenUser.exp) {
    const expiresIn = (tokenUser.exp * 1000) - Date.now();
    if (expiresIn > 0) {
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, expiresIn);
    }
  }
}

export async function logout() {
  const token = localStorage.getItem('token');
  
  // Call backend logout endpoint if token exists
  if (token) {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role'); // Legacy cleanup
}

export async function login(username, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: username.trim(),
      password
    });
    
    const { token, user } = response.data;
    setAuth(token, user);
    
    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.response) {
      return { 
        success: false, 
        error: error.response.data.message || 'Login failed',
        status: error.response.status
      };
    } else if (error.request) {
      return { 
        success: false, 
        error: 'Network error. Please check your connection.',
        status: 0
      };
    } else {
      return { 
        success: false, 
        error: 'An unexpected error occurred.',
        status: 0
      };
    }
  }
}

export async function register(username, password, role = 'cashier') {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      username: username.trim(),
      password,
      role
    });
    
    return { success: true, user: response.data.user };
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.response) {
      return { 
        success: false, 
        error: error.response.data.message || 'Registration failed',
        details: error.response.data.details,
        status: error.response.status
      };
    } else if (error.request) {
      return { 
        success: false, 
        error: 'Network error. Please check your connection.',
        status: 0
      };
    } else {
      return { 
        success: false, 
        error: 'An unexpected error occurred.',
        status: 0
      };
    }
  }
}

export async function changePassword(currentPassword, newPassword) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post(`${API_BASE_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.response) {
      return { 
        success: false, 
        error: error.response.data.message || 'Password change failed',
        details: error.response.data.details,
        status: error.response.status
      };
    } else if (error.request) {
      return { 
        success: false, 
        error: 'Network error. Please check your connection.',
        status: 0
      };
    } else {
      return { 
        success: false, 
        error: 'An unexpected error occurred.',
        status: 0
      };
    }
  }
}

export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Axios interceptor to handle expired tokens
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && isAuthenticated()) {
      // Token is expired or invalid
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
