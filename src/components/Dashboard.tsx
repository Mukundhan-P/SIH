import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { StudentProfile, ChatMessage, CareerRecommendation, StudyTask, ResumeAnalysis, InterviewRoundState } from '../types';
import { calculateLearningDNA } from '../lib/learningDnaEngine';
import { recordLogin, flushSessionHours, readStats } from '../lib/userStats';
import { awardPoints } from '../lib/gamification';
import AIPersonalityAvatar from './AIPersonalityAvatar';
import AnalyticsCharts from './AnalyticsCharts';
import RevisionPredictor from './RevisionPredictor';
import ResumeAnalyzer from './ResumeAnalyzer';
import MockInterviewArena from './MockInterviewArena';
import AIChatBot from './AIChatBot';
import LockedRoadmap from './LockedRoadmap';
import DatabaseInspector from './DatabaseInspector';
import Leaderboard from './Leaderboard';
import CompareCareers from './CompareCareers';
import CodeEditor from './CodeEditor';
import DailyCheckin from './DailyCheckin';
import {
  MessageSquare, Compass, Calendar, FileText, Cpu, BarChart2, BookOpen, GraduationCap,
  Sparkles, Flame, Award, ChevronRight, ChevronLeft, LogOut, CheckCircle, Volume2, Globe, Send, HelpCircle, ArrowRight, ShieldCheck, Target, ListChecks, User, Sun, Moon, Database, Settings, Trophy, ArrowRightLeft, Terminal, Brain
} from 'lucide-react';

interface DashboardProps {
  profile: StudentProfile;
  onProfileUpdate?: (profile: StudentProfile) => void;
  onLogout: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function Dashboard({ profile, onProfileUpdate, onLogout, theme = 'light', onToggleTheme }: DashboardProps) {
  // Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'mentor' | 'revisionPredictor' | 'compareCareers' | 'codeEditor' | 'resume' | 'interview' | 'analytics' | 'courses' | 'locked-roadmap' | 'syllabus-timeline' | 'course-mcq' | 'leaderboard' | 'dbInspect'>('locked-roadmap');

  // Shared Course Roadmap & Lesson States
  const [selectedCourse, setSelectedCourse] = useState<string>("Python Crash Course");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);

