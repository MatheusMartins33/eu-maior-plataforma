/* -------------------------------------------------------------------------- */
/*  JarvisPage.tsx – Versão Refatorada com Correções de UI e Estado          */
/* -------------------------------------------------------------------------- */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/contexts/ProfileContext";
import { chatApi, ChatMessage } from "@/services/api.service";
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  Sparkles,
  X,
  Send,
  Menu,
  ChevronDown,
} from "lucide-react";
// WebhookError types removed - using api.service.ts now

// Importar sistema de responsividade
import {
  ResponsiveProvider,
  useResponsive,
  ResponsiveOrbContainer,
  ResponsiveInputContainer,
  useResponsiveAnimation,
  getResponsiveFontSize,
} from "@/components/cosmic/ResponsiveLayout";

// Importar componentes existentes
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import { CentralOrb } from "@/components/cosmic/CentralOrb";
import { OrbitalPanel } from "@/components/cosmic/OrbitalPanel";
import { UserAvatar } from "@/components/cosmic/UserAvatar";

/* -------------------------------------------------------------------------- */
/* TIPOS EXPANDIDOS PARA CONTROLE DE ESTADO                                  */
/* -------------------------------------------------------------------------- */
export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  error?: boolean;
}

// Estados expandidos para controle fino
type ExtendedAIState =
  | "idle"
  | "listening"
  | "thinking"
  | "responding"
  | "typewriting"
  | "contemplating"
  | "ready";

/* -------------------------------------------------------------------------- */
/* INPUT RESPONSIVO                                                           */
/* -------------------------------------------------------------------------- */
interface ResponsiveInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  loading: boolean;
  disabled: boolean;
  placeholder?: string;
}

