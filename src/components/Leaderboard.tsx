import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Sparkles, RefreshCw, Flame, Award, ShieldCheck, Target,
  Star, Code, FileText, Cpu, BookOpen, ChevronRight, User, HelpCircle,
  Calendar, CheckCircle, ArrowRight, Zap, GraduationCap, Play, Info
} from 'lucide-react';
import type { StudentProfile, StudyTask, ResumeAnalysis } from '../types';

interface LeaderboardProps {
  profile: StudentProfile;
  studyTasks: StudyTask[];
  resumeAnalysis: ResumeAnalysis | null;
  activeInterview: any;
  onNavigate: (tabId: 'mentor' | 'roadmap' | 'resume' | 'interview' | 'courses' | 'locked-roadmap' | 'syllabus-timeline' | 'dbInspect') => void;
}

export default function Leaderboard({
  profile,
  studyTasks,
  resumeAnalysis,
  activeInterview,
  onNavigate
}: LeaderboardProps) {
  const [showCoachReview, setShowCoachReview] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTip, setShowTip] = useState<number | null>(null);
  const [liveUsers, setLiveUsers] = useState<{ name: string; email: string; xp: number; college: string; dreamCareer: string }[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch leaderboard from server
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLiveUsers(data.leaderboard || []);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard', e);
    }
  };

  // Push current user XP to server
  const pushXP = async (xp: number) => {
    try {
      const token = localStorage.getItem('halohex_token');
      if (!token) return;
      await fetch('/api/leaderboard/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ xp })
      });
    } catch (e) {
      console.error('Failed to push XP', e);
    }
  };

  // On mount: fetch leaderboard + start polling every 10s
  useEffect(() => {
    fetchLeaderboard();
    pollRef.current = setInterval(fetchLeaderboard, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Dynamic XP calculations — only quiz completions and completed proctored interview
  const calculateDynamicXP = () => {
    let xp = 0;

    // 1. Proctored Interview (+100 XP only when fully completed)
    let interviewXP = 0;
    if (activeInterview && activeInterview.isComplete) {
      interviewXP = 100;
    }
    xp += interviewXP;

    // 2. Quizzes from roadmap progress in localStorage (+50 XP each)
    let roadmapCompletedDays = 0;
    let quizzesTaken = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('roadmap_progress_')) {
          const valStr = localStorage.getItem(key);
          if (valStr) {
            const val = JSON.parse(valStr);
            if (val.completedDays && Array.isArray(val.completedDays)) {
              roadmapCompletedDays += val.completedDays.length;
            }
            if (val.quizScores && typeof val.quizScores === 'object') {
              quizzesTaken += Object.keys(val.quizScores).length;
            }
          }
        }
      }
    } catch (e) {
      console.error("Error reading roadmap progress from localStorage for XP", e);
    }

    xp += quizzesTaken * 50;

    return {
      totalXP: xp,
      completedTasksCount: 0,
      roadmapCompletedDays,
      quizzesTaken,
      interviewXP,
      hasResume: !!resumeAnalysis,
      hasInterview: !!activeInterview && activeInterview.isComplete
    };
  };

  const xpMetrics = calculateDynamicXP();
  const currentXP = xpMetrics.totalXP;

  // Determine syllabus level & title based on XP thresholds
  const getLevelInfo = (xp: number) => {
    if (xp < 100) {
      return {
        level: 'Beginner',
        icon: '🌱',
        nextMilestone: 100,
        desc: 'Getting started in your learning path',
        color: 'from-emerald-500 to-teal-500'
      };
    } else if (xp < 300) {
      return {
        level: 'Novice',
        icon: '⚡',
        nextMilestone: 300,
        desc: 'Acquiring stable core competencies',
        color: 'from-blue-500 to-indigo-500'
      };
    } else if (xp < 600) {
      return {
        level: 'Explorer',
        icon: '🚀',
        nextMilestone: 600,
        desc: 'Exploring advanced engineering vectors',
        color: 'from-purple-500 to-pink-500'
      };
    } else if (xp < 1000) {
      return {
        level: 'Specialist',
        icon: '🎓',
        nextMilestone: 1000,
        desc: 'Deep specialized domain mastery',
        color: 'from-amber-500 to-orange-500'
      };
    } else {
      return {
        level: 'Master',
        icon: '👑',
        nextMilestone: 2000,
        desc: 'Ultimate career readiness authority',
        color: 'from-red-500 to-rose-500'
      };
    }
  };

  const levelInfo = getLevelInfo(currentXP);

  // Dynamic progress to next level
  const prevMilestone = levelInfo.level === 'Beginner' ? 0 : 
                       levelInfo.level === 'Novice' ? 100 :
                       levelInfo.level === 'Explorer' ? 300 :
                       levelInfo.level === 'Specialist' ? 600 : 1000;
  const range = levelInfo.nextMilestone - prevMilestone;
  const filled = currentXP - prevMilestone;
  const levelProgressPercentage = Math.min(100, Math.max(5, Math.round((filled / range) * 100)));

  // ATS score formatting
  const formattedAtsScore = resumeAnalysis ? `${resumeAnalysis.atsScore}%` : 'No Upload';

  // Badges Earned check
  const getBadges = () => {
    const badgesList = [];
    if (xpMetrics.quizzesTaken > 0 || xpMetrics.interviewXP > 0) {
      badgesList.push({ id: 'welcome', title: 'First Steps', icon: '🌱', desc: 'Earned your first XP' });
    }
    if (xpMetrics.roadmapCompletedDays > 0) {
      badgesList.push({ id: 'roadmap', title: 'Course Scholar', icon: '📚', desc: 'Completed a course module' });
    }
    if (xpMetrics.quizzesTaken > 0) {
      badgesList.push({ id: 'quiz', title: 'Quiz Master', icon: '✍️', desc: 'Scored high on course quiz' });
    }
    if (xpMetrics.hasResume) {
      badgesList.push({ id: 'resume', title: 'ATS Approved', icon: '📄', desc: 'Optimized resume successfully' });
    }
    if (xpMetrics.hasInterview) {
      badgesList.push({ id: 'interview', title: 'Arena Warrior', icon: '🤖', desc: 'Completed a full AI mock interview' });
    }
    if (currentXP >= 300) {
      badgesList.push({ id: 'elite', title: 'Explorer Star', icon: '⭐', desc: 'Surpassed 300 total XP' });
    }
    return badgesList;
  };

  const earnedBadges = getBadges();

  // Push XP to server whenever it changes (only if > 0)
  useEffect(() => {
    if (currentXP > 0) pushXP(currentXP);
  }, [currentXP]);

  // Handle reload action
  const handleReload = () => {
    setIsRefreshing(true);
    fetchLeaderboard().then(() => setIsRefreshing(false));
  };

  // Build merged leaderboard: live server users + current user (always up to date)
  const mergedLeaderboard = (() => {
    const serverUsers = liveUsers.filter(u => u.email !== (profile as any).email && u.name !== profile.name);
    const currentUserEntry = {
      name: profile.name,
      email: (profile as any).email || '',
      xp: currentXP,
      college: profile.college || '',
      dreamCareer: profile.dreamCareer || '',
      isCurrentUser: true
    };
    const combined = [
      currentUserEntry,
      ...serverUsers.map(u => ({ ...u, isCurrentUser: false }))
    ].sort((a, b) => b.xp - a.xp);
    return combined;
  })();

  const userRank = mergedLeaderboard.findIndex(u => u.isCurrentUser) + 1;

  return (
    <div className="space-y-8 pb-12" id="leaderboard-root">
      {/* 1. HERO HEADER SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Abstract background gradient decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3.5 max-w-3xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-blue-50 dark:bg-blue-955/40 border border-blue-100 dark:border-blue-900/50 rounded-full text-blue-700 dark:text-blue-400 text-xs font-black tracking-wider uppercase">
              <Trophy className="w-3.5 h-3.5" /> Community Competition
            </div>
            <h1 className="text-2xl md:text-3.5xl font-black text-slate-950 dark:text-white tracking-tight">
              HaloHex Community Leaderboard
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Compete, level up, and conquer the leaderboard in real time! Gain XP automatically by finishing lessons, scoring high on quizzes, performing mock interviews, and perfecting your resume.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto shrink-0 mt-2 lg:mt-0">
            <button
              onClick={() => setShowCoachReview(true)}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs md:text-sm font-black px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-indigo-400/20"
              id="coach-standing-review-btn"
            >
              <Sparkles className="w-4.5 h-4.5 animate-pulse text-yellow-350" />
              AI Coach Standings Review
            </button>
            <button
              onClick={handleReload}
              className={`p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-350 dark:border-slate-700 rounded-2xl shadow-sm transition-all cursor-pointer ${
                isRefreshing ? 'animate-spin' : 'active:scale-90'
              }`}
              title="Refresh Leaderboard"
              id="refresh-leaderboard-btn"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. LEADERBOARD & PROFILE MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: PODIUM & TOP STUDENTS LIST */}
        <div className="lg:col-span-2 space-y-6">
          {/* Animated Podium Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-8 flex items-center gap-2">
              <span className="text-lg">🏆</span> Live Hall of Fame
            </h2>

            <div className="flex flex-col md:flex-row items-end justify-center gap-6 pt-8 pb-4">
              {mergedLeaderboard[1] && (
                <div className="w-full md:w-44 flex flex-col items-center order-2 md:order-1 mt-6 md:mt-0">
                  <div className="relative mb-3.5">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl shadow-md overflow-hidden relative">
                      <span role="img" aria-label="avatar">{mergedLeaderboard[1].isCurrentUser ? "👩🎨" : "🧑💻"}</span>
                    </div>
                    <span className="absolute -top-2 -right-2 bg-slate-400 dark:bg-slate-500 text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm">2</span>
                  </div>
                  <div className="text-center space-y-0.5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">{mergedLeaderboard[1].name}{mergedLeaderboard[1].isCurrentUser && <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">YOU</span>}</h3>
                    <p className="text-[11px] font-bold text-slate-450 dark:text-slate-500 truncate max-w-[150px]">{mergedLeaderboard[1].dreamCareer}</p>
                  </div>
                  <div className="w-full bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 border border-slate-200 dark:border-slate-750 rounded-t-2xl mt-4 px-4 py-6 text-center space-y-1.5 shadow-sm min-h-[140px] flex flex-col justify-center">
                    <div className="text-lg font-black text-slate-750 dark:text-slate-200">{mergedLeaderboard[1].xp} XP</div>
                    <div className="inline-block bg-slate-200/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">{getLevelInfo(mergedLeaderboard[1].xp).level}</div>
                    <div className="text-[9px] text-slate-450 dark:text-slate-500 truncate max-w-[130px] mt-1 font-medium">{mergedLeaderboard[1].college}</div>
                  </div>
                </div>
              )}
              {mergedLeaderboard[0] && (
                <div className="w-full md:w-52 flex flex-col items-center order-1 md:order-2">
                  <div className="relative mb-3.5">
                    <div className="absolute inset-0 bg-yellow-400/20 dark:bg-yellow-400/10 rounded-full blur-xl animate-pulse" />
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-400 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-5xl shadow-lg overflow-hidden relative">
                      <span role="img" aria-label="avatar">{mergedLeaderboard[0].isCurrentUser ? "👩🎨" : "👑"}</span>
                    </div>
                    <span className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[11px] font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">👑</span>
                  </div>
                  <div className="text-center space-y-0.5 relative z-10">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1">{mergedLeaderboard[0].name}{mergedLeaderboard[0].isCurrentUser && <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">YOU</span>}</h3>
                    <p className="text-xs font-bold text-slate-450 dark:text-slate-500">{mergedLeaderboard[0].dreamCareer}</p>
                  </div>
                  <div className="w-full bg-gradient-to-b from-amber-50 to-amber-100/80 dark:from-amber-950/20 dark:to-amber-900/10 border-2 border-amber-200 dark:border-amber-900/40 rounded-t-2xl mt-4 px-4 py-8 text-center space-y-2 shadow-md min-h-[180px] flex flex-col justify-center relative">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-t-full" />
                    <div className="text-xl font-black text-amber-700 dark:text-amber-400">{mergedLeaderboard[0].xp} XP</div>
                    <div><span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 dark:border-amber-800/40">{getLevelInfo(mergedLeaderboard[0].xp).level}</span></div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[160px] mt-1 font-medium">{mergedLeaderboard[0].college}</div>
                  </div>
                </div>
              )}
              {mergedLeaderboard[2] && (
                <div className="w-full md:w-44 flex flex-col items-center order-3 mt-6 md:mt-0">
                  <div className="relative mb-3.5">
                    <div className="w-20 h-20 rounded-full border-4 border-amber-600 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-4xl shadow-md overflow-hidden relative">
                      <span role="img" aria-label="avatar">{mergedLeaderboard[2].isCurrentUser ? "👩🎨" : "👨💻"}</span>
                    </div>
                    <span className="absolute -top-2 -right-2 bg-amber-700 text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm">3</span>
                  </div>
                  <div className="text-center space-y-0.5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">{mergedLeaderboard[2].name}{mergedLeaderboard[2].isCurrentUser && <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">YOU</span>}</h3>
                    <p className="text-[11px] font-bold text-slate-450 dark:text-slate-500 truncate max-w-[150px]">{mergedLeaderboard[2].dreamCareer}</p>
                  </div>
                  <div className="w-full bg-gradient-to-b from-amber-50/50 to-amber-100/20 dark:from-amber-950/5 dark:to-amber-950/10 border border-amber-200/40 dark:border-amber-900/10 rounded-t-2xl mt-4 px-4 py-5 text-center space-y-1.5 shadow-sm min-h-[120px] flex flex-col justify-center">
                    <div className="text-lg font-black text-amber-800 dark:text-amber-500">{mergedLeaderboard[2].xp} XP</div>
                    <div className="inline-block bg-amber-100/30 dark:bg-amber-950/20 text-amber-750 dark:text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">{getLevelInfo(mergedLeaderboard[2].xp).level}</div>
                    <div className="text-[9px] text-slate-450 dark:text-slate-500 truncate max-w-[130px] mt-1 font-medium">{mergedLeaderboard[2].college}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LOWER RANKS LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-5">
              Active Contender Stream
            </h2>
            
            <div className="space-y-3">
              {mergedLeaderboard.map((u, idx) => (
                <div
                  key={u.email || u.name}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    u.isCurrentUser
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800/60 shadow-sm'
                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 dark:bg-slate-850/30 dark:hover:bg-slate-850/60 dark:border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`w-6 text-center text-xs font-black ${idx === 0 ? 'text-yellow-500 text-sm' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-400 dark:text-slate-500'}`}>#{idx + 1}</span>
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-xs">
                      {u.isCurrentUser ? "👩🎨" : "🧑💻"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        {u.name}
                        {u.isCurrentUser && <span className="bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">YOU</span>}
                      </h4>
                      <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                        {u.dreamCareer}{u.college ? ` · ${u.college}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs md:text-sm font-black text-slate-950 dark:text-white block leading-none">{u.xp} XP</span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Level {getLevelInfo(u.xp).level}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MY LEADERBOARD PROFILE CARD */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-slate-950 text-white border border-slate-850 dark:border-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="user-leaderboard-profile-card">
            {/* Subtle card decorations */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -ml-16 -mb-16" />

            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full">
                  My Leaderboard Profile
                </span>
                <span className="text-xs font-black text-indigo-400 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" /> Rank #{userRank}
                </span>
              </div>

              {/* Avatar and Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center text-4xl shadow-md overflow-hidden">
                    👩‍🎨
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 border border-indigo-400 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                    #{userRank}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black truncate">{profile.name}</h3>
                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {profile.college || 'Peter College of engineering'}
                  </p>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800 py-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total XP</span>
                  <p className="text-lg font-black text-indigo-400 leading-none">{currentXP} XP</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Syllabus Level</span>
                  <p className="text-lg font-black text-white leading-none flex items-center gap-1">
                    {levelInfo.icon} {levelInfo.level}
                  </p>
                </div>
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Weekly Streak</span>
                  <p className="text-lg font-black text-amber-400 leading-none flex items-center gap-1.5">
                    <Flame className="w-4.5 h-4.5 text-orange-500 fill-orange-500 animate-pulse" /> 0 Days
                  </p>
                </div>
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">ATS Score</span>
                  <p className="text-lg font-black text-emerald-400 leading-none">{formattedAtsScore}</p>
                </div>
              </div>

              {/* Rank Progression */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Rank Progression</span>
                  <span className="text-indigo-400">Next milestone: {levelInfo.nextMilestone} XP</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgressPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Current: {currentXP} XP</span>
                  <span>{levelInfo.nextMilestone - currentXP} XP needed</span>
                </div>
              </div>

              {/* Earned Badges Stream */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Earned Badges ({earnedBadges.length})
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {earnedBadges.map((badge, idx) => (
                    <div
                      key={badge.id}
                      className="group relative cursor-pointer"
                      onMouseEnter={() => setShowTip(idx)}
                      onMouseLeave={() => setShowTip(null)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xl shadow-inner hover:scale-110 active:scale-95 transition-all">
                        {badge.icon}
                      </div>
                      
                      {/* Tooltip */}
                      <AnimatePresence>
                        {showTip === idx && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-950 text-white border border-slate-800 rounded-lg p-2.5 w-48 text-center shadow-xl z-50 pointer-events-none text-[10px] leading-relaxed"
                          >
                            <p className="font-extrabold text-xs text-indigo-400">{badge.title}</p>
                            <p className="text-slate-400 mt-1 font-medium">{badge.desc}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 3. XP REWARD FORMULA CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
            XP Reward Formula
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: 'Complete Academic Quiz', xp: '+50 XP', icon: '✍️', desc: 'Score high on unit checkpoints', tab: 'locked-roadmap' },
            { title: 'Mock Interview (Full Round)', xp: '+100 XP', icon: '🤖', desc: 'Complete a full proctored interview', tab: 'interview' },
          ].map((item) => (
            <div
              key={item.title}
              onClick={() => onNavigate(item.tab as any)}
              className="bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-850/30 dark:hover:bg-slate-850/50 border border-slate-100 dark:border-slate-800/60 p-4.5 rounded-2xl flex flex-col justify-between space-y-4 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-xs group cursor-pointer"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                  {item.title}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {item.xp}
                </span>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 flex items-center gap-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Go <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. MODAL: AI COACH STANDING REVIEW OVERLAY */}
      <AnimatePresence>
        {showCoachReview && (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden text-slate-900 dark:text-white"
            >
              {/* Card headers decoration */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center space-y-1 relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent" />
                
                <h2 className="text-lg font-black tracking-tight flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  Hexo's AI Standings Review
                </h2>
                <p className="text-[11px] text-blue-100 font-medium">
                  Real-time standing analysis and performance strategy calibration
                </p>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-3xl shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-900/30">
                    🤖
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                      AI Coach Hexo reports:
                    </span>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      "Bzzzt! Greetings {profile.name}! I am Hexo, your robot study proctor and career calibration companion. I have reviewed your current position."
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Standing Diagnostics:
                  </h4>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="text-base">📈</span>
                      <span>You are ranked <strong className="text-slate-950 dark:text-white">#{userRank}</strong> in the competitive path with <strong className="text-slate-950 dark:text-white">{currentXP} XP</strong>.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-base">🚀</span>
                      <span>Monika is leading at <strong className="text-slate-950 dark:text-white">250 XP</strong>. You only need <strong className="text-indigo-600 dark:text-indigo-400">{Math.max(10, 250 - currentXP + 15)} XP</strong> to overtake her and claim the top podium spot!</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Next High-XP Calibration Actions:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setShowCoachReview(false);
                        onNavigate('interview');
                      }}
                      className="p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 dark:border-indigo-900/40 rounded-xl text-left flex items-center justify-between text-xs font-black group transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">🤖</span>
                        <span>AI Mock Interview Arena</span>
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        +100 XP <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowCoachReview(false);
                        onNavigate('locked-roadmap');
                      }}
                      className="p-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 dark:bg-blue-955/20 dark:hover:bg-blue-955/40 dark:border-blue-900/40 rounded-xl text-left flex items-center justify-between text-xs font-black group transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">📝</span>
                        <span>Complete Course Unit Quiz</span>
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        +50 XP <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowCoachReview(false);
                        onNavigate('resume');
                      }}
                      className="p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:border-emerald-900/40 rounded-xl text-left flex items-center justify-between text-xs font-black group transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">📄</span>
                        <span>Scan & Optimize ATS Resume</span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        +80 XP <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
                <button
                  onClick={() => setShowCoachReview(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-250 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white rounded-xl text-xs font-black transition-all cursor-pointer"
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
