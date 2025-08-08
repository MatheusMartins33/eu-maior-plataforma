import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConversationOrb } from "./ConversationOrb";
import { AstralDataOrb } from "./AstralDataOrb";
import { InputOrb } from "./InputOrb";

/* -------------------------------------------------------------------------- */
/* SCROLLBAR CUSTOMIZADA                                                      */
/* -------------------------------------------------------------------------- */
const CustomScrollbar: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "" 
}) => (
  <div className={`overflow-y-auto custom-scrollbar ${className}`} style={{
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(55, 65, 81, 0.3)',
  }}>
    <style>
      {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}
    </style>
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/* INTERFACES                                                                 */
/* -------------------------------------------------------------------------- */
export interface OrbitalPanelProps {
  position: "left" | "right" | "bottom" | "center";
  content: "conversations" | "astral-data" | "input-area";
  /** Se o painel está expandido/visível */
  isExpanded?: boolean;
  /** Props específicas para conversação */
  conversationProps?: {
    messages: Array<{
      id: string;
      sender: "user" | "ai";
      text: string;
      timestamp: Date;
      error?: boolean;
    }>;
    loading: boolean;
    onRetry: () => void;
  };
  /** Props específicas para input */
  inputProps?: {
    value: string;
    onChange: (v: string) => void;
    onSend: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    loading: boolean;
    charCount: number;
  };
  /** Props específicas para dados astrais */
  astralProps?: unknown;
  /** Callback quando painel é fechado */
  onClose?: () => void;
  /** Modo de apresentação */
  variant?: "sidebar" | "modal" | "inline";
}

/* -------------------------------------------------------------------------- */
/* UTILITÁRIOS DE POSICIONAMENTO                                              */
/* -------------------------------------------------------------------------- */
const getOverlayClasses = (position: string, variant: string = "sidebar") => {
  const base = "fixed z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-600/30";
  
  switch (position) {
    case "left":
      return `${base} left-0 top-0 h-full w-96 border-r shadow-2xl shadow-black/50`;
    case "right":
      return `${base} right-0 top-0 h-full w-96 border-l shadow-2xl shadow-black/50`;
    case "bottom":
      return `${base} bottom-0 left-0 right-0 h-80 border-t shadow-2xl shadow-black/50`;
    case "center":
      return `${base} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 max-h-[80vh] rounded-2xl border shadow-2xl shadow-black/50`;
    default:
      return base;
  }
};

const getAnimationVariants = (position: string) => {
  switch (position) {
    case "left":
      return {
        hidden: { x: -400, opacity: 0 },
        visible: { x: 0, opacity: 1 },
        exit: { x: -400, opacity: 0 }
      };
    case "right":
      return {
        hidden: { x: 400, opacity: 0 },
        visible: { x: 0, opacity: 1 },
        exit: { x: 400, opacity: 0 }
      };
    case "bottom":
      return {
        hidden: { y: 400, opacity: 0 },
        visible: { y: 0, opacity: 1 },
        exit: { y: 400, opacity: 0 }
      };
    case "center":
      return {
        hidden: { scale: 0.8, opacity: 0 },
        visible: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 }
      };
    default:
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
      };
  }
};

