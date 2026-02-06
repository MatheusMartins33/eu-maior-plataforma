// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProfileProvider } from "@/contexts/ProfileContext";
import NavigationController from "@/components/NavigationController";

// páginas (pode usar React.lazy depois)
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import OnboardingPage from "@/pages/OnboardingPage";
import JarvisPage from "@/pages/JarvisPage";
import NotFound from "@/pages/NotFound";

// Dashboard pages
import DashboardLayout from "@/layouts/DashboardLayout";
import MindViewPage from "@/pages/dashboard/MindViewPage";

import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthState } from "@/types/auth";

export default function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        {/* hook de redirecionamento global */}
        <NavigationController />

        <Routes>
          <Route path="/" element={<Index />} />

          <Route
            path="/login"
            element={
              <ProtectedRoute
                requiresAuth={false}
                allowedAuthStates={[AuthState.UNAUTHENTICATED]}
              >
                <LoginPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/register"
            element={
              <ProtectedRoute
                requiresAuth={false}
                allowedAuthStates={[AuthState.UNAUTHENTICATED]}
              >
                <RegisterPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requiresProfile={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route path="/jarvis"
            element={
              <ProtectedRoute>
                <JarvisPage />
              </ProtectedRoute>
            }
          />

          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MindViewPage />} />
            <Route path="dna" element={<MindViewPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ProfileProvider>
    </BrowserRouter>
  );
}
