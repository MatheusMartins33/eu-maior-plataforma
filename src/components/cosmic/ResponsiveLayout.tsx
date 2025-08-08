import React, { useState, useEffect, createContext, useContext } from 'react';

/* -------------------------------------------------------------------------- */
/* TIPOS E INTERFACES                                                         */
/* -------------------------------------------------------------------------- */
export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type LayoutMode = 'stack' | 'overlay' | 'sidebar';

export interface ResponsiveConfig {
  breakpoint: BreakpointSize;
  device: DeviceType;
  layoutMode: LayoutMode;
  isTouch: boolean;
  canHover: boolean;
  width: number;
  height: number;
}

/* -------------------------------------------------------------------------- */
/* BREAKPOINTS E CONFIGURAÇÕES                                                */
/* -------------------------------------------------------------------------- */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const RESPONSIVE_CONFIGS: Record<BreakpointSize, Partial<ResponsiveConfig>> = {
  xs: {
    device: 'mobile',
    layoutMode: 'stack',
  },
  sm: {
    device: 'mobile',
    layoutMode: 'overlay',
  },
  md: {
    device: 'tablet',
    layoutMode: 'overlay',
  },
  lg: {
    device: 'desktop',
    layoutMode: 'sidebar',
  },
  xl: {
    device: 'desktop',
    layoutMode: 'sidebar',
  },
  '2xl': {
    device: 'desktop',
    layoutMode: 'sidebar',
  },
};

/* -------------------------------------------------------------------------- */
/* CONTEXT DE RESPONSIVIDADE                                                  */
/* -------------------------------------------------------------------------- */
const ResponsiveContext = createContext<ResponsiveConfig>({
  breakpoint: 'lg',
  device: 'desktop',
  layoutMode: 'sidebar',
  isTouch: false,
  canHover: true,
  width: 1280,
  height: 720,
});

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  return context;
};

/* -------------------------------------------------------------------------- */
/* HOOK PARA DETECTAR RESPONSIVIDADE                                          */
/* -------------------------------------------------------------------------- */
export function useResponsiveConfig(): ResponsiveConfig {
  const [config, setConfig] = useState<ResponsiveConfig>(() => {
    if (typeof window === 'undefined') {
      return {
        breakpoint: 'lg',
        device: 'desktop',
        layoutMode: 'sidebar',
        isTouch: false,
        canHover: true,
        width: 1280,
        height: 720,
      };
    }

    return calculateResponsiveConfig(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    const handleResize = () => {
      const newConfig = calculateResponsiveConfig(window.innerWidth, window.innerHeight);
      setConfig(newConfig);
    };

    const handleOrientationChange = () => {
      // Delay para aguardar a mudança completa da orientação
      setTimeout(() => {
        handleResize();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return config;
}

/* -------------------------------------------------------------------------- */
/* FUNÇÃO PARA CALCULAR CONFIGURAÇÃO RESPONSIVA                               */
/* -------------------------------------------------------------------------- */
function calculateResponsiveConfig(width: number, height: number): ResponsiveConfig {
  // Detectar breakpoint
  let breakpoint: BreakpointSize = 'xs';
  for (const [bp, minWidth] of Object.entries(BREAKPOINTS)) {
    if (width >= minWidth) {
      breakpoint = bp as BreakpointSize;
    }
  }

  // Detectar capacidades do dispositivo
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const canHover = window.matchMedia('(hover: hover)').matches;
  
  // Detectar tipo de dispositivo
  let device: DeviceType = 'desktop';
  if (width < BREAKPOINTS.md) {
    device = 'mobile';
  } else if (width < BREAKPOINTS.lg) {
    device = 'tablet';
  }

  // Determinar modo de layout
  let layoutMode: LayoutMode = 'sidebar';
  if (device === 'mobile' && width < BREAKPOINTS.sm) {
    layoutMode = 'stack';
  } else if (device === 'mobile' || device === 'tablet') {
    layoutMode = 'overlay';
  }

  return {
    breakpoint,
    device,
    layoutMode,
    isTouch,
    canHover,
    width,
    height,
    ...RESPONSIVE_CONFIGS[breakpoint],
  };
}

/* -------------------------------------------------------------------------- */
/* PROVIDER DE RESPONSIVIDADE                                                 */
/* -------------------------------------------------------------------------- */
export const ResponsiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = useResponsiveConfig();

  return (
    <ResponsiveContext.Provider value={config}>
      {children}
    </ResponsiveContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTES RESPONSIVOS                                                    */
/* -------------------------------------------------------------------------- */

// Container responsivo para o orbe central
export const ResponsiveOrbContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { device, width } = useResponsive();

  const getOrbSize = () => {
    if (device === 'mobile') {
      return width < 380 ? 'w-64 h-64' : 'w-72 h-72';
    } else if (device === 'tablet') {
      return 'w-80 h-80';
    }
    return 'w-96 h-96 md:w-[28rem] md:h-[28rem]';
  };

  return (
    <div className={`flex items-center justify-center ${getOrbSize()}`}>
      {children}
    </div>
  );
};

// Container responsivo para input
export const ResponsiveInputContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { device, layoutMode } = useResponsive();

  const getPadding = () => {
    if (device === 'mobile') {
      return 'p-4 pb-6';
    } else if (device === 'tablet') {
      return 'p-5 pb-7';
    }
    return 'p-6 pb-8';
  };

  const getMaxWidth = () => {
    if (layoutMode === 'stack') {
      return 'max-w-full';
    } else if (device === 'tablet') {
      return 'max-w-2xl';
    }
    return 'max-w-4xl';
  };

  return (
    <div className={getPadding()}>
      <div className={`w-full ${getMaxWidth()} mx-auto`}>
        {children}
      </div>
    </div>
  );
};

// Container responsivo para controles flutuantes
export const ResponsiveFloatingControls: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { device, isTouch } = useResponsive();

  if (device === 'mobile') {
    // Em mobile, os controles ficam na parte inferior
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex space-x-4">
        {children}
      </div>
    );
  }

  // Desktop/tablet mantém nos cantos
  return <>{children}</>;
};

// Hook para classes responsivas de painel
export const useResponsivePanelClasses = (position: 'left' | 'right' | 'bottom' | 'center') => {
  const { device, layoutMode, width, height } = useResponsive();

  const getClasses = () => {
    const base = "fixed z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-600/30";
    
    if (layoutMode === 'stack') {
      // Mobile pequeno - painel ocupa tela toda
      return `${base} inset-0 rounded-none border-0`;
    }
    
    if (layoutMode === 'overlay') {
      // Mobile/tablet - painéis maiores
      if (position === 'left' || position === 'right') {
        const panelWidth = device === 'mobile' ? 'w-5/6' : 'w-80';
        const borderSide = position === 'left' ? 'border-r' : 'border-l';
        const positioning = position === 'left' ? 'left-0' : 'right-0';
        return `${base} ${positioning} top-0 h-full ${panelWidth} ${borderSide} shadow-2xl shadow-black/50`;
      } else if (position === 'bottom') {
        const panelHeight = height < 600 ? 'h-3/4' : 'h-96';
        return `${base} bottom-0 left-0 right-0 ${panelHeight} border-t shadow-2xl shadow-black/50`;
      } else {
        // center
        const modalSize = device === 'mobile' ? 'w-11/12 max-h-[85vh]' : 'w-96 max-h-[80vh]';
        return `${base} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${modalSize} rounded-2xl border shadow-2xl shadow-black/50`;
      }
    }
    
    // Desktop - sidebar mode
    if (position === 'left' || position === 'right') {
      const borderSide = position === 'left' ? 'border-r' : 'border-l';
      const positioning = position === 'left' ? 'left-0' : 'right-0';
      return `${base} ${positioning} top-0 h-full w-96 ${borderSide} shadow-2xl shadow-black/50`;
    } else if (position === 'bottom') {
      return `${base} bottom-0 left-0 right-0 h-80 border-t shadow-2xl shadow-black/50`;
    } else {
      return `${base} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 max-h-[80vh] rounded-2xl border shadow-2xl shadow-black/50`;
    }
  };

  return getClasses();
};

// Hook para detectar se deve usar navegação por gestos
export const useGestureNavigation = () => {
  const { isTouch, device } = useResponsive();
  return isTouch && device === 'mobile';
};

// Hook para obter configurações de animação baseadas no dispositivo
export const useResponsiveAnimation = () => {
  const { device, isTouch } = useResponsive();

  return {
    duration: device === 'mobile' ? 0.2 : 0.3,
    ease: isTouch ? 'easeOut' : 'easeInOut',
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    springConfig: {
      damping: device === 'mobile' ? 30 : 25,
      stiffness: device === 'mobile' ? 400 : 300,
    },
  };
};

/* -------------------------------------------------------------------------- */
/* UTILITÁRIOS RESPONSIVOS                                                    */
/* -------------------------------------------------------------------------- */

// Função para obter tamanho de fonte responsivo
export const getResponsiveFontSize = (device: DeviceType, size: 'xs' | 'sm' | 'base' | 'lg' | 'xl') => {
  const sizes = {
    mobile: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    tablet: {
      xs: 'text-sm',
      sm: 'text-base',
      base: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
    },
    desktop: {
      xs: 'text-sm',
      sm: 'text-base',
      base: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
    },
  };

  return sizes[device][size];
};

// Função para obter espaçamento responsivo
export const getResponsiveSpacing = (device: DeviceType, size: 'sm' | 'md' | 'lg' | 'xl') => {
  const spacings = {
    mobile: {
      sm: 'p-2',
      md: 'p-3',
      lg: 'p-4',
      xl: 'p-5',
    },
    tablet: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
      xl: 'p-6',
    },
    desktop: {
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    },
  };

  return spacings[device][size];
};

export default ResponsiveProvider;