/// <reference types="vite/client" />
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ChevronLeft, ChevronRight, X, Gift, CheckCircle2 } from 'lucide-react';
import { awardPoints, hasAlreadyAwarded } from '../lib/gamification';

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function loginHistoryKey(): string {
  const uid = localStorage.getItem('halohex_user_id') || localStorage.getItem('halohex_user_email') || 'anon';
  return `halohex_login_history_${uid}`;
}

function getLoginHistory(): string[] {
  try {
    const raw = localStorage.getItem(loginHistoryKey());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function recordLoginDay(dateStr: string): void {
  const history = getLoginHistory();
  if (!history.includes(dateStr)) {
    history.push(dateStr);
    localStorage.setItem(loginHistoryKey(), JSON.stringify(history));
  }
}

function computeStreak(history: string[]): number {
  const sorted = [...history].sort().reverse();
  const today = todayKey();
  let streak = 0;
  let checking = today;
  for (const d of sorted) {
    if (d === checking) {
      streak++;
      const prev = new Date(checking);
      prev.setDate(prev.getDate() - 1);
      checking = prev.toISOString().split('T')[0];
    } else if (d < checking) {
      break;
    }
  }
  return streak;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS  = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function buildCalendarGrid(year: number, month: number, loginHistory: string[]): { date: string | null; day: number | null; logged: boolean; isToday: boolean }[][] {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  // JS getDay(): 0=Sun,1=Mon...6=Sat → convert to Mo-first: Mo=0..Su=6
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayKey();

  const cells: { date: string | null; day: number | null; logged: boolean; isToday: boolean }[] = [];

  // leading blanks
  for (let i = 0; i < startDow; i++) cells.push({ date: null, day: null, logged: false, isToday: false });

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date: dateStr, day: d, logged: loginHistory.includes(dateStr), isToday: dateStr === today });
  }

  // chunk into rows of 7
  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  // pad last row to 7
  while (rows[rows.length - 1]?.length < 7) {
    rows[rows.length - 1].push({ date: null, day: null, logged: false, isToday: false });
  }
  return rows;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DailyCheckin() {
  const [open, setOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loginHistory, setLoginHistory] = useState<string[]>([]);
  const [showPop, setShowPop] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const today = todayKey();

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const history = getLoginHistory();
    setLoginHistory(history);
    setStreak(computeStreak(history));
    if (hasAlreadyAwarded('daily_login', `login_${today}`)) {
      setClaimed(true);
      recordLoginDay(today);
    }
  }, [today]);

  // ── Navigate month ────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // ── Claim ──────────────────────────────────────────────────────────────────
  const handleClaim = useCallback(async () => {
    if (claimed || claiming) return;
    setClaiming(true);
    const token = localStorage.getItem('halohex_token');
    if (!token) { setClaiming(false); return; }

    await awardPoints('daily_login', `login_${today}`, token);
    recordLoginDay(today);
    const newHistory = getLoginHistory();
    setLoginHistory(newHistory);
    setStreak(computeStreak(newHistory));
    setClaimed(true);
    setClaiming(false);
    setShowPop(true);
    setTimeout(() => setShowPop(false), 2500);
  }, [claimed, claiming, today]);

  const rows = buildCalendarGrid(viewYear, viewMonth, loginHistory);

  const flameColor = streak >= 14 ? 'text-orange-400' : streak >= 7 ? 'text-amber-400' : 'text-amber-500';

  return (
    <>
      {/* ── Floating Trigger Button ─────────────────────────────────────── */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2" id="daily-checkin-float">

        {/* Mini celebration pop */}
        <AnimatePresence>
          {showPop && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="bg-emerald-500 text-white text-xs font-black px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 pointer-events-none"
            >
              🎉 +10 pts Claimed!
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen(o => !o)}
          id="daily-checkin-fab"
          className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all cursor-pointer ${
            claimed
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30'
              : 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/30'
          }`}
          title={claimed ? `Streak: ${streak} days — claimed today ✓` : 'Daily Check-In — Claim your +10 pts!'}
        >
          {/* Calendar icon SVG */}
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            {claimed && <path d="M8 14l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>

          {/* Streak badge */}
          {streak > 0 && (
            <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-amber-400 border-2 border-white dark:border-slate-950 rounded-full text-[9px] font-black text-white flex items-center justify-center`}>
              {streak}🔥
            </span>
          )}

          {/* Unclaimed pulse ring */}
          {!claimed && (
            <span className="absolute inset-0 rounded-full ring-2 ring-rose-400/60 animate-ping pointer-events-none" />
          )}
        </motion.button>
      </div>

      {/* ── Calendar Popup ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            />

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              className="fixed bottom-40 right-6 z-50 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
              id="daily-checkin-popup"
            >
              {/* ── Calendar Header ──────────────────────────────── */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <span className={`text-xs font-black flex items-center gap-1 ${flameColor}`}>
                    <Flame className="w-3.5 h-3.5" /> {streak}d
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevMonth}
                    className="w-7 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="w-7 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ── Day Labels ──────────────────────────────────── */}
              <div className="grid grid-cols-7 px-4 mb-1">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-slate-400 dark:text-slate-500 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* ── Calendar Grid ────────────────────────────────── */}
              <div className="px-4 space-y-1 pb-2">
                {rows.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-7 gap-y-1">
                    {row.map((cell, ci) => (
                      <div
                        key={ci}
                        className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          !cell.day
                            ? ''
                            : cell.isToday && cell.logged
                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40 font-black'
                            : cell.isToday
                            ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/40 font-black ring-2 ring-rose-300 dark:ring-rose-700'
                            : cell.logged
                            ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-black'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {cell.day ?? ''}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* ── Claim / Claimed Bar ──────────────────────────── */}
              <div className="px-4 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 mt-1">
                {!claimed ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleClaim}
                    disabled={claiming}
                    id="daily-checkin-claim-btn"
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-sm py-3 rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {claiming ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Claiming…</>
                    ) : (
                      <><Gift className="w-4 h-4" /> Claim Today's +10 pts</>
                    )}
                  </motion.button>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 font-black text-xs py-3 rounded-2xl">
                    <CheckCircle2 className="w-4 h-4" />
                    Claimed! Come back tomorrow 🔥
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-4 justify-center mt-3 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-100 dark:bg-rose-950/50 border border-rose-300 inline-block" />
                    Logged
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Today
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Claimed
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
