# 🛠️ SOLUÇÕES TÉCNICAS ESPECÍFICAS PARA O SISTEMA DE NAVEGAÇÃO

## 🎯 OVERVIEW DAS SOLUÇÕES

**Objetivo:** Corrigir completamente o sistema de navegação eliminando loops infinitos, race conditions e redirecionamentos conflitantes.

**Estratégia:** Centralização da lógica de navegação com estados bem definidos e fluxos controlados.

---

## 🔧 SOLUÇÃO 1: CENTRALIZAR LÓGICA DE NAVEGAÇÃO

### 📋 **Problema:** Redirecionamentos duplicados em múltiplos componentes

### 💡 **Solução:** Criar um NavigationController centralizado

**Implementação:**

```typescript
// src/hooks/useNavigationController.ts
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';

interface NavigationState {
  user: any;
  hasProfile: boolean;
  loading: boolean;
  isInitialized: boolean;
}

export const useNavigationController = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasProfile, loading } = useProfile();
  const navigationRef = useRef<string | null>(null);

  // Previne múltiplos redirecionamentos simultâneos
  const navigateSafely = (to: string, replace = true) => {
    if (navigationRef.current === to || location.pathname === to) {
      return; // Já está na rota ou redirecionamento em andamento
    }
    
    navigationRef.current = to;
    navigate(to, { replace });
    
    // Reset após navegação
    setTimeout(() => {
      navigationRef.current = null;
    }, 100);
  };

  const determineRoute = (): string | null => {
    // Aguarda inicialização completa
    if (loading) return null;

    // Usuário não autenticado
    if (!user) {
      const publicRoutes = ['/', '/login', '/register'];
      if (!publicRoutes.includes(location.pathname)) {
        return '/login';
      }
      return null;
    }

    // Usuário autenticado mas sem perfil completo
    if (!hasProfile) {
      if (location.pathname !== '/onboarding') {
        return '/onboarding';
      }
      return null;
    }

    // Usuário com perfil completo
    if (hasProfile) {
      const restrictedRoutes = ['/login', '/register', '/onboarding'];
      if (restrictedRoutes.includes(location.pathname) || location.pathname === '/') {
        return '/jarvis';
      }
      return null;
    }

    return null;
  };

  useEffect(() => {
    const targetRoute = determineRoute();
    if (targetRoute) {
      navigateSafely(targetRoute);
    }
  }, [user, hasProfile, loading, location.pathname]);

  return { navigateSafely };
};
```

**Uso nos componentes:**

```typescript
// Remover todos os useEffect de redirecionamento das páginas
// Index.tsx, LoginPage.tsx, RegisterPage.tsx - REMOVER useEffect

// Em App.tsx - adicionar o controller
import { useNavigationController } from '@/hooks/useNavigationController';

const App = () => {
  useNavigationController(); // Centraliza toda a lógica
  
  return (
    // ... resto do componente
  );
};
```

**Benefícios:**
- ✅ Elimina redirecionamentos duplicados
- ✅ Previne loops infinitos
- ✅ Lógica centralizada e testável
- ✅ Controle preciso de timing

---

## 🔧 SOLUÇÃO 2: CORRIGIR LÓGICA HASPROFILE

### 📋 **Problema:** Validação inadequada de perfil completo

### 💡 **Solução:** Implementar validação robusta com enum de status

**Implementação:**

```typescript
// src/types/profile.ts
export enum ProfileStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete'
}

export interface ProfileValidation {
  isValid: boolean;
  missingFields: string[];
  status: ProfileStatus;
}

// src/utils/profileValidation.ts
import { Profile } from '@/contexts/ProfileContext';
import { ProfileStatus, ProfileValidation } from '@/types/profile';

const REQUIRED_FIELDS = [
  'full_name',
  'data_nascimento',
  'local_nascimento'
] as const;

const OPTIONAL_FIELDS = [
  'hora_nascimento',
  'cidade_nascimento',
  'estado_nascimento',
  'pais_nascimento'
] as const;

export const validateProfile = (profile: Profile | null): ProfileValidation => {
  if (!profile) {
    return {
      isValid: false,
      missingFields: [...REQUIRED_FIELDS],
      status: ProfileStatus.PENDING
    };
  }

  const missingFields: string[] = [];

  // Verificar campos obrigatórios
  REQUIRED_FIELDS.forEach(field => {
    const value = profile[field];
    if (!value || (typeof value === 'string' && !value.trim())) {
      missingFields.push(field);
    }
  });

  // Determinar status baseado na validação
  let status: ProfileStatus;
  
  if (profile.status === ProfileStatus.COMPLETED && missingFields.length === 0) {
    status = ProfileStatus.COMPLETED;
  } else if (profile.status === ProfileStatus.IN_PROGRESS || missingFields.length > 0) {
    status = ProfileStatus.INCOMPLETE;
  } else {
    status = ProfileStatus.PENDING;
  }

  return {
    isValid: missingFields.length === 0 && status === ProfileStatus.COMPLETED,
    missingFields,
    status
  };
};

export const isProfileComplete = (profile: Profile | null): boolean => {
  const validation = validateProfile(profile);
  return validation.isValid;
};
```

