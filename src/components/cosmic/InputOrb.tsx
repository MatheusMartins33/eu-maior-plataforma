import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* INTERFACES                                                                 */
/* -------------------------------------------------------------------------- */
export interface InputOrbProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  loading?: boolean;
  charCount?: number;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  /** Modo de voz (futuro) */
  voiceMode?: boolean;
  onVoiceToggle?: () => void;
}

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL                                                        */
/* -------------------------------------------------------------------------- */
export const InputOrb: React.FC<InputOrbProps> = ({
  value,
  onChange,
  onSend,
  onKeyDown,
  loading = false,
  charCount = 0,
  placeholder = "Ask anything",
  maxLength = 2000,
  disabled = false,
  voiceMode = false,
  onVoiceToggle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const newRows = Math.min(Math.max(Math.ceil(scrollHeight / 24), 1), 4);
      setRows(newRows);
      textarea.style.height = `${Math.min(scrollHeight, 96)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) {
        onSend();
      }
    }
    onKeyDown?.(e);
  };

  const canSend = !loading && !disabled && value.trim().length > 0;
  const isActive = isFocused || isHovered || value.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Container Principal */}
      <motion.div
        className={`relative flex items-end bg-gray-900/60 backdrop-blur-xl rounded-2xl border transition-all duration-300 ${
          isActive 
            ? 'border-blue-400/50 shadow-lg shadow-blue-500/10' 
            : 'border-gray-600/30'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          scale: isActive ? 1.02 : 1,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Área de Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            className={`w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none transition-all duration-200 ${
              rows === 1 ? 'py-4 px-6 text-lg' : 'py-4 px-6 text-base'
            }`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxLength}
            disabled={disabled || loading}
            rows={rows}
            style={{ 
              minHeight: '56px',
              maxHeight: '96px',
              lineHeight: '24px'
            }}
          />

          {/* Placeholder customizado quando vazio */}
          {!value && !isFocused && (
            <motion.div
              className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-gray-400 text-lg">
                {placeholder}
              </span>
            </motion.div>
          )}
        </div>

        {/* Controles à Direita */}
        <div className="flex items-center space-x-2 pr-3 pb-3">
          {/* Botão de Voz (se habilitado) */}
          {onVoiceToggle && (
            <motion.button
              className={`p-2 rounded-xl transition-colors ${
                voiceMode 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300'
              }`}
              onClick={onVoiceToggle}
              disabled={disabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {voiceMode ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>
          )}

          {/* Botão Enviar */}
          <motion.button
            className={`p-2 rounded-xl transition-all duration-200 ${
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
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* Glow Effect quando ativo */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </motion.div>

      {/* Informações Extras */}
      <div className="flex justify-between items-center mt-3 px-2">
        {/* Contador de Caracteres */}
        <motion.p
          className={`text-xs transition-colors ${
            charCount > maxLength * 0.9 
              ? 'text-orange-400' 
              : charCount > maxLength * 0.95 
              ? 'text-red-400' 
              : 'text-gray-500'
          }`}
          animate={{ opacity: charCount > 0 ? 1 : 0 }}
        >
          {maxLength - charCount} caracteres restantes
        </motion.p>

        {/* Dicas de Uso */}
        <motion.p 
          className="text-xs text-gray-500"
          animate={{ opacity: isFocused ? 1 : 0 }}
        >
          <span className="hidden sm:inline">Enter para enviar, </span>
          <span>Shift+Enter para nova linha</span>
        </motion.p>
      </div>

      {/* Sugestões Rápidas (quando vazio) */}
      {!value && !isFocused && (
        <motion.div
          className="mt-4 flex flex-wrap gap-2 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[
            "Como posso melhorar minha energia?",
            "Qual meu propósito de vida?",
            "Preciso de orientação espiritual",
          ].map((suggestion, index) => (
            <motion.button
              key={index}
              className="px-3 py-1.5 text-sm bg-gray-800/40 hover:bg-gray-700/60 text-gray-300 rounded-full border border-gray-600/30 transition-colors"
              onClick={() => onChange(suggestion)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Indicador de Status */}
      {loading && (
        <motion.div
          className="mt-3 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="flex space-x-1">
              <motion.div
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <span className="text-sm">IA processando...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InputOrb;