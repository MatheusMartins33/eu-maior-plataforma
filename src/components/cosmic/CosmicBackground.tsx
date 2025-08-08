import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleDelay: number;
}

interface CosmicBackgroundProps {
  starCount?: number;
  intensity?: 'low' | 'medium' | 'high';
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  starCount = 25, // Reduzido drasticamente
  intensity = 'low'
}) => {
  const [stars, setStars] = useState<Star[]>([]);

  // Gerar estrelas minimalistas
  useEffect(() => {
    const generateStars = (): Star[] => {
      return Array.from({ length: starCount }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.5 + 0.5, // Estrelas menores
        opacity: Math.random() * 0.4 + 0.1, // Menos brilhantes
        twinkleDelay: Math.random() * 8 + 2 // Animação mais lenta
      }));
    };

    setStars(generateStars());

    const handleResize = () => {
      setStars(generateStars());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [starCount]);

  const getIntensityMultiplier = () => {
    switch (intensity) {
      case 'low': return 0.3;
      case 'high': return 0.8;
      default: return 0.5;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Fundo escuro sólido como ElevenLabs */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      {/* Gradiente sutil para profundidade */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(30, 58, 138, 0.1) 0%, transparent 50%)'
        }}
      />

      {/* Campo de estrelas minimalista */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
            }}
            animate={{
              opacity: [
                star.opacity * 0.2, 
                star.opacity * getIntensityMultiplier(), 
                star.opacity * 0.2
              ],
              scale: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 4 + star.twinkleDelay,
              repeat: Infinity,
              ease: "easeInOut",
              delay: star.twinkleDelay
            }}
          />
        ))}
      </div>

      {/* Vinheta sutil para depth */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.4) 100%)'
        }}
      />
    </div>
  );
};

export default CosmicBackground;