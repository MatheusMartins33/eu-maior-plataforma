// src/components/cosmic/helpers.ts

import { Message } from "./ConversationOrb";

/* -------------------------------------------------------------------------- */
/* POSICIONAMENTO E LAYOUT                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Retorna classes de posicionamento para overlays
 * Adaptado para o novo sistema de overlays laterais
 */
export function getOverlayClasses(
  position: "left" | "right" | "bottom" | "center",
  variant: "sidebar" | "modal" | "inline" = "sidebar"
): string {
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
}

/**
 * Classes de posicionamento para painéis (legacy - mantido para compatibilidade)
 */
export function getPositionClasses(
  position: "left" | "right" | "bottom"
): string {
  switch (position) {
    case "left":
      return "left-4 top-1/2 -translate-y-1/2 w-72";
    case "right":
      return "right-4 top-1/2 -translate-y-1/2 w-72";
    case "bottom":
      return "bottom-4 left-1/2 -translate-x-1/2 w-[28rem]";
    default:
      return "";
  }
}

/**
 * Retorna variantes de animação baseadas na posição
 */
export function getAnimationVariants(position: "left" | "right" | "bottom" | "center") {
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
}

/* -------------------------------------------------------------------------- */
/* GERENCIAMENTO DE ESTADO E SESSÕES                                          */
/* -------------------------------------------------------------------------- */

/**
 * Gera um ID único para sessões
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Salva mensagens no localStorage com compressão
 */
export function saveMessages(userId: string, messages: Message[]): void {
  if (!userId) return;
  
  try {
    const key = `jarvis_messages_${userId}`;
    const compressed = JSON.stringify(messages);
    localStorage.setItem(key, compressed);
  } catch (error) {
    console.error("Error saving messages:", error);
  }
}

/**
 * Carrega mensagens do localStorage
 */
