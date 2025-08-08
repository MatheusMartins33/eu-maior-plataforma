import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthState } from '@/types/auth';
import { isProfileComplete, validateProfile } from '@/utils/profileValidation';
import { useRealtimeProfile } from '@/hooks/useRealtimeProfile';

export interface Profile {
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

interface ProfileContextType {
  profile: Profile | null;
  hasProfile: boolean;
  loading: boolean;
  user: User | null;
  authState: AuthState;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<Omit<Profile, 'id'>>) => Promise<boolean>;
  validateCurrentProfile: () => ReturnType<typeof validateProfile>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // 🔧 FIX: Estados separados para controlar loading de forma mais precisa
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // EFEITO 1: Gerenciar o estado de autenticação do usuário
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Erro ao carregar sessão inicial:', error);
        setUser(null);
      } finally {
        // ✅ FIX: User loading termina aqui, mas o loading geral continua até profile ser verificado
        setIsUserLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth state changed: ${event}`);
      setUser(session?.user ?? null);
      
      // Limpar perfil ao deslogar
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsProfileLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // EFEITO 2: Buscar perfil quando user muda
  const fetchProfile = useCallback(async () => {
    // ✅ FIX: Se não há user, limpar profile e parar loading
    if (!user) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    // ✅ FIX: Indicar que estamos carregando o perfil
    setIsProfileLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
      }
      
      setProfile(data || null);
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', error);
      setProfile(null);
    } finally {
      // ✅ FIX: Profile loading termina aqui
      setIsProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // EFEITO 3: Real-time subscription para perfil
  useRealtimeProfile({
    userId: user?.id ?? '',
    onProfileChange: (newProfile) => {
      console.log('[REALTIME] ProfileContext recebeu atualização do perfil via hook.');
      setProfile(newProfile);
    },
    enabled: !!user,
  });

  // Função para atualizar perfil
  const updateProfile = useCallback(async (profileData: Partial<Omit<Profile, 'id'>>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        return false;
      }
      
      setProfile(data);
      return true;
    } catch (error) {
      console.error('Erro inesperado ao atualizar perfil:', error);
      return false;
    }
  }, [user]);

  // ✅ FIX: Loading geral só termina quando AMBOS user e profile foram verificados
  const isLoading = useMemo(() => {
    return isUserLoading || isProfileLoading;
  }, [isUserLoading, isProfileLoading]);

  // ✅ FIX: AuthState agora usa o loading state correto
  const authState = useMemo((): AuthState => {
    // Ainda carregando user ou profile
    if (isLoading) {
      return AuthState.INITIALIZING;
    }
    
    // User não existe
    if (!user) {
      return AuthState.UNAUTHENTICATED;
    }
    
    // User existe, mas profile não existe ou está incompleto
    if (!profile || !isProfileComplete(profile)) {
      return AuthState.AUTHENTICATED_NO_PROFILE;
    }
    
    // User existe e profile está completo
    return AuthState.AUTHENTICATED_WITH_PROFILE;
  }, [user, profile, isLoading]);

  const validateCurrentProfile = useCallback(() => {
    return validateProfile(profile);
  }, [profile]);

  // ✅ FIX: refreshProfile agora reseta o loading state apropriadamente
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const contextValue = useMemo((): ProfileContextType => ({
    profile,
    hasProfile: authState === AuthState.AUTHENTICATED_WITH_PROFILE,
    loading: authState === AuthState.INITIALIZING,
    user,
    authState,
    refreshProfile,
    updateProfile,
    validateCurrentProfile,
  }), [profile, authState, user, refreshProfile, updateProfile, validateCurrentProfile]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};