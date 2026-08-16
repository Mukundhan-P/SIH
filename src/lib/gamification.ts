/// <reference types="vite/client" />
/**
 * Gamification Engine — Firebase Firestore backed, server-validated points system.
 * All point awards go through the server endpoint to prevent client-side manipulation.
 */

import { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  type Firestore,
} from 'firebase/firestore';

// ─── Client-Side Firebase Initialization ────────────────────────────────────
// Uses VITE_ env vars so the browser bundle can access Firestore for onSnapshot.

let clientDb: Firestore | null = null;

export function initClientFirebase(): Firestore | null {
  if (clientDb) return clientDb;
  try {
    const config = {
      apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    };
    if (!config.apiKey || !config.projectId) return null;
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    clientDb = getFirestore(app);
    return clientDb;
  } catch (e) {
    console.error('[GAMIFICATION] Failed to init client Firebase:', e);
    return null;
  }
}

// ─── Types & Constants ───────────────────────────────────────────────────────

export type PointEvent =
  | 'daily_login'
  | 'topic_complete'
  | 'quiz_pass'
  | 'quiz_perfect'
  | 'coding_pass'
  | 'roadmap_complete'
  | 'resume_scan'
  | 'interview_complete'
  | 'assessment_pass';

export const POINT_VALUES: Record<PointEvent, number> = {
  daily_login:        10,
  topic_complete:     15,
  quiz_pass:          50,
  quiz_perfect:       80,       // score >= 90%
  coding_pass:        60,
  roadmap_complete:   200,
  resume_scan:        80,
  interview_complete: 100,
  assessment_pass:    40,
};

export interface Medal {
  id: string;
  title: string;
  icon: string;
  desc: string;
  color: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Beginner',   icon: '🌱', minPoints: 0,    maxPoints: 99,   color: 'from-emerald-500 to-teal-500' },
  { level: 2, title: 'Novice',     icon: '⚡', minPoints: 100,  maxPoints: 299,  color: 'from-blue-500 to-cyan-500' },
  { level: 3, title: 'Explorer',   icon: '🚀', minPoints: 300,  maxPoints: 599,  color: 'from-indigo-500 to-purple-500' },
  { level: 4, title: 'Specialist', icon: '🎓', minPoints: 600,  maxPoints: 999,  color: 'from-amber-500 to-orange-500' },
  { level: 5, title: 'Expert',     icon: '🔥', minPoints: 1000, maxPoints: 1999, color: 'from-rose-500 to-pink-500' },
  { level: 6, title: 'Master',     icon: '👑', minPoints: 2000, maxPoints: Infinity, color: 'from-yellow-400 to-amber-500' },
];

/** Medal definitions (stable — matched by id) */
export const MEDAL_DEFS: Record<string, Medal> = {
  first_steps: { id: 'first_steps', title: 'First Steps',     icon: '🌱', desc: 'Earned your first points',            color: 'text-emerald-500' },
  scholar:     { id: 'scholar',     title: 'Course Scholar',  icon: '📚', desc: 'Completed a course module',           color: 'text-blue-500' },
  quiz_ace:    { id: 'quiz_ace',    title: 'Quiz Ace',        icon: '✍️', desc: 'Passed a course quiz',                color: 'text-indigo-500' },
  ats:         { id: 'ats',         title: 'ATS Approved',    icon: '📄', desc: 'Scanned & optimised your resume',     color: 'text-violet-500' },
  warrior:     { id: 'warrior',     title: 'Arena Warrior',   icon: '🤖', desc: 'Completed a full mock interview',     color: 'text-rose-500' },
  explorer:    { id: 'explorer',    title: 'Explorer Star',   icon: '⭐', desc: 'Surpassed 300 points',               color: 'text-amber-500' },
  specialist:  { id: 'specialist',  title: 'Specialist',      icon: '🎓', desc: 'Reached Specialist level',           color: 'text-orange-500' },
  elite:       { id: 'elite',       title: 'Elite Coder',     icon: '🔥', desc: 'Reached Expert level — top 10%',     color: 'text-red-500' },
  master:      { id: 'master',      title: 'Grand Master',    icon: '👑', desc: 'Reached the pinnacle — Master rank', color: 'text-yellow-500' },
};

export function getLevelInfo(points: number): LevelInfo {
  return [...LEVELS].reverse().find(l => points >= l.minPoints) || LEVELS[0];
}

export function getProgressToNextLevel(points: number): number {
  const current = getLevelInfo(points);
  if (current.maxPoints === Infinity) return 100;
  const range = current.maxPoints - current.minPoints + 1;
  const filled = points - current.minPoints;
  return Math.min(100, Math.max(2, Math.round((filled / range) * 100)));
}

export function getMedals(points: number, completedDays: number, quizzesPassed: number, interviewDone: boolean, resumeScanned: boolean): Medal[] {
  const medals: Medal[] = [];
  if (points >= 10)        medals.push(MEDAL_DEFS.first_steps);
  if (completedDays >= 1)  medals.push(MEDAL_DEFS.scholar);
  if (quizzesPassed >= 1)  medals.push(MEDAL_DEFS.quiz_ace);
  if (resumeScanned)       medals.push(MEDAL_DEFS.ats);
  if (interviewDone)       medals.push(MEDAL_DEFS.warrior);
  if (points >= 300)       medals.push(MEDAL_DEFS.explorer);
  if (points >= 600)       medals.push(MEDAL_DEFS.specialist);
  if (points >= 1000)      medals.push(MEDAL_DEFS.elite);
  if (points >= 2000)      medals.push(MEDAL_DEFS.master);
  return medals;
}

