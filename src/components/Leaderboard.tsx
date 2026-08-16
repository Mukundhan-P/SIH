import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Sparkles, RefreshCw, Flame, Award, Target,
  ChevronRight, ArrowRight, Zap, GraduationCap, Info, Wifi, WifiOff, Crown
} from 'lucide-react';
import type { StudentProfile, ResumeAnalysis } from '../types';
import {
  useRealtimeLeaderboard,
  getLevelInfo,
  getProgressToNextLevel,
  getMedals,
  MEDAL_DEFS,
  LEVELS,
  type LeaderboardEntry,
} from '../lib/gamification';

interface LeaderboardProps {
  profile: StudentProfile;
  studyTasks: any[];
  resumeAnalysis: ResumeAnalysis | null;
  activeInterview: any;
  onNavigate: (tabId: 'mentor' | 'roadmap' | 'resume' | 'interview' | 'courses' | 'locked-roadmap' | 'syllabus-timeline' | 'dbInspect') => void;
}

// ─── Rank Medal Icons ─────────────────────────────────────────────────────────
const RANK_MEDALS: Record<number, { icon: string; ring: string; bg: string; label: string; podiumHeight: string }> = {
  0: { icon: '🥇', ring: 'ring-4 ring-yellow-400',    bg: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20',    label: '1st Place', podiumHeight: 'h-44' },
  1: { icon: '🥈', ring: 'ring-4 ring-slate-300 dark:ring-slate-600',  bg: 'from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-900/20',  label: '2nd Place', podiumHeight: 'h-36' },
  2: { icon: '🥉', ring: 'ring-4 ring-amber-600',     bg: 'from-amber-50/50 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10', label: '3rd Place', podiumHeight: 'h-28' },
};

// ─── XP Reward Items ─────────────────────────────────────────────────────────
const XP_ACTIONS = [
  { title: 'Daily Login',              xp: '+10 pts',  icon: '☀️',  tab: null,           desc: 'Log in every day to keep your streak' },
  { title: 'Complete Topic/Module',    xp: '+15 pts',  icon: '📖',  tab: 'locked-roadmap', desc: 'Mark a lesson as learned in the roadmap' },
  { title: 'Quiz Pass',                xp: '+50 pts',  icon: '✍️',  tab: 'locked-roadmap', desc: 'Score 60%+ on a unit checkpoint quiz' },
  { title: 'Quiz Perfect Score',       xp: '+80 pts',  icon: '🎯',  tab: 'locked-roadmap', desc: 'Score 90%+ on a quiz' },
  { title: 'Mock Interview (Full)',     xp: '+100 pts', icon: '🤖',  tab: 'interview',    desc: 'Complete a full 5-question mock interview' },
  { title: 'Resume ATS Scan',          xp: '+80 pts',  icon: '📄',  tab: 'resume',       desc: 'Scan and optimise your resume once' },
] as const;

// ─── Avatar Helpers ───────────────────────────────────────────────────────────
function getAvatar(name: string): string {
  const avatars = ['👩‍💻', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧑‍🎨', '👨‍💻', '👩‍🎓', '🧑‍🚀', '👨‍🎓', '👩‍🚀'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatars[Math.abs(hash) % avatars.length];
}

export default function Leaderboard({
  profile,
  resumeAnalysis,
  activeInterview,
  onNavigate,
}: LeaderboardProps) {
  const [showCoachReview, setShowCoachReview] = useState(false);
  const [showTip, setShowTip] = useState<number | null>(null);

  // ── Real-time Firestore onSnapshot ──────────────────────────────────────────
  const { entries: liveEntries, loading, error, isLive } = useRealtimeLeaderboard(100);

  // ── Build merged leaderboard: live Firestore + current user guaranteed visible
  const mergedLeaderboard: (LeaderboardEntry & { isCurrentUser: boolean })[] = (() => {
    const currentUserEmail = (profile as any).email || '';
    const currentUserName  = profile.name;

    // Check if current user exists in Firestore data
    const hasCurrentUser = liveEntries.some(
      e => e.email === currentUserEmail || e.name === currentUserName
    );

    const list = liveEntries.map(e => ({
      ...e,
      isCurrentUser: e.email === currentUserEmail || e.name === currentUserName,
    }));

    // If not yet in Firestore (brand-new user), synthesise a 0-point entry
    if (!hasCurrentUser) {
      const pts = 0;
      list.push({
        uid:          'current',
        name:         currentUserName,
        email:        currentUserEmail,
        points:       pts,
        level:        getLevelInfo(pts),
        medals:       [],
        college:      profile.college || '',
        dreamCareer:  profile.dreamCareer || '',
        completedDays: 0,
        quizzesPassed: 0,
        interviewDone: false,
        resumeScanned: false,
        isCurrentUser: true,
      });
    }

    return [...list].sort((a, b) => b.points - a.points);
  })();

  const currentUserEntry = mergedLeaderboard.find(e => e.isCurrentUser);
  const userRank = mergedLeaderboard.findIndex(e => e.isCurrentUser) + 1;

  // Pull a live leaderboard entry's medals or compute from client stats
  const myPoints    = currentUserEntry?.points ?? 0;
  const myLevel     = getLevelInfo(myPoints);
  const myProgress  = getProgressToNextLevel(myPoints);
  const myMedals    = currentUserEntry?.medals ?? [];

  const top1 = mergedLeaderboard[0];
  const leadingPoints = top1 && !top1.isCurrentUser ? top1.points : null;

  // ATS score display
  const atsDisplay = resumeAnalysis ? `${resumeAnalysis.atsScore}%` : 'No Upload';

  return (
    <div className="space-y-8 pb-12" id="leaderboard-root">

      {/* ── HERO HEADER ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3.5 max-w-3xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-full text-blue-700 dark:text-blue-400 text-xs font-black tracking-wider uppercase">
              <Trophy className="w-3.5 h-3.5" /> Community Competition
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              HaloHex Community Leaderboard
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Compete, level up, and conquer the leaderboard in real time! Earn points by finishing lessons, scoring on quizzes, mock interviews, and resume scans.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto shrink-0 mt-2 lg:mt-0">
            {/* Real-time status indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold border ${
              error
                ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
                : loading
                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
            }`}>
              {error ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              {loading ? 'Connecting…' : error ? 'Offline' : 'Live'}
            </div>

            <button
              onClick={() => setShowCoachReview(true)}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs md:text-sm font-black px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-indigo-400/20"
              id="coach-standing-review-btn"
            >
              <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
              AI Coach Review
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID: PODIUM + PROFILE ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT: PODIUM + RANKED LIST */}
        <div className="lg:col-span-2 space-y-6">

          {/* Live Podium */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-8 flex items-center gap-2">
              <span className="text-lg">🏆</span> Live Hall of Fame
              {loading && <span className="ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />}
            </h2>

            {mergedLeaderboard.length === 0 && !loading ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No users yet. Be the first!</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 pt-6 pb-2">
                {/* 2nd Place */}
                {mergedLeaderboard[1] && (
                  <PodiumCard entry={mergedLeaderboard[1]} rank={1} />
                )}
                {/* 1st Place */}
                {mergedLeaderboard[0] && (
                  <PodiumCard entry={mergedLeaderboard[0]} rank={0} />
                )}
                {/* 3rd Place */}
                {mergedLeaderboard[2] && (
                  <PodiumCard entry={mergedLeaderboard[2]} rank={2} />
                )}
              </div>
            )}
          </div>

          {/* Full Ranked List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-5 flex items-center justify-between">
              Active Contender Stream
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium normal-case">
                {mergedLeaderboard.length} student{mergedLeaderboard.length !== 1 ? 's' : ''}
              </span>
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {mergedLeaderboard.map((u, idx) => {
                  const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                  return (
                    <motion.div
                      key={u.uid || u.email || u.name}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        u.isCurrentUser
                          ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-300 dark:border-blue-700/60 shadow-sm ring-1 ring-blue-400/20'
                          : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 dark:bg-slate-850/30 dark:hover:bg-slate-850/60 dark:border-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-7 text-center font-black text-sm ${
                          idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400 dark:text-slate-500' : idx === 2 ? 'text-amber-600' : 'text-slate-400 dark:text-slate-500 text-xs'
                        }`}>
                          {rankIcon || `#${idx + 1}`}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-xs">
                          {getAvatar(u.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            {u.name}
                            {u.isCurrentUser && (
                              <span className="bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">YOU</span>
                            )}
                            {/* Level badge */}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r ${u.level.color} text-white opacity-90`}>
                              {u.level.icon} {u.level.title}
                            </span>
                          </h4>
                          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {u.dreamCareer}{u.college ? ` · ${u.college}` : ''}
                          </p>
                          {/* Medal chips */}
                          {u.medals.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {u.medals.slice(0, 4).map(m => (
                                <span key={m.id} title={m.title} className="text-xs">{m.icon}</span>
                              ))}
                              {u.medals.length > 4 && (
                                <span className="text-[9px] text-slate-400 font-bold">+{u.medals.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs md:text-sm font-black text-slate-950 dark:text-white block leading-none">{u.points} pts</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Lv.{u.level.level}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: MY PROFILE CARD */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 text-white border border-slate-800 dark:border-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="user-leaderboard-profile-card">
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -ml-16 -mb-16" />

            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full">
                  My Profile
                </span>
                <span className="text-xs font-black text-indigo-400 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" /> Rank #{userRank}
                </span>
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center text-4xl shadow-md overflow-hidden">
                    {getAvatar(profile.name)}
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 border border-indigo-400 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                    #{userRank}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black truncate">{profile.name}</h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium truncate">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    {profile.college || 'Your College'}
                  </p>
                  {/* Level badge */}
                  <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-black px-2 py-0.5 rounded-lg bg-gradient-to-r ${myLevel.color} text-white`}>
                    {myLevel.icon} {myLevel.title}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800 py-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Points</span>
                  <p className="text-xl font-black text-indigo-400 leading-none">{myPoints}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Level</span>
                  <p className="text-lg font-black text-white leading-none flex items-center gap-1">
                    {myLevel.icon} {myLevel.title}
                  </p>
                </div>
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Medals</span>
                  <p className="text-lg font-black text-amber-400 leading-none">{myMedals.length} earned</p>
                </div>
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">ATS Score</span>
                  <p className="text-lg font-black text-emerald-400 leading-none">{atsDisplay}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Progress to next level</span>
                  <span className="text-indigo-400">{myProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${myLevel.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${myProgress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Current: {myPoints} pts</span>
                  {myLevel.maxPoints !== Infinity && (
                    <span>{myLevel.maxPoints + 1 - myPoints} pts to {LEVELS.find(l => l.level === myLevel.level + 1)?.title || 'Max'}</span>
                  )}
                  {myLevel.maxPoints === Infinity && <span className="text-yellow-500">👑 Max Level!</span>}
                </div>
              </div>

              {/* Medals */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Earned Medals ({myMedals.length})
                </span>
                {myMedals.length === 0 ? (
                  <p className="text-[11px] text-slate-500 font-medium">Complete activities to earn your first medal!</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {myMedals.map((medal, idx) => (
                      <div
                        key={medal.id}
                        className="group relative cursor-default"
                        onMouseEnter={() => setShowTip(idx)}
                        onMouseLeave={() => setShowTip(null)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xl shadow-inner hover:scale-110 active:scale-95 transition-all">
                          {medal.icon}
                        </div>
                        <AnimatePresence>
                          {showTip === idx && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 w-48 text-center shadow-xl z-50 pointer-events-none text-[10px] leading-relaxed"
                            >
                              <p className="font-extrabold text-xs text-indigo-400">{medal.title}</p>
                              <p className="text-slate-400 mt-1 font-medium">{medal.desc}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* All Medals Available Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> All Achievements
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(MEDAL_DEFS).map(medal => {
                const earned = myMedals.some(m => m.id === medal.id);
                return (
                  <div
                    key={medal.id}
                    title={`${medal.title} — ${medal.desc}`}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                      earned
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/40 opacity-40 grayscale'
                    }`}
                  >
                    <span className="text-xl">{medal.icon}</span>
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 leading-tight">{medal.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── XP REWARD FORMULA ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Points Reward Formula
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {XP_ACTIONS.map((item) => (
            <div
              key={item.title}
              onClick={() => item.tab && onNavigate(item.tab as any)}
              className={`bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-850/30 dark:hover:bg-slate-850/50 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-xs group ${item.tab ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{item.title}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{item.xp}</span>
                {item.tab && (
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 flex items-center gap-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Go <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI COACH REVIEW MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showCoachReview && (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden text-slate-900 dark:text-white"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center space-y-1 relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent" />
                <h2 className="text-lg font-black tracking-tight flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  Hexo's AI Standings Review
                </h2>
                <p className="text-[11px] text-blue-100 font-medium">Real-time standing analysis and performance calibration</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-3xl shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-900/30">
                    🤖
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">AI Coach Hexo reports:</span>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      "Greetings {profile.name}! I've reviewed your current standings."
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Standing Diagnostics:</h4>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="text-base">📈</span>
                      <span>You are ranked <strong className="text-slate-950 dark:text-white">#{userRank}</strong> with <strong className="text-slate-950 dark:text-white">{myPoints} pts</strong>.</span>
                    </li>
                    {leadingPoints !== null && (
                      <li className="flex items-center gap-2">
                        <span className="text-base">🚀</span>
                        <span>The leader has <strong className="text-slate-950 dark:text-white">{leadingPoints} pts</strong>. You need <strong className="text-indigo-600 dark:text-indigo-400">{Math.max(1, leadingPoints - myPoints + 5)} pts</strong> to take #1!</span>
                      </li>
                    )}
                    {myMedals.length > 0 && (
                      <li className="flex items-center gap-2">
                        <span className="text-base">🎖️</span>
                        <span>You've earned <strong className="text-amber-600 dark:text-amber-400">{myMedals.length} medal{myMedals.length > 1 ? 's' : ''}</strong>. Keep going!</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Next High-Point Actions:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'AI Mock Interview Arena', pts: '+100 pts', tab: 'interview' as const, icon: '🤖' },
                      { label: 'Complete Course Quiz',    pts: '+50 pts',  tab: 'locked-roadmap' as const, icon: '📝' },
                      { label: 'Scan & Optimize Resume',  pts: '+80 pts',  tab: 'resume' as const, icon: '📄' },
                    ].map(action => (
                      <button
                        key={action.label}
                        onClick={() => { setShowCoachReview(false); onNavigate(action.tab); }}
                        className="p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 dark:border-indigo-900/40 rounded-xl text-left flex items-center justify-between text-xs font-black group transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{action.icon}</span>
                          <span>{action.label}</span>
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          {action.pts} <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
                <button
                  onClick={() => setShowCoachReview(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Understood, Coach!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Podium Card Sub-Component ─────────────────────────────────────────────

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry & { isCurrentUser: boolean }; rank: 0 | 1 | 2 }) {
  const meta = RANK_MEDALS[rank];
  const isFirst = rank === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`flex flex-col items-center ${isFirst ? 'order-1 md:order-2 z-10' : rank === 1 ? 'order-2 md:order-1' : 'order-3'} w-full ${isFirst ? 'md:w-52' : 'md:w-44'}`}
    >
      {/* Crown for 1st */}
      {isFirst && (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="text-2xl mb-1"
        >
          👑
        </motion.div>
      )}

      {/* Avatar Ring */}
      <div className="relative mb-3">
        {isFirst && <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />}
        <div className={`${isFirst ? 'w-24 h-24' : 'w-20 h-20'} rounded-full ${meta.ring} flex items-center justify-center text-4xl shadow-lg overflow-hidden relative bg-white dark:bg-slate-800`}>
          {getAvatar(entry.name)}
        </div>
        <span className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-lg shadow">
          {meta.icon}
        </span>
      </div>

      {/* Name */}
      <div className="text-center space-y-0.5 mb-3">
        <h3 className={`${isFirst ? 'text-base' : 'text-sm'} font-black text-slate-900 dark:text-white flex items-center justify-center gap-1`}>
          {entry.name}
          {entry.isCurrentUser && <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">YOU</span>}
        </h3>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[140px]">{entry.dreamCareer}</p>
      </div>

      {/* Podium Base */}
      <div className={`w-full bg-gradient-to-b ${meta.bg} border-2 ${
        isFirst ? 'border-yellow-300 dark:border-yellow-700/40' : rank === 1 ? 'border-slate-200 dark:border-slate-700/40' : 'border-amber-200/50 dark:border-amber-800/20'
      } rounded-t-2xl px-4 py-5 text-center space-y-1.5 shadow-md ${meta.podiumHeight} flex flex-col justify-center relative`}>
        {isFirst && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-t-full" />}
        <div className={`${isFirst ? 'text-xl' : 'text-lg'} font-black ${isFirst ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
          {entry.points} pts
        </div>
        <div className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
          isFirst ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                  : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300'
        }`}>
          {entry.level.icon} {entry.level.title}
        </div>
        <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[130px] mt-0.5 font-medium">{entry.college}</div>
        {/* Medals row */}
        {entry.medals.length > 0 && (
          <div className="flex justify-center gap-0.5 mt-1 flex-wrap">
            {entry.medals.slice(0, 3).map(m => (
              <span key={m.id} className="text-xs" title={m.title}>{m.icon}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
