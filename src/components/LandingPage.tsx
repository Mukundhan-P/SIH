import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sun, Moon, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function LandingPage({ onGetStarted, onLoginClick, theme, onToggleTheme }: LandingPageProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col justify-between select-none transition-colors duration-300 ${isDark ? 'bg-[#060414] text-white' : 'bg-slate-50 text-slate-900'}`} id="landing-page-wrapper">
      
      {/* Background hexagon grids/particles style decorations */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] pointer-events-none transition-colors duration-300 ${isDark ? 'from-indigo-950/40 via-[#060414] to-[#04020a]' : 'from-blue-100/40 via-slate-50 to-white'}`} />
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] blur-[140px] rounded-full pointer-events-none transition-colors duration-300 ${isDark ? 'bg-indigo-500/10' : 'bg-blue-400/10'}`} />

      {/* Modern Top Header Nav */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center relative z-20" id="landing-header">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <span className={`text-xl font-black tracking-tight transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>HaloHex</span>
          <span className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-sm">
            PATH AI
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-5">
          {/* Light/Dark Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-2.5 rounded-full border transition-all cursor-pointer ${isDark ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-400 hover:text-white' : 'border-slate-200 hover:border-slate-300 hover:bg-white text-slate-600 hover:text-slate-900 shadow-sm'}`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
          </button>

          {/* Log In Link */}
          <button
            onClick={onLoginClick}
            className={`text-sm font-bold transition-colors cursor-pointer border-b border-transparent pb-0.5 ${isDark ? 'text-slate-300 hover:text-white hover:border-white' : 'text-slate-600 hover:text-slate-950 hover:border-slate-950'}`}
          >
            Log in
          </button>

          {/* Header Get Started Button */}
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-full transition-all shadow-[0_4px_20px_rgba(109,40,217,0.3)] hover:shadow-[0_4px_25px_rgba(109,40,217,0.45)] flex items-center gap-1.5 cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Center Content Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto relative z-10 py-12" id="landing-hero">
        
        {/* Small Highlight pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`px-4 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-widest mb-6.5 transition-colors duration-300 ${isDark ? 'bg-slate-900/85 border-slate-800/80 text-indigo-300' : 'bg-blue-50/90 border-blue-100/80 text-blue-600'}`}
        >
          AI-Powered Personalized Learning Platform
        </motion.div>

        {/* Main Sleek Display Typography */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`text-4xl md:text-6xl font-black tracking-tight leading-[1.12] transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          Your Career. Your Skills.<br />
          <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Your AI Roadmap.
          </span>
          <br />
          <span className={`text-2xl md:text-3xl font-black mt-2 block transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Learn Smarter. Grow Faster.
          </span>
        </motion.h1>

        {/* Description Text */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`text-sm md:text-base max-w-2xl mt-6 leading-relaxed font-medium transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
        >
          Discover a personalized learning experience powered by Artificial Intelligence. HaloHex analyzes your skills, interests, and career goals to identify skill gaps and generate a customized learning roadmap. With AI mentoring, voice-enabled learning for visually impaired users, adaptive assessments, study planning, resume analysis, mock interviews, and real-time progress tracking, our platform empowers every learner to build industry-ready skills with confidence.
        </motion.p>

        {/* Central "Get Started" Call-to-Action button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-9"
        >
          <button
            onClick={onGetStarted}
            className="px-8 py-4.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white text-sm font-black rounded-full transition-all shadow-[0_6px_25px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_35px_rgba(139,92,246,0.5)] flex items-center gap-2.5 cursor-pointer relative group overflow-hidden"
          >
            {/* Glossy shine overlay */}
            <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-25deg] -translate-x-full group-hover:animate-shine" />
            <Sparkles className="w-4.5 h-4.5 text-amber-300" />
            <span>Start Your Learning Journey</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>

      </main>

      {/* Decorative spacing element replacing the removed pathway graphic */}
      <div className="h-12 shrink-0" />
    </div>
  );
}
