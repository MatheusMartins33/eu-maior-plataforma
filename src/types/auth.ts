export enum AuthState {
  INITIALIZING = 'initializing',
  UNAUTHENTICATED = 'unauthenticated',
  AUTHENTICATED_NO_PROFILE = 'authenticated_no_profile',
  AUTHENTICATED_WITH_PROFILE = 'authenticated_with_profile',
  ERROR = 'error'
}

export interface AuthStateTransition {
  from: AuthState;
  to: AuthState;
  reason: string;
  timestamp: Date;
}

export interface NavigationGuard {
  allowedStates: AuthState[];
  redirectTo?: string;
  requiresAuth?: boolean;
  requiresProfile?: boolean;
}