/* -------------------------------------------------------------------------- */
/* CONVERSAÇÃO MELHORADA COM SCROLL                                           */
/* -------------------------------------------------------------------------- */
const EnhancedConversationOrb: React.FC<{
  messages: Array<{
    id: string;
    sender: "user" | "ai";
    text: string;
    timestamp: Date;
    error?: boolean;
  }>;
  loading: boolean;
  onRetry: () => void;
}> = ({ messages, loading, onRetry }) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header Fixo */}
      <div className="flex-shrink-0 p-6 border-b border-gray-600/30 bg-gray-900/95">
        <h2 className="text-xl font-semibold text-white mb-2">Conversação</h2>
        <p className="text-gray-400 text-sm">
          {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Messages Container com Scroll */}
      <CustomScrollbar className="flex-1 p-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">Nenhuma conversa ainda</p>
                <p className="text-sm">Inicie sua jornada cósmica abaixo</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`max-w-sm px-4 py-3 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-blue-600/80 text-white"
                      : message.error
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : "bg-gray-700/50 text-gray-100"
                  }`}
                >
                  {message.error && (
                    <div className="flex items-center mb-2 text-xs uppercase tracking-wide opacity-80">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Erro
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </motion.div>
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-gray-700/50 text-gray-300 px-4 py-3 rounded-2xl flex items-center">
                <div className="flex space-x-1 mr-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">Pensando...</span>
              </div>
            </motion.div>
          )}
        </div>
      </CustomScrollbar>

      {/* Footer com Retry Button */}
      {messages.at(-1)?.error && (
        <div className="flex-shrink-0 p-6 border-t border-gray-600/30 bg-gray-900/95">
          <button
            className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors flex items-center justify-center"
            onClick={onRetry}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* DADOS ASTRAIS MELHORADOS COM SCROLL                                        */
/* -------------------------------------------------------------------------- */
const EnhancedAstralDataOrb: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Header Fixo */}
      <div className="flex-shrink-0 p-6 border-b border-gray-600/30 bg-gray-900/95">
        <h2 className="text-xl font-semibold text-white mb-2">Energia Astral</h2>
        <p className="text-gray-400 text-sm">Seu estado energético atual</p>
      </div>

      {/* Content com Scroll */}
      <CustomScrollbar className="flex-1 p-6">
        <div className="space-y-8">
          {/* Componente principal dos dados astrais */}
          <AstralDataOrb showDetails={true} size="normal" />
          
          {/* Seção adicional: Recomendações */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Recomendações Cósmicas</h3>
            <div className="space-y-3">
              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <h4 className="text-blue-300 font-medium text-sm mb-2">Meditação Matinal</h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Dedique 10 minutos pela manhã para equilibrar seus chakras e elevar sua vibração.
                </p>
              </div>
              
              <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <h4 className="text-purple-300 font-medium text-sm mb-2">Cristais Recomendados</h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Ametista e quartzo rosa podem ajudar a amplificar sua energia atual.
                </p>
              </div>
              
              <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <h4 className="text-green-300 font-medium text-sm mb-2">Práticas Energéticas</h4>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Respiração 4-7-8 e visualização de luz dourada potencializarão sua clareza mental.
                </p>
              </div>
            </div>
          </div>

          {/* Seção adicional: Histórico Energético */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Evolução Energética</h3>
            <div className="space-y-3">
              {['Ontem', 'Há 2 dias', 'Há 3 dias'].map((day, index) => (
                <div key={day} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-xl">
                  <span className="text-gray-300 text-sm">{day}</span>
                  <div className="flex space-x-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                        style={{ width: `${Math.random() * 40 + 40}%` }}
                      />
                    </div>
                    <span className="text-gray-400 text-xs">
                      {Math.floor(Math.random() * 30 + 60)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Padding bottom para scroll completo */}
          <div className="h-4"></div>
        </div>
      </CustomScrollbar>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL                                                        */
/* -------------------------------------------------------------------------- */
export const OrbitalPanel: React.FC<OrbitalPanelProps> = ({
  position,
  content,
  isExpanded = false,
  conversationProps,
  inputProps,
  astralProps,
  onClose,
  variant = "sidebar",
}) => {
  const [shouldRender, setShouldRender] = useState(isExpanded);

  useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
    }
  }, [isExpanded]);

  const handleAnimationComplete = () => {
    if (!isExpanded) {
      setShouldRender(false);
    }
  };

  const variants = getAnimationVariants(position);

  if (!shouldRender) return null;

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isExpanded && (
        <motion.div
          className={getOverlayClasses(position, variant)}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
        >
          {/* Content Container com altura total */}
          <div className="h-full flex flex-col overflow-hidden">
            {content === "conversations" && conversationProps && (
              <EnhancedConversationOrb {...conversationProps} />
            )}
            
            {content === "astral-data" && (
              <EnhancedAstralDataOrb />
            )}
            
            {content === "input-area" && inputProps && (
              <div className="p-6">
                <InputOrb {...inputProps} />
              </div>
            )}
          </div>

          {/* Close Button (para versões não-inline) */}
          {variant !== "inline" && onClose && (
            <button
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-10 bg-gray-900/50 rounded-full backdrop-blur-sm"
              onClick={onClose}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrbitalPanel;