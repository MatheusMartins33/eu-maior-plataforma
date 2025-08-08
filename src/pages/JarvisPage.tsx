/* -------------------------------------------------------------------------- */
/*  JarvisPage.tsx – Versão Sincronizada com Controle de Estado Perfeito     */
/* -------------------------------------------------------------------------- */

import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/contexts/ProfileContext";
import { sendMessage, generateSessionId } from "@/services/n8nWebhook";
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
import type { WebhookError } from "@/types/webhook";
import { WebhookErrorType } from "@/types/webhook";

// Importar sistema de responsividade
import { 
  ResponsiveProvider,
  useResponsive,
  ResponsiveOrbContainer,
  ResponsiveInputContainer,
  ResponsiveFloatingControls,
  useResponsivePanelClasses,
  useResponsiveAnimation,
  getResponsiveFontSize,
  getResponsiveSpacing,
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
  disabled: boolean; // ✅ NOVO: controle de desabilitação
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
  const { device, layoutMode } = useResponsive();
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  // Auto-resize textarea
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

  // Responsive classes
  const containerPadding = device === 'mobile' ? 'p-3' : device === 'tablet' ? 'p-4' : 'p-4';
  const textSize = device === 'mobile' ? 'text-base' : 'text-lg';

  return (
    <motion.div
      className={`relative flex items-end rounded-2xl border transition-all duration-300 ${
        disabled 
          ? 'bg-gray-800/40 border-gray-700/50 opacity-60' 
          : isActive 
          ? 'bg-gray-900/60 backdrop-blur-xl border-blue-400/50 shadow-lg shadow-blue-500/10' 
          : 'bg-gray-900/60 backdrop-blur-xl border-gray-600/30'
      }`}
      animate={{
        scale: isActive && !disabled ? 1.02 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Área de Input */}
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          className={`w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none transition-all duration-200 ${containerPadding} ${textSize} ${
            disabled ? 'cursor-not-allowed' : ''
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

      {/* Botão Enviar */}
      <div className={`flex items-center ${device === 'mobile' ? 'pr-2 pb-2' : 'pr-3 pb-3'}`}>
        <motion.button
          className={`${device === 'mobile' ? 'p-2' : 'p-2'} rounded-xl transition-all duration-200 ${
            canSend
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

      {/* Glow Effect quando ativo */}
      {isActive && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Indicador de Estado Bloqueado */}
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
  disabled: boolean; // ✅ NOVO: controle de desabilitação
}

const ResponsiveControls: React.FC<ResponsiveControlsProps> = ({
  onToggleConversation,
  onToggleAstralData,
  conversationActive,
  astralDataActive,
  disabled
}) => {
  const { device, layoutMode } = useResponsive();

  // Mobile: Menu drawer na parte inferior
  if (device === 'mobile') {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <div className={`flex space-x-3 bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/30 p-2 shadow-lg transition-opacity duration-300 ${
          disabled ? 'opacity-50' : 'opacity-100'
        }`}>
          <motion.button
            className={`p-3 rounded-xl transition-colors ${
              conversationActive 
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
          
          <motion.button
            className={`p-3 rounded-xl transition-colors ${
              astralDataActive 
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

  // Desktop/Tablet: Controles nos cantos
  return (
    <>
      {/* Botão de Conversação - Esquerda */}
      <motion.button
        className={`fixed top-6 left-6 p-3 rounded-full backdrop-blur-sm transition-colors z-40 ${
          conversationActive 
            ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-500/25' 
            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && onToggleConversation()}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        title={disabled ? "Aguarde a resposta" : "Conversas"}
      >
        <MessageSquare className="w-5 h-5" />
      </motion.button>

      {/* Dados astrais - Direita */}
      <motion.button
        className={`fixed top-6 right-20 p-3 rounded-full backdrop-blur-sm transition-colors z-40 ${
          astralDataActive 
            ? 'bg-purple-600/80 text-white shadow-lg shadow-purple-500/25' 
            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && onToggleAstralData()}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        title={disabled ? "Aguarde a resposta" : "Energia Astral"}
      >
        <Sparkles className="w-5 h-5" />
      </motion.button>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* PAINEL RESPONSIVO (sem alterações)                                        */
/* -------------------------------------------------------------------------- */
interface ResponsivePanelProps {
  position: "left" | "right" | "bottom" | "center";
  content: "conversations" | "astral-data";
  isVisible: boolean;
  onClose: () => void;
  conversationProps?: any;
  astralProps?: any;
}

const ResponsivePanel: React.FC<ResponsivePanelProps> = ({
  position,
  content,
  isVisible,
  onClose,
  conversationProps,
  astralProps
}) => {
  const { device, layoutMode } = useResponsive();
  const animation = useResponsiveAnimation();
  const panelClasses = useResponsivePanelClasses(position);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-45 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        className={panelClasses}
        initial={
          layoutMode === 'stack' 
            ? { y: '100%' }
            : position === 'left' 
            ? { x: -400 } 
            : { x: 400 }
        }
        animate={
          layoutMode === 'stack'
            ? { y: 0 }
            : { x: 0 }
        }
        exit={
          layoutMode === 'stack'
            ? { y: '100%' }
            : position === 'left'
            ? { x: -400 }
            : { x: 400 }
        }
        transition={animation.springConfig}
      >
        <OrbitalPanel
          position={position}
          content={content}
          conversationProps={conversationProps}
          astralProps={astralProps}
          isExpanded={true}
        />
        
        <button
          className={`absolute ${
            layoutMode === 'stack' ? 'top-4 right-4' : 
            position === 'left' ? 'top-4 right-4' : 'top-4 left-4'
          } p-2 text-gray-400 hover:text-white z-10 bg-gray-900/50 rounded-full backdrop-blur-sm transition-colors`}
          onClick={onClose}
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL COM SINCRONIZAÇÃO PERFEITA                           */
/* -------------------------------------------------------------------------- */
function JarvisPageContent() {
  /* --------------------------- Estados principais ------------------------- */
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiState, setAiState] = useState<ExtendedAIState>("idle");
  
  // Estados dos overlays
  const [showConversation, setShowConversation] = useState(false);
  const [showAstralData, setShowAstralData] = useState(false);

  // ✅ NOVO: Estados de sincronização
  const [responseCompleted, setResponseCompleted] = useState(false);
  const [typewriterCompleted, setTypewriterCompleted] = useState(false);

  const { toast } = useToast();
  const { user, profile } = useProfile();
  const { device, layoutMode } = useResponsive();

  /* --------------------------- Lógica existente --------------------------- */
  const getOrCreateSessionId = useCallback(() => {
    if (!user?.id) return null;
    const key = `jarvis_session_${user.id}`;
    let id = localStorage.getItem(key);
    if (!id) {
      id = generateSessionId();
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

  useEffect(() => {
    if (user?.id) {
      getOrCreateSessionId();
      const msgs = loadMessages();
      if (msgs.length) setMessages(msgs);
    }
  }, [user?.id, getOrCreateSessionId, loadMessages]);

  useEffect(() => {
    if (messages.length) persistMessages(messages);
  }, [messages, persistMessages]);

  /* ✅ NOVA LÓGICA: Sincronização de Estados */
  
  // ✅ Determinar se interface deve estar limpa (sem distrações)
  const isReadingMode = aiState === "responding" || aiState === "typewriting" || aiState === "contemplating";
  const isInterfaceDisabled = aiState !== "idle" && aiState !== "ready";
  
  // ✅ Fechar painéis automaticamente quando entrar no modo de leitura
  useEffect(() => {
    if (isReadingMode) {
      setShowConversation(false);
      setShowAstralData(false);
    }
  }, [isReadingMode]);
  
  // Callback quando typewriter completa
  const handleTypewriterComplete = useCallback(() => {
    setTypewriterCompleted(true);
    setAiState("contemplating");
    
    // Pausa contemplativa antes de liberar interação
    setTimeout(() => {
      setAiState("ready");
      
      // Mais um momento antes de voltar ao idle
      setTimeout(() => {
        setAiState("idle");
        setResponseCompleted(false);
        setTypewriterCompleted(false);
      }, 3000);
    }, 2000);
  }, []);

  /* --------------------------- Handlers ----------------------------------- */
  const createMsg = (sender: "user" | "ai", text: string, error = false): Message => ({
    id: crypto.randomUUID(),
    sender,
    text,
    timestamp: new Date(),
    error,
  });

  const errorToUserMsg = (e: WebhookError): string => {
    switch (e.type) {
      case WebhookErrorType.NETWORK_ERROR:
        return "Erro de conexão. Verifique sua internet.";
      case WebhookErrorType.TIMEOUT_ERROR:
        return "Resposta demorando…";
      default:
        return "Problema na comunicação.";
    }
  };

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
      const resp = await sendMessage(userMsg.text, user);
      if (!resp.success || !resp.reply?.trim()) throw new Error("Invalid");
      
      setMessages((p) => [...p, createMsg("ai", resp.reply)]);
      setResponseCompleted(true);
      setAiState("responding");
      
    } catch (e) {
      const text = e && typeof e === "object" && "type" in e
        ? errorToUserMsg(e as WebhookError)
        : "Erro inesperado.";
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
    
    // Hotkeys apenas para desktop
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

  /* ----------------------------- RENDER ----------------------------------- */
  return (
    <div 
      className="min-h-screen bg-black relative flex flex-col overflow-hidden"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Background minimalista */}
      <CosmicBackground 
        intensity="low" 
        starCount={device === 'mobile' ? 15 : 25} 
      />

      {/* Indicador de modo de leitura */}
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

      {/* Avatar do usuário - OCULTO durante leitura */}
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

      {/* Orbe central - responsivo */}
      <div className="flex-1 flex items-center justify-center px-4">
        <ResponsiveOrbContainer>
          <CentralOrb
            isActive={aiState !== "idle"}
            pulseIntensity={isLoading ? 1 : 0.3}
            cosmicEnergy={{}}
            messages={messages.map(({ id, text }) => ({ id, text }))}
            aiState={aiState === "ready" ? "idle" : 
                   (aiState === "typewriting" || aiState === "contemplating") ? "responding" : aiState} // ✅ Mapear estado interno para compatibilidade
            isLoading={isLoading}
            onTypewriterComplete={handleTypewriterComplete} // ✅ NOVO: callback
          />
        </ResponsiveOrbContainer>
        
        {/* Estado atual sobreposto */}
        {aiState !== "idle" && aiState !== "ready" && (
          <motion.div
            className={`absolute ${device === 'mobile' ? 'mt-32' : 'mt-48'} text-white/80 ${getResponsiveFontSize(device, 'sm')} font-medium`}
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

        {/* Indicador de retorno da interface */}
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

      {/* Input responsivo - OCULTO durante leitura para foco total */}
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

      {/* Painéis responsivos - BLOQUEADOS durante leitura */}
      <AnimatePresence>
        {showConversation && !isReadingMode && (
          <ResponsivePanel
            position="left"
            content="conversations"
            isVisible={showConversation}
            onClose={handleCloseConversation}
            conversationProps={{ messages, loading: isLoading, onRetry: handleRetry }}
          />
        )}

        {showAstralData && !isReadingMode && (
          <ResponsivePanel
            position="right"
            content="astral-data"
            isVisible={showAstralData}
            onClose={handleCloseAstralData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* WRAPPER COM PROVIDER                                                       */
/* -------------------------------------------------------------------------- */
export default function JarvisPage() {
  return (
    <ResponsiveProvider>
      <JarvisPageContent />
    </ResponsiveProvider>
  );
}