import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, HelpCircle } from 'lucide-react';
import AIChatBot from './AIChatBot';
import type { StudentProfile } from '../types';

interface FloatingChatBotProps {
  profile: StudentProfile | null;
}

// Full-featured responsive guest profile fallback in case student is still onboarding
const defaultGuestProfile: StudentProfile = {
  name: "Aspiring Student",
  degree: "Bachelor of Technology",
  branch: "Computer Science & Engineering",
  yearOfStudy: "3rd Year",
  college: "Institution of Higher Education",
  skills: ["Programming", "Problem Solving"],
  languages: ["English"],
  interests: ["Technology", "Software Engineering"],
  dreamCareer: "Full Stack Engineer",
  preferredIndustry: "Software & Technology",
  preferredCountry: "United States",
  studyHours: 4,
  preferredLanguage: "English",
  learningStyle: "Mixed",
  timelineGoal: "6 months"
};

export default function FloatingChatBot({ profile }: FloatingChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const activeProfile = profile || defaultGuestProfile;

  // Option to close the chatbot popup when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        // Find if user clicked on the trigger button to prevent immediate toggle back
        const triggerBtn = document.getElementById('chatbot-floating-launcher-btn');
        if (triggerBtn && triggerBtn.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="font-sans" id="floating-chatbot-launcher-root">
      {/* 1. Floating Action Trigger Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Circular Floating Launcher Button */}
        <motion.button
          id="chatbot-floating-launcher-btn"
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`pointer-events-auto relative w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
            isOpen 
              ? 'bg-rose-600 shadow-rose-100 hover:bg-rose-700' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-200 hover:opacity-95'
          }`}
          title={isOpen ? "Minimize Chat" : "AI Mentor Chat"}
        >
          {/* Animated Glow Rings when closed */}
          {!isOpen && (
            <>
              <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping -z-10" />
              <span className="absolute -inset-1.5 rounded-full border border-blue-400/20 animate-pulse -z-10" />
            </>
          )}

          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close-icon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="chat-icon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Bot className="w-5.5 h-5.5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-blue-600 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* 2. Floating Chatbot Dialog Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popupRef}
            id="chatbot-floating-modal"
            initial={{ opacity: 0, scale: 0.85, y: 40, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40, transformOrigin: 'bottom right' }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed z-50 overflow-hidden bg-slate-50/98 dark:bg-slate-900/98 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800/90 flex flex-col transition-all duration-350
              w-[92vw] h-[80vh] max-h-[720px] bottom-24 right-4 left-4 sm:left-auto sm:w-[500px] sm:right-6
              lg:w-[1040px] lg:h-[750px] lg:max-h-[85vh] lg:bottom-26 lg:right-6"
          >
            {/* Modal Premium Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8.5 h-8.5 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-100 dark:shadow-none font-extrabold text-sm">
                    A
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">AI Assistant</h3>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 shadow-xs cursor-pointer transition-all"
                  title="Minimize Chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Workspace wrapping AIChatBot */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-7 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <AIChatBot profile={activeProfile} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
