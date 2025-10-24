import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
// Initialize application WebSocket client (connects to ws://localhost:3001/ws by default)
import './utils/wsClient';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter future={{ v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>
);
