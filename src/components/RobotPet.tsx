import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface RobotPetProps {
  message: string;
  expression?: 'greeting' | 'thinking' | 'happy' | 'excited' | 'neutral';
  className?: string;
}

export default function RobotPet({ message, expression = 'neutral', className = '' }: RobotPetProps) {
  // Eye expressions in dynamic SVG
  const getEyes = () => {
    switch (expression) {
      case 'greeting':
        return (
          <>
            {/* Winking eye and normal eye */}
            <path d="M 33 36 Q 38 31 43 36" stroke="#2563eb" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <circle cx="67" cy="38" r="6.5" fill="#2563eb" />
            <circle cx="65" cy="36" r="2.5" fill="#ffffff" />
          </>
        );
      case 'happy':
        return (
          <>
            {/* Two happy upside-down curved eyes */}
            <path d="M 30 40 Q 38 30 46 40" stroke="#10b981" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 54 40 Q 62 30 70 40" stroke="#10b981" strokeWidth="5" strokeLinecap="round" fill="none" />
          </>
        );
      case 'excited':
        return (
          <>
            {/* Glowing starburst/joyous wide circular eyes */}
            <circle cx="38" cy="38" r="7.5" fill="#f59e0b" />
            <circle cx="36" cy="36" r="3" fill="#ffffff" />
            <circle cx="62" cy="38" r="7.5" fill="#f59e0b" />
            <circle cx="60" cy="36" r="3" fill="#ffffff" />
          </>
        );
      case 'thinking':
        return (
          <>
            {/* Skeptical raised eyebrow/slanting digital slits */}
            <path d="M 32 34 L 44 38" stroke="#818cf8" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="64" cy="38" r="5" fill="#818cf8" />
          </>
        );
      case 'neutral':
      default:
        return (
          <>
            {/* Super friendly large Duolingo-style pupils with white sparkle highlights */}
            <circle cx="38" cy="38" r="7" fill="#3b82f6" />
            <circle cx="36" cy="36" r="2.5" fill="#ffffff" />
            <circle cx="62" cy="38" r="7" fill="#3b82f6" />
            <circle cx="60" cy="36" r="2.5" fill="#ffffff" />
          </>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 text-center ${className}`} id="robot-pet-container">
      {/* Floating Mascot with Bobbing motion */}
      <motion.div
        animate={{
          y: [0, -12, 0],
          rotate: expression === 'excited' ? [-2, 2, -2] : [0, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        {/* Glow Shadow under Feet */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-2.5 bg-blue-500/15 dark:bg-blue-400/25 blur-sm rounded-full" />

        {/* Mascot SVG representation - Duolingo style proportions (70% Head & Body, little arms and legs) */}
        <svg
          width="130"
          height="130"
          viewBox="0 0 100 100"
          className="drop-shadow-[0_10px_18px_rgba(59,130,246,0.25)] dark:drop-shadow-[0_10px_24px_rgba(59,130,246,0.35)]"
        >
          {/* DEFINITIONS for gradient overlays */}
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
            <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
          </defs>

          {/* BACKGROUND SHIELD OR HALO ACCENT */}
          <circle cx="50" cy="45" r="32" fill="#3b82f6" opacity="0.08" className="animate-pulse" />

          {/* ANTENNA (top of mascot head) */}
          <line x1="50" y1="12" x2="50" y2="20" stroke="#4f46e5" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="50" cy="11" r="5" fill="#3b82f6" className="animate-pulse" />

          {/* LEGS & FEET (Cute Duolingo-style hopping legs) */}
          {/* Left Leg */}
          <motion.rect
            x="34"
            y="70"
            width="8"
            height="14"
            rx="4"
            fill="#4f46e5"
            animate={{
              y: expression === 'excited' ? [0, -4, 0] : [0, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
            }}
          />
          {/* Left Foot */}
          <circle cx="38" cy="84" r="5" fill="#312e81" />

          {/* Right Leg */}
          <motion.rect
            x="58"
            y="70"
            width="8"
            height="14"
            rx="4"
            fill="#4f46e5"
            animate={{
              y: expression === 'excited' ? [-4, 0, -4] : [0, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
            }}
          />
          {/* Right Foot */}
          <circle cx="62" cy="84" r="5" fill="#312e81" />

          {/* ARMS / HANDS (Left hand waving to say hello) */}
          {/* Left Arm / Hand (Interactive waving movement) */}
          <motion.path
            d="M 22 52 Q 10 40 12 32"
            stroke="#4f46e5"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            animate={expression === 'greeting' || expression === 'excited' ? {
              rotate: [0, -15, 10, -15, 0],
            } : {
              rotate: 0,
            }}
            originX="22"
            originY="52"
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          {/* Left Palm bulb */}
          <circle cx="12" cy="32" r="4.5" fill="#38bdf8" />

          {/* Right Arm / Hand (Holding hip or relaxed) */}
          <path d="M 78 52 Q 88 56 86 64" stroke="#4f46e5" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Right Palm bulb */}
          <circle cx="86" cy="64" r="4.5" fill="#38bdf8" />

          {/* MAIN CHUBBY BODY & HEAD (Integrated together for a cute animal/robot mascot ratio) */}
          <rect x="22" y="18" width="56" height="56" rx="28" fill="url(#bodyGrad)" />

          {/* WHITE TUMMY / FACE SHIELD VISOR PANEL */}
          <rect x="26" y="22" width="48" height="46" rx="22" fill="url(#visorGrad)" stroke="#818cf8" strokeWidth="2.5" />

          {/* EYE CREATIONS */}
          {getEyes()}

          {/* CHEEKS (Cute pink blushes) */}
          <circle cx="30" cy="48" r="3" fill="#f43f5e" opacity="0.4" />
          <circle cx="70" cy="48" r="3" fill="#f43f5e" opacity="0.4" />

          {/* MOUTH / SMILE */}
          {expression === 'happy' || expression === 'excited' ? (
            <path d="M 44 48 Q 50 56 56 48" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          ) : expression === 'thinking' ? (
            <path d="M 46 51 L 54 49" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          ) : (
            // Big cute smile
            <path d="M 43 49 Q 50 55 57 49" stroke="#312e81" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          )}

          {/* HEART BEAT SENSOR ON THE TUMMY */}
          <circle cx="50" cy="60" r="3.5" fill="#ef4444" className="animate-pulse" />
        </svg>
      </motion.div>

      {/* Talk Speech Bubble */}
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-xs bg-slate-950 text-white text-xs md:text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl border border-slate-850"
        >
          <span className="leading-relaxed block">{message}</span>
        </motion.div>
      )}
    </div>
  );
}