const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyDown,
  loading,
  disabled,
  placeholder = "Compartilhe sua jornada espiritual..."
}) => {
  const { device } = useResponsive();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = device === 'mobile' ? 20 : 24;
      const maxRows = device === 'mobile' ? 3 : 4;
      const newRows = Math.min(Math.max(Math.ceil(scrollHeight / lineHeight), 1), maxRows);
      setRows(newRows);
      textarea.style.height = `${Math.min(scrollHeight, lineHeight * maxRows)}px`;
    }
  }, [value, device]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !disabled && value.trim()) {
        onSend();
      }
    }
    onKeyDown?.(e);
  };

  const canSend = !loading && !disabled && value.trim().length > 0;
  const isActive = isFocused || value.length > 0;
  const containerPadding = device === 'mobile' ? 'p-3' : 'p-4';
  const textSize = device === 'mobile' ? 'text-base' : 'text-lg';

  return (
    <motion.div
      className={`relative flex items-end rounded-2xl border transition-all duration-300 ${disabled
        ? 'bg-gray-800/40 border-gray-700/50 opacity-60'
        : isActive
          ? 'bg-gray-900/60 backdrop-blur-xl border-blue-400/50 shadow-lg shadow-blue-500/10'
          : 'bg-gray-900/60 backdrop-blur-xl border-gray-600/30'
        }`}
      animate={{ scale: isActive && !disabled ? 1.02 : 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          className={`w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none transition-all duration-200 ${containerPadding} ${textSize} ${disabled ? 'cursor-not-allowed' : ''
            }`}
          placeholder={disabled ? "Aguarde a resposta completar..." : placeholder}
          value={value}
          onChange={(e) => !disabled && onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={2000}
          disabled={loading || disabled}
          rows={rows}
          style={{
            minHeight: device === 'mobile' ? '44px' : '56px',
            maxHeight: device === 'mobile' ? '60px' : '96px',
            lineHeight: device === 'mobile' ? '20px' : '24px'
          }}
        />
      </div>
      <div className={`flex items-center ${device === 'mobile' ? 'pr-2 pb-2' : 'pr-3 pb-3'}`}>
        <motion.button
          className={`${device === 'mobile' ? 'p-2' : 'p-2'} rounded-xl transition-all duration-200 ${canSend
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          onClick={onSend}
          disabled={!canSend}
          whileHover={canSend ? { scale: 1.05 } : {}}
          whileTap={canSend ? { scale: 0.95 } : {}}
        >
          {loading ? (
            <Loader2 className={`${device === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
          ) : (
            <Send className={`${device === 'mobile' ? 'w-4 h-4' : 'w-5 h-5'}`} />
          )}
        </motion.button>
      </div>
      {isActive && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
      {disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gray-800/20 to-gray-900/20 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-gray-800/80 text-gray-300 px-3 py-1 rounded-full text-xs flex items-center space-x-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processando resposta...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/* CONTROLES RESPONSIVOS MELHORADOS                                          */
/* -------------------------------------------------------------------------- */
interface ResponsiveControlsProps {
  onToggleConversation: () => void;
  onToggleAstralData: () => void;
  conversationActive: boolean;
  astralDataActive: boolean;
  disabled: boolean;
}

const ResponsiveControls: React.FC<ResponsiveControlsProps> = ({
  onToggleConversation,
  onToggleAstralData,
  conversationActive,
  astralDataActive,
  disabled
}) => {
  const { device } = useResponsive();

  // Se for mobile, renderiza os controles na parte inferior central
  if (device === 'mobile') {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
        <div className={`flex space-x-3 bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/30 p-2 shadow-lg transition-opacity duration-300 ${disabled ? 'opacity-50' : 'opacity-100'
          }`}>
          {/* Botão de Conversa (Mobile) */}
          <motion.button
            className={`p-3 rounded-xl transition-colors ${conversationActive
              ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-500/25'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              } ${disabled ? 'cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onToggleConversation()}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            title={disabled ? "Aguarde a resposta" : "Conversas"}
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>

          {/* Botão de Energia Astral (Mobile) */}
          <motion.button
            className={`p-3 rounded-xl transition-colors ${astralDataActive
              ? 'bg-purple-600/80 text-white shadow-lg shadow-purple-500/25'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              } ${disabled ? 'cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onToggleAstralData()}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            title={disabled ? "Aguarde a resposta" : "Energia Astral"}
          >
            <Sparkles className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    );
  }

  // Se for Desktop ou Tablet, renderiza os controles nos cantos superiores
  return (
    <div className="relative z-50">
      {/* Botão de Conversação - Esquerda */}
      <motion.button
        className={`fixed top-6 left-6 p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${conversationActive
          ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-500/25'
          : 'bg-gradient-to-br from-blue-600/50 to-cyan-600/50 text-blue-200 border border-blue-400/30 hover:shadow-blue-500/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && onToggleConversation()}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.1, boxShadow: "0 0 20px rgba(59, 130, 246, 0.6)" } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 8px rgba(59, 130, 246, 0.3)",
            "0 0 16px rgba(59, 130, 246, 0.5)",
            "0 0 8px rgba(59, 130, 246, 0.3)"
          ]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        title={disabled ? "Aguarde a resposta" : "Conversas"}
      >
        <MessageSquare className="w-5 h-5" />
      </motion.button>

      {/* Botão de Energia Astral - Direita */}
      <motion.button
        className={`fixed top-6 right-40 p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${astralDataActive
          ? 'bg-purple-600/80 text-white shadow-lg shadow-purple-500/25'
          : 'bg-gradient-to-br from-purple-600/50 to-blue-600/50 text-purple-200 border border-purple-400/30 hover:shadow-purple-500/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && onToggleAstralData()}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.1, boxShadow: "0 0 20px rgba(147, 51, 234, 0.6)" } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 8px rgba(147, 51, 234, 0.3)",
            "0 0 16px rgba(147, 51, 234, 0.5)",
            "0 0 8px rgba(147, 51, 234, 0.3)"
          ]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        title={disabled ? "Aguarde a resposta" : "Energia Astral"}
      >
        <Sparkles className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL COM CORREÇÕES DE ESTADO E UI                         */
/* -------------------------------------------------------------------------- */
function JarvisPageContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiState, setAiState] = useState<ExtendedAIState>("idle");
  const [showConversation, setShowConversation] = useState(false);
  const [showAstralData, setShowAstralData] = useState(false);
  const [responseCompleted, setResponseCompleted] = useState(false);
  const [typewriterCompleted, setTypewriterCompleted] = useState(false);
  const { toast } = useToast();
  const { user } = useProfile();
  const { device } = useResponsive();

  // ✅ CORREÇÃO 2: Flag para evitar múltiplos carregamentos
  const messagesLoadedRef = useRef<string | null>(null);

  const getOrCreateSessionId = useCallback(() => {
    if (!user?.id) return null;
    const key = `jarvis_session_${user.id}`;
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }, [user?.id]);

  const loadMessages = useCallback((): Message[] => {
    if (!user?.id) return [];
    const key = `jarvis_messages_${user.id}`;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      return JSON.parse(stored).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    } catch {
      return [];
    }
  }, [user?.id]);

  const persistMessages = useCallback(
    (msgs: Message[]) => {
      if (!user?.id) return;
      localStorage.setItem(`jarvis_messages_${user.id}`, JSON.stringify(msgs));
    },
    [user?.id]
  );

  // ✅ CORREÇÃO 2: useEffect melhorado para carregamento do estado
  useEffect(() => {
    // Guarda de segurança: só carrega se o user.id estiver presente
    if (!user?.id) return;

    // Flag para evitar múltiplos carregamentos para o mesmo usuário
    if (messagesLoadedRef.current === user.id) return;

    getOrCreateSessionId();
    const msgs = loadMessages();
    if (msgs.length) {
      setMessages(msgs);
    }

    // Marca que já carregou para este usuário
    messagesLoadedRef.current = user.id;
  }, [user?.id, getOrCreateSessionId, loadMessages]);

  useEffect(() => {
    if (messages.length) persistMessages(messages);
  }, [messages, persistMessages]);

  const isReadingMode = aiState === "responding" || aiState === "typewriting" || aiState === "contemplating";
  const isInterfaceDisabled = aiState !== "idle" && aiState !== "ready";

  useEffect(() => {
    if (isReadingMode) {
      setShowConversation(false);
      setShowAstralData(false);
    }
  }, [isReadingMode]);

  const handleTypewriterComplete = useCallback(() => {
    setTypewriterCompleted(true);
    setAiState("contemplating");

    setTimeout(() => {
      setAiState("ready");
      setTimeout(() => {
        setAiState("idle");
        setResponseCompleted(false);
        setTypewriterCompleted(false);
      }, 3000);
    }, 2000);
  }, []);

  const createMsg = (sender: "user" | "ai", text: string, error = false): Message => ({
    id: crypto.randomUUID(),
    sender,
    text,
    timestamp: new Date(),
    error,
  });

  // Removed obsolete errorToUserMsg function

  const handleToggleConversation = useCallback(() => {
    if (isInterfaceDisabled) return;
    setShowConversation(prev => !prev);
  }, [isInterfaceDisabled]);

  const handleToggleAstralData = useCallback(() => {
    if (isInterfaceDisabled) return;
    setShowAstralData(prev => !prev);
  }, [isInterfaceDisabled]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading || !user || isInterfaceDisabled) return;
    const sid = getOrCreateSessionId();
    if (!sid) return;

    const userMsg = createMsg("user", inputText.trim());
    setMessages((p) => [...p, userMsg]);
    setInputText("");
    setIsLoading(true);
    setAiState("thinking");
    setResponseCompleted(false);
    setTypewriterCompleted(false);

    try {
      // Use new chatApi
      const profileId = user.id;
      const resp = await chatApi.sendMessage(profileId, sid, userMsg.text);
      if (resp.error || !resp.data?.message?.trim()) throw new Error(resp.error || "Invalid");

      setMessages((p) => [...p, createMsg("ai", resp.data.message)]);
      setResponseCompleted(true);
      setAiState("responding");
    } catch (e) {
      const text = e instanceof Error ? e.message : "Erro inesperado.";
      setMessages((p) => [...p, createMsg("ai", text, true)]);
      setAiState("idle");
      setResponseCompleted(false);
      setTypewriterCompleted(false);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, user, getOrCreateSessionId, isInterfaceDisabled]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isInterfaceDisabled) return;

    if (device === 'desktop') {
      if (e.key === "c" && e.ctrlKey) {
        e.preventDefault();
        handleToggleConversation();
      }
      if (e.key === "a" && e.ctrlKey) {
        e.preventDefault();
        handleToggleAstralData();
      }
    }
    if (e.key === "Escape") {
      setShowConversation(false);
      setShowAstralData(false);
    }
  }, [device, handleToggleConversation, handleToggleAstralData, isInterfaceDisabled]);

  const handleCloseConversation = useCallback(() => {
    setShowConversation(false);
  }, []);

  const handleCloseAstralData = useCallback(() => {
    setShowAstralData(false);
  }, []);

  const handleRetry = useCallback(() => {
    if (isInterfaceDisabled) return;
    const lastUser = [...messages].reverse().find((m) => m.sender === "user");
    if (lastUser) setInputText(lastUser.text);
  }, [messages, isInterfaceDisabled]);

  if (!user) return null;

  return (
    <div
      className="min-h-screen bg-black relative flex flex-col overflow-hidden"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <CosmicBackground
        intensity="low"
        starCount={device === 'mobile' ? 15 : 25}
      />

      {/* ✅ CORREÇÃO 1: Movido para cima no DOM e ajustado z-index para z-30 */}
      {aiState !== "idle" && aiState !== "ready" && (
        <motion.div
          className={`fixed ${device === 'mobile' ? 'top-24' : 'top-32'} left-1/2 -translate-x-1/2 text-white/80 ${getResponsiveFontSize(device, 'sm')} font-medium z-30`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {aiState === "thinking" && "Refletindo profundamente..."}
          {aiState === "listening" && "Ouvindo sua energia..."}
          {aiState === "responding" && "Preparando sua resposta..."}
          {aiState === "typewriting" && "✨ Foque na leitura - controles ocultos"}
          {aiState === "contemplating" && "Absorva esta sabedoria..."}
        </motion.div>
      )}

      <AnimatePresence>
        {isReadingMode && (
          <motion.div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="px-4 py-2 bg-black/80 backdrop-blur-sm border border-gray-600/30 rounded-full text-xs flex items-center space-x-2"
              style={{
                color: '#FFFFFF !important',
                textShadow: '0 1px 2px rgba(0, 0, 0, 1)',
              }}
            >
              <span>📖 Modo Leitura - Foque na mensagem</span>
              {aiState === "responding" && (
                <span className="text-gray-400">• Use "Ver Tudo" para acelerar</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isReadingMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ResponsiveControls
              onToggleConversation={handleToggleConversation}
              onToggleAstralData={handleToggleAstralData}
              conversationActive={showConversation}
              astralDataActive={showAstralData}
              disabled={isInterfaceDisabled}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isReadingMode && (
          <motion.div
            className="fixed top-6 right-6 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <UserAvatar
              user={user}
              onLogout={async () => {
                if (isInterfaceDisabled) return;
                await supabase.auth.signOut();
                toast({
                  title: "Logout realizado",
                  description: "Você foi desconectado com sucesso.",
                });
              }}
              onSettings={() => {
                if (isInterfaceDisabled) return;
                toast({
                  title: "Configurações",
                  description: "Funcionalidade em desenvolvimento.",
                });
              }}
              onProfile={() => {
                if (isInterfaceDisabled) return;
                toast({
                  title: "Perfil",
                  description: "Funcionalidade em desenvolvimento.",
                });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex items-center justify-center px-4">
        <ResponsiveOrbContainer>
          <CentralOrb
            isActive={aiState !== "idle"}
            pulseIntensity={isLoading ? 1 : 0.3}
            cosmicEnergy={{}}
            messages={messages.map(({ id, text }) => ({ id, text }))}
            aiState={aiState === "ready" ? "idle" :
              (aiState === "typewriting" || aiState === "contemplating") ? "responding" : aiState}
            isLoading={isLoading}
            onTypewriterComplete={handleTypewriterComplete}
          />
        </ResponsiveOrbContainer>

        {aiState === "ready" && (
          <motion.div
            className={`absolute ${device === 'mobile' ? 'mt-32' : 'mt-48'} text-white/90 ${getResponsiveFontSize(device, 'sm')} font-medium`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center space-x-3 bg-green-500/20 border border-green-500/40 px-6 py-3 rounded-full backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-green-400" />
              <span>Interface liberada - Pronto para nova jornada ✨</span>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {!isReadingMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ResponsiveInputContainer>
              <ResponsiveInput
                value={inputText}
                onChange={setInputText}
                onSend={handleSend}
                onKeyDown={onKeyDown}
                loading={isLoading}
                disabled={isInterfaceDisabled}
                placeholder={device === 'mobile' ? "Sua jornada..." : "Compartilhe sua jornada espiritual..."}
              />
            </ResponsiveInputContainer>
          </motion.div>
        )}
      </AnimatePresence>

      <OrbitalPanel
        position="left"
        content="conversations"
        isExpanded={showConversation && !isReadingMode}
        onClose={handleCloseConversation}
        conversationProps={{ messages, loading: isLoading, onRetry: handleRetry }}
      />

      <OrbitalPanel
        position="right"
        content="astral-data"
        isExpanded={showAstralData && !isReadingMode}
        onClose={handleCloseAstralData}
      />
    </div>
  );
}

export default function JarvisPage() {
  return (
    <ResponsiveProvider>
      <JarvisPageContent />
    </ResponsiveProvider>
  );
}