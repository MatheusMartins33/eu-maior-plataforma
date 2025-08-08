import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { AuthState } from "@/types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiresAuth?: boolean;
  requiresProfile?: boolean;
  allowedAuthStates?: AuthState[];
}

/**
 * Simplified ProtectedRoute that acts as a pure guard
 * Does NOT handle redirects - that's handled by NavigationController
 * Only blocks access based on auth states
 */
export default function ProtectedRoute({
  children,
  requiresAuth = true,
  requiresProfile = true,
  allowedAuthStates = []
}: ProtectedRouteProps) {
  const { authState } = useProfile();
  const location = useLocation();

  // Show loading during initialization
  if (authState === AuthState.INITIALIZING) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  // If specific auth states are allowed, check against them
  if (allowedAuthStates.length > 0) {
    if (!allowedAuthStates.includes(authState)) {
      // Redirect to home and let NavigationController handle proper routing
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // Simple guards - only block access, don't redirect
  if (requiresAuth && authState === AuthState.UNAUTHENTICATED) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresProfile && authState === AuthState.AUTHENTICATED_NO_PROFILE) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // Access allowed
  return <>{children}</>;
}