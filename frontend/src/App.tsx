import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ConnectRepositoryPage } from './pages/ConnectRepositoryPage';
import { DeploymentConfigPage } from './pages/DeploymentConfigPage';
import { DeploymentDetailsPage } from './pages/DeploymentDetailsPage';
import { DeploymentHistoryPage } from './pages/DeploymentHistoryPage';
import { MonitoringDashboardPage } from './pages/MonitoringDashboardPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { LogsAndIncidentsPage } from './pages/LogsAndIncidentsPage';
import { CostEstimatorPage } from './pages/CostEstimatorPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-cyan-400 font-mono text-sm">
        Initializing CloudPilot Console...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Dashboard Pages */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardOverviewPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/connect" element={<ConnectRepositoryPage />} />
        <Route path="/deployments" element={<DeploymentHistoryPage />} />
        <Route path="/deployments/configure" element={<DeploymentConfigPage />} />
        <Route path="/deployments/:id" element={<DeploymentDetailsPage />} />
        <Route path="/monitoring" element={<MonitoringDashboardPage />} />
        <Route path="/ai-insights" element={<AIInsightsPage />} />
        <Route path="/incidents" element={<LogsAndIncidentsPage />} />
        <Route path="/costs" element={<CostEstimatorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
