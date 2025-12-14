
import React, { useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useLanguageStore } from './store/useLanguageStore';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const { HashRouter: Router, Routes, Route, Navigate, Outlet } = ReactRouterDOM as any;

// Auth Guard Component (Protects private routes)
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Public/Root Route Guard (Redirects to app if already logged in)
const RootRoute = () => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <LandingPage />;
};

const App: React.FC = () => {
  const { initialize } = useLanguageStore();

  useEffect(() => {
    // Initial sync of DOM attributes with store state
    initialize();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes (The SaaS Shell) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="editor" element={<EditorPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