export function loadMessages(userId: string): Message[] {
  if (!userId) return [];
  
  try {
    const key = `jarvis_messages_${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch (error) {
    console.error("Error loading messages:", error);
    return [];
  }
}

/**
 * Limpa mensagens antigas (mantém apenas as últimas N)
 */
export function cleanupOldMessages(userId: string, maxMessages: number = 1000): void {
  const messages = loadMessages(userId);
  if (messages.length > maxMessages) {
    const trimmed = messages.slice(-maxMessages);
    saveMessages(userId, trimmed);
  }
}

/* -------------------------------------------------------------------------- */
/* UTILITÁRIOS DE ENERGIA E CHAKRAS                                           */
/* -------------------------------------------------------------------------- */

/**
 * Calcula níveis de energia baseado em atividade do usuário
 */
export function calculateEnergyLevels(messages: Message[]): {
  balance: number;
  vibration: number;
  clarity: number;
} {
  if (messages.length === 0) {
    return { balance: 50, vibration: 50, clarity: 50 };
  }

  const recentMessages = messages.slice(-10);
  const userMessages = recentMessages.filter(m => m.sender === "user");
  const aiMessages = recentMessages.filter(m => m.sender === "ai" && !m.error);
  
  // Algoritmo simples baseado na atividade
  const balance = Math.min(95, 40 + (aiMessages.length * 8));
  const vibration = Math.min(90, 30 + (userMessages.length * 12));
  const clarity = Math.min(100, 20 + (recentMessages.length * 6));
  
  return { balance, vibration, clarity };
}

/**
 * Obtém cor baseada no nível de energia
 */
export function getEnergyColor(level: number): string {
  if (level >= 80) return "from-green-500 to-emerald-500";
  if (level >= 60) return "from-blue-500 to-cyan-500";
  if (level >= 40) return "from-yellow-500 to-orange-500";
  return "from-red-500 to-rose-500";
}

/**
 * Gera conselho astral baseado nos níveis de energia
 */
export function generateAstralAdvice(energyLevels: {
  balance: number;
  vibration: number;
  clarity: number;
}): string {
  const { balance, vibration, clarity } = energyLevels;
  const average = (balance + vibration + clarity) / 3;

  if (average >= 80) {
    return "Suas energias estão em perfeita harmonia. Este é um momento ideal para manifestação e crescimento espiritual.";
  } else if (average >= 60) {
    return "Você está em um bom caminho energético. Continue praticando meditação para elevar ainda mais sua vibração.";
  } else if (average >= 40) {
    return "Suas energias precisam de atenção. Considere práticas de respiração e conexão com a natureza.";
  } else {
    return "É hora de renovar suas energias. Dedique tempo ao autoconhecimento e práticas de purificação energética.";
  }
}

/* -------------------------------------------------------------------------- */
/* UTILITÁRIOS DE UI E INTERAÇÃO                                             */
/* -------------------------------------------------------------------------- */

/**
 * Debounce para otimizar performance
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

/**
 * Formata timestamp para exibição
 */
export function formatTimestamp(date: Date, format: "time" | "full" | "relative" = "time"): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  switch (format) {
    case "time":
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    case "full":
      return date.toLocaleString();
    
    case "relative":
      if (diff < 60000) return "agora";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
      return `${Math.floor(diff / 86400000)}d atrás`;
    
    default:
      return date.toLocaleTimeString();
  }
}

/**
 * Copia texto para clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy text:", error);
    return false;
  }
}

/**
 * Exporta histórico de conversas
 */
export function exportConversationHistory(messages: Message[], format: "txt" | "json" = "txt"): void {
  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === "json") {
    content = JSON.stringify(messages, null, 2);
    filename = `jarvis_conversation_${new Date().toISOString().split('T')[0]}.json`;
    mimeType = "application/json";
  } else {
    content = messages
      .map(m => `[${formatTimestamp(m.timestamp, "full")}] ${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n\n");
    filename = `jarvis_conversation_${new Date().toISOString().split('T')[0]}.txt`;
    mimeType = "text/plain";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------- */
/* DETECÇÃO DE DISPOSITIVO E RESPONSIVIDADE                                   */
/* -------------------------------------------------------------------------- */

/**
 * Detecta se é dispositivo móvel
 */
export function isMobileDevice(): boolean {
  return window.innerWidth < 768;
}

/**
 * Detecta se suporta hover
 */
export function supportsHover(): boolean {
  return window.matchMedia("(hover: hover)").matches;
}

/**
 * Obtém tamanho de painel baseado no dispositivo
 */
export function getResponsivePanelSize(): "compact" | "normal" | "expanded" {
  const width = window.innerWidth;
  if (width < 640) return "compact";
  if (width < 1024) return "normal";
  return "expanded";
}

/* -------------------------------------------------------------------------- */
/* VALIDAÇÃO E SANITIZAÇÃO                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Valida e sanitiza input do usuário
 */
export function sanitizeInput(input: string, maxLength: number = 2000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ""); // Remove caracteres perigosos básicos
}

/**
 * Valida se uma mensagem é válida
 */
export function isValidMessage(text: string): boolean {
  return text.trim().length > 0 && text.trim().length <= 2000;
}

/* -------------------------------------------------------------------------- */
/* CONFIGURAÇÕES E CONSTANTES                                                 */
/* -------------------------------------------------------------------------- */

export const COSMIC_CONSTANTS = {
  MAX_MESSAGES: 1000,
  MAX_INPUT_LENGTH: 2000,
  AUTO_SAVE_INTERVAL: 30000, // 30 segundos
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  ENERGY_UPDATE_INTERVAL: 60000, // 1 minuto
} as const;

export const CHAKRA_COLORS = [
  "from-red-500 to-red-600",      // Raiz
  "from-orange-500 to-orange-600", // Sacral
  "from-yellow-500 to-yellow-600", // Solar
  "from-green-500 to-green-600",   // Cardíaco
  "from-blue-500 to-blue-600",     // Laríngeo
  "from-indigo-500 to-indigo-600", // Frontal
  "from-purple-500 to-purple-600", // Coronário
] as const;

export const AI_STATES = {
  IDLE: "idle",
  LISTENING: "listening", 
  THINKING: "thinking",
  RESPONDING: "responding",
} as const;

export type AIState = typeof AI_STATES[keyof typeof AI_STATES];