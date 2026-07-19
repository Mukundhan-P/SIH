import React from 'react';
import { Sparkles, Brain, Cpu, MessageSquare } from 'lucide-react';

interface AIPersonalityAvatarProps {
  status: 'idle' | 'thinking' | 'speaking';
  mode?: string;
}

export default function AIPersonalityAvatar({ status, mode }: AIPersonalityAvatarProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        {/* Soft, beautiful ripple ring */}
        <div
          className={`absolute rounded-full transition-all duration-700 ${
            status === 'thinking'
              ? 'w-20 h-20 bg-emerald-500/10 animate-pulse'
              : status === 'speaking'
              ? 'w-24 h-24 bg-blue-500/10 animate-ping'
              : 'w-16 h-16 bg-slate-100'
          }`}
        />

        {/* Core container circle */}
        <div
          className={`relative w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 ${
            status === 'thinking'
              ? 'bg-emerald-50/50 border-emerald-400'
              : status === 'speaking'
              ? 'bg-blue-50/50 border-blue-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          {status === 'thinking' ? (
            <Brain className="w-7 h-7 text-emerald-600 animate-spin-slow" />
          ) : status === 'speaking' ? (
            <Sparkles className="w-7 h-7 text-blue-600 animate-bounce" />
          ) : (
            <MessageSquare className="w-7 h-7 text-slate-500" />
          )}

          {/* Status Indicator Dot */}
          <span
            className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
              status === 'thinking'
                ? 'bg-emerald-500'
                : status === 'speaking'
                ? 'bg-blue-500'
                : 'bg-slate-400'
            }`}
          />
        </div>
      </div>

      <div className="text-center mt-3.5">
        <span className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center justify-center gap-1">
          {status === 'thinking' ? (
            <span className="text-emerald-700">Advisor analyzing...</span>
          ) : status === 'speaking' ? (
            <span className="text-blue-700">Advisor Speaking</span>
          ) : (
            <span className="text-slate-700">Career Companion</span>
          )}
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mt-0.5">
          {mode || 'General Mentor'} Mode
        </span>
      </div>
    </div>
  );
}
