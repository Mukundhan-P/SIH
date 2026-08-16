import React, { useState, useEffect, useCallback } from 'react';
import StudentProfileForm from './components/StudentProfileForm';
import Dashboard from './components/Dashboard';
import FloatingChatBot from './components/FloatingChatBot';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import MascotWelcomeScreen from './components/MascotWelcomeScreen';
import type { StudentProfile } from './types';
import { Sparkles, Brain, Sun, Moon, ArrowRight } from 'lucide-react';
import RobotPet from './components/RobotPet';
import { motion } from 'motion/react';

export default function App() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; fullName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [view, setView] = useState<'landing' | 'auth'>('landing');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('halohex_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Apply dark class to document root dynamically
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('halohex_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Restores all roadmap progresses & custom structures from the server database
  const syncUserDataFromServer = async (authToken: string) => {
    try {
      const res = await fetch('/api/user/data', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const { userData } = await res.json();
        if (userData) {
          if (userData.progress) {
            Object.entries(userData.progress).forEach(([courseName, val]) => {
              localStorage.setItem(`roadmap_progress_${courseName}`, JSON.stringify(val));
            });
          }
          if (userData.structures) {
            Object.entries(userData.structures).forEach(([courseName, val]) => {
              localStorage.setItem(`roadmap_structure_${courseName}`, JSON.stringify(val));
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync user data from server", e);
    }
  };

  // Push local storage values of course roadmaps and progress to server database
  const syncUserDataToServer = useCallback(async () => {
    if (!token) return;

    const progress: Record<string, any> = {};
    const structures: Record<string, any> = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (key.startsWith('roadmap_progress_')) {
            const courseName = key.replace('roadmap_progress_', '');
            const val = localStorage.getItem(key);
            if (val) {
              progress[courseName] = JSON.parse(val);
            }
          } else if (key.startsWith('roadmap_structure_')) {
            const courseName = key.replace('roadmap_structure_', '');
            const val = localStorage.getItem(key);
            if (val) {
              structures[courseName] = JSON.parse(val);
            }
          }
        }
      }

      await fetch('/api/user/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userData: { progress, structures }
        })
      });
    } catch (e) {
      console.error("Failed to auto-sync progress to database", e);
    }
  }, [token]);

  // Set up the local storage interceptor so that any change to progress or structures triggers server sync in real time
  useEffect(() => {
    if (!token) return;

    (window as any).syncUserProgressToServer = () => {
      syncUserDataToServer();
    };

    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key: string, value: string) => {
      originalSetItem(key, value);
      if (key.startsWith('roadmap_progress_') || key.startsWith('roadmap_structure_') || key === 'halohex_interview_scores') {
        window.dispatchEvent(new Event('storage'));
        if (key.startsWith('roadmap_progress_') || key.startsWith('roadmap_structure_')) {
          if ((window as any).syncUserProgressToServer) {
            (window as any).syncUserProgressToServer();
          }
        }
      }
    };

    return () => {
      localStorage.setItem = originalSetItem;
      delete (window as any).syncUserProgressToServer;
    };
  }, [token, syncUserDataToServer]);

  // Check persistent authentication on initial load
  useEffect(() => {
    const verifyAuthSession = async () => {
      try {
        const savedToken = localStorage.getItem('halohex_token');
        if (savedToken) {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setToken(savedToken);
            setUser({ email: data.email, fullName: data.fullName });
            // Store user identity for per-user gamification keys
            localStorage.setItem('halohex_user_id', data.id || data.email);
            localStorage.setItem('halohex_user_email', data.email);
            if (data.profile) {
              setProfile(data.profile);
              localStorage.setItem('halohex_profile', JSON.stringify(data.profile));
              setShowWelcomeScreen(false);
            } else {
              setProfile(null);
              setShowWelcomeScreen(true);
            }
            // Pull progress & structures for this user immediately upon verified session restoration
            await syncUserDataFromServer(savedToken);
          } else {
            // Token expired or server restarted and wiped memory session
            localStorage.removeItem('halohex_token');
            localStorage.removeItem('halohex_profile');
          }
        } else {
          // If no token, clear any leftover stale profiles
          localStorage.removeItem('halohex_profile');
        }
      } catch (e) {
        console.error("Session verification failed", e);
      } finally {
        setLoading(false);
      }
    };
    verifyAuthSession();
  }, []);

  const handleLoginSuccess = async (newToken: string, loginUser: { email: string; fullName: string; profile: any }) => {
    setToken(newToken);
    setUser({ email: loginUser.email, fullName: loginUser.fullName });
    try {
      localStorage.setItem('halohex_token', newToken);
      localStorage.setItem('halohex_user_id', loginUser.profile?.id || loginUser.email);
      localStorage.setItem('halohex_user_email', loginUser.email);
    } catch (e) {
      console.error(e);
    }
    if (loginUser.profile) {
      setProfile(loginUser.profile);
      setShowWelcomeScreen(false);
      try {
        localStorage.setItem('halohex_profile', JSON.stringify(loginUser.profile));
      } catch (e) {
        console.error(e);
      }
    } else {
      setProfile(null);
      setShowWelcomeScreen(true);
    }
    // Pull progress & structures for this user immediately upon successful login
    await syncUserDataFromServer(newToken);
  };

  const handleProfileSubmit = async (newProfile: StudentProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('halohex_profile', JSON.stringify(newProfile));
      if (token) {
        // Synchronize student profile to backend server
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profile: newProfile })
        });
      }
    } catch (e) {
      console.error("Failed to sync profile with database", e);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error("Logout request failed", e);
    }

    setProfile(null);
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('halohex_profile');
      localStorage.removeItem('halohex_token');
      localStorage.removeItem('halohex_profile');
      localStorage.removeItem('halohex_user_id');
      localStorage.removeItem('halohex_user_email');

      // Clear all cached course progresses and structures to prevent leakage between accounts
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('roadmap_progress_') || key.startsWith('roadmap_structure_'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error("Failed to clear local storage profile", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 font-sans" id="app-loader">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
          <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin-slow" />
        </div>
        <p className="mt-4 text-xs tracking-wider font-semibold uppercase text-slate-500 dark:text-slate-400">Connecting to Mentorship Portal...</p>
      </div>
    );
  }

  const isDashboardVisible = !!token && !!profile;
  const showStandardHeader = false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200" id="app-root">
      {/* Onboarding / Login top bar */}
      {showStandardHeader && (
        <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => !token && setView('landing')}
              className="flex items-center gap-2 text-left focus:outline-none cursor-pointer"
            >
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">HaloHex</span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-sm">
                PATH AI
              </span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Onboarding Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white dark:border-slate-700"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
            {token && (
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900 border border-rose-100 dark:border-rose-900/50 rounded-xl transition-all cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </header>
      )}

      {/* Primary body orchestrator */}
      <div className="flex-1 flex flex-col justify-center">
        {isDashboardVisible ? (
          <Dashboard profile={profile} onProfileUpdate={handleProfileSubmit} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
        ) : !token ? (
          view === 'landing' ? (
            <LandingPage
              onGetStarted={() => setView('auth')}
              onLoginClick={() => setView('auth')}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          ) : (
            <div className="py-12 px-4 md:px-8 max-w-lg mx-auto w-full">
              <button 
                onClick={() => setView('landing')}
                className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                ← Back to Homepage
              </button>
              <LoginPage onLoginSuccess={handleLoginSuccess} theme={theme} />
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            {showWelcomeScreen ? (
              <MascotWelcomeScreen 
                userName={user?.fullName || ''} 
                onProceed={() => setShowWelcomeScreen(false)} 
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            ) : (
              <div className="py-12 px-4 md:px-8">
                <StudentProfileForm onSubmit={handleProfileSubmit} initialName={user?.fullName || ''} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Chat Launcher Panel - Render ONLY after profile has been successfully onboarded */}
      {token && profile && <FloatingChatBot profile={profile} />}
    </div>
  );
}
