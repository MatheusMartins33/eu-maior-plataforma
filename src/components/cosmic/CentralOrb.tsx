import React from "react";
import { motion } from "framer-motion";
import { AIResponseDisplay } from "./AIResponseDisplay"; // Importar o novo componente

/* -------------------------------------------------------------------------- */
/* TIPAGEM EXPANDIDA                                                          */
/* -------------------------------------------------------------------------- */
export interface CentralOrbProps {
  /** IA está "pensando" ou "falando" ?  */
  isActive: boolean;
  /** 0 – 1 → intensidade do pulso dos anéis */
  pulseIntensity: number;
  /** Dados astrais futuros (chakra, planetas, etc.) */
  cosmicEnergy: unknown;
  /** Últimas mensagens (exibimos só a mais recente) */
  messages: { id: string; text: string }[];
  /** Estado atual da IA */
  aiState?: "idle" | "listening" | "thinking" | "responding";
  /** Loading state */
  isLoading?: boolean;
  /** ✅ NOVO: Callback quando typewriter completa */
  onTypewriterComplete?: () => void;
}

/* -------------------------------------------------------------------------- */
/* ANÉIS CÓSMICOS REALISTAS                                                   */
/* -------------------------------------------------------------------------- */
const CosmicRings: React.FC<{ 
  intensity: number; 
  isActive: boolean;
  aiState?: string;
}> = ({ intensity, isActive, aiState }) => {
  // Cores baseadas no estado da IA
  const getStateColors = () => {
    switch (aiState) {
      case "listening":
        return {
          primary: "rgba(34, 197, 94, 0.6)", // Verde
          secondary: "rgba(34, 197, 94, 0.3)",
          glow: "0 0 30px rgba(34, 197, 94, 0.4)"
        };
      case "thinking":
        return {
          primary: "rgba(59, 130, 246, 0.7)", // Azul
          secondary: "rgba(59, 130, 246, 0.4)",
          glow: "0 0 40px rgba(59, 130, 246, 0.5)"
        };
      case "responding":
        return {
          primary: "rgba(147, 51, 234, 0.7)", // Roxo
          secondary: "rgba(147, 51, 234, 0.4)",
          glow: "0 0 35px rgba(147, 51, 234, 0.5)"
        };
      default:
        return {
          primary: "rgba(56, 189, 248, 0.5)", // Azul claro padrão
          secondary: "rgba(56, 189, 248, 0.3)",
          glow: "0 0 25px rgba(56, 189, 248, 0.3)"
        };
    }
  };

  const colors = getStateColors();

  return (
    <>
      {/* Anel Principal - Mais dinâmico */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: colors.primary,
          boxShadow: colors.glow,
        }}
        animate={{
          scale: isActive ? [1, 1.08, 1] : [1, 1.03, 1],
          opacity: [0.6 + intensity * 0.4, 1, 0.6 + intensity * 0.4],
          rotate: isActive ? 360 : 180,
        }}
        transition={{
          scale: { duration: isActive ? 1.2 : 2.5, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: isActive ? 8 : 20, repeat: Infinity, ease: "linear" },
        }}
      />

      {/* Anel Secundário - Rotação independente */}
      <motion.div
        className="absolute inset-4 rounded-full border"
        style={{
          borderColor: colors.secondary,
          boxShadow: `0 0 20px ${colors.secondary}`,
        }}
        animate={{
          scale: isActive ? [1, 1.12, 1] : [1, 1.05, 1],
          opacity: [0.4, 0.9, 0.4],
          rotate: isActive ? -360 : -180,
        }}
        transition={{
          scale: { duration: 2.3, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: isActive ? 6 : 15, repeat: Infinity, ease: "linear" },
        }}
      />

      {/* Anel Interno - Pulso rápido */}
      <motion.div
        className="absolute inset-8 rounded-full border"
        style={{
          borderColor: colors.primary,
          opacity: 0.4,
        }}
        animate={{
          rotate: isActive ? 360 : 180,
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          rotate: { duration: isActive ? 4 : 10, repeat: Infinity, ease: "linear" },
          scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Pulsos de energia quando ativo */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: colors.primary,
          }}
          animate={{
            scale: [1, 1.3, 1.6],
            opacity: [0.8, 0.4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* GEOMETRIA SAGRADA APRIMORADA                                               */
/* -------------------------------------------------------------------------- */
const SacredGeometry: React.FC<{
  pattern: "flower-of-life" | string;
  astralInfluence: unknown;
  isActive: boolean;
  intensity: number;
  aiState?: string;
}> = ({ isActive, intensity, aiState }) => {
  // Cores dinâmicas baseadas no estado
  const getGeometryColor = () => {
    switch (aiState) {
      case "listening": return "rgba(34, 197, 94, 0.3)";
      case "thinking": return "rgba(59, 130, 246, 0.4)";
      case "responding": return "rgba(147, 51, 234, 0.4)";
      default: return "rgba(59, 130, 246, 0.3)";
    }
  };

  const geometryColor = getGeometryColor();

  return (
    <>
      {/* Círculo Central Principal */}
      <motion.div
        className="absolute inset-16 rounded-full"
        style={{
          background: `radial-gradient(circle, 
            ${geometryColor} 0%, 
            transparent 70%
          )`,
          boxShadow: `inset 0 0 ${40 + intensity * 30}px ${geometryColor}`,
        }}
        animate={{
          scale: isActive ? [1, 1.15, 1] : [1, 1.08, 1],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Padrão Hexagonal Dinâmico */}
      <div className="absolute inset-20 flex items-center justify-center">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: geometryColor,
              transform: `rotate(${i * 60}deg) translateY(-45px)`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.4, 0.8],
              rotate: isActive ? 360 : 180,
            }}
            transition={{
              opacity: { duration: 2.5, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 2.2, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 12, repeat: Infinity, ease: "linear" },
            }}
          />
        ))}
      </div>

      {/* Núcleo Central Pulsante */}
      <motion.div
        className="absolute inset-28 rounded-full border-2"
        style={{
          borderColor: geometryColor,
          background: `radial-gradient(circle, ${geometryColor} 0%, transparent 60%)`,
        }}
        animate={{
          rotate: isActive ? 360 : 180,
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          rotate: { duration: 15, repeat: Infinity, ease: "linear" },
          scale: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      {/* Partículas orbitais */}
      {isActive && [...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: geometryColor,
            left: "50%",
            top: "50%",
          }}
          animate={{
            x: Math.cos(i * 45 * Math.PI / 180) * 80,
            y: Math.sin(i * 45 * Math.PI / 180) * 80,
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 3,
            delay: i * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL COM CALLBACK                                          */
/* -------------------------------------------------------------------------- */
export const CentralOrb: React.FC<CentralOrbProps> = ({
  isActive,
  pulseIntensity,
  cosmicEnergy,
  messages,
  aiState = "idle",
  isLoading = false,
  onTypewriterComplete, // ✅ NOVO: recebe callback
}) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Container do Orbe - Maior e mais imponente */}
      <motion.div
        className="relative w-96 h-96 md:w-[28rem] md:h-[28rem]"
        animate={{
          scale: isActive ? [1, 1.03, 1] : 1,
        }}
        transition={{
          scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        {/* Anéis cósmicos */}
        <CosmicRings 
          intensity={pulseIntensity} 
          isActive={isActive} 
          aiState={aiState}
        />

        {/* Geometria sagrada */}
        <SacredGeometry 
          pattern="flower-of-life" 
          astralInfluence={cosmicEnergy}
          isActive={isActive}
          intensity={pulseIntensity}
          aiState={aiState}
        />

        {/* Glow Effect Central Dinâmico */}
        <motion.div
          className="absolute inset-24 rounded-full"
          style={{
            background: `radial-gradient(circle, 
              ${aiState === "thinking" ? "rgba(59, 130, 246, 0.4)" : 
                aiState === "responding" ? "rgba(147, 51, 234, 0.4)" :
                aiState === "listening" ? "rgba(34, 197, 94, 0.4)" :
                "rgba(56, 189, 248, 0.3)"} 0%, 
              transparent 70%
            )`,
            filter: "blur(2px)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* ✅ Display de resposta da IA com callback */}
        <AIResponseDisplay 
          messages={messages} 
          aiState={aiState}
          isLoading={isLoading}
          onTypewriterComplete={onTypewriterComplete} // ✅ REPASSA o callback
        />
      </motion.div>

      {/* Campo de Energia Ambiente */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-blue-400/60"
              style={{
                left: "50%",
                top: "50%",
              }}
              animate={{
                x: [0, Math.cos(i * 30 * Math.PI / 180) * 200],
                y: [0, Math.sin(i * 30 * Math.PI / 180) * 200],
                opacity: [0, 0.8, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 4,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Ondas de energia quando mudando de estado */}
      {(aiState === "thinking" || aiState === "responding") && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.5, opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-full h-full rounded-full border border-blue-400/30" />
        </motion.div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORT                                                             */
/* -------------------------------------------------------------------------- */
export default CentralOrb;