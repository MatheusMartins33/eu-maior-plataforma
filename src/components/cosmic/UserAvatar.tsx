import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Bell, 
  Crown,
  Sparkles,
  ChevronDown
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* INTERFACES                                                                 */
/* -------------------------------------------------------------------------- */
interface UserAvatarProps {
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar_url?: string;
    subscription_tier?: 'free' | 'premium' | 'cosmic';
  };
  onLogout?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
  className?: string;
}

interface UserMenuProps {
  user: NonNullable<UserAvatarProps['user']>;
  onLogout?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
  onClose: () => void;
}

/* -------------------------------------------------------------------------- */
/* MENU DROPDOWN DO USUÁRIO                                                   */
/* -------------------------------------------------------------------------- */
const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onLogout,
  onSettings,
  onProfile,
  onClose
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case 'cosmic': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'premium': return <Sparkles className="w-4 h-4 text-purple-400" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'cosmic': return 'Cósmico';
      case 'premium': return 'Premium';
      default: return 'Gratuito';
    }
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'cosmic': return 'from-yellow-400/20 to-orange-400/20 border-yellow-400/30';
      case 'premium': return 'from-purple-400/20 to-pink-400/20 border-purple-400/30';
      default: return 'from-gray-400/20 to-gray-500/20 border-gray-400/30';
    }
  };

  return (
    <motion.div
      className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-600/30 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header do Perfil */}
      <div className={`p-6 bg-gradient-to-br ${getTierColor(user.subscription_tier)} border-b border-gray-600/30`}>
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.name || 'User'} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            
            {/* Badge do Tier */}
            <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-1">
              {getTierIcon(user.subscription_tier)}
            </div>
          </div>

          {/* Info do Usuário */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg truncate">
              {user.name || 'Usuário Cósmico'}
            </h3>
            <p className="text-gray-300 text-sm truncate">
              {user.email}
            </p>
            <div className="flex items-center mt-2">
              {getTierIcon(user.subscription_tier)}
              <span className="ml-2 text-xs font-medium text-gray-300">
                Plano {getTierLabel(user.subscription_tier)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-2">
        {/* Perfil */}
        <motion.button
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-colors text-left"
          onClick={() => { onProfile?.(); onClose(); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <User className="w-5 h-5 text-gray-400" />
          <span className="text-gray-200">Ver Perfil</span>
        </motion.button>

        {/* Configurações */}
        <motion.button
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-colors text-left"
          onClick={() => { onSettings?.(); onClose(); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Settings className="w-5 h-5 text-gray-400" />
          <span className="text-gray-200">Configurações</span>
        </motion.button>

        {/* Notificações */}
        <motion.button
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-colors text-left"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="text-gray-200">Notificações</span>
          <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
        </motion.button>

        {/* Modo Escuro Toggle */}
        <motion.button
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-colors text-left"
          onClick={() => setIsDarkMode(!isDarkMode)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-gray-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-gray-200">
            {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </span>
        </motion.button>

        {/* Divisor */}
        <div className="my-2 border-t border-gray-600/30"></div>

        {/* Logout */}
        <motion.button
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-colors text-left"
          onClick={() => { onLogout?.(); onClose(); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="text-red-300">Sair</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL DO AVATAR                                             */
/* -------------------------------------------------------------------------- */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  onLogout,
  onSettings,
  onProfile,
  className = ""
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!user) {
    return null;
  }

  const getInitials = () => {
    return user.name?.charAt(0).toUpperCase() || 
           user.email?.charAt(0).toUpperCase() || 
           'U';
  };

  const getTierGlow = () => {
    switch (user.subscription_tier) {
      case 'cosmic': return 'shadow-yellow-400/50';
      case 'premium': return 'shadow-purple-400/50';
      default: return 'shadow-blue-400/50';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Avatar Button */}
      <motion.button
        className={`relative flex items-center space-x-2 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
          isMenuOpen || isHovered
            ? `bg-gray-800/80 shadow-lg ${getTierGlow()}`
            : 'bg-gray-800/50 hover:bg-gray-700/50'
        }`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Avatar Image/Initials */}
        <div className="relative">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm transition-all duration-300 ${
            isMenuOpen || isHovered ? 'ring-2 ring-blue-400/50' : ''
          }`}>
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.name || 'User'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials()
            )}
          </div>

          {/* Status Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          
          {/* Tier Badge */}
          {user.subscription_tier && user.subscription_tier !== 'free' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
              {user.subscription_tier === 'cosmic' ? (
                <Crown className="w-2.5 h-2.5 text-yellow-400" />
              ) : (
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              )}
            </div>
          )}
        </div>

        {/* Name (hidden on mobile) */}
        <div className="hidden sm:block">
          <span className="text-white text-sm font-medium">
            {user.name?.split(' ')[0] || 'User'}
          </span>
        </div>

        {/* Dropdown Arrow */}
        <motion.div
          animate={{ rotate: isMenuOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="hidden sm:block"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>

        {/* Glow Effect */}
        {(isMenuOpen || isHovered) && (
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 -z-10`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
          />
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop (mobile) */}
            <div 
              className="fixed inset-0 z-40 sm:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu */}
            <UserMenu
              user={user}
              onLogout={onLogout}
              onSettings={onSettings}
              onProfile={onProfile}
              onClose={() => setIsMenuOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserAvatar;