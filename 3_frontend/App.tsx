import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import LandingPage from "./pages/Shared/LandingPage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";

import UserLayout from "./components/layout/UserLayout";
import UserDashboard from "./pages/User/UserDashboard";
import ChatAssessment from "./pages/User/ChatAssessment";
import VoiceAssessment from "./pages/User/VoiceAssessment";
import AssessmentResult from "./pages/User/AssessmentResult";
import MyCase from "./pages/User/MyCase";
import Recommendations from "./pages/User/Recommendations";
import NearbyHelp from "./pages/User/NearbyHelp";
import ProfilePage from "./pages/User/ProfilePage";
import DocumentsPage from "./pages/User/DocumentsPage";
import PrivacyPage from "./pages/Shared/PrivacyPage";

import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminCaseList from "./pages/Admin/AdminCaseList";
import AdminCaseDetail from "./pages/Admin/AdminCaseDetail";
import AdminReports from "./pages/Admin/AdminReports";
import AdminSecurity from "./pages/Admin/AdminSecurity";
import GeoAnalysis from "./pages/Admin/GeoAnalysis";
import CriticalAlerts from "./pages/Admin/CriticalAlerts";
import Settings from "./pages/Admin/Settings";
import SupportAllocation from "./pages/Admin/SupportAllocation";

import { getUser } from "./utils/api";

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: string }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const onStorage = () => setUser(getUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User (citizen) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <UserDashboard />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat-assessment"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <ChatAssessment />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/voice-assessment"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <VoiceAssessment />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment-result"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <AssessmentResult />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-case"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <MyCase />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <Recommendations />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/nearby-help"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <NearbyHelp />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <ProfilePage />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <DocumentsPage />
            </UserLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <ProtectedRoute role="user">
            <UserLayout>
              <PrivacyPage />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cases"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout>
              <AdminCaseList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cases/:caseId"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout>
              <AdminCaseDetail />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout>
              <AdminReports />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout>
              <AdminSecurity />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/geo-analysis"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout>
              <GeoAnalysis />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/critical-alerts"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout>
              <CriticalAlerts />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout>
              <Settings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/support-allocation"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout>
              <SupportAllocation />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
