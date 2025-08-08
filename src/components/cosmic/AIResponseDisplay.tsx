import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Brain, 
  MessageCircle, 
  Loader2, 
  ChevronRight, 
  FastForward,
  SkipForward,
  Play,
  Pause,
  Square
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* INTERFACES                                                                 */
/* -------------------------------------------------------------------------- */
interface AIResponseDisplayProps {
  messages: { id: string; text: string }[];
  aiState?: "idle" | "listening" | "thinking" | "responding";
  isLoading?: boolean;
  onTypewriterComplete?: () => void;
}

interface UserControlledCarouselProps {
  text: string;
  onComplete?: () => void;
  onGlobalComplete?: () => void;
}

interface ControlledTypewriterProps {
  text: string;
  isActive: boolean;
  speed?: number;
  onPageComplete?: () => void;
}

/* -------------------------------------------------------------------------- */
/* TYPEWRITER CONTROLADO PELO USUÁRIO                                        */
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
    if (!isActive) {
      setDisplayedText('');
      setCurrentIndex(0);
      setIsComplete(false);
      return;
    }

    if (currentIndex < text.length && isActive) {
      const currentChar = text[currentIndex];
      let charSpeed = speed;
      
      // Pausas nas pontuações (reduzidas para melhor controle)
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
      setTimeout(() => {
        onPageComplete?.();
      }, 800);
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
        whiteSpace: 'pre-wrap',
      }}
    >
      {displayedText}
      
      {/* Cursor piscante apenas quando ativo e não completo */}
      {isActive && !isComplete && (
        <motion.span
          className="inline-block w-0.5 h-6 ml-1"
          style={{
            backgroundColor: '#60A5FA',
            boxShadow: '0 0 10px rgba(96, 165, 250, 0.8)',
          }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CARROSSEL CONTROLADO PELO USUÁRIO                                         */
/* -------------------------------------------------------------------------- */
const UserControlledCarousel: React.FC<UserControlledCarouselProps> = ({ 
  text, 
  onComplete,
  onGlobalComplete 
}) => {
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPageComplete, setCurrentPageComplete] = useState(false);
  const [isSkippedToEnd, setIsSkippedToEnd] = useState(false);
  const [carouselComplete, setCarouselComplete] = useState(false);

  // Dividir texto em páginas otimizadas
  useEffect(() => {
    const maxCharsPerPage = 320; // Tamanho otimizado para leitura
    const sentences = text.split(/(?<=[.!?])\s+/);
    const pageArray: string[] = [];
    let currentPageText = '';

    for (const sentence of sentences) {
      const potentialPage = currentPageText + (currentPageText ? ' ' : '') + sentence;
      
      if (potentialPage.length > maxCharsPerPage && currentPageText.length > 0) {
        pageArray.push(currentPageText.trim());
        currentPageText = sentence;
      } else {
        currentPageText = potentialPage;
      }
    }

    if (currentPageText) {
      pageArray.push(currentPageText.trim());
    }

    setPages(pageArray);
    setCurrentPage(0);
    setCurrentPageComplete(false);
    setIsSkippedToEnd(false);
    setCarouselComplete(false);
  }, [text]);

  // Callback quando página atual completa
  const handlePageComplete = () => {
    setCurrentPageComplete(true);
    
    // Se é a última página, marca carrossel como completo
    if (currentPage === pages.length - 1) {
      setCarouselComplete(true);
      setTimeout(() => {
        onComplete?.();
        setTimeout(() => {
          onGlobalComplete?.();
        }, 1000);
      }, 1200);
    }
  };

  // Próxima página
  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1);
      setCurrentPageComplete(false);
    }
  };

  // Acelerar/Pular para o final
  const skipToEnd = () => {
    setIsSkippedToEnd(true);
    setTimeout(() => {
      onComplete?.();
      setTimeout(() => {
        onGlobalComplete?.();
      }, 500);
    }, 300);
  };

  if (pages.length === 0) return null;

  // Modo acelerado: texto completo com scroll
  if (isSkippedToEnd) {
    return (
      <motion.div
        className="w-full max-h-[60vh] overflow-y-auto space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(17, 24, 39, 0.8)',
        }}
      >
        <div 
          className="text-white leading-relaxed"
          style={{
            color: '#FFFFFF !important',
            textShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 1px 2px rgba(0, 0, 0, 0.9)',
            fontWeight: '500',
            fontSize: '17px',
            lineHeight: '1.7',
            letterSpacing: '0.025em',
          }}
        >
          {text}
        </div>
        
        {/* Indicador de texto completo */}
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div 
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-full text-sm"
            style={{
              color: '#FFFFFF !important',
              textShadow: '0 1px 2px rgba(0, 0, 0, 1)',
            }}
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Mensagem completa exibida</span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Modo carrossel paginado
  return (
    <div className="w-full space-y-6">
      {/* Conteúdo da página atual */}
      <div className="min-h-[200px] flex items-start">
        <ControlledTypewriter
          text={pages[currentPage]}
          isActive={!carouselComplete}
          speed={100} // Velocidade otimizada
          onPageComplete={handlePageComplete}
        />
      </div>

      {/* Controles do usuário */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Indicador de progresso */}
        <div className="flex items-center space-x-3">
          {/* Progresso visual */}
          <div className="flex space-x-1">
            {pages.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index < currentPage 
                    ? 'w-6 bg-green-400' 
                    : index === currentPage 
                    ? 'w-8 bg-blue-400' 
                    : 'w-3 bg-gray-600'
                }`}
                animate={{
                  scale: index === currentPage ? [1, 1.1, 1] : 1
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            ))}
          </div>
          
          {/* Contador */}
          <span 
            className="text-sm"
            style={{
              color: '#FFFFFF !important',
              textShadow: '0 1px 2px rgba(0, 0, 0, 1)',
              opacity: 0.8,
            }}
          >
            {currentPage + 1} de {pages.length}
          </span>
        </div>

        {/* Botões de controle */}
        <div className="flex items-center space-x-3">
          {/* Botão Acelerar */}
          <motion.button
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600/70 hover:bg-purple-500/80 text-white rounded-xl transition-all duration-200 backdrop-blur-sm"
            onClick={skipToEnd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: '0 4px 15px rgba(147, 51, 234, 0.4)',
            }}
          >
            <FastForward className="w-4 h-4" />
            <span className="text-sm font-medium">Ver Tudo</span>
          </motion.button>

          {/* Botão Próxima Página */}
          {currentPage < pages.length - 1 && (
            <motion.button
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
                currentPageComplete
                  ? 'bg-blue-600/70 hover:bg-blue-500/80 text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
              }`}
              onClick={nextPage}
              disabled={!currentPageComplete}
              whileHover={currentPageComplete ? { scale: 1.05 } : {}}
              whileTap={currentPageComplete ? { scale: 0.95 } : {}}
              style={{
                boxShadow: currentPageComplete ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none'
              }}
            >
              <span className="text-sm font-medium">Próxima</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Dica para o usuário */}
      {!currentPageComplete && currentPage === 0 && (
        <motion.div
          className="text-center text-sm opacity-60"
          style={{
            color: '#FFFFFF !important',
            textShadow: '0 1px 2px rgba(0, 0, 0, 1)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 3 }}
        >
          💡 Use "Ver Tudo" para acelerar ou aguarde para navegar página por página
        </motion.div>
      )}

      {/* Mensagem de conclusão */}
      {carouselComplete && (
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div 
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500/20 border border-green-500/40 rounded-full"
            style={{
              color: '#FFFFFF !important',
              textShadow: '0 1px 2px rgba(0, 0, 0, 1)',
            }}
          >
            <Sparkles className="w-5 h-5 text-green-400" />
            <span>Mensagem completa! Absorva esta sabedoria ✨</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* LOADING INDICATOR SIMPLIFICADO                                            */
/* -------------------------------------------------------------------------- */
const SimplifiedLoadingIndicator: React.FC<{ state: string }> = ({ state }) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      rotate: 360,
      transition: { duration: 3, repeat: Infinity, ease: "linear" }
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
        boxShadow: `0 0 40px ${stateInfo.glowColor}`,
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
          boxShadow: `0 0 30px ${stateInfo.glowColor}`,
        }}
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 3, repeat: Infinity, ease: "linear" },
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <IconComponent 
          className="w-10 h-10"
          style={{ color: '#FFFFFF' }}
        />
      </motion.div>

      <motion.p
        className="text-center max-w-xs"
        style={{
          color: '#FFFFFF !important',
          textShadow: '0 2px 4px rgba(0, 0, 0, 1)',
          fontSize: '18px',
          fontWeight: '500',
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
/* COMPONENTE PRINCIPAL COM INTERFACE LIMPA                                  */
/* -------------------------------------------------------------------------- */
export const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({
  messages,
  aiState = "idle",
  isLoading = false,
  onTypewriterComplete
}) => {
  const [showContent, setShowContent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages.at(-1);
  const lastMessageText = lastMessage?.text || "";

  // Detectar nova mensagem
  useEffect(() => {
    if (lastMessage && aiState === "responding") {
      setTimeout(() => {
        setShowContent(true);
      }, 800);
    }
  }, [lastMessage, aiState]);

  // Estados de exibição
  const shouldShowLoadingState = aiState !== "idle" && (isLoading || aiState === "thinking" || aiState === "listening");
  const shouldShowResponseContent = aiState === "responding" && lastMessageText && showContent;

  if (aiState === "idle" && !lastMessageText) {
    return null;
  }

  return (
    <div className="absolute inset-12 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {/* Estado de Loading Simplificado */}
        {shouldShowLoadingState && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <SimplifiedLoadingIndicator state={aiState} />
          </motion.div>
        )}

        {/* Carrossel Controlado pelo Usuário */}
        {shouldShowResponseContent && (
          <motion.div
            key="response"
            className="w-full max-w-[clamp(24rem,60vw,45rem)]"
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -40 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div
              ref={scrollRef}
              className="relative px-10 py-8 rounded-3xl"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.92)',
                border: '2px solid rgba(59, 130, 246, 0.5)',
                boxShadow: `
                  0 30px 60px -12px rgba(0, 0, 0, 0.9),
                  0 0 40px rgba(59, 130, 246, 0.3),
                  inset 0 2px 0 rgba(255, 255, 255, 0.1)
                `,
                backdropFilter: 'blur(25px)',
              }}
            >
              <UserControlledCarousel
                text={lastMessageText}
                onComplete={() => {
                  // Callback local quando carrossel completa
                }}
                onGlobalComplete={onTypewriterComplete}
              />

              {/* Aura de fundo */}
              <motion.div
                className="absolute inset-0 -z-10 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 100%)',
                }}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Estado idle simplificado */}
        {aiState === "idle" && lastMessageText && !shouldShowResponseContent && (
          <motion.div
            key="idle-content"
            className="w-full max-w-[clamp(24rem,60vw,45rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="px-10 py-8 rounded-3xl"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.88)',
                border: '1px solid rgba(107, 114, 128, 0.5)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div 
                className="text-white leading-relaxed"
                style={{
                  color: '#FFFFFF !important',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 1)',
                  fontWeight: '500',
                  fontSize: '17px',
                  lineHeight: '1.7',
                }}
              >
                {lastMessageText}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partículas ambiente simplificadas */}
      {(shouldShowLoadingState || shouldShowResponseContent) && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${15 + Math.random() * 70}%`,
                backgroundColor: 'rgba(59, 130, 246, 0.4)',
                boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: i * 1.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AIResponseDisplay;