import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  MessageCircle, 
  Loader2, 
  ChevronRight, 
  FastForward,
  X // ✅ CORREÇÃO: Importado o ícone de 'X'
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* INTERFACES (Sem alterações)                                                */
/* -------------------------------------------------------------------------- */
interface AIResponseDisplayProps {
  messages: { id: string; text: string }[];
  aiState?: "idle" | "listening" | "thinking" | "responding";
  isLoading?: boolean;
  onTypewriterComplete?: () => void;
}

interface UserControlledCarouselProps {
  text: string;
  onGlobalComplete?: () => void;
}

interface ControlledTypewriterProps {
  text: string;
  isActive: boolean;
  speed?: number;
  onPageComplete?: () => void;
}

/* -------------------------------------------------------------------------- */
/* TYPEWRITER CONTROLADO PELO USUÁRIO (Sem alterações)                       */
/* -------------------------------------------------------------------------- */
const ControlledTypewriter: React.FC<ControlledTypewriterProps> = ({ 
  text, 
  isActive,
  speed = 120,
  onPageComplete 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text, isActive]);

  useEffect(() => {
    if (!isActive) return;

    if (currentIndex < text.length) {
      const currentChar = text[currentIndex];
      let charSpeed = speed;
      if (currentChar === '.') charSpeed = 400; 
      else if (currentChar === ',') charSpeed = 200; 
      else if (currentChar === '!') charSpeed = 450; 
      else if (currentChar === '?') charSpeed = 450; 
      else if (currentChar === ':') charSpeed = 250; 
      else if (currentChar === ' ') charSpeed = 60;
      
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, charSpeed);
      return () => clearTimeout(timer);
    } else if (!isComplete && text.length > 0 && currentIndex >= text.length) {
      setIsComplete(true);
      setTimeout(() => onPageComplete?.(), 800);
    }
  }, [currentIndex, text, isActive, speed, onPageComplete, isComplete]);


  return (
    <div 
      className="text-white leading-relaxed" 
      style={{ 
        color: '#FFFFFF !important', 
        textShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 1px 2px rgba(0, 0, 0, 0.9)', 
        fontWeight: '500', 
        fontSize: '17px', 
        lineHeight: '1.7', 
        letterSpacing: '0.025em', 
        whiteSpace: 'pre-wrap' 
      }}
    >
      {displayedText}
      {isActive && !isComplete && (
        <motion.span 
          className="inline-block w-0.5 h-6 ml-1" 
          style={{ 
            backgroundColor: '#60A5FA', 
            boxShadow: '0 0 10px rgba(96, 165, 250, 0.8)' 
          }} 
          animate={{ opacity: [0, 1, 0] }} 
          transition={{ duration: 1, repeat: Infinity }} 
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* BOTÃO COM TOOLTIP (Sem alterações)                                         */
/* -------------------------------------------------------------------------- */
const TooltipButton: React.FC<{
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ tooltip, onClick, disabled = false, children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <motion.button
        className={`p-2 rounded-full transition-colors duration-200 ${
          disabled
            ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
            : "bg-gray-800/60 hover:bg-purple-600/80 text-gray-300 hover:text-white"
        }`}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        {children}
      </motion.button>
      <AnimatePresence>
        {isHovered && !disabled && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/80 text-white text-xs font-medium rounded-md whitespace-nowrap z-10"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CARROSSEL COM CONTROLE DE FECHAMENTO                                       */
/* -------------------------------------------------------------------------- */
const UserControlledCarousel: React.FC<UserControlledCarouselProps> = ({
  text,
  onGlobalComplete,
}) => {
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSkippedToEnd, setIsSkippedToEnd] = useState(false);
  const [carouselComplete, setCarouselComplete] = useState(false);

  const onGlobalCompleteRef = useRef(onGlobalComplete);
  useEffect(() => { 
    onGlobalCompleteRef.current = onGlobalComplete; 
  }, [onGlobalComplete]);

  useEffect(() => {
    const maxCharsPerPage = 320;
    const sentences = text.split(/(?<=[.!?])\s+/);
    const pageArray: string[] = [];
    let currentPageText = "";
    
    for (const sentence of sentences) {
      const potentialPage = currentPageText + (currentPageText ? " " : "") + sentence;
      if (potentialPage.length > maxCharsPerPage && currentPageText.length > 0) {
        pageArray.push(currentPageText.trim());
        currentPageText = sentence;
      } else {
        currentPageText = potentialPage;
      }
    }
    
    if (currentPageText) pageArray.push(currentPageText.trim());
    setPages(pageArray);
    setCurrentPage(0);
    setIsSkippedToEnd(false);
    setCarouselComplete(false);
  }, [text]);

  const handleInteractionEnd = () => { 
    if (!carouselComplete) { 
      setCarouselComplete(true); 
      onGlobalCompleteRef.current?.(); 
    } 
  };
  
  const handlePageComplete = () => { 
    if (currentPage === pages.length - 1) { 
      handleInteractionEnd(); 
    } 
  };
  
  const nextPage = () => { 
    if (currentPage < pages.length - 1) { 
      setCurrentPage((prev) => prev + 1); 
    } 
  };
  
  const skipToEnd = () => { 
    setIsSkippedToEnd(true); 
  };
  
  // ✅ CORREÇÃO: O timer automático foi removido.
  // A finalização agora é controlada pelo botão de fechar.

  if (pages.length === 0) return null;

  return (
    <div className="w-full flex flex-col space-y-4">
      <AnimatePresence mode="wait">
        {!isSkippedToEnd ? (
          <motion.div
            key="paginated-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="min-h-[220px] flex items-start">
              <ControlledTypewriter 
                text={pages[currentPage]} 
                isActive={!carouselComplete} 
                speed={100} 
                onPageComplete={handlePageComplete} 
              />
            </div>
            
            <motion.div 
              className="w-full pt-4 border-t border-gray-700/50 flex flex-col space-y-3" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  {pages.map((_, index) => (
                    <motion.div 
                      key={index} 
                      className={`h-1.5 rounded-full transition-colors duration-300 ${
                        index < currentPage 
                          ? "bg-blue-500/50" 
                          : index === currentPage 
                          ? "bg-blue-400" 
                          : "bg-gray-600"
                      }`} 
                      animate={{ width: index === currentPage ? 20 : 6 }} 
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {currentPage + 1}/{pages.length}
                </span>
              </div>
              
              <div className="flex items-center justify-end w-full min-h-[40px]">
                <div className="flex-shrink-0 flex items-center space-x-2">
                  {!carouselComplete && (
                    <TooltipButton tooltip="Ver Tudo" onClick={skipToEnd}>
                      <FastForward className="w-5 h-5" />
                    </TooltipButton>
                  )}
                  {currentPage < pages.length - 1 && (
                    <TooltipButton 
                      tooltip="Próxima" 
                      onClick={nextPage}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </TooltipButton>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="full-view"
            className="relative w-full max-h-[60vh] overflow-y-auto cosmic-scrollbar p-4" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* ✅ CORREÇÃO: Adicionado o botão de fechar */}
            <motion.button
              onClick={handleInteractionEnd}
              className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-gray-700/80 hover:text-white transition-colors z-10"
              aria-label="Fechar"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.5 } }}
            >
              <X className="w-5 h-5" />
            </motion.button>

            <div 
              className="text-white leading-relaxed" 
              style={{ 
                color: "#FFFFFF !important", 
                textShadow: "0 2px 4px rgba(0, 0, 0, 1), 0 1px 2px rgba(0, 0, 0, 0.9)", 
                fontWeight: "500", 
                fontSize: "17px", 
                lineHeight: "1.7", 
                letterSpacing: "0.025em" 
              }}
            >
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* LOADING INDICATOR SIMPLIFICADO (Sem alterações)                           */
/* -------------------------------------------------------------------------- */
const SimplifiedLoadingIndicator: React.FC<{ state: string }> = ({ state }) => {
  const controls = useAnimation();
  
  useEffect(() => { 
    controls.start({ 
      rotate: 360, 
      transition: { 
        duration: 3, 
        repeat: Infinity, 
        ease: "linear" 
      } 
    }); 
  }, [controls]);
  
  const getStateInfo = (state: string) => {
    switch (state) {
      case "listening": 
        return { 
          icon: MessageCircle, 
          text: "Absorvendo sua energia...", 
          glowColor: "rgba(34, 197, 94, 0.7)" 
        };
      case "thinking": 
        return { 
          icon: Brain, 
          text: "Refletindo profundamente...", 
          glowColor: "rgba(59, 130, 246, 0.7)" 
        };
      case "responding": 
        return { 
          icon: Sparkles, 
          text: "Preparando sua resposta...", 
          glowColor: "rgba(147, 51, 234, 0.7)" 
        };
      default: 
        return { 
          icon: Loader2, 
          text: "Conectando com o cosmos...", 
          glowColor: "rgba(156, 163, 175, 0.7)" 
        };
    }
  };
  
  const stateInfo = getStateInfo(state);
  const IconComponent = stateInfo.icon;
  
  return (
    <motion.div 
      className="flex flex-col items-center space-y-6 p-8 rounded-3xl backdrop-blur-xl" 
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.9)', 
        border: `2px solid ${stateInfo.glowColor}`, 
        boxShadow: `0 0 40px ${stateInfo.glowColor}` 
      }} 
      initial={{ scale: 0.8, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      exit={{ scale: 0.8, opacity: 0 }} 
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div 
        className="p-6 rounded-full" 
        style={{ 
          backgroundColor: stateInfo.glowColor, 
          boxShadow: `0 0 30px ${stateInfo.glowColor}` 
        }} 
        animate={{ 
          rotate: 360, 
          scale: [1, 1.1, 1] 
        }} 
        transition={{ 
          rotate: { 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear" 
          }, 
          scale: { 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          } 
        }}
      >
        <IconComponent className="w-10 h-10" style={{ color: '#FFFFFF' }} />
      </motion.div>
      <motion.p 
        className="text-center max-w-xs" 
        style={{ 
          color: '#FFFFFF !important', 
          textShadow: '0 2px 4px rgba(0, 0, 0, 1)', 
          fontSize: '18px', 
          fontWeight: '500' 
        }} 
        animate={{ opacity: [0.7, 1, 0.7] }} 
        transition={{ duration: 4, repeat: Infinity }}
      >
        {stateInfo.text}
      </motion.p>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL (Sem alterações)                                    */
/* -------------------------------------------------------------------------- */
export const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({
  messages,
  aiState = "idle",
  isLoading = false,
  onTypewriterComplete
}) => {
  const [showContent, setShowContent] = useState(false);
  const lastMessage = messages.at(-1);
  const lastMessageText = lastMessage?.text || "";

  useEffect(() => {
    if (aiState === "responding" && lastMessage) {
      const timer = setTimeout(() => { 
        setShowContent(true); 
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [aiState, lastMessage]);

  const shouldShowLoadingState = aiState === "thinking" || aiState === "listening";
  const shouldShowResponseContent = aiState === "responding" && showContent;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 z-40">
      <AnimatePresence mode="wait">
        {shouldShowLoadingState && (
          <motion.div 
            key="loading" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }} 
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <SimplifiedLoadingIndicator state={aiState} />
          </motion.div>
        )}
        
        {shouldShowResponseContent && (
          <motion.div 
            key="response" 
            className="w-full max-w-2xl" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div 
              className="relative p-6 sm:p-8 rounded-2xl" 
              style={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                border: '1px solid rgba(59, 130, 246, 0.3)', 
                boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.7)`, 
                backdropFilter: 'blur(16px)' 
              }}
            >
              <UserControlledCarousel 
                text={lastMessageText} 
                onGlobalComplete={onTypewriterComplete} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIResponseDisplay;