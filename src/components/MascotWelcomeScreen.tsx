import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';
import RobotPet from './RobotPet';

interface MascotWelcomeScreenProps {
  userName: string;
  onProceed: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function MascotWelcomeScreen({ userName, onProceed, theme, onToggleTheme }: MascotWelcomeScreenProps) {
  const isDark = theme === 'dark';
  let formattedName = (userName || 'Friend')
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // If the user name was entered as "h messi", it formats to "H Messi".
  // Let's strip the leading "H " so it becomes just "Messi", resulting in "Hi Messi"
  if (formattedName.startsWith('H ')) {
    formattedName = formattedName.slice(2);
  }

  const fullText = `Hiello ${formattedName}! Welcome to HaloHex, Lets start choosing your career!`;
  const [typedText, setTypedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  // Fast typewriter effect
  useEffect(() => {
    let index = 0;
    setTypedText('');
    setIsTypingDone(false);

    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        setIsTypingDone(true);
        clearInterval(timer);
      }
    }, 25); // Fast and responsive typing speed

    return () => clearInterval(timer);
  }, [fullText]);

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 select-none transition-colors duration-300 ${isDark ? 'bg-[#060414] text-white' : 'bg-slate-50 text-slate-900'}`} id="mascot-welcome-screen">
      
      {/* Background decorations matching LandingPage */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] pointer-events-none transition-colors duration-300 ${isDark ? 'from-indigo-950/40 via-[#060414] to-[#04020a]' : 'from-blue-100/40 via-slate-50 to-white'}`} />
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] blur-[140px] rounded-full pointer-events-none transition-colors duration-300 ${isDark ? 'bg-indigo-500/10' : 'bg-blue-400/10'}`} />

      {/* Modern Top Header Nav */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-2">
          <span className={`text-xl font-black tracking-tight transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>HaloHex</span>
          <span className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-sm">
            PATH AI
          </span>
        </div>

        {/* Theme control */}
        <button
          onClick={onToggleTheme}
          className={`p-2.5 rounded-full border transition-all cursor-pointer ${isDark ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-400 hover:text-white' : 'border-slate-200 hover:border-slate-300 hover:bg-white text-slate-600 hover:text-slate-900 shadow-sm'}`}
          title="Toggle theme"
        >
          {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
        </button>
      </header>

      {/* Centered Large Mascot and Speech Container */}
      <main className="max-w-2xl w-full flex flex-col items-center text-center relative z-10 space-y-8 mt-12">
        
        {/* Animated Glow Halo */}
        <div className="absolute -top-10 w-72 h-72 bg-violet-500/10 dark:bg-violet-400/15 rounded-full blur-[80px] pointer-events-none animate-pulse" />

        {/* Big centered high-fidelity Duolingo-style companion robot pet */}
        <div className="scale-[1.3] transform md:scale-[1.45] py-6 select-none pointer-events-none">
          <RobotPet 
            message="" 
            expression="excited" 
            className="pointer-events-none" 
          />
        </div>

        {/* Speech Bubble / Dynamic Typing Area */}
        <div className="w-full max-w-xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 md:p-8 rounded-3xl border shadow-xl relative ${isDark ? 'bg-slate-900/90 border-slate-800/85 text-white shadow-none' : 'bg-white border-slate-200/80 text-slate-800 shadow-slate-200/50'}`}
          >
            {/* Typography */}
            <div className="min-h-[50px] flex items-center justify-center">
              <span className="text-lg md:text-2xl font-black tracking-tight leading-relaxed select-text">
                {typedText}
                <span className="inline-block w-1.5 h-5 ml-1 bg-violet-500 animate-pulse" />
              </span>
            </div>
          </motion.div>
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <button
            onClick={onProceed}
            className="px-8 py-4.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:via-indigo-500 hover:to-blue-500 text-white text-sm font-black rounded-full transition-all shadow-[0_6px_25px_rgba(109,40,217,0.3)] hover:shadow-[0_6px_35px_rgba(109,40,217,0.55)] flex items-center gap-2.5 cursor-pointer relative group overflow-hidden"
          >
            <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-25deg] -translate-x-full group-hover:animate-shine" />
            <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
            <span>Lets Start Your Roadmap</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>

      </main>

    </div>
  );
}