**Atualizar ProfileContext:**

```typescript
// src/contexts/ProfileContext.tsx - SUBSTITUIR hasProfile calculation
import { isProfileComplete } from '@/utils/profileValidation';

// Substituir linhas 116-119
const hasProfile = isProfileComplete(profile);

// Adicionar função de validação ao context
const validateCurrentProfile = () => validateProfile(profile);

// Adicionar ao value
const value: ProfileContextType = {
  profile,
  hasProfile,
  loading,
  user,
  refreshProfile,
  updateProfile,
  validateProfile: validateCurrentProfile, // Nova função
};
```

**Atualizar OnboardingPage:**

```typescript
// src/pages/OnboardingPage.tsx - CORRIGIR status setting
import { ProfileStatus } from '@/types/profile';
import { validateProfile } from '@/utils/profileValidation';

const handleSubmit = async (e: React.FormEvent) => {
  // ... código existente até linha 207

  const profileData = {
    full_name: fullName,
    data_nascimento: dataNascimento || null,
    hora_nascimento: horaNascimento || null,
    local_nascimento: local.display || null,
    cidade_nascimento: cidade,
    estado_nascimento: estado,
    pais_nascimento: pais,
    status: ProfileStatus.IN_PROGRESS, // Primeiro salvar como em progresso
  };

  console.log('Profile data to save:', profileData);

  const success = await updateProfile(profileData);

  if (success) {
    // Validar se o perfil está realmente completo
    const validation = validateProfile(profileData as any);
    
    if (validation.isValid) {
      // Só marcar como completo se validação passar
      await updateProfile({ status: ProfileStatus.COMPLETED });
    } else {
      toast({
        title: "Perfil incompleto",
        description: `Campos obrigatórios faltando: ${validation.missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    // ... resto do código
  }
};
```

**Benefícios:**
- ✅ Validação robusta de campos obrigatórios
- ✅ Status bem definidos com enum
- ✅ Prevenção de perfis incompletos marcados como completos
- ✅ Feedback claro para usuário sobre campos faltantes

---

## 🔧 SOLUÇÃO 3: RESOLVER RACE CONDITIONS

### 📋 **Problema:** Estados inconsistentes entre loading, user e hasProfile

### 💡 **Solução:** Máquina de estados e sincronização adequada

**Implementação:**

```typescript
// src/types/authState.ts
export enum AuthState {
  INITIALIZING = 'initializing',
  UNAUTHENTICATED = 'unauthenticated', 
  AUTHENTICATED_NO_PROFILE = 'authenticated_no_profile',
  AUTHENTICATED_WITH_PROFILE = 'authenticated_with_profile',
  ERROR = 'error'
}

// src/contexts/ProfileContext.tsx - REFATORAR
import { AuthState } from '@/types/authState';

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>(AuthState.INITIALIZING);

  // Função sincronizada para determinar estado
  const determineAuthState = useCallback((currentUser: User | null, currentProfile: Profile | null): AuthState => {
    if (!currentUser) {
      return AuthState.UNAUTHENTICATED;
    }

    if (!currentProfile || !isProfileComplete(currentProfile)) {
      return AuthState.AUTHENTICATED_NO_PROFILE;
    }

    return AuthState.AUTHENTICATED_WITH_PROFILE;
  }, []);

  // Função para atualizar estado de forma atômica
  const updateAuthState = useCallback((newUser: User | null, newProfile: Profile | null) => {
    setUser(newUser);
    setProfile(newProfile);
    setAuthState(determineAuthState(newUser, newProfile));
  }, [determineAuthState]);

  // Substituir useEffect complexo por um único e controlado
  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    let profileSubscription: any = null;

    const initializeAuth = async () => {
      try {
        // Obter sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          // Buscar perfil
          const profileData = await fetchProfile(session.user.id);
          updateAuthState(session.user, profileData);
          
          // Setup profile subscription
          profileSubscription = supabase
            .channel(`profile-changes-${session.user.id}`)
            .on('postgres_changes', {
              event: '*',
              schema: 'public', 
              table: 'profiles',
              filter: `id=eq.${session.user.id}`,
            }, async (payload) => {
              if (!mounted) return;
              
              if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                const validatedProfile = validateProfile(payload.new as Profile);
                if (validatedProfile.isValid || payload.new) {
                  updateAuthState(session.user, payload.new as Profile);
                }
              } else if (payload.eventType === 'DELETE') {
                updateAuthState(session.user, null);
              }
            })
            .subscribe();
        } else {
          updateAuthState(null, null);
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState(AuthState.ERROR);
        }
      }
    };

    // Setup auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          updateAuthState(session.user, profileData);
        } else {
          updateAuthState(null, null);
        }
      }
    );
    authSubscription = subscription;

    initializeAuth();

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
      profileSubscription?.unsubscribe();
    };
  }, [updateAuthState]);

  // Valores derivados do estado central
  const loading = authState === AuthState.INITIALIZING;
  const hasProfile = authState === AuthState.AUTHENTICATED_WITH_PROFILE;

  const value: ProfileContextType = {
    profile,
    hasProfile,
    loading,
    user,
    authState, // Expor estado para debugging
    refreshProfile,
    updateProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
```

**Benefícios:**
- ✅ Estado central único e consistente
- ✅ Elimina race conditions
- ✅ Transições de estado controladas
- ✅ Cleanup adequado de subscriptions

---

## 🔧 SOLUÇÃO 4: ELIMINAR LOOPS INFINITOS NO PROTECTEDROUTE

### 📋 **Problema:** ProtectedRoute pode causar loops de redirecionamento

### 💡 **Solução:** Simplificar e tornar ProtectedRoute apenas um guard

**Implementação:**

```typescript
// src/components/ProtectedRoute.tsx - SIMPLIFICAR DRASTICAMENTE
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { AuthState } from "@/types/authState";

interface ProtectedRouteProps {
  children: ReactNode;
  requiresAuth?: boolean;
  requiresProfile?: boolean;
  allowedAuthStates?: AuthState[];
}

export default function ProtectedRoute({
  children,
  requiresAuth = true,
  requiresProfile = true,
  allowedAuthStates = []
}: ProtectedRouteProps) {
  const { authState } = useProfile();
  const location = useLocation();

  // Loading state - mostrar loading
  if (authState === AuthState.INITIALIZING) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="text-lg text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  // Verificar se estado atual é permitido
  if (allowedAuthStates.length > 0) {
    return allowedAuthStates.includes(authState) ? <>{children}</> : <Navigate to="/" replace />;
  }

  // Guards simples - SEM redirecionamentos, apenas bloqueia acesso
  if (requiresAuth && authState === AuthState.UNAUTHENTICATED) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresProfile && authState === AuthState.AUTHENTICATED_NO_PROFILE) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // Acesso permitido
  return <>{children}</>;
}
```

**Atualizar App.tsx com guards específicos:**

```typescript
// src/App.tsx - ESPECIFICAR requirements para cada rota
import { AuthState } from '@/types/authState';

const App = () => {
  useNavigationController(); // Centraliza navegação

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Index />} />
              
              {/* Rotas para não-autenticados */}
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
              
              {/* Onboarding - apenas para autenticados sem perfil */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute
                    allowedAuthStates={[AuthState.AUTHENTICATED_NO_PROFILE]}
                  >
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Jarvis - apenas para autenticados com perfil */}
              <Route
                path="/jarvis"
                element={
                  <ProtectedRoute
                    allowedAuthStates={[AuthState.AUTHENTICATED_WITH_PROFILE]}
                  >
                    <JarvisPage />
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProfileProvider>
    </QueryClientProvider>
  );
};
```

**Benefícios:**
- ✅ Elimina loops infinitos
- ✅ Lógica clara e específica para cada rota
- ✅ ProtectedRoute torna-se apenas um guard
- ✅ NavigationController gerencia redirecionamentos

---

## 🔧 SOLUÇÃO 5: CONFIGURAR SUPABASE ADEQUADAMENTE

### 📋 **Problema:** Configuração inadequada de persistência de sessão

### 💡 **Solução:** Configuração robusta com fallbacks

**Implementação:**

```typescript
// .env (criar arquivo)
VITE_SUPABASE_URL=https://yocxrulyvzcmacqyifrx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// src/integrations/supabase/client.ts - REFATORAR COMPLETAMENTE
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Detectar se localStorage está disponível
const getStorageAdapter = () => {
  try {
    // Testar se localStorage funciona
    const testKey = '__supabase_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return localStorage;
  } catch {
    // Fallback para sessionStorage se localStorage falhar
    try {
      const testKey = '__supabase_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return sessionStorage;
    } catch {
      // Fallback para storage em memória
      return {
        getItem: (key: string) => null,
        setItem: (key: string, value: string) => {},
        removeItem: (key: string) => {},
      };
    }
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorageAdapter(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // IMPORTANTE para links de confirmação
    flowType: 'pkce', // Mais seguro para SPAs
    debug: import.meta.env.DEV, // Debug apenas em desenvolvimento
  },
  global: {
    headers: {
      'X-Client-Info': 'eu-maior-foundation@1.0.0',
    },
  },
});

