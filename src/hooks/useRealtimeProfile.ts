import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validateProfile } from '@/utils/profileValidation';

// Define Profile interface for this hook
interface Profile {
  id: string;
  full_name: string | null;
  data_nascimento: string | null;
  hora_nascimento: string | null;
  local_nascimento: string | null;
  cidade_nascimento: string | null;
  estado_nascimento: string | null;
  pais_nascimento: string | null;
  fuso_horario_nascimento: string | null;
  status: string | null;
  updated_at: string | null;
}

interface UseRealtimeProfileOptions {
  userId: string;
  onProfileChange: (profile: Profile | null) => void;
  enabled?: boolean;
}

/**
 * Robust real-time profile subscription hook with retry logic
 */
export const useRealtimeProfile = ({ 
  userId, 
  onProfileChange, 
  enabled = true 
}: UseRealtimeProfileOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const baseRetryDelay = 1000; // 1 second

  /**
   * Clean up all subscriptions and timeouts
   */
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('[REALTIME] Cleaning up profile subscription for user:', userId);
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    retryCountRef.current = 0;
  }, [userId]);

  /**
   * Setup profile subscription with error handling and retry logic
   */
  const setupSubscription = useCallback(() => {
    if (!enabled || !userId) {
      console.log('[REALTIME] Subscription disabled or no userId');
      return;
    }

    cleanup(); // Clean up any existing subscription

    // Create unique channel name to avoid conflicts
    const channelName = `profile-changes-${userId}-${Date.now()}`;
    
    console.log('[REALTIME] Setting up profile subscription:', channelName);
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          console.log('[REALTIME] Profile change detected:', {
            event: payload.eventType,
            userId,
            timestamp: new Date().toISOString()
          });
          
          try {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              if (payload.new) {
                // Validate data before applying changes
                const validation = validateProfile(payload.new as Profile);
                
                if (import.meta.env.DEV) {
                  console.log('[REALTIME] Profile validation:', {
                    isValid: validation.isValid,
                    missingFields: validation.missingFields,
                    status: validation.status
                  });
                }
                
                // Apply the change regardless of validation (let the app handle incomplete profiles)
                onProfileChange(payload.new as Profile);
                
                if (!validation.isValid && validation.missingFields.length > 0) {
                  console.warn('[REALTIME] Received profile with missing fields:', validation.missingFields);
                }
              }
            } else if (payload.eventType === 'DELETE') {
              console.log('[REALTIME] Profile deleted for user:', userId);
              onProfileChange(null);
            }
            
            // Reset retry count on successful processing
            retryCountRef.current = 0;
            
          } catch (error) {
            console.error('[REALTIME] Error processing profile change:', error);
            
            // Optionally fetch fresh data on processing error
            try {
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
                
              if (data) {
                console.log('[REALTIME] Fetched fresh profile data after error');
                onProfileChange(data as Profile);
              }
            } catch (fetchError) {
              console.error('[REALTIME] Failed to fetch fresh profile data:', fetchError);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Subscription status:', status, 'for user:', userId);
        
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] Successfully subscribed to profile changes');
          retryCountRef.current = 0; // Reset retry count on successful subscription
        } else if (status === 'CHANNEL_ERROR' && retryCountRef.current < maxRetries) {
          // Implement exponential backoff retry
          const delay = baseRetryDelay * Math.pow(2, retryCountRef.current);
          retryCountRef.current++;
          
          console.warn(`[REALTIME] Subscription error, retrying in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
          
          retryTimeoutRef.current = setTimeout(() => {
            console.log('[REALTIME] Retrying subscription setup...');
            setupSubscription();
          }, delay);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[REALTIME] Max retries reached, subscription failed permanently');
        } else if (status === 'CLOSED') {
          console.log('[REALTIME] Subscription closed');
        }
      });

  }, [userId, enabled, onProfileChange, cleanup]);

  /**
   * Manual retry function for external use
   */
  const retry = useCallback(() => {
    console.log('[REALTIME] Manual retry requested');
    retryCountRef.current = 0; // Reset retry count for manual retry
    setupSubscription();
  }, [setupSubscription]);

  /**
   * Get subscription status
   */
  const getStatus = useCallback(() => {
    return {
      isConnected: channelRef.current?.state === 'joined',
      retryCount: retryCountRef.current,
      channelState: channelRef.current?.state || 'disconnected'
    };
  }, []);

  // Setup subscription on mount and when dependencies change
  useEffect(() => {
    setupSubscription();
    return cleanup;
  }, [setupSubscription, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { 
    retry, 
    cleanup, 
    getStatus,
    isEnabled: enabled && !!userId
  };
};

/**
 * Hook for debugging real-time subscriptions
 */
export const useRealtimeDebug = () => {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const logRealtimeStats = () => {
      const channels = (supabase.realtime as any).channels || [];
      console.log('[REALTIME DEBUG] Active channels:', channels.length);
      channels.forEach((channel: any, index: number) => {
        console.log(`[REALTIME DEBUG] Channel ${index}:`, {
          topic: channel.topic,
          state: channel.state,
          joinedAt: channel.joinedAt
        });
      });
    };

    // Log stats every 30 seconds in development
    const interval = setInterval(logRealtimeStats, 30000);
    
    return () => clearInterval(interval);
  }, []);
};