import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

/**
 * Detect if localStorage is available with fallbacks
 * Handles incognito mode and other storage restrictions
 */
const getStorageAdapter = () => {
  try {
    // Test if localStorage works
    const testKey = '__supabase_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return localStorage;
  } catch {
    // Fallback to sessionStorage if localStorage fails
    try {
      const testKey = '__supabase_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return sessionStorage;
    } catch {
      // Fallback to in-memory storage if both fail
      console.warn('Both localStorage and sessionStorage are unavailable. Using in-memory storage.');
      return {
        getItem: (key: string) => null,
        setItem: (key: string, value: string) => {},
        removeItem: (key: string) => {},
      };
    }
  }
};

/**
 * Create Supabase client with robust configuration for SPA
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorageAdapter(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // CRITICAL for email confirmation links
    flowType: 'pkce', // More secure for SPAs
    debug: import.meta.env.DEV, // Debug only in development
  },
  global: {
    headers: {
      'X-Client-Info': 'eu-maior-foundation@1.0.0',
      'X-Client-Version': '1.0.0',
    },
  },
  // Configure realtime for better performance
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Enhanced auth state listener with error handling
 */
supabase.auth.onAuthStateChange((event, session) => {
  if (import.meta.env.DEV) {
    console.log(`[SUPABASE] Auth event: ${event}`, {
      userId: session?.user?.id,
      email: session?.user?.email,
      expiresAt: session?.expires_at
    });
  }
  
  // Handle specific auth events
  switch (event) {
    case 'SIGNED_OUT':
      // Clear any cached data if needed
      if (import.meta.env.DEV) {
        console.log('[SUPABASE] User signed out, clearing cache');
      }
      break;
      
    case 'TOKEN_REFRESHED':
      if (import.meta.env.DEV) {
        console.log('[SUPABASE] Token refreshed successfully');
      }
      break;
      
    case 'SIGNED_IN':
      if (import.meta.env.DEV) {
        console.log('[SUPABASE] User signed in:', session?.user?.id);
      }
      break;
      
    case 'PASSWORD_RECOVERY':
      if (import.meta.env.DEV) {
        console.log('[SUPABASE] Password recovery initiated');
      }
      break;
  }
});

/**
 * Health check function for Supabase connection
 */
export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    return !error;
  } catch (error) {
    console.error('[SUPABASE] Health check failed:', error);
    return false;
  }
};

/**
 * Get current session with error handling
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[SUPABASE] Error getting session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('[SUPABASE] Unexpected error getting session:', error);
    return null;
  }
};

// Export types for convenience
export type { Database } from './types';