import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2,
  Download,
  MessageSquare
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* INTERFACES                                                                 */
/* -------------------------------------------------------------------------- */
export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  error?: boolean;
}

export interface ConversationOrbProps {
  messages?: Message[];
  loading?: boolean;
  onRetry?: () => void;
  onClearHistory?: () => void;
  onExportHistory?: () => void;
  maxMessages?: number;
}

/* -------------------------------------------------------------------------- */
/* COMPONENTE DE MENSAGEM INDIVIDUAL                                           */
/* -------------------------------------------------------------------------- */
const MessageBubble: React.FC<{
  message: Message;
  onRetry?: () => void;
}> = ({ message, onRetry }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const isUser = message.sender === "user";
  const isError = message.error;

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"} group`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      layout
    >
      <div className={`relative max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
        {/* Avatar/Indicador */}
        <div className={`flex items-end space-x-2 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
          {/* Avatar */}
          <motion.div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isUser 
                ? "bg-blue-600" 
                : isError 
                ? "bg-red-500/20 border border-red-500/40" 
                : "bg-purple-600"
            }`}
            whileHover={{ scale: 1.1 }}
          >
            {isUser ? (
              <span className="text-white text-sm font-medium">U</span>
            ) : isError ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <MessageSquare className="w-4 h-4 text-white" />
            )}
          </motion.div>

          {/* Bubble */}
          <div
            className={`relative px-4 py-3 rounded-2xl max-w-md break-words ${
              isUser
                ? "bg-blue-600/90 text-white"
                : isError
                ? "bg-red-500/10 text-red-300 border border-red-500/30"
                : "bg-gray-700/60 text-gray-100 backdrop-blur-sm"
            }`}
          >
            {/* Conteúdo da mensagem */}
            <div className="space-y-2">
              {isError && (
                <div className="flex items-center text-xs uppercase tracking-wide opacity-80">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Erro na comunicação
                </div>
              )}
              
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
              
              {/* Timestamp */}
              <p className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Tail do bubble */}
            <div
              className={`absolute top-4 w-2 h-2 transform rotate-45 ${
                isUser
                  ? "right-[-4px] bg-blue-600/90"
                  : isError
                  ? "left-[-4px] bg-red-500/10 border-l border-b border-red-500/30"
                  : "left-[-4px] bg-gray-700/60"
              }`}
            />

            {/* Actions (mostrar no hover) */}
            <div
              className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                isUser ? "left-[-40px]" : "right-[-40px]"
              }`}
            >
              <div className="flex flex-col space-y-1">
                <motion.button
                  className="p-1.5 bg-gray-800/80 text-gray-300 rounded-lg hover:text-white transition-colors"
                  onClick={handleCopy}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Copiar mensagem"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </motion.button>
                
                {isError && onRetry && (
                  <motion.button
                    className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    onClick={onRetry}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Tentar novamente"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/* ESTADO VAZIO                                                               */
/* -------------------------------------------------------------------------- */
const EmptyState: React.FC = () => (
  <motion.div
    className="flex flex-col items-center justify-center h-full text-center px-6"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div
      className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center"
      animate={{
        scale: [1, 1.05, 1],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <MessageSquare className="w-10 h-10 text-blue-400" />
    </motion.div>
    
    <h3 className="text-xl font-semibold text-white mb-3">
      Bem-vindo à sua jornada
    </h3>
    
    <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
      Comece uma conversa espiritual comigo. Estou aqui para guiá-lo em sua 
      busca por crescimento e autoconhecimento.
    </p>
    
    <motion.div
      className="mt-6 text-xs text-gray-500"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      ✨ Digite sua primeira pergunta abaixo
    </motion.div>
  </motion.div>
);

/* -------------------------------------------------------------------------- */
/* INDICADOR DE LOADING                                                       */
/* -------------------------------------------------------------------------- */
const LoadingIndicator: React.FC = () => (
  <motion.div
    className="flex justify-start"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-end space-x-2">
      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
        <MessageSquare className="w-4 h-4 text-white" />
      </div>
      
      <div className="bg-gray-700/60 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-none">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="text-gray-300 text-sm ml-2">Pensando...</span>
        </div>
      </div>
    </div>
  </motion.div>
);

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL                                                        */
/* -------------------------------------------------------------------------- */
export const ConversationOrb: React.FC<ConversationOrbProps> = ({
  messages = [],
  loading = false,
  onRetry,
  onClearHistory,
  onExportHistory,
  maxMessages = 100,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, loading, autoScroll]);

  // Detectar se o usuário fez scroll manual
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
    setAutoScroll(isAtBottom);
  };

  // Limitar número de mensagens para performance
  const displayMessages = messages.slice(-maxMessages);

  if (messages.length === 0 && !loading) {
    return <EmptyState />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header com controles */}
      <div className="flex-shrink-0 p-4 border-b border-gray-600/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Conversação</h2>
            <p className="text-xs text-gray-400">
              {messages.length} mensagem{messages.length !== 1 ? "s" : ""}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {onExportHistory && messages.length > 0 && (
              <motion.button
                className="p-2 text-gray-400 hover:text-white transition-colors"
                onClick={onExportHistory}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Exportar histórico"
              >
                <Download className="w-4 h-4" />
              </motion.button>
            )}
            
            {onClearHistory && messages.length > 0 && (
              <motion.button
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                onClick={onClearHistory}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Limpar histórico"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de mensagens */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 cosmic-scrollbar"
        onScroll={handleScroll}
      >
        <AnimatePresence mode="popLayout">
          {displayMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onRetry={message.error ? onRetry : undefined}
            />
          ))}
        </AnimatePresence>

        {/* Indicador de loading */}
        {loading && <LoadingIndicator />}

        {/* Referência para auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Indicador de scroll para baixo */}
      {!autoScroll && (
        <motion.button
          className="absolute bottom-20 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg"
          onClick={() => {
            setAutoScroll(true);
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.button>
      )}
    </div>
  );
};

export default ConversationOrb;