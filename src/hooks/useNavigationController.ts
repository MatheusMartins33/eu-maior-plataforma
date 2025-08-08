import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { AuthState } from '@/types/auth';

/**
 * Controlador de navegação centralizado que gerencia redirecionamentos
 * com base em um estado de autenticação estável.
 */
export const useNavigationController = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useProfile();

  useEffect(() => {
    // Não faz nada enquanto a aplicação está inicializando
    if (authState === AuthState.INITIALIZING) {
      return;
    }

    const currentPath = location.pathname;
    let targetRoute: string | null = null;

    switch (authState) {
      // Caso 1: Usuário autenticado, mas sem perfil completo.
      // Deve ser forçado para a página de onboarding.
      case AuthState.AUTHENTICATED_NO_PROFILE:
        if (currentPath !== '/onboarding') {
          targetRoute = '/onboarding';
        }
        break;

      // Caso 2: Usuário autenticado e com perfil completo.
      // Deve ser redirecionado para a aplicação principal se estiver em páginas de auth/onboarding.
      case AuthState.AUTHENTICATED_WITH_PROFILE:
        const restrictedRoutes = ['/login', '/register', '/onboarding'];
        if (restrictedRoutes.includes(currentPath) || currentPath === '/') {
          targetRoute = '/jarvis';
        }
        break;

      // Caso 3: Usuário não autenticado.
      // NENHUM redirecionamento automático. O usuário pode navegar livremente
      // nas rotas públicas. A proteção de rotas privadas é feita pelo componente <ProtectedRoute>.
      case AuthState.UNAUTHENTICATED:
      case AuthState.ERROR:
      default:
        targetRoute = null;
        break;
    }

    // Executa a navegação apenas se um redirecionamento for necessário
    // e se não já estivermos na rota de destino.
    if (targetRoute && targetRoute !== currentPath) {
      console.log(`[NAV] Redirecionando de '${currentPath}' para '${targetRoute}' devido ao estado: ${authState}`);
      navigate(targetRoute, { replace: true });
    }

  }, [authState, location.pathname, navigate]);

  // O hook pode retornar informações úteis, se necessário, ou nada.
  // Manter a consistência com o código anterior.
  return {
    currentAuthState: authState,
  };
};

// Este hook pode ser removido se não for usado em outros lugares,
// pois o controlador principal agora é totalmente automático.
export const useSafeNavigation = () => {
  const navigate = useNavigate();
  return {
    navigateTo: (to: string, replace = true) => navigate(to, { replace }),
  };
};