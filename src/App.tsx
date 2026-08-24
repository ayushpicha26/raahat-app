import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import UserDashboard from "./pages/UserDashboard";
import VoiceAssessment from "./pages/VoiceAssessment";
import ChatAssessment from "./pages/ChatAssessment";
import AssessmentResult from "./pages/AssessmentResult";
import Recommendations from "./pages/Recommendations";
import CaseSummary from "./pages/CaseSummary";
import MyCase from "./pages/MyCase";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCaseList from "./pages/AdminCaseList";
import AdminCaseDetail from "./pages/AdminCaseDetail";
import GeoAnalysis from "./pages/GeoAnalysis";
import AdminReports from "./pages/AdminReports";
import AdminSecurity from "./pages/AdminSecurity";

import ProfilePage from "./pages/ProfilePage";
import PrivacyPage from "./pages/PrivacyPage";
import NearbyHelp from "./pages/NearbyHelp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* User */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/nearby-help" element={<NearbyHelp />} />
        <Route path="/voice" element={<VoiceAssessment />} />
        <Route path="/chat" element={<ChatAssessment />} />
        <Route path="/assessment-result" element={<AssessmentResult />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/case-summary" element={<CaseSummary />} />
        <Route path="/my-case" element={<MyCase />} />
        <Route path="/documents" element={<MyCase />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/cases/:priority" element={<AdminCaseList />} />
        <Route path="/admin/case/:id" element={<AdminCaseDetail />} />
        <Route path="/admin/geo" element={<GeoAnalysis />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/security" element={<AdminSecurity />} />
        <Route path="/admin/alerts" element={<AdminDashboard />} />
        <Route path="/admin/support" element={<AdminDashboard />} />
        <Route path="/admin/settings" element={<AdminDashboard />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
