import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiresOnboarding = false 
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Check if user has completed profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          const profileComplete = !!(profile && (profile as any).full_name);
          setHasProfile(profileComplete);
          console.log('Profile check:', { userId: user.id, profileComplete, profile });
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .maybeSingle();

          const profileComplete = !!(profile && (profile as any).full_name);
          setHasProfile(profileComplete);
          console.log('Profile check on auth change:', { userId: session.user.id, profileComplete, profile });
        } else {
          setHasProfile(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute decision:', { 
    requiresOnboarding, 
    hasProfile, 
    userEmail: user.email 
  });

  // If this is the onboarding route and user doesn't have profile yet, allow access
  if (requiresOnboarding && !hasProfile) {
    return <>{children}</>;
  }

  // If this is NOT the onboarding route but user doesn't have profile, redirect to onboarding
  if (!requiresOnboarding && !hasProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  // If this is the onboarding route but user already has profile, redirect to main app
  if (requiresOnboarding && hasProfile) {
    return <Navigate to="/jarvis" replace />;
  }

  // User has profile and is accessing main app - allow access
  return <>{children}</>;
}