/** Convert a Firestore gamification doc's medal id array to full Medal objects */
export function hydrateMedals(medalIds: string[]): Medal[] {
  if (!Array.isArray(medalIds)) return [];
  return medalIds.map(id => MEDAL_DEFS[id]).filter(Boolean);
}

// ─── Duplicate-Award Prevention (localStorage layer) ─────────────────────────
// The server performs its own dedup via Firestore `awardedEvents` array.
// localStorage is a fast client-side guard so we don't even fire the request twice.
// Keys are SCOPED PER USER so different users on the same browser are independent.

function currentUserId(): string {
  // Uses the user ID stored on login — falls back to a hash of the token
  return localStorage.getItem('halohex_user_id') || localStorage.getItem('halohex_user_email') || 'anon';
}

function getDedupeKey(event: PointEvent, contextId: string): string {
  return `halohex_awarded_${currentUserId()}_${event}_${contextId}`;
}

export function hasAlreadyAwarded(event: PointEvent, contextId: string): boolean {
  return !!localStorage.getItem(getDedupeKey(event, contextId));
}

export function markAwarded(event: PointEvent, contextId: string): void {
  localStorage.setItem(getDedupeKey(event, contextId), '1');
}

// ─── Server Award Function ───────────────────────────────────────────────────

/**
 * Awards points via the secure server endpoint.
 * Returns the new total points or null on failure / dedup.
 */
export async function awardPoints(
  event: PointEvent,
  contextId: string,    // unique ID to prevent duplicates (e.g. dayId, 'resume', 'interview')
  token: string
): Promise<number | null> {
  // Fast local dedup — server will also dedup, but this avoids network round-trip
  if (hasAlreadyAwarded(event, contextId)) return null;

  try {
    const res = await fetch('/api/gamification/award', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ event, contextId }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.success) {
      markAwarded(event, contextId);
      return data.totalPoints;
    }
    // Already awarded on server — sync local flag too
    if (data.reason === 'already_awarded') {
      markAwarded(event, contextId);
    }
    return null;
  } catch {
    return null;
  }
}

// ─── LeaderboardEntry Type ───────────────────────────────────────────────────

export interface LeaderboardEntry {
  uid: string;
  name: string;
  email: string;
  points: number;
  level: LevelInfo;
  medals: Medal[];
  college: string;
  dreamCareer: string;
  completedDays: number;
  quizzesPassed: number;
  interviewDone: boolean;
  resumeScanned: boolean;
}

// ─── Real-Time Leaderboard Hook ───────────────────────────────────────────────
// Dual mode: tries Firestore onSnapshot for real-time, falls back to REST polling.

export function useRealtimeLeaderboard(maxEntries = 100): {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
} {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Map raw REST/Firestore doc to LeaderboardEntry ──────────────────────────
  function mapEntry(data: any, docId?: string): LeaderboardEntry {
    const points: number = data.points || 0;
    return {
      uid:          docId || data.uid || '',
      name:         data.name || data.fullName || 'Unknown',
      email:        data.email || '',
      points,
      level:        getLevelInfo(points),
      medals:       hydrateMedals(data.medals || []),
      college:      data.college || '',
      dreamCareer:  data.dreamCareer || '',
      completedDays:  data.completedDays || 0,
      quizzesPassed:  data.quizzesPassed || 0,
      interviewDone:  data.interviewDone || false,
      resumeScanned:  data.resumeScanned || false,
    };
  }

  // ── REST API fallback (always works — reads from users collection) ───────────
  async function fetchFromApi() {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) return;
      const data = await res.json();
      const raw: any[] = data.leaderboard || [];
      setEntries(raw.slice(0, maxEntries).map(d => mapEntry(d)));
      setLoading(false);
      setError(null);
    } catch (e) {
      console.error('[LEADERBOARD] REST fetch error:', e);
    }
  }

  useEffect(() => {
    // Immediately fetch from REST (guaranteed to work)
    fetchFromApi();

    // Poll every 10s so changes from any user reflect
    pollRef.current = setInterval(fetchFromApi, 10000);

    // Also try Firestore onSnapshot for true real-time (works once rules allow it)
    const db = initClientFirebase();
    if (db) {
      try {
        const q = query(
          collection(db, 'gamification'),
          orderBy('points', 'desc'),
          limit(maxEntries)
        );
        unsubRef.current = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) return; // rules blocked or empty — REST fallback handles it
            const rawEntries = snapshot.docs.map(d => mapEntry(d.data(), d.id));
            setEntries(rawEntries);
            setLoading(false);
            setError(null);
            setIsLive(true);
            // Once Firestore works, stop REST polling to save bandwidth
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          },
          (err) => {
            // Rules blocked — REST polling continues as fallback
            console.warn('[LEADERBOARD] Firestore onSnapshot blocked (rules), using REST polling:', err.code);
            setIsLive(false);
          }
        );
      } catch (e) {
        console.warn('[LEADERBOARD] Could not start onSnapshot:', e);
      }
    }

    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [maxEntries]);

  return { entries, loading, error, isLive };
}
