import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Sun, Moon, Star } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* INTERFACES & TIPOS                                                         */
/* -------------------------------------------------------------------------- */
interface ChakraData {
  name: string;
  color: string;
  glowColor: string;
  energy: number; // 0-100
  description: string;
  element: string;
}

interface AstralDataOrbProps {
  /** Dados energéticos personalizados */
  energyData?: {
    balance: number;
    vibration: number;
    clarity: number;
  };
  /** Mostrar detalhes expandidos */
  showDetails?: boolean;
  /** Tamanho da visualização */
  size?: "compact" | "normal" | "expanded";
}

/* -------------------------------------------------------------------------- */
/* DADOS DOS CHAKRAS                                                          */
/* -------------------------------------------------------------------------- */
const chakrasData: ChakraData[] = [
  {
    name: "Raiz",
    color: "from-red-500 to-red-600",
    glowColor: "rgba(239, 68, 68, 0.5)",
    energy: 75,
    description: "Segurança e estabilidade",
    element: "Terra",
  },
  {
    name: "Sacral",
    color: "from-orange-500 to-orange-600",
    glowColor: "rgba(249, 115, 22, 0.5)",
    energy: 68,
    description: "Criatividade e sexualidade",
    element: "Água",
  },
  {
    name: "Solar",
    color: "from-yellow-500 to-yellow-600",
    glowColor: "rgba(234, 179, 8, 0.5)",
    energy: 82,
    description: "Poder pessoal e confiança",
    element: "Fogo",
  },
  {
    name: "Cardíaco",
    color: "from-green-500 to-green-600",
    glowColor: "rgba(34, 197, 94, 0.5)",
    energy: 90,
    description: "Amor e compaixão",
    element: "Ar",
  },
  {
    name: "Laríngeo",
    color: "from-blue-500 to-blue-600",
    glowColor: "rgba(59, 130, 246, 0.5)",
    energy: 72,
    description: "Comunicação e verdade",
    element: "Som",
  },
  {
    name: "Frontal",
    color: "from-indigo-500 to-indigo-600",
    glowColor: "rgba(99, 102, 241, 0.5)",
    energy: 65,
    description: "Intuição e sabedoria",
    element: "Luz",
  },
  {
    name: "Coronário",
    color: "from-purple-500 to-purple-600",
    glowColor: "rgba(147, 51, 234, 0.5)",
    energy: 78,
    description: "Espiritualidade e conexão",
    element: "Pensamento",
  },
];

/* -------------------------------------------------------------------------- */
/* COMPONENTE CHAKRA INDIVIDUAL                                               */
/* -------------------------------------------------------------------------- */
const ChakraIndicator: React.FC<{
  chakra: ChakraData;
  index: number;
  size: "compact" | "normal" | "expanded";
  isHovered: boolean;
  onHover: (index: number | null) => void;
}> = ({ chakra, index, size, isHovered, onHover }) => {
  const sizes = {
    compact: "w-4 h-4",
    normal: "w-6 h-6",
    expanded: "w-8 h-8",
  };

  return (
    <motion.div
      className="relative group"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      whileHover={{ scale: 1.2 }}
    >
      {/* Chakra Circle */}
      <motion.div
        className={`${sizes[size]} rounded-full bg-gradient-to-br ${chakra.color} cursor-pointer relative overflow-hidden`}
        animate={{
          scale: isHovered ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
          boxShadow: [
            `0 0 10px ${chakra.glowColor}`,
            `0 0 20px ${chakra.glowColor}`,
            `0 0 10px ${chakra.glowColor}`,
          ],
        }}
        transition={{
          duration: 2 + index * 0.1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.2,
        }}
      >
        {/* Energy Level Indicator */}
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: chakra.energy / 100 }}
          transition={{ duration: 1, delay: index * 0.1 }}
        />

        {/* Pulse Effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/30"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.3,
          }}
        />
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && size !== "compact" && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 border border-gray-600/30 min-w-max">
              <div className="font-medium text-center">{chakra.name}</div>
              <div className="text-gray-300 text-center">{chakra.energy}%</div>
              <div className="text-gray-400 text-center text-[10px] mt-1">
                {chakra.description}
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/95 border-r border-b border-gray-600/30 transform rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/* BARRAS DE ENERGIA                                                          */
/* -------------------------------------------------------------------------- */
const EnergyBars: React.FC<{
  energyData: { balance: number; vibration: number; clarity: number };
}> = ({ energyData }) => {
  const energyTypes = [
    { name: "Equilíbrio", value: energyData.balance, color: "from-blue-500 to-purple-500" },
    { name: "Vibração", value: energyData.vibration, color: "from-green-500 to-blue-500" },
    { name: "Clareza", value: energyData.clarity, color: "from-purple-500 to-pink-500" },
  ];

  return (
    <div className="space-y-4">
      {energyTypes.map((energy, index) => (
        <div key={energy.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm font-medium">{energy.name}</span>
            <span className="text-gray-400 text-xs">{energy.value}%</span>
          </div>
          <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${energy.color} relative`}
              initial={{ width: 0 }}
              animate={{ width: `${energy.value}%` }}
              transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: [-100, 200] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
              />
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* FASES LUNARES                                                              */
/* -------------------------------------------------------------------------- */
const LunarPhase: React.FC = () => {
  const [currentPhase] = useState("Lua Crescente");
  
  const phaseIcon = {
    "Lua Nova": <div className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600" />,
    "Lua Crescente": <Moon className="w-6 h-6 text-blue-300" />,
    "Lua Cheia": <div className="w-6 h-6 rounded-full bg-blue-200" />,
    "Lua Minguante": <Moon className="w-6 h-6 text-gray-400 transform scale-x-[-1]" />,
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-xl">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {phaseIcon[currentPhase as keyof typeof phaseIcon]}
      </motion.div>
      <div>
        <p className="text-white text-sm font-medium">{currentPhase}</p>
        <p className="text-gray-400 text-xs">Momento ideal para reflexão</p>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL                                                        */
/* -------------------------------------------------------------------------- */
export const AstralDataOrb: React.FC<AstralDataOrbProps> = ({
  energyData = { balance: 75, vibration: 68, clarity: 82 },
  showDetails = true,
  size = "normal",
}) => {
  const [hoveredChakra, setHoveredChakra] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (size === "compact") {
    return (
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="grid grid-cols-7 gap-1">
            {chakrasData.map((chakra, index) => (
              <ChakraIndicator
                key={chakra.name}
                chakra={chakra}
                index={index}
                size={size}
                isHovered={hoveredChakra === index}
                onHover={setHoveredChakra}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="text-center">
        <motion.h3
          className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="inline w-5 h-5 mr-2 text-blue-400" />
          Energia Astral
        </motion.h3>
        <p className="text-gray-400 text-sm mt-1">
          {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Chakras */}
      <div className="space-y-4">
        <h4 className="text-white font-medium text-center">Chakras</h4>
        <div className="flex justify-center">
          <div className="grid grid-cols-7 gap-3">
            {chakrasData.map((chakra, index) => (
              <ChakraIndicator
                key={chakra.name}
                chakra={chakra}
                index={index}
                size={size}
                isHovered={hoveredChakra === index}
                onHover={setHoveredChakra}
              />
            ))}
          </div>
        </div>
        
        {/* Chakra Detail */}
        {hoveredChakra !== null && (
          <motion.div
            className="text-center p-3 bg-gray-800/30 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={hoveredChakra}
          >
            <p className="text-blue-300 font-medium">
              {chakrasData[hoveredChakra].name}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {chakrasData[hoveredChakra].element} • {chakrasData[hoveredChakra].energy}% ativo
            </p>
          </motion.div>
        )}
      </div>

      {showDetails && (
        <>
          {/* Status Energético */}
          <div className="space-y-3">
            <h4 className="text-white font-medium text-center">Status Energético</h4>
            <EnergyBars energyData={energyData} />
          </div>

          {/* Fase Lunar */}
          <div className="space-y-3">
            <h4 className="text-white font-medium text-center">Influência Cósmica</h4>
            <LunarPhase />
          </div>

          {/* Momento Astral */}
          <div className="space-y-3">
            <h4 className="text-white font-medium text-center">Momento Astral</h4>
            <motion.div
              className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20"
              animate={{ borderColor: ["rgba(59, 130, 246, 0.2)", "rgba(147, 51, 234, 0.2)", "rgba(59, 130, 246, 0.2)"] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <p className="text-gray-300 text-sm leading-relaxed text-center">
                Suas energias estão em harmonia crescente. Este é um momento 
                propício para meditação e conexão espiritual.
              </p>
              <div className="flex justify-center mt-3">
                <Star className="w-4 h-4 text-yellow-400" />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default AstralDataOrb;