  const [activeDay, setActiveDay] = useState<any>(null);
  const [lessonContent, setLessonContent] = useState<any>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);
  
  const [flowStep, setFlowStep] = useState<'content' | 'mcq' | 'result' | 'exam'>('content');
  const [isMarkedAsLearned, setIsMarkedAsLearned] = useState<boolean>(false);

  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'java' | 'c'>('python');
  const [editorCode, setEditorCode] = useState<string>("");
  const [isEvaluatingCode, setIsEvaluatingCode] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<any>(null);

  const [runResult, setRunResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string; compileLogs?: string } | null>(null);

  // Core Chatbot States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Hello ${profile.name}! I am **HaloHex AI Career Mentor**. I have initialized your custom student profile.\n\nI can help you build custom roadmaps, conduct technical or behavioral interviews, solve coding doubts, optimize your resume, and map out daily study plans.\n\nWhat career milestone are we targeting today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [chatMode, setChatMode] = useState('General Mentor');
  const [translatorLang, setTranslatorLang] = useState(profile.preferredLanguage || 'English');
  const [chatStatus, setChatStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle');

  // Career Roadmap States
  const [careerData, setCareerData] = useState<CareerRecommendation | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [completedRoadmapTopics, setCompletedRoadmapTopics] = useState<string[]>([]);

  // Helpers for relative dates and parsing duration
  const getRelativeDateString = (offsetDays: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  const parseDurationToHours = (durationStr: string): number => {
    if (!durationStr) return 0;
    const lowercase = durationStr.toLowerCase().trim();
    const matchHours = lowercase.match(/([\d.]+)\s*(hour|hr|h|hrs)/);
    if (matchHours) {
      return parseFloat(matchHours[1]);
    }
    const matchMins = lowercase.match(/([\d.]+)\s*(min|m|mins)/);
    if (matchMins) {
      return parseFloat(matchMins[1]) / 60;
    }
    const matchNum = lowercase.match(/^[\d.]+$/);
    if (matchNum) {
      return parseFloat(lowercase);
    }
    return 1;
  };

  // Study Planner States — starts empty, populated by AI planner or user
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([]);
  const [isLoadingPlanner, setIsLoadingPlanner] = useState(false);

  // Manual extra study hours state
  const [manualHours, setManualHours] = useState<Record<string, number>>({});

  // Dynamically compute study hours for the last 7 days from tasks & manual logs
  const getStudyHoursData = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data: { day: string; hours: number; dateString: string }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayLabel = daysOfWeek[d.getDay()];
      
      const dayTasks = studyTasks.filter((t) => t.date === dateString);
      let completedHours = 0;
      dayTasks.forEach((t) => {
        if (t.status === 'completed') {
          completedHours += parseDurationToHours(t.duration);
        }
      });
      
      const manual = manualHours[dateString] || 0;
      const totalHours = Math.round((completedHours + manual) * 10) / 10;
      
      data.push({
        day: dayLabel,
        hours: totalHours,
        dateString,
      });
    }
    
    return data;
  };

  // Resume Analyzer States
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);

  // Mock Interview States
  const [activeInterview, setActiveInterview] = useState<InterviewRoundState | null>(null);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);

  // General App Streaks & Badges
  const [streakDays, setStreakDays] = useState(() => readStats().streak);
  const [earnedBadges, setEarnedBadges] = useState<{ name: string; desc: string; icon: any }[]>([]);

  // Goal Feasibility Checker State
  const [feasGoal, setFeasGoal] = useState(profile.dreamCareer || 'AI Engineer');
  const [feasTimeline, setFeasTimeline] = useState('1 month');
  const [feasResult, setFeasResult] = useState<string | null>(null);
  const [feasLoading, setFeasLoading] = useState(false);

  // Dynamic Course Finder State
  const [courseFilter, setCourseFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [courses, setCourses] = useState([
    { title: 'Machine Learning by Andrew Ng', platform: 'Coursera', type: 'free', url: 'https://coursera.org', rating: '4.9', duration: '11 weeks' },
    { title: 'Introduction to Artificial Intelligence', platform: 'MIT OpenCourseWare', type: 'free', url: 'https://ocw.mit.edu', rating: '4.8', duration: '15 weeks' },
    { title: 'Full Stack Web Development Path', platform: 'freeCodeCamp', type: 'free', url: 'https://freecodecamp.org', rating: '4.9', duration: '300 hours' },
    { title: 'Advanced Data Structures and Algorithms', platform: 'NPTEL', type: 'free', url: 'https://nptel.ac.in', rating: '4.7', duration: '12 weeks' },
    { title: 'The Complete React Developer Course', platform: 'Udemy', type: 'paid', url: 'https://udemy.com', rating: '4.7', duration: '40 hours' },
    { title: 'Cybersecurity Fundamentals Specialized Path', platform: 'edX', type: 'free', url: 'https://edx.org', rating: '4.6', duration: '6 weeks' },
  ]);

  // Listen for local storage changes (from other components like LockedRoadmap) to trigger Learning DNA update
  const [localStorageTrigger, setLocalStorageTrigger] = useState(0);
  useEffect(() => {
    const handleStorageChange = () => {
      setLocalStorageTrigger(prev => prev + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Dynamically calculate and save AI Learning DNA
  const learningDNA = useMemo(() => {
    return calculateLearningDNA(profile, studyTasks, resumeAnalysis, activeInterview, streakDays);
  }, [profile, studyTasks, resumeAnalysis, activeInterview, streakDays, localStorageTrigger]);

  // On login: record streak + session start, flush hours on unload
  useEffect(() => {
    recordLogin();
    setStreakDays(readStats().streak);
    const handleUnload = () => flushSessionHours();
    window.addEventListener('beforeunload', handleUnload);
    // Flush every 5 minutes to keep hours updated live
    const flushInterval = setInterval(() => {
      flushSessionHours();
      setStreakDays(readStats().streak);
    }, 5 * 60 * 1000);

    // DailyCheckin component now handles the interactive claim — remove silent background award
    // (awardPoints is called inside DailyCheckin when user clicks 'Claim')

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(flushInterval);
    };
  }, []);

  // Load recommendations automatically on login
  useEffect(() => {
    generateInitialCareerRoadmap();
  }, []);

  // Fetch initial career roadmap from server
  const generateInitialCareerRoadmap = async () => {
    setIsLoadingRoadmap(true);
    try {
      const res = await fetch("/api/career-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, learningDNA }),
      });
      const data = await res.json();
      if (data && data.name) {
        setCareerData(data);
      }
    } catch (error) {
      console.error("Failed to generate career roadmap:", error);
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  // Chat message submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setChatStatus('thinking');

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          history: chatMessages,
          profile,
          mode: chatMode,
          language: translatorLang,
        }),
      });
      const data = await res.json();
      if (data.text) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: chatMode,
        };
        setChatMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error("Failed to fetch chat response:", err);
    } finally {
      setChatStatus('idle');
    }
  };

  // Speech synthesizers for Chat replies
  const handleVoicePlay = async (text: string) => {
    setChatStatus('speaking');
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceName: 'Kore' }),
      });
      const data = await res.json();
      if (data.audio) {
        const audioSrc = `data:audio/mp3;base64,${data.audio}`;
        const audio = new Audio(audioSrc);
        audio.play().catch((playErr) => {
          console.warn("Audio playback blocked by browser/iframe restrictions:", playErr);
          setChatStatus('idle');
        });
        audio.onended = () => setChatStatus('idle');
      } else {
        setChatStatus('idle');
      }
    } catch (err) {
      console.error("Failed to play synthesized audio", err);
      setChatStatus('idle');
    }
  };

  // Milestone toggling in roadmaps (updates streak and career score)
  const handleMilestoneToggle = (topic: string) => {
    setCompletedRoadmapTopics((prev) => {
      const exists = prev.includes(topic);
      const updated = exists ? prev.filter((t) => t !== topic) : [...prev, topic];

      // Celebrate first milestone with a badge
      if (updated.length === 1) {
        setEarnedBadges((prevBadges) => {
          if (prevBadges.some((b) => b.name === 'Roadmap Pioneer')) {
            return prevBadges;
          }
          return [
            ...prevBadges,
            { name: 'Roadmap Pioneer', desc: 'Completed your first study roadmap milestone', icon: Compass },
          ];
        });
        setStreakDays((s) => s + 1);
      }
      return updated;
    });
  };

  // Study Planner: Add custom task
  const handleAddTask = (newTask: Omit<StudyTask, 'id'>) => {
    setStudyTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), ...newTask } as StudyTask,
    ]);
  };

  // Study Planner: Check off task
  const handleToggleTask = (id: string) => {
    setStudyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t))
    );
  };

  // Study Planner: Auto-reschedule missed tasks to today
  const handleRescheduleMissed = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStudyTasks((prev) =>
      prev.map((t) => {
        const isPast = new Date(t.date) < new Date(todayStr);
        if (isPast && t.status !== 'completed') {
          return { ...t, date: todayStr, status: 'pending' as const };
        }
        return t;
      })
    );
  };

  // Study Planner: Generate weekly schedule with Gemini
  const handleGenerateAIPlan = async (extraGoal: string, examDates: string) => {
    setIsLoadingPlanner(true);
    try {
      const res = await fetch("/api/study-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, extraGoal, examDates, learningDNA }),
      });
      const data = await res.json();
      if (data && data.tasks) {
        setStudyTasks(data.tasks);
        setEarnedBadges((prev) => {
          if (prev.some((b) => b.name === 'AI Structured')) {
            return prev;
          }
          return [
            ...prev,
            { name: 'AI Structured', desc: 'Generated an advanced AI Weekly Timetable', icon: Sparkles },
          ];
        });
      }
    } catch (err) {
      console.error("Failed to generate study plan:", err);
    } finally {
      setIsLoadingPlanner(false);
    }
  };

  // Resume Analyzer
  const handleAnalyzeResume = async (resumeText: string) => {
    setIsLoadingResume(true);
    try {
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, profile, learningDNA }),
      });
      const data = await res.json();
      if (data && data.score) {
        setResumeAnalysis(data);
        setEarnedBadges((prev) => {
          if (prev.some((b) => b.name === 'ATS Overlord')) {
            return prev;
          }
          return [
            ...prev,
            { name: 'ATS Overlord', desc: 'Scanned your resume using ATS lasers', icon: FileText },
          ];
        });
        // Award gamification points for resume scan (once)
        const token = localStorage.getItem('halohex_token');
        if (token) {
          awardPoints('resume_scan', 'resume_scan_once', token).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Failed to analyze resume:", err);
    } finally {
      setIsLoadingResume(false);
    }
  };

  // Mock Interviews
  const handleStartInterview = async (role: string, roundType: 'HR' | 'Technical' | 'Coding' | 'Behavioral' | 'System Design' | 'Project Discussion') => {
    setIsLoadingInterview(true);
    try {
      const res = await fetch("/api/mock-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, roundType, profile, learningDNA }),
      });
      const data = await res.json();
      if (data && data.questions) {
        setActiveInterview({
          active: true,
          role,
          roundType,
          currentQuestionIndex: 0,
          questions: data.questions,
          chatHistory: [{ role: 'interviewer', text: data.questions[0] }],
          answers: [],
          isComplete: false,
        });
      }
    } catch (err) {
      console.error("Failed to start mock interview:", err);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  const handleEvaluateAnswer = async (answer: string) => {
    if (!activeInterview) return;
    setIsEvaluatingAnswer(true);

    const question = activeInterview.questions[activeInterview.currentQuestionIndex];

    try {
      const res = await fetch("/api/mock-interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          role: activeInterview.role,
          roundType: activeInterview.roundType,
          profile,
          learningDNA,
        }),
      });
      const data = await res.json();
      if (data && data.feedback) {
        const updatedAnswers = [...activeInterview.answers];
        updatedAnswers[activeInterview.currentQuestionIndex] = {
          question,
          answer,
          feedback: data.feedback,
          mistakes: data.mistakes || [],
          correctAnswer: data.correctAnswer || '',
          confidenceScore: data.confidenceScore || 70,
          communicationScore: data.communicationScore || 70,
          technicalScore: data.technicalScore || 70,
          overallRating: data.overallRating || 3.5,
        };

        setActiveInterview({
          ...activeInterview,
          answers: updatedAnswers,
          chatHistory: [
            ...activeInterview.chatHistory,
            { role: 'user', text: answer },
          ],
        });
      }
    } catch (err) {
      console.error("Failed to evaluate answer:", err);
    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (!activeInterview) return;
    const nextIdx = activeInterview.currentQuestionIndex + 1;
    if (nextIdx < 5) {
      setActiveInterview({
        ...activeInterview,
        currentQuestionIndex: nextIdx,
        chatHistory: [
          ...activeInterview.chatHistory,
          { role: 'interviewer', text: activeInterview.questions[nextIdx] },
        ],
      });
    } else {
      // Completed! Add standard interview badge
      setActiveInterview({
        ...activeInterview,
        isComplete: true,
      });
      setEarnedBadges((prev) => {
        if (prev.some((b) => b.name === 'Elite Talker')) {
          return prev;
        }
        return [
          ...prev,
          { name: 'Elite Talker', desc: 'Completed a full 5-question AI panel interview', icon: Cpu },
        ];
      });
      // Award gamification points for completing a full interview (once per interview session)
      const token = localStorage.getItem('halohex_token');
      if (token) {
        const interviewId = `interview_${Date.now()}`;
        awardPoints('interview_complete', interviewId, token).catch(() => {});
      }
    }
  };

  const handleResetInterview = () => {
    setActiveInterview(null);
  };

  // Goal Feasibility Checker
  const handleFeasibilityCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeasLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Check my career feasibility: I want to become a ${feasGoal} in ${feasTimeline}. My current background includes ${profile.degree} in ${profile.branch} with current skills: ${profile.skills.join(', ')}. Can I do it? If not, calculate the realistic hours and timeline required and outline a viable alternative schedule.`,
          profile,
          mode: 'Goal Feasibility Checker',
          language: 'English',
          learningDNA,
        }),
      });
      const data = await res.json();
      if (data.text) {
        setFeasResult(data.text);
      }
    } catch (err) {
      console.error("Failed to check goal feasibility:", err);
    } finally {
      setFeasLoading(false);
    }
  };

  // Calculate dynamic overall Career Readiness Score
  const computeReadinessScore = () => {
    let score = 30; // base profile onboarding
    if (completedRoadmapTopics.length > 0) score += Math.min(completedRoadmapTopics.length * 8, 30);
    if (resumeAnalysis) score += Math.round((resumeAnalysis.score - 50) / 2);
    if (activeInterview && activeInterview.answers.length > 0) {
      const avgRating = activeInterview.answers.reduce((acc, c) => acc + c.overallRating, 0) / activeInterview.answers.length;
      score += Math.round(avgRating * 4);
    }
    const completedTasks = studyTasks.filter((t) => t.status === 'completed').length;
    score += Math.min(completedTasks * 3, 10);
    return Math.min(score, 100);
  };

  const activeReadinessScore = computeReadinessScore();

  // Skill Competencies mapping for graph (derived dynamically)
  const getCompetencyData = () => {
    const baseSkills = [
      { name: 'Algorithms', score: 65 },
      { name: 'System Design', score: 40 },
      { name: 'Core Language', score: 75 },
      { name: 'Problem Solving', score: 60 },
    ];
    if (completedRoadmapTopics.length > 0) {
      baseSkills[0].score = Math.min(baseSkills[0].score + completedRoadmapTopics.length * 5, 95);
      baseSkills[3].score = Math.min(baseSkills[3].score + completedRoadmapTopics.length * 6, 95);
    }
    if (activeInterview && activeInterview.answers.length > 0) {
      const technicalSum = activeInterview.answers.reduce((acc, c) => acc + c.technicalScore, 0) / activeInterview.answers.length;
      baseSkills[1].score = Math.min(baseSkills[1].score + Math.round((technicalSum - 50) / 2), 95);
    }
    return baseSkills;
  };

  // Sidebar link details
  const menuItems = [
    { id: 'locked-roadmap', title: 'Dashboard', icon: ListChecks },
    { id: 'syllabus-timeline', title: 'Roadmap', icon: BookOpen },
    { id: 'course-mcq', title: "Course and MCQ's", icon: GraduationCap },
    { id: 'mentor', title: 'AI Assistant', icon: MessageSquare },
    { id: 'revisionPredictor', title: 'Revision', icon: Brain },
    { id: 'compareCareers', title: 'Compare Careers', icon: ArrowRightLeft },
    { id: 'codeEditor', title: 'Code Editor', icon: Terminal },
    { id: 'resume', title: 'ATS Resume Scan', icon: FileText },
    { id: 'interview', title: 'Mock Interviews', icon: Cpu },
    { id: 'courses', title: 'Best Courses', icon: BookOpen },
    { id: 'leaderboard', title: 'Community Leaderboard', icon: Trophy },
    { id: 'dbInspect', title: 'Account Profile', icon: Settings },
  ] as const;

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200 overflow-hidden">
      {/* Sidebar navigation */}
      <aside className={`w-full ${isSidebarCollapsed ? "md:w-20" : "md:w-64"} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 flex flex-col justify-between shadow-sm h-full md:h-screen overflow-y-auto transition-all duration-300`} id="dashboard-sidebar">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 overflow-hidden">
              {!isSidebarCollapsed && (
                <>
                  <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">HaloHex</span>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full shadow-sm">
                    PATH AI
                  </span>
                </>
              )}
              {isSidebarCollapsed && (
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white mx-auto">H</span>
              )}
            </div>
            
            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-800 dark:text-slate-350 dark:hover:text-white border border-slate-200 dark:border-slate-750 transition-all cursor-pointer shadow-sm shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-350 dark:hover:text-white dark:border-slate-700 md:hidden"
                title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            )}
          </div>
 
          {/* Quick Profile view */}
          <div className={`p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 ${isSidebarCollapsed ? 'text-center' : ''}`}>
            {!isSidebarCollapsed ? (
              <>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Active Student</span>
                <p className="text-slate-900 dark:text-white text-xs font-semibold mt-0.5 truncate">{profile.name}</p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium mt-0.5">{profile.dreamCareer} ({profile.timelineGoal})</span>
              </>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs mx-auto" title={`${profile.name} - ${profile.dreamCareer}`}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
 
          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-2.5'} rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none'
                      : 'text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                  title={isSidebarCollapsed ? item.title : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{item.title}</span>}
                </button>
              );
            })}
          </nav>
        </div>
 
        {/* Footer info/Exit button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <button
            onClick={onLogout}
            className={`w-full flex items-center justify-center ${isSidebarCollapsed ? 'p-2.5' : 'gap-2 px-4 py-2'} text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-750 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 rounded-xl transition-all cursor-pointer`}
            title={isSidebarCollapsed ? "Exit Career Dashboard" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Exit Career Dashboard</span>}
          </button>
        </div>
      </aside>
 
      {/* Main Workspace Frame */}
      <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto w-full h-full md:h-screen">
        {/* Top bar Metrics strip */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1.5">
            {(() => {
              const getHeaderTitle = () => {
                switch (activeTab) {
                  case 'locked-roadmap':
                    return 'Dashboard';
                  case 'syllabus-timeline':
                    return 'Roadmap';
                  case 'course-mcq':
                    return "Course and MCQ's";
                  case 'courses':
                    return 'Best Courses';
                  case 'dbInspect':
                    return 'Account Profile';
                  case 'mentor':
                    return 'AI Assistant';
                  case 'revisionPredictor':
                    return 'Revision';
                  case 'codeEditor':
                    return 'Code Editor';
                  case 'leaderboard':
                    return 'Community Leaderboard';
                  default:
                    return null;
                }
              };
              const title = getHeaderTitle();
              return title ? (
                <h2 className="text-2xl font-black text-slate-955 dark:text-white tracking-tight">
                  {title}
                </h2>
              ) : null;
            })()}
          </div>
 
          {/* Badges strip and theme toggler */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer dark:text-slate-300 dark:hover:text-white shadow-sm flex items-center justify-center shrink-0"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
            )}
          </div>
        </header>

        {/* Tab rendering */}
        <AnimatePresence mode="wait">
          {activeTab === 'mentor' && (
            <motion.div
              key="mentor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AIChatBot profile={profile} />
            </motion.div>
          )}

          {activeTab === 'revisionPredictor' && (
            <motion.div
              key="revisionPredictor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RevisionPredictor />
            </motion.div>
          )}

          {activeTab === 'resume' && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ResumeAnalyzer
                profile={profile}
                onAnalyze={handleAnalyzeResume}
                analysis={resumeAnalysis}
                isLoading={isLoadingResume}
              />
            </motion.div>
          )}

          {activeTab === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MockInterviewArena
                profile={profile}
                activeInterview={activeInterview}
                onStartInterview={handleStartInterview}
                onEvaluateAnswer={handleEvaluateAnswer}
                onNextQuestion={handleNextQuestion}
                onResetInterview={handleResetInterview}
                isLoading={isLoadingInterview}
                isEvaluating={isEvaluatingAnswer}
              />
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" /> Best Quality Recommended Courses
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">High-quality handpicked learning resources. We prioritize free options first!</p>
                </div>
                <div className="flex gap-2">
                  {(['all', 'free', 'paid'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setCourseFilter(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                        courseFilter === type
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-450 dark:hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Bento Card layouts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses
                  .filter((c) => courseFilter === 'all' || c.type === courseFilter)
                  .map((course) => (
                    <div key={course.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between group hover:border-blue-400 transition-all shadow-sm">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                            course.type === 'free' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40'
                          }`}>
                            {course.type}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase">{course.platform}</span>
                        </div>
                        <h4 className="text-slate-900 dark:text-slate-200 text-sm font-bold mt-3 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors leading-snug">
                          {course.title}
                        </h4>
                      </div>

                      <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Duration: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{course.duration}</strong></span>
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1 group-hover:underline"
                        >
                          Visit <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}



          {activeTab === 'feasibility' && (
            <motion.div
              key="feasibility"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md transition-all duration-300 ${feasResult ? 'max-w-4xl' : 'max-w-xl'}`}
            >
              <div className="text-center">
                <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 mb-2">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Goal Feasibility Calculator</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Submit your targeted learning timeline. Our career companion will calculate whether it's realistic and optimize your hours.</p>
              </div>

              <form onSubmit={handleFeasibilityCheck} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-350 text-xs font-semibold uppercase tracking-wider mb-1.5">Dream Career Role</label>
                    <select
                      value={feasGoal}
                      onChange={(e) => setFeasGoal(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option>AI Engineer</option>
                      <option>Machine Learning Engineer</option>
                      <option>Data Scientist</option>
                      <option>Software Engineer</option>
                      <option>Full Stack Developer</option>
                      <option>Cybersecurity Analyst</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-350 text-xs font-semibold uppercase tracking-wider mb-1.5">Your Targeted Timeline</label>
                    <select
                      value={feasTimeline}
                      onChange={(e) => setFeasTimeline(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option>1 month (Crash study)</option>
                      <option>3 months (Fast track)</option>
                      <option>6 months (Standard)</option>
                      <option>1 year (Detailed learning)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={feasLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {feasLoading ? 'Evaluating Feasibility...' : 'Evaluate Timeline Achievability'}
                </button>
              </form>

              <AnimatePresence mode="wait">
                {feasResult && (() => {
                  let parsedFeas = null;
                  try {
                    let cleaned = feasResult.trim();
                    if (cleaned.startsWith('```json')) {
                      cleaned = cleaned.substring(7);
                    }
                    if (cleaned.startsWith('```')) {
                      cleaned = cleaned.substring(3);
                    }
                    if (cleaned.endsWith('```')) {
                      cleaned = cleaned.substring(0, cleaned.length - 3);
                    }
                    parsedFeas = JSON.parse(cleaned.trim());
                  } catch (e) {
                    console.warn("Could not parse JSON", e);
                  }

                  if (parsedFeas) {
                    const {
                      feasibilityScore = 50,
                      isRealistic = false,
                      verdict = "Analysis Ready",
                      verdictColor = "blue",
                      analysisSummary = "",
                      requestedTimeline = "",
                      realisticTimeline = "",
                      recommendedHoursPerDay = 4,
                      totalStudyHoursNeeded = 300,
                      milestones = [],
                      alternativeSchedule = [],
                      actionableTips = []
                    } = parsedFeas;

                    let badgeBg = 'bg-slate-50 dark:bg-slate-900 text-slate-750 dark:text-slate-300 border-slate-200 dark:border-slate-800';
                    let progressColor = 'bg-blue-600';

                    if (verdictColor === 'emerald') {
                      badgeBg = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40';
                      progressColor = 'bg-emerald-500';
                    } else if (verdictColor === 'amber') {
                      badgeBg = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40';
                      progressColor = 'bg-amber-500';
                    } else if (verdictColor === 'rose') {
                      badgeBg = 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40';
                      progressColor = 'bg-rose-500';
                    } else if (verdictColor === 'indigo') {
                      badgeBg = 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/40';
                      progressColor = 'bg-indigo-500';
                    }

                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Custom Feasibility Evaluation</span>
                        </div>

                        {/* Metric Score Cards and Badge Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* 1. Score Circle / Progress */}
                          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Feasibility Rating</span>
                            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1.5">{feasibilityScore}%</div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                              <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${feasibilityScore}%` }} />
                            </div>
                          </div>

                          {/* 2. Verdict details */}
                          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-center text-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">Timeline Verdict</span>
                            <div className={`inline-flex items-center justify-center font-bold text-[11px] py-1 px-2.5 rounded-xl border ${badgeBg}`}>
                              {verdict}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                              {isRealistic ? "✓ Achievable target" : "⚠ Timeline tight/unrealistic"}
                            </div>
                          </div>

                          {/* 3. Study commitment required */}
                          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex flex-col justify-center text-[11px] space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-0.5">Study Commitment</span>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 dark:text-slate-400">Daily Study:</span>
                              <strong className="text-slate-800 dark:text-white font-bold">{recommendedHoursPerDay} hrs/day</strong>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 dark:text-slate-400">Total Hours:</span>
                              <strong className="text-slate-800 dark:text-white font-bold">{totalStudyHoursNeeded} hrs</strong>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 dark:text-slate-400">Realistic Window:</span>
                              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{realisticTimeline}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Analysis Text Block */}
                        <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/20 rounded-2xl p-4.5 text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-bold text-blue-800 dark:text-blue-300 block mb-1">Advisor Analysis:</span>
                          <p className="leading-relaxed font-medium text-slate-650 dark:text-slate-300">{analysisSummary}</p>
                        </div>

                        {/* Milestones Horizontal / Vertical Timeline */}
                        {milestones && milestones.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Optimized Phased Learning Steps</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {milestones.map((ms: any, index: number) => (
                                <div key={index} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 space-y-2.5 shadow-xs flex flex-col justify-between hover:shadow transition-shadow">
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{ms.duration || `Phase ${index + 1}`}</span>
                                      <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-black border border-blue-100 dark:border-blue-900">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <h5 className="font-bold text-slate-900 dark:text-white text-xs mt-1 truncate">{ms.phase}</h5>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium italic mt-0.5">Focus: {ms.focus}</p>
                                    
                                    <ul className="mt-3 space-y-1.5 text-[10px] text-slate-600 dark:text-slate-350 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                                      {ms.actions && ms.actions.map((act: string, aIdx: number) => (
                                        <li key={aIdx} className="flex items-start gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                          <span className="leading-normal">{act}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Alternate flexible schedule and career advice */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Alternative Pathways */}
                          {alternativeSchedule && alternativeSchedule.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4.5 rounded-2xl space-y-2.5">
                              <h5 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Flexible Scheduling Paths</h5>
                              <div className="space-y-2">
                                {alternativeSchedule.map((alt: any, aIdx: number) => (
                                  <div key={aIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs flex items-start gap-3">
                                    <span className="p-1 bg-indigo-50 dark:bg-indigo-950/40 rounded text-indigo-600 dark:text-indigo-400 text-[9px] font-bold shrink-0">Option {aIdx + 1}</span>
                                    <div>
                                      <p className="font-bold text-slate-800 dark:text-white text-[11px]">{alt.label}</p>
                                      <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 leading-normal">{alt.desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actionable Advice */}
                          {actionableTips && actionableTips.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4.5 rounded-2xl space-y-2.5">
                              <h5 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">High-Yield Strategy Tips</h5>
                              <ul className="space-y-2 text-xs">
                                {actionableTips.map((tip: string, tIdx: number) => (
                                  <li key={tIdx} className="flex items-start gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
                                    <span className="text-amber-500 shrink-0 text-sm">💡</span>
                                    <span className="text-[10px] leading-relaxed font-medium text-slate-600 dark:text-slate-350">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  }

                  // Default Fallback rendering if parsing failed
                  return (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap shadow-inner"
                    >
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest block mb-2">Feasibility Report & Plan</span>
                      {feasResult}
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          )}

          {(activeTab === 'locked-roadmap' || activeTab === 'syllabus-timeline' || activeTab === 'course-mcq') && (
            <motion.div
              key="locked-roadmap-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full space-y-8"
            >
              <LockedRoadmap 
                profile={profile} 
                viewMode={
                  activeTab === 'locked-roadmap' 
                    ? 'dashboard' 
                    : activeTab === 'syllabus-timeline' 
                      ? 'syllabus' 
                      : 'course-mcq'
                }
                onNavigateToSyllabus={() => setActiveTab('syllabus-timeline')}
                onNavigateToDashboard={() => setActiveTab('locked-roadmap')}
                onNavigateToCourseMCQ={() => setActiveTab('course-mcq')}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                roadmap={roadmap}
                setRoadmap={setRoadmap}
                progress={progress}
                setProgress={setProgress}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                lessonContent={lessonContent}
                setLessonContent={setLessonContent}
                isLoadingLesson={isLoadingLesson}
                setIsLoadingLesson={setIsLoadingLesson}
                flowStep={flowStep}
                setFlowStep={setFlowStep}
                isMarkedAsLearned={isMarkedAsLearned}
                setIsMarkedAsLearned={setIsMarkedAsLearned}
                selectedAnswers={selectedAnswers}
                setSelectedAnswers={setSelectedAnswers}
                quizScore={quizScore}
                setQuizScore={setQuizScore}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                editorCode={editorCode}
                setEditorCode={setEditorCode}
                isEvaluatingCode={isEvaluatingCode}
                setIsEvaluatingCode={setIsEvaluatingCode}
                examResult={examResult}
                setExamResult={setExamResult}
                runResult={runResult}
                setRunResult={setRunResult}
              />
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <Leaderboard
                profile={profile}
                studyTasks={studyTasks}
                resumeAnalysis={resumeAnalysis}
                activeInterview={activeInterview}
                onNavigate={(tabId) => setActiveTab(tabId)}
              />
            </motion.div>
          )}

          {activeTab === 'codeEditor' && (
            <motion.div
              key="codeEditor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <CodeEditor />
            </motion.div>
          )}

          {activeTab === 'compareCareers' && (
            <motion.div
              key="compareCareers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <CompareCareers
                profile={profile}
                careerData={careerData}
              />
            </motion.div>
          )}

          {activeTab === 'dbInspect' && (
            <motion.div
              key="dbInspect"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <DatabaseInspector 
                theme={theme} 
                profile={profile}
                onProfileUpdate={onProfileUpdate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {/* Floating Daily Check-In — always visible on all tabs */}
      <DailyCheckin />
    </div>
  );
}
