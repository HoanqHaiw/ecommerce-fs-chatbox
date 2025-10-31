import React from 'react';
import ReactDOM from 'react-dom/client';
import './scss/app.scss';
import App from './App';
import AdminApp from './AdminApp'; // 👈 import thêm phần admin

// Xác định URL hiện tại
const path = window.location.pathname;

// Tạo root
const root = ReactDOM.createRoot(document.getElementById('root'));

// Nếu URL bắt đầu bằng /admin => render AdminApp, ngược lại render App
root.render(
  <React.StrictMode>
    {path.startsWith('/admin') ? <AdminApp /> : <App />}
  </React.StrictMode>
);