// Listener para erros de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    // Limpar cache de dados sensíveis se necessário
  }
  
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.id);
  }
});
```

**Benefícios:**
- ✅ Configuração segura com variáveis de ambiente
- ✅ Fallbacks para diferentes tipos de storage
- ✅ Configuração adequada para SPA
- ✅ Detecção de sessão em URLs (confirmação de email)

---

## 🔧 SOLUÇÃO 6: MELHORAR SISTEMA DE SUBSCRIPTIONS

### 📋 **Problema:** Subscriptions podem falhar ou causar inconsistências

### 💡 **Solução:** Sistema robusto com retry e validação

**Implementação:**

```typescript
// src/hooks/useRealtimeProfile.ts
import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/contexts/ProfileContext';
import { validateProfile } from '@/utils/profileValidation';

interface UseRealtimeProfileOptions {
  userId: string;
  onProfileChange: (profile: Profile | null) => void;
  enabled?: boolean;
}

export const useRealtimeProfile = ({ 
  userId, 
  onProfileChange, 
  enabled = true 
}: UseRealtimeProfileOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('Cleaning up profile subscription');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    retryCountRef.current = 0;
  }, []);

  const setupSubscription = useCallback(() => {
    if (!enabled || !userId) return;

    cleanup(); // Limpar subscription anterior

    const channelName = `profile-changes-${userId}-${Date.now()}`;
    
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
          console.log('Profile change detected:', payload.eventType);
          
          try {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              if (payload.new) {
                // Validar dados antes de aplicar
                const validation = validateProfile(payload.new as Profile);
                
                if (validation.isValid || payload.new) {
                  onProfileChange(payload.new as Profile);
                } else {
                  console.warn('Received invalid profile data:', validation.missingFields);
                  // Opcionalmente, fazer fetch manual para obter dados válidos
                  const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
                    
                  if (data) {
                    onProfileChange(data as Profile);
                  }
                }
              }
            } else if (payload.eventType === 'DELETE') {
              onProfileChange(null);
            }
            
            // Reset retry count em caso de sucesso
            retryCountRef.current = 0;
            
          } catch (error) {
            console.error('Error processing profile change:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Profile subscription status:', status);
        
        if (status === 'CHANNEL_ERROR' && retryCountRef.current < maxRetries) {
          // Retry com backoff exponencial
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          retryCountRef.current++;
          
          console.log(`Retrying profile subscription in ${delay}ms (attempt ${retryCountRef.current})`);
          
          retryTimeoutRef.current = setTimeout(() => {
            setupSubscription();
          }, delay);
        }
      });

  }, [userId, enabled, onProfileChange, cleanup]);

  useEffect(() => {
    setupSubscription();
    return cleanup;
  }, [setupSubscription, cleanup]);

  return { retry: setupSubscription, cleanup };
};
```

**Uso no ProfileContext:**

```typescript
// src/contexts/ProfileContext.tsx - USAR o hook
import { useRealtimeProfile } from '@/hooks/useRealtimeProfile';

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  // ... outros states

  const handleProfileChange = useCallback((newProfile: Profile | null) => {
    setProfile(newProfile);
    setAuthState(determineAuthState(user, newProfile));
  }, [user, determineAuthState]);

  // Substituir useEffect complexo de subscription
  useRealtimeProfile({
    userId: user?.id || '',
    onProfileChange: handleProfileChange,
    enabled: !!user?.id
  });

  // ... resto do código
};
```

**Benefícios:**
- ✅ Retry automático com backoff exponencial
- ✅ Validação de dados antes de aplicar
- ✅ Cleanup adequado de subscriptions
- ✅ Logging detalhado para debugging

---

## 🔧 SOLUÇÃO 7: OTIMIZAR TIMING E PERFORMANCE

### 📋 **Problema:** Re-renders desnecessários e timing issues

### 💡 **Solução:** Memoização e controle de re-renders

**Implementação:**

```typescript
// src/contexts/ProfileContext.tsx - ADICIONAR memoização
import { memo, useMemo, useCallback } from 'react';

