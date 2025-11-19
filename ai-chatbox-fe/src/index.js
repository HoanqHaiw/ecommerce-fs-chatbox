import React from 'react';
import ReactDOM from 'react-dom/client';
import './scss/app.scss';
import App from './App';
import AdminApp from './AdminApp';


const path = window.location.pathname;


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {path.startsWith('/admin') ? <AdminApp /> : <App />}
  </React.StrictMode>
);
