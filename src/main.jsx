import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Path routing without a router: Cloudflare Pages serves index.html for /account and /admin.
const Account = lazy(() => import('./pages/Account.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const Page = { '/account': Account, '/admin': Admin }[path] || App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div className="min-h-screen bg-night" />}>
      <Page />
    </Suspense>
  </React.StrictMode>
);
