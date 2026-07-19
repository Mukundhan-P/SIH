import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { InterviewRoundState, StudentProfile } from '@/src/types';
import { HelpCircle, Sparkles, Award, Play, CheckCircle, ChevronRight, User, Cpu, Volume2, Star, ThumbsUp } from 'lucide-react';

interface MockInterviewArenaProps {
  profile: StudentProfile;
  activeInterview: InterviewRoundState | null;
  onStartInterview: (role: string, round: 'HR' | 'Technical' | 'Coding' | 'Behavioral' | 'System Design' | 'Project Discussion') => void;
  onEvaluateAnswer: (answer: string) => void;
  onNextQuestion: () => void;
  onResetInterview: () => void;
  isLoading: boolean;
  isEvaluating: boolean;
}

export default function MockInterviewArena({
  profile,
  activeInterview,
  onStartInterview,
  onEvaluateAnswer,
  onNextQuestion,
  onResetInterview,
  isLoading,
  isEvaluating,
}: MockInterviewArenaProps) {
  const [selectedRole, setSelectedRole] = useState(profile.dreamCareer || 'AI Engineer');
  const [selectedRound, setSelectedRound] = useState<'HR' | 'Technical' | 'Coding' | 'Behavioral' | 'System Design' | 'Project Discussion'>('Technical');
  const [userAnswer, setUserAnswer] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const careerOptions = [
    'AI Engineer', 'Machine Learning Engineer', 'Data Scientist', 'Data Analyst',
    'Software Engineer', 'Full Stack Developer', 'DevOps Engineer', 'Cloud Engineer',
    'Cybersecurity Analyst', 'UI/UX Designer', 'Product Manager', 'Blockchain Developer',
    'Mobile App Developer', 'Game Developer', 'Research Scientist'
  ];

  const roundOptions = ['HR', 'Technical', 'Coding', 'Behavioral', 'System Design', 'Project Discussion'] as const;

  // Speak the question aloud using our server-side TTS proxy
  const handleSpeakQuestion = async (text: string) => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceName: 'Charon' }) // Charon is a deep professional male voice
      });
      const data = await res.json();
      if (data.audio) {
        const audioSrc = `data:audio/mp3;base64,${data.audio}`;
        const audio = new Audio(audioSrc);
        audio.play().catch((playErr) => {
          console.warn("Audio playback blocked by browser/iframe restrictions:", playErr);
          setIsPlayingAudio(false);
        });
        audio.onended = () => setIsPlayingAudio(false);
      } else {
        setIsPlayingAudio(false);
      }
    } catch (err) {
      console.error("Failed to play synthesized speech", err);
      setIsPlayingAudio(false);
    }
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userAnswer.trim()) {
      onEvaluateAnswer(userAnswer.trim());
      setUserAnswer('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-5.5 h-5.5 text-blue-600 dark:text-blue-400" /> AI mock interview
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Conducted by our automated Senior Technical Panel</p>
        </div>
        {activeInterview && (
          <button
            onClick={onResetInterview}
            className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-3.5 py-1.5 rounded-xl transition-all"
          >
            Quit Interview
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!activeInterview ? (
          /* Selection Screen */
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-xl mx-auto bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-sm"
          >
            <div className="text-center mb-4">
              <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 mb-2">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Setup Your Mock Session</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Select your target parameters to synthesize 5 real-world interview questions.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wider">Target Job Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 font-semibold cursor-pointer"
                >
                  {careerOptions.map((role) => (
                    <option key={role} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wider">Interview Phase Round</label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 font-semibold cursor-pointer"
                >
                  {roundOptions.map((round) => (
                    <option key={round} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {round} Round
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => onStartInterview(selectedRole, selectedRound)}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs py-3.5 rounded-xl transition-all shadow-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Assembling Panel Questions...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Start Session
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : activeInterview.isComplete ? (
          /* Report Card Screen */
          <motion.div
            key="report-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-3xl mx-auto bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-sm"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Interview Round Complete!</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">A comprehensive breakdown of your response parameters for {activeInterview.role}</p>
            </div>

            {/* Averages summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase block">Avg Technical Accuracy</span>
                <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 block mt-1">
                  {Math.round(activeInterview.answers.reduce((acc, curr) => acc + curr.technicalScore, 0) / 5)}%
                </span>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase block">Avg Communication</span>
                <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 block mt-1">
                  {Math.round(activeInterview.answers.reduce((acc, curr) => acc + curr.communicationScore, 0) / 5)}%
                </span>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase block">Mock Rating</span>
                <div className="flex justify-center items-center gap-1 mt-1 text-amber-500">
                  <Star className="w-5 h-5 fill-amber-500" />
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
                    {(activeInterview.answers.reduce((acc, curr) => acc + curr.overallRating, 0) / 5).toFixed(1)}/5
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Q&A dropdown lists */}
            <div className="space-y-4">
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Detailed Evaluations</h4>
              {activeInterview.answers.map((ans, idx) => (
                <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50 dark:bg-slate-950/20 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-blue-750 dark:text-blue-400 font-mono text-xs font-bold">Q{idx + 1}. {ans.question}</span>
                    <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-2.5 py-0.5 rounded">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {ans.overallRating}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-slate-300 dark:border-slate-700 pl-3 italic">
                    <span className="text-[10px] text-slate-505 dark:text-slate-400 uppercase font-bold block mb-1 not-italic">Your Answer:</span>
                    "{ans.answer}"
                  </div>
                  <div className="text-xs space-y-2 bg-white dark:bg-black p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong className="text-blue-700 dark:text-blue-400 text-[10px] uppercase font-bold block mb-1">Expert Feedback:</strong> {ans.feedback}</p>
                    {ans.mistakes.length > 0 && (
                      <p className="text-red-700 dark:text-red-400 leading-relaxed"><strong className="text-red-700 dark:text-red-450 text-[10px] uppercase font-bold block mb-1">Identified Mistakes:</strong> {ans.mistakes.join(', ')}</p>
                    )}
                    <div className="text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-pre-wrap mt-2">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold block mb-1.5 font-sans">Ideal Model Response:</span>
                      {ans.correctAnswer}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onResetInterview}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs py-3 rounded-xl transition-all cursor-pointer"
            >
              Back to Interview Room
            </button>
          </motion.div>
        ) : (
          /* Live Chat Arena */
          <motion.div
            key="arena"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Question dialogue box */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between min-h-[450px] shadow-sm">
                {/* Interview panel header state */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <span className="text-xs text-slate-900 dark:text-white font-bold">Senior AI Panelist</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Conducting {activeInterview.roundType} Round</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300">
                    Q: {activeInterview.currentQuestionIndex + 1} / 5
                  </span>
                </div>

                {/* The Interviewer question card */}
                <div className="py-6 space-y-4 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl relative flex-1">
                      <p className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-relaxed">
                        {activeInterview.questions[activeInterview.currentQuestionIndex]}
                      </p>
                      <button
                        onClick={() => handleSpeakQuestion(activeInterview.questions[activeInterview.currentQuestionIndex])}
                        disabled={isPlayingAudio}
                        className="mt-3 inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> {isPlayingAudio ? 'Speaking...' : 'Listen Question'}
                      </button>
                    </div>
                  </div>

                  {/* Previous question answers evaluation displays under */}
                  {activeInterview.answers[activeInterview.currentQuestionIndex] && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black rounded-2xl p-5 space-y-3.5 shadow-sm"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> Instant Evaluation Feedback</span>
                        <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded">
                          <Star className="w-3 h-3 fill-amber-400" /> {activeInterview.answers[activeInterview.currentQuestionIndex].overallRating}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Tech Accuracy</span>
                          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{activeInterview.answers[activeInterview.currentQuestionIndex].technicalScore}%</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Communication</span>
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{activeInterview.answers[activeInterview.currentQuestionIndex].communicationScore}%</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Confidence</span>
                          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{activeInterview.answers[activeInterview.currentQuestionIndex].confidenceScore}%</span>
                        </div>
                      </div>

                      <div className="text-xs space-y-2 pt-2">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong className="text-blue-750 dark:text-blue-400">Feedback:</strong> {activeInterview.answers[activeInterview.currentQuestionIndex].feedback}</p>
                        {activeInterview.answers[activeInterview.currentQuestionIndex].mistakes.length > 0 && (
                          <p className="text-red-700 dark:text-red-400 leading-relaxed"><strong className="text-red-700 dark:text-red-400">Gaps/Mistakes:</strong> {activeInterview.answers[activeInterview.currentQuestionIndex].mistakes.join(', ')}</p>
                        )}
                        <p className="text-emerald-700 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[10px] leading-relaxed"><strong className="text-slate-500 dark:text-slate-400 text-[10px] block mb-1 font-sans">Sample Model Response:</strong> {activeInterview.answers[activeInterview.currentQuestionIndex].correctAnswer}</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input block */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  {!activeInterview.answers[activeInterview.currentQuestionIndex] ? (
                    <form onSubmit={handleAnswerSubmit} className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          disabled={isEvaluating}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 font-semibold"
                          placeholder="Type your detailed interview answer here..."
                        />
                        <button
                          type="submit"
                          disabled={isEvaluating || !userAnswer.trim()}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs px-5 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          {isEvaluating ? 'Evaluating...' : 'Submit'}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block text-right">Be specific, professional, and explain your reasoning clearly!</span>
                    </form>
                  ) : (
                    <button
                      onClick={onNextQuestion}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3.5 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      {activeInterview.currentQuestionIndex === 4 ? 'Compile Final Report Card' : 'Proceed to Next Question'} <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Score Board */}
            <div className="lg:col-span-5 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 space-y-6 shadow-sm">
              <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">Session Progress</h3>
              <div className="space-y-4">
                {activeInterview.questions.map((q, idx) => {
                  const completed = activeInterview.answers[idx];
                  const active = idx === activeInterview.currentQuestionIndex;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3.5 border rounded-xl ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-slate-800 dark:text-slate-200'
                          : completed
                          ? 'bg-slate-50/60 dark:bg-slate-950/10 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500'
                          : 'bg-transparent border-transparent text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                          completed 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40' 
                            : active 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs truncate max-w-[150px] font-semibold">{q}</span>
                      </div>

                      {completed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : active ? (
                        <span className="text-[9px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 font-bold px-2 py-0.5 rounded-md uppercase">Live</span>
                      ) : (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold font-mono">Queued</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
