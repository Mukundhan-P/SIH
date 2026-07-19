// Persistent user stats stored in localStorage
// Keys: halohex_streak, halohex_last_login, halohex_hours, halohex_session_start, halohex_weekly_activity

export interface UserStats {
  streak: number;          // consecutive login days
  hoursStudied: number;    // total hours studied (accumulated across sessions)
  lastLogin: string;       // YYYY-MM-DD of last login
  sessionStart: number;    // timestamp (ms) of current session start
  weeklyActivity: Record<string, number>; // YYYY-MM-DD -> topics completed that day
}

const KEYS = {
  streak: 'halohex_streak',
  lastLogin: 'halohex_last_login',
  hours: 'halohex_hours',
  sessionStart: 'halohex_session_start',
  weeklyActivity: 'halohex_weekly_activity',
};

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// Called once on login — updates streak and records session start
export function recordLogin(): void {
  const today = todayStr();
  const lastLogin = localStorage.getItem(KEYS.lastLogin) || '';
  const streak = parseInt(localStorage.getItem(KEYS.streak) || '0', 10);

  // Calculate yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = streak;
  if (lastLogin === today) {
    // Already logged in today — no change
    newStreak = streak;
  } else if (lastLogin === yesterdayStr) {
    // Consecutive day — increment streak
    newStreak = streak + 1;
  } else if (lastLogin === '') {
    // First ever login
    newStreak = 1;
  } else {
    // Streak broken
    newStreak = 1;
  }

  localStorage.setItem(KEYS.streak, String(newStreak));
  localStorage.setItem(KEYS.lastLogin, today);
  localStorage.setItem(KEYS.sessionStart, String(Date.now()));
}

// Called periodically or on tab close — accumulates session time into total hours
export function flushSessionHours(): void {
  const sessionStart = parseInt(localStorage.getItem(KEYS.sessionStart) || '0', 10);
  if (!sessionStart) return;

  const elapsed = (Date.now() - sessionStart) / 3600000; // convert ms to hours
  const prev = parseFloat(localStorage.getItem(KEYS.hours) || '0');
  const updated = Math.round((prev + elapsed) * 100) / 100;
  localStorage.setItem(KEYS.hours, String(updated));
  // Reset session start to now so we don't double-count
  localStorage.setItem(KEYS.sessionStart, String(Date.now()));
}

// Increment topic count for today (called when a lesson/quiz is completed)
export function recordTopicCompleted(): void {
  const today = todayStr();
  const raw = localStorage.getItem(KEYS.weeklyActivity);
  const activity: Record<string, number> = raw ? JSON.parse(raw) : {};
  activity[today] = (activity[today] || 0) + 1;
  localStorage.setItem(KEYS.weeklyActivity, JSON.stringify(activity));
}

// Read current stats
export function readStats(): UserStats {
  try {
    const streak = parseInt(localStorage.getItem(KEYS.streak) || '0', 10);
    const lastLogin = localStorage.getItem(KEYS.lastLogin) || '';
    const sessionStart = parseInt(localStorage.getItem(KEYS.sessionStart) || '0', 10);
    const storedHours = parseFloat(localStorage.getItem(KEYS.hours) || '0');
    const sessionElapsed = sessionStart ? (Date.now() - sessionStart) / 3600000 : 0;
    const hoursStudied = Math.round((storedHours + sessionElapsed) * 100) / 100;
    const raw = localStorage.getItem(KEYS.weeklyActivity);
    const weeklyActivity: Record<string, number> = raw ? JSON.parse(raw) : {};
    return { streak, hoursStudied, lastLogin, sessionStart, weeklyActivity };
  } catch {
    return { streak: 0, hoursStudied: 0, lastLogin: '', sessionStart: 0, weeklyActivity: {} };
  }
}

// Get last 7 days of activity as ordered array for chart
export function getWeeklyActivityPoints(): { label: string; date: string; topics: number }[] {
  let activity: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(KEYS.weeklyActivity);
    activity = raw ? JSON.parse(raw) : {};
  } catch { activity = {}; }
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    result.push({
      label: days[d.getDay()],
      date: dateStr,
      topics: activity[dateStr] || 0,
    });
  }
  return result;
}