export const ProfileProvider = memo(({ children }: ProfileProviderProps) => {
  // ... states existentes

  // Memoizar funções para evitar re-renders
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    setAuthState(AuthState.INITIALIZING);
    try {
      const profileData = await fetchProfile(user.id);
      updateAuthState(user, profileData);
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setAuthState(AuthState.ERROR);
    }
  }, [user, updateAuthState]);

  const updateProfile = useCallback(async (profileData: Partial<Profile>): Promise<boolean> => {
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
        console.error('Error updating profile:', error);
        return false;
      }

      // Atualizar estado local imediatamente
      if (data) {
        updateAuthState(user, data as Profile);
      }
      
      return true;
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
      return false;
    }
  }, [user, updateAuthState]);

  // Memoizar value do context
  const contextValue = useMemo((): ProfileContextType => ({
    profile,
    hasProfile,
    loading,
    user,
    authState,
    refreshProfile,
    updateProfile,
  }), [profile, hasProfile, loading, user, authState, refreshProfile, updateProfile]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
});

ProfileProvider.displayName = 'ProfileProvider';
```

**Hook para debounce de navegação:**

```typescript
// src/hooks/useDebounce.ts
import { useRef, useCallback } from 'react';

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

// Uso no NavigationController
const debouncedNavigate = useDebounce(navigateSafely, 100);
```

**Benefícios:**
- ✅ Redução significativa de re-renders
- ✅ Melhor performance geral
- ✅ Controle de timing com debounce
- ✅ Memoização adequada de valores complexos

---

## 📊 SUMMARY DAS SOLUÇÕES

| Problema | Solução | Impacto | Prioridade |
|----------|---------|---------|------------|
| Redirecionamentos duplicados | NavigationController centralizado | 🔴 CRÍTICO | 🚨 URGENTE |
| Lógica hasProfile falha | Validação robusta com enum | 🔴 CRÍTICO | 🚨 URGENTE |
| Race conditions | Máquina de estados centralizada | 🔴 CRÍTICO | 🚨 URGENTE |
| Loops infinitos | ProtectedRoute simplificado | 🔴 CRÍTICO | 🚨 URGENTE |
| Configuração Supabase | Config robusta com fallbacks | 🟡 ALTA | 🔧 ALTA |
| Subscriptions falham | Sistema com retry e validação | 🟡 ALTA | 🔧 ALTA |
| Performance issues | Memoização e debounce | 🟢 MÉDIA | 📈 MÉDIA |

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### 🚨 **SPRINT 1 - URGENTE (1-2 dias)**
1. ✅ Implementar NavigationController
2. ✅ Corrigir lógica hasProfile
3. ✅ Refatorar ProfileContext com máquina de estados
4. ✅ Simplificar ProtectedRoute

### 🔧 **SPRINT 2 - ALTA (3-5 dias)**
1. ✅ Configurar Supabase adequadamente
2. ✅ Implementar sistema de subscriptions robusto
3. ✅ Adicionar validação de perfil completa

### 📈 **SPRINT 3 - MÉDIA (1-2 dias)**
1. ✅ Otimizar performance com memoização
2. ✅ Adicionar debounce onde necessário
3. ✅ Remover logs de produção
4. ✅ Implementar testes para prevenir regressões

---

## ✅ RESULTADOS ESPERADOS

Após implementação completa das soluções:

**✅ Para o Usuário:**
- Navegação fluida sem travamentos
- Redirecionamentos consistentes e previsíveis
- Sessões persistem corretamente entre reloads
- Feedback claro sobre estado do perfil

**✅ Para o Sistema:**
- Zero loops infinitos de redirecionamento
- Estados sempre consistentes entre componentes
- Performance otimizada com menos re-renders
- Código maintível e testável

**✅ Para o Desenvolvedor:**
- Lógica centralizada e fácil de debugar
- Testes automatizados previnem regressões
- Código modular e reutilizável
- Documentação clara dos fluxos