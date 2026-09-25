import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import LandingPage from "./pages/Shared/LandingPage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";

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
import CaseSummary from "./pages/Shared/CaseSummary";

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

/**
 * ProtectedRoute — guards a route by login state and optional role.
 * Backend JWT tokens store role as "citizen" for users and "admin" for admins.
 */
function ProtectedRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role?: string;
}) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [, setUser] = useState(getUser());

  useEffect(() => {
    const onStorage = () => setUser(getUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <Routes>
      {/* ── Public ─────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Privacy accessible without login (linked from landing page) */}
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* ── User (citizen) ─────────────────────────── */}
      {/* NOTE: Each page component already includes its own <UserLayout>.
          Do NOT add a second <UserLayout> wrapper here — that causes
          double sidebars and double navigation bars. */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="citizen">
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/voice-assessment"
        element={
          <ProtectedRoute role="citizen">
            <VoiceAssessment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat-assessment"
        element={
          <ProtectedRoute role="citizen">
            <ChatAssessment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment-result"
        element={
          <ProtectedRoute role="citizen">
            <AssessmentResult />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-case"
        element={
          <ProtectedRoute role="citizen">
            <MyCase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/case-summary"
        element={
          <ProtectedRoute role="citizen">
            <CaseSummary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute role="citizen">
            <Recommendations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nearby-help"
        element={
          <ProtectedRoute role="citizen">
            <NearbyHelp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute role="citizen">
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute role="citizen">
            <DocumentsPage />
          </ProtectedRoute>
        }
      />

      {/* ── Admin ──────────────────────────────────── */}
      {/* NOTE: Each admin page already includes its own <AdminLayout>.
          Do NOT add a second <AdminLayout> wrapper here. */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      {/* Case list — with optional priority filter in URL */}
      <Route
        path="/admin/cases"
        element={
          <ProtectedRoute role="admin">
            <AdminCaseList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cases/:priority"
        element={
          <ProtectedRoute role="admin">
            <AdminCaseList />
          </ProtectedRoute>
        }
      />
      {/* Case detail — uses /admin/case/:id (singular) to avoid conflict with list */}
      <Route
        path="/admin/case/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminCaseDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security"
        element={
          <ProtectedRoute role="admin">
            <AdminSecurity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/geo-analysis"
        element={
          <ProtectedRoute role="admin">
            <GeoAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/critical-alerts"
        element={
          <ProtectedRoute role="admin">
            <CriticalAlerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/support-allocation"
        element={
          <ProtectedRoute role="admin">
            <SupportAllocation />
          </ProtectedRoute>
        }
      />

      {/* ── Fallback ───────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
