import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Unlock, CheckCircle2, Circle, AlertTriangle, Play, FileText, 
  Award, Eye, ShieldAlert, Monitor, Sparkles, RefreshCw, ChevronRight, 
  Check, X, Camera, Send, Terminal, BookOpen, Clock, BarChart3, HelpCircle,
  Flame, Compass
} from 'lucide-react';
import type { StudentProfile, DayModule, MCQQuestion, CodingExam, DayLessonContent, AdaptiveLockedRoadmap, RoadmapProgress } from '../types';
import { readStats, getWeeklyActivityPoints, recordTopicCompleted } from '../lib/userStats';
import { awardPoints } from '../lib/gamification';

const WeeklyActivityChart = () => {
  const points = getWeeklyActivityPoints();
  const maxTopics = Math.max(...points.map(p => p.topics), 1);
  
  const width = 500;
  const height = 150;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const getX = (index: number) => padding + (index * chartWidth) / (points.length - 1);
  const getY = (val: number) => height - padding - (val * chartHeight) / maxTopics;
  
  let pathD = "";
  let areaD = "";
  
  points.forEach((pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.topics);
    if (idx === 0) {
      pathD += `M ${x} ${y}`;
      areaD += `M ${x} ${height - padding} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }
    if (idx === points.length - 1) {
      areaD += ` L ${x} ${height - padding} Z`;
    }
  });

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-[310px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">Weekly Activity</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Topics completed per day over the last 7 days</p>
        </div>
        <div className="p-2 bg-blue-50 dark:bg-blue-955 rounded-xl text-blue-600 dark:text-blue-400">
          <BarChart3 className="w-4 h-4" />
        </div>
      </div>
      
      <div className="relative w-full overflow-hidden flex-1 flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible max-h-[160px]">
          {[0, 25, 50, 75, 100].map((gridVal) => {
            const y = getY(gridVal);
            return (
              <g key={gridVal}>
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  className="stroke-slate-100 dark:stroke-slate-800/60" 
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text 
                  x={padding - 8} 
                  y={y + 3} 
                  className="text-[9px] fill-slate-400 font-bold"
                  textAnchor="end"
                >
                  {gridVal}%
                </text>
              </g>
            );
          })}
          
          <path d={areaD} className="fill-blue-500/10 dark:fill-blue-500/5" />
          
          <path 
            d={pathD} 
            className="stroke-blue-600 fill-transparent" 
            strokeWidth={3} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          
          {points.map((pt, idx) => {
            const x = getX(idx);
            const y = getY(pt.topics);
            return (
              <g key={idx} className="group/dot cursor-pointer">
                <circle 
                  cx={x} 
                  cy={y} 
                  r={5} 
                  className="fill-white stroke-blue-600" 
                  strokeWidth={3} 
                />
                <circle 
                  cx={x} 
                  cy={y} 
                  r={9} 
                  className="fill-blue-600/20 opacity-0 group-hover/dot:opacity-100 transition-opacity" 
                />
                <text 
                  x={x} 
                  y={height - padding + 15} 
                  className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500"
                  textAnchor="middle"
                >
                  {pt.label}
                </text>
                <text 
                  x={x} 
                  y={y - 10} 
                  className="text-[9px] font-black fill-blue-600 dark:fill-blue-400 opacity-0 group-hover/dot:opacity-100 transition-opacity"
                  textAnchor="middle"
                >
                  {pt.topics} topics
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const RoadmapProgressDonut = ({ completed, total }: { completed: number; total: number }) => {
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-[310px] flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-black text-slate-900 dark:text-white">Roadmap Progress</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Overall completion</p>
      </div>

      <div className="flex items-center justify-center py-6">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800 fill-transparent"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-blue-600 fill-transparent transition-all duration-1000 ease-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-black text-slate-950 dark:text-white">{percent}%</span>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mt-0.5">Complete</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-around border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] font-bold">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span className="text-slate-500 dark:text-slate-400">Completed: {completed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <span className="text-slate-500 dark:text-slate-400">Remaining: {Math.max(0, total - completed)}</span>
        </div>
      </div>
    </div>
  );
};

interface LockedRoadmapProps {
  profile: StudentProfile;
  viewMode?: 'dashboard' | 'syllabus' | 'course-mcq';
  onNavigateToSyllabus?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToCourseMCQ?: () => void;
  selectedCourse: string;
  setSelectedCourse: (c: string) => void;
  roadmap: AdaptiveLockedRoadmap | null;
  setRoadmap: (r: AdaptiveLockedRoadmap | null) => void;
  progress: RoadmapProgress | null;
  setProgress: (p: RoadmapProgress | null) => void;
  activeDay: DayModule | null;
  setActiveDay: (d: DayModule | null) => void;
  lessonContent: DayLessonContent | null;
  setLessonContent: (l: DayLessonContent | null) => void;
  isLoadingLesson: boolean;
  setIsLoadingLesson: (b: boolean) => void;
  flowStep: 'content' | 'mcq' | 'result' | 'exam';
  setFlowStep: (s: 'content' | 'mcq' | 'result' | 'exam') => void;
  isMarkedAsLearned: boolean;
  setIsMarkedAsLearned: (b: boolean) => void;
  selectedAnswers: { [qId: string]: number };
  setSelectedAnswers: (a: { [qId: string]: number } | ((prev: { [qId: string]: number }) => { [qId: string]: number })) => void;
  quizScore: number | null;
  setQuizScore: (n: number | null) => void;
  selectedLanguage: 'python' | 'java' | 'c';
  setSelectedLanguage: (l: 'python' | 'java' | 'c') => void;
  editorCode: string;
  setEditorCode: (s: string) => void;
  isEvaluatingCode: boolean;
  setIsEvaluatingCode: (b: boolean) => void;
  examResult: any | null;
  setExamResult: (r: any | null) => void;
  runResult: { status: 'idle' | 'success' | 'error'; message: string; compileLogs?: string } | null;
  setRunResult: (r: { status: 'idle' | 'success' | 'error'; message: string; compileLogs?: string } | null) => void;
}

export default function LockedRoadmap({ 
  profile, 
  viewMode = 'dashboard', 
  onNavigateToSyllabus, 
  onNavigateToDashboard,
  onNavigateToCourseMCQ,
  selectedCourse,
  setSelectedCourse,
  roadmap,
  setRoadmap,
  progress,
  setProgress,
  activeDay,
  setActiveDay,
  lessonContent,
  setLessonContent,
  isLoadingLesson,
  setIsLoadingLesson,
  flowStep,
  setFlowStep,
  isMarkedAsLearned,
  setIsMarkedAsLearned,
  selectedAnswers,
  setSelectedAnswers,
  quizScore,
  setQuizScore,
  selectedLanguage,
  setSelectedLanguage,
  editorCode,
  setEditorCode,
  isEvaluatingCode,
  setIsEvaluatingCode,
  examResult,
  setExamResult,
  runResult,
  setRunResult
}: LockedRoadmapProps) {
  // Course Selector / Duration local states
  const [selectedDuration, setSelectedDuration] = useState<string>("1 month (Crash study)");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Proctoring & Run Check States
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tabSwitchesCount, setTabSwitchesCount] = useState<number>(0);
  const [proctorLogs, setProctorLogs] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes (600s) countdown

  // Camera & Webcam Feed States
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize/load roadmap progress
  useEffect(() => {
    const savedProgress = localStorage.getItem(`roadmap_progress_${selectedCourse}`);
    const savedRoadmap = localStorage.getItem(`roadmap_structure_${selectedCourse}`);
    
    if (savedRoadmap) {
      const parsed = JSON.parse(savedRoadmap);
      setRoadmap(parsed);
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        const mergedProgress: RoadmapProgress = {
          courseId: parsedProgress.courseId || parsed.id,
          completedDays: parsedProgress.completedDays || [],
          unlockedDays: parsedProgress.unlockedDays || [parsed.days?.[0]?.id || "w1-d1"],
          quizScores: parsedProgress.quizScores || {},
          codingScores: parsedProgress.codingScores || {},
          timeSpent: parsedProgress.timeSpent || {},
          failedAttempts: parsedProgress.failedAttempts || {},
          lastAccessedDayId: parsedProgress.lastAccessedDayId || parsed.days?.[0]?.id || "w1-d1"
        };
        setProgress(mergedProgress);
      } else {
        // Initialize new progress
        const initialProgress: RoadmapProgress = {
          courseId: parsed.id,
          completedDays: [],
          unlockedDays: [parsed.days?.[0]?.id || "w1-d1"],
          quizScores: {},
          codingScores: {},
          timeSpent: {},
          failedAttempts: {},
          lastAccessedDayId: parsed.days?.[0]?.id || "w1-d1"
        };
        setProgress(initialProgress);
        localStorage.setItem(`roadmap_progress_${selectedCourse}`, JSON.stringify(initialProgress));
      }
    } else {
      generateRoadmap();
    }
  }, [selectedCourse]);

  // Handle auto-unlock of first day if empty
  useEffect(() => {
    if (roadmap && progress) {
      const unlockedDaysList = progress.unlockedDays || [];
      const daysList = roadmap.days || [];
      if (unlockedDaysList.length === 0 && daysList.length > 0) {
        const updated = { ...progress, unlockedDays: [daysList[0].id] };
        setProgress(updated);
        localStorage.setItem(`roadmap_progress_${selectedCourse}`, JSON.stringify(updated));
      }
    }
  }, [roadmap, progress]);  // Request / Release camera stream for exam
  useEffect(() => {
    if (flowStep === 'exam') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          setCameraStream(stream);
          setCameraError(null);
          addProctorLog("🎥 Webcam Active: Live monitoring feed initialized successfully.");
        })
        .catch(err => {
          console.error("Camera access error:", err);
          setCameraError("Camera access is required for proctored examination.");
          addProctorLog("🚨 Alert: Failed to access webcam feed. Permission denied.");
        });

      if (!document.fullscreenElement) {
        requestFullscreen();
      }
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setCameraError(null);
    }
  }, [flowStep]);

  // Bind video stream to <video> ref when stream is loaded
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Watch for tab visibility changes (Proctoring)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && flowStep === 'exam') {
        setTabSwitchesCount(prev => {
          const next = prev + 1;
          addProctorLog(`⚠️ Warning: Tab switch detected! (Incident count: ${next})`);
          if (next >= 3) {
            addProctorLog("🚨 Alert: High-risk behavior flagged due to excessive tab switching.");
          }
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flowStep]);

  // Watch for fullscreen change (Proctoring)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && flowStep === 'exam') {
        addProctorLog("⚠️ Warning: Fullscreen mode exited! Re-enter fullscreen to avoid flagging.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [flowStep]);

  // Real-time Countdown Timer Loop for Proctored Exam
  useEffect(() => {
    let interval: any;
    if (flowStep === 'exam') {
      setTimeLeft(600); // 10 minutes (600s)
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [flowStep]);

  // Browser keystroke and activity logs
  useEffect(() => {
    if (flowStep !== 'exam') return;

    const handleKeyPress = () => {
      if (Math.random() < 0.15) {
        addProctorLog("⌨️ Activity Monitor: Active keystrokes recorded in compiler workspace.");
      }
    };

    const handleMouseMove = () => {
      if (Math.random() < 0.05) {
        addProctorLog("🖱️ Activity Monitor: Cursor movement active within secure boundaries.");
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [flowStep]);

  const handleTimeExpired = () => {
    addProctorLog("⏰ Time Expired: Automatically evaluating and submitting current buffer...");
    submitCodingExam();
  };

  const addProctorLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setProctorLogs(prev => [`[${timestamp}] ${text}`, ...prev.slice(0, 15)]);
  };

  // Run Button - sandbox compiler check (Check code without official submission)
  const runCodeCheck = async () => {
    if (!activeDay || !lessonContent) return;
    setIsEvaluatingCode(true);
    addProctorLog("⚙️ Sandbox Run: Executing and verifying test cases in real-time sandbox...");
    
    try {
      const res = await fetch("/api/locked-roadmap/evaluate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editorCode,
          language: selectedLanguage,
          testCases: lessonContent.codingExam.testCases,
          dayId: activeDay.id,
          question: lessonContent.codingExam.question
        })
      });
      
      const result = await res.json();
      if (result.passed) {
        setRunResult({
          status: 'success',
          message: 'Okay - Code passed compilation and all local test cases successfully!',
          compileLogs: result.compileLogs
        });
        addProctorLog("✅ Sandbox: Validation check PASSED (Okay).");
      } else {
        setRunResult({
          status: 'error',
          message: 'Error - Code did not pass validation check. See compiler console for errors.',
          compileLogs: result.compileLogs || "Assertion failed for sample inputs."
        });
        addProctorLog("❌ Sandbox: Validation check FAILED with errors.");
      }
    } catch (e) {
      setRunResult({
        status: 'error',
        message: 'Error - Sandbox run error. Review syntax parameters.'
      });
      addProctorLog("❌ Sandbox: Execution error.");
    } finally {
      setIsEvaluatingCode(false);
    }
  };

  // Generate complete roadmap structure
  const generateRoadmap = async () => {
    setIsLoading(true);
    try {
      let learningDNAVal = null;
      try {
        const cached = localStorage.getItem('learning_dna');
        if (cached) learningDNAVal = JSON.parse(cached);
      } catch (e) {}

      const res = await fetch("/api/locked-roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          courseName: selectedCourse, 
          duration: selectedDuration,
          profile,
          learningDNA: learningDNAVal,
        }),
      });
      const data = await res.json();
      setRoadmap(data);
      localStorage.setItem(`roadmap_structure_${selectedCourse}`, JSON.stringify(data));

      // Create new progress tracker
      const newProgress: RoadmapProgress = {
        courseId: data.id,
        completedDays: [],
        unlockedDays: [data.days[0]?.id || "w1-d1"],
        quizScores: {},
        codingScores: {},
        timeSpent: {},
        failedAttempts: {},
        lastAccessedDayId: data.days[0]?.id || "w1-d1"
      };
      setProgress(newProgress);
      localStorage.setItem(`roadmap_progress_${selectedCourse}`, JSON.stringify(newProgress));
      
      setActiveDay(null);
      setLessonContent(null);
    } catch (err) {
      console.error("Error generating adaptive roadmap:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load a single day's comprehensive materials
  const loadDayLesson = async (day: DayModule) => {
    setIsLoadingLesson(true);
    setActiveDay(day);
    setFlowStep('content');
    setIsMarkedAsLearned(false);
    setSelectedAnswers({});
    setQuizScore(null);
    setExamResult(null);
    setRunResult(null); // Clear previous sandbox run results
    
    try {
      const res = await fetch("/api/locked-roadmap/day-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: selectedCourse,
          dayId: day.id,
          title: day.title
        })
      });
      const data: DayLessonContent = await res.json();
      setLessonContent(data);
      
      // Load template code based on active programming language selection
      setEditorCode(data.codingExam.templatePython);
    } catch (err) {
      console.error("Failed to load lesson modules:", err);
    } finally {
      setIsLoadingLesson(false);
    }
  };

  // Handle language switch
  const handleLanguageChange = (lang: 'python' | 'java' | 'c') => {
    setSelectedLanguage(lang);
    if (lessonContent) {
      if (lang === 'python') setEditorCode(lessonContent.codingExam.templatePython);
      if (lang === 'java') setEditorCode(lessonContent.codingExam.templateJava);
      if (lang === 'c') setEditorCode(lessonContent.codingExam.templateC);
    }
  };

  // MCQ Selection handler
  const selectMcqOption = (qId: string, optIdx: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optIdx
    }));
  };

  // Submit MCQ answers
  const evaluateMCQ = () => {
    if (!lessonContent) return;
    
    let correctCount = 0;
    lessonContent.mcqs.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / lessonContent.mcqs.length) * 100);
    setQuizScore(score);
    
    if (score >= 60) {
      addProctorLog(`✅ MCQ Quiz Passed! Score: ${score}% (Passing score: 60%)`);
      setFlowStep('result');

      // Award gamification points for quiz (once per dayId)
      if (activeDay) {
        const token = localStorage.getItem('halohex_token');
        if (token) {
          const event = score >= 90 ? 'quiz_perfect' : 'quiz_pass';
          awardPoints(event, `quiz_${activeDay.id}`, token).catch(() => {});
        }
      }
    } else {
      addProctorLog(`❌ MCQ Quiz Failed. Score: ${score}% (Passing score: 60%). Please review the concepts.`);
      setFlowStep('result');
      
      // Update failed attempts
      if (progress && activeDay) {
        const dId = activeDay.id;
        const updated = {
          ...progress,
          failedAttempts: {
            ...progress.failedAttempts,
            [dId]: (progress.failedAttempts[dId] || 0) + 1
          }
        };
        setProgress(updated);
        localStorage.setItem(`roadmap_progress_${selectedCourse}`, JSON.stringify(updated));
      }
    }
  };

  // Submit coding exam
  const submitCodingExam = async () => {
    if (!activeDay || !lessonContent) return;
    
    setIsEvaluatingCode(true);
    addProctorLog("⚙️ Submitting code for automatic sandboxed test cases evaluation...");

    try {
      const res = await fetch("/api/locked-roadmap/evaluate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editorCode,
          language: selectedLanguage,
          testCases: lessonContent.codingExam.testCases,
          dayId: activeDay.id,
          question: lessonContent.codingExam.question
        })
      });
      
      const result = await res.json();
      setExamResult(result);
      setFlowStep('result');

      if (result.passed && quizScore !== null && quizScore >= 60) {
        // Complete the day!
        completeDay(activeDay.id);
      } else {
        addProctorLog(`❌ Code Evaluation failed. Try revising and writing custom logic.`);
        if (progress) {
          const dId = activeDay.id;
          const updated = {
            ...progress,
            failedAttempts: {
              ...progress.failedAttempts,
              [dId]: (progress.failedAttempts[dId] || 0) + 1
            }
          };
          setProgress(updated);
          localStorage.setItem(`roadmap_progress_${selectedCourse}`, JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.error("Evaluation crash:", e);
    } finally {
      setIsEvaluatingCode(false);
    }
  };

  // Unlock and save progress
  const completeDay = (dayId: string) => {
    if (!roadmap || !progress) return;

    const completed = [...progress.completedDays];
    if (!completed.includes(dayId)) {
      completed.push(dayId);
    }

    // Find next day in sequence
    const days = roadmap.days || [];
    const currentIdx = days.findIndex(d => d.id === dayId);
    const unlocked = [...progress.unlockedDays];
    
    if (currentIdx !== -1 && currentIdx + 1 < days.length) {
      const nextDay = days[currentIdx + 1];
      if (!unlocked.includes(nextDay.id)) {
        unlocked.push(nextDay.id);
        addProctorLog(`🎉 Unlocked Next Module Day: ${nextDay.title}!`);
      }
    }

    const quizScores = { ...progress.quizScores, [dayId]: quizScore || 100 };
    const codingScores = { ...progress.codingScores, [dayId]: examResult?.score || 100 };

    const updated: RoadmapProgress = {
      ...progress,
      completedDays: completed,
      unlockedDays: unlocked,
      quizScores,
      codingScores,
      lastAccessedDayId: dayId
    };

    setProgress(updated);
    localStorage.setItem(`roadmap_progress_${selectedCourse}`, JSON.stringify(updated));
    recordTopicCompleted();

    // Award gamification points for topic/module completion (once per dayId)
    const token = localStorage.getItem('halohex_token');
    if (token) {
      awardPoints('topic_complete', `topic_${dayId}`, token).catch(() => {});
    }
  };

  // Request full screen
  const requestFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  };

  // Computed aggregated metrics for Dashboard
  const getAggregatedMetrics = () => {
    if (!progress || !roadmap) return { currentWeek: 1, completedDaysCount: 0, avgQuiz: 0, codingPerformance: 0 };
    
    const completedDaysCount = (progress.completedDays || []).length;
    
    // Avg Quiz Score
    const quizValues = progress.quizScores ? (Object.values(progress.quizScores) as number[]) : [];
    const avgQuiz = quizValues.length > 0 
      ? Math.round(quizValues.reduce((a, b) => a + b, 0) / quizValues.length)
      : 0;

    // Coding performance
    const codeValues = progress.codingScores ? (Object.values(progress.codingScores) as number[]) : [];
    const codingPerformance = codeValues.length > 0
      ? Math.round(codeValues.reduce((a, b) => a + b, 0) / codeValues.length)
      : 0;

    // Calculate current week
    let currentWeek = 1;
    const daysList = roadmap.days || [];
    const unlockedList = progress.unlockedDays || [];
    if (daysList.length > 0 && unlockedList.length > 0) {
      const lastUnlockedDayId = unlockedList[unlockedList.length - 1];
      const lastUnlockedDay = daysList.find(d => d.id === lastUnlockedDayId);
      if (lastUnlockedDay) {
        currentWeek = lastUnlockedDay.weekNumber;
      }
    }

    // Student skill tier level calculation
    let studentLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';
    if (completedDaysCount > 0 && completedDaysCount <= 10) {
      studentLevel = 'Intermediate';
    } else if (completedDaysCount > 10) {
      studentLevel = 'Advanced';
    }

    return {
      currentWeek,
      completedDaysCount,
      avgQuiz,
      codingPerformance,
      studentLevel
    };
  };

  const metrics = getAggregatedMetrics();

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Syllabus Timeline tab view: full width list of modules */}
        {viewMode === 'syllabus' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
              {/* Header section matching the design */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider block">
                    COURSE TRACK MODULES PLAN
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customize, choose, and auto-generate specialized learning paths powered by Gemini AI.
                  </p>
                </div>
                <span className="bg-blue-100 dark:bg-blue-955 text-blue-700 dark:text-blue-300 text-[10px] font-black px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-900 shrink-0">
                  {roadmap?.days?.length || 0} TOTAL CHAPTERS
                </span>
              </div>

              {/* Selector Box matching the design */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900/40 grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-5 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">
                    CHOOSE CAREER PATH / TRACK
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-3.5 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="Python Crash Course">Python Crash Course</option>
                      <option value="Full-Stack Web Dev">Full-Stack Web Dev</option>
                      <option value="Machine Learning Track">Machine Learning Track</option>
                      <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                    </select>
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 flex items-center justify-center pointer-events-none">
                      <Compass className="w-4.5 h-4.5" />
                    </div>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 dark:border-t-slate-400 w-0 h-0" />
                  </div>
                </div>

                <div className="md:col-span-4 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">
                    STUDY PACE & DURATION
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="w-full bg-slate-50/50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-3.5 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="1 month (Crash study)">1 Month (Crash study)</option>
                      <option value="3 months (Fast track)">3 Months (Fast track)</option>
                      <option value="6 months (Standard)">6 Months (Standard)</option>
                      <option value="1 year (Detailed learning)">1 Year (Detailed learning)</option>
                    </select>
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500 flex items-center justify-center pointer-events-none">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 dark:border-t-slate-400 w-0 h-0" />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <button
                    onClick={generateRoadmap}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <RefreshCw className="w-4 h-4 shrink-0" />
                    )}
                    <span>Generate New Track Plan</span>
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3 py-12 text-center text-slate-400 text-sm font-semibold">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
                  Drafting Personalized Course Plan...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roadmap?.days?.map((day, idx) => {
                    const isCompleted = progress?.completedDays.includes(day.id);
                    const isFirstDay = idx === 0 || day.dayNumber === 1;
                    const isPrevCompleted = idx > 0 && roadmap?.days && progress?.completedDays.includes(roadmap.days[idx - 1].id);
                    const isUnlocked = isFirstDay || isPrevCompleted || progress?.unlockedDays.includes(day.id) || progress?.completedDays.includes(day.id);
                    const isActive = activeDay?.id === day.id;

                    return (
                      <div
                        key={day.id}
                        onClick={() => {
                          if (!isUnlocked) return;
                          loadDayLesson(day);
                          if (onNavigateToCourseMCQ) {
                            onNavigateToCourseMCQ();
                          } else if (onNavigateToDashboard) {
                            onNavigateToDashboard();
                          }
                        }}
                        className={`group border p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 border-slate-200 dark:border-slate-800 ${
                          !isUnlocked
                            ? 'bg-slate-50/50 dark:bg-slate-950/20 opacity-60 cursor-not-allowed'
                            : isActive 
                              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 hover:shadow-md cursor-pointer hover:border-blue-400' 
                              : isCompleted 
                                ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-200/60 dark:border-emerald-900/40 hover:shadow-md cursor-pointer hover:border-emerald-350' 
                                : 'bg-white dark:bg-slate-900 hover:shadow-md cursor-pointer hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500">
                              CHAPTER {idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-slate-955 dark:text-white leading-snug truncate">
                              {day.title}
                            </h4>
                          </div>
                          <div className="shrink-0 mt-0.5">
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : !isUnlocked ? (
                              <Lock className="w-4.5 h-4.5 text-slate-400" />
                            ) : (
                              <BookOpen className="w-4.5 h-4.5 text-blue-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-2 text-[10px]">
                          <span className={`font-bold uppercase tracking-wider ${
                            isCompleted 
                              ? 'text-emerald-600 dark:text-emerald-450' 
                              : !isUnlocked 
                                ? 'text-slate-400 dark:text-slate-500' 
                                : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {isCompleted ? 'COMPLETED' : !isUnlocked ? 'LOCKED' : 'AVAILABLE'}
                          </span>
                          {isUnlocked && (
                            <span className="text-blue-600 dark:text-blue-450 font-bold group-hover:underline flex items-center gap-1">
                              Study <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard metrics & charts tab */}
        {viewMode === 'dashboard' && (
          <div className="lg:col-span-12">
            {/* Real-time Metric Cards matching the attached design image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {/* Card 1: Overall Progress */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-950 dark:text-white leading-none">
                    {roadmap?.days?.length ? Math.min(100, Math.round((metrics.completedDaysCount / (roadmap.days.length || 1)) * 100)) : 0}%
                  </p>
                  <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider block mt-1.5">Overall Progress</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{metrics.completedDaysCount} of {roadmap?.days?.length || 38} topics</p>
                </div>
              </div>

              {/* Card 2: Learning Streak */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="p-3.5 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-2xl">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-950 dark:text-white leading-none">{readStats().streak} days</p>
                  <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider block mt-1.5">Learning Streak</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Keep it up!</p>
                </div>
              </div>

              {/* Card 3: Hours Studied */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex items-center gap-4">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-950 dark:text-white leading-none">
                    {readStats().hoursStudied.toFixed(1)}h
                  </p>
                  <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider block mt-1.5">Hours Studied</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Total time invested</p>
                </div>
              </div>
            </div>

            {/* Charts Grid exactly like the attached design image */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <WeeklyActivityChart />
              </div>
              <div className="lg:col-span-1">
                <RoadmapProgressDonut completed={metrics.completedDaysCount} total={roadmap?.days?.length || 38} />
              </div>
            </div>

            {/* Elegant Banner linking to Course & MCQs */}
            {activeDay ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950 border border-blue-200 dark:border-slate-800 rounded-3xl p-6.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                    📖
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      Active Study Session: <span className="text-blue-600 dark:text-blue-400">{activeDay.title}</span>
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-xl">
                      Your learning curriculum, interactive MCQ checkpoint quizzes, and proctored coding assessments are active. Continue studying in the course tab.
                    </p>
                  </div>
                </div>
                {onNavigateToCourseMCQ && (
                  <button
                    onClick={onNavigateToCourseMCQ}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer active:scale-98 hover:shadow-lg"
                  >
                    Go to Course & MCQ's <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-350 flex items-center justify-center text-xl shrink-0">
                    🌟
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Start your study path!</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-lg">
                      You don't have an active study session in progress. Explore the syllabus timeline modules and click study to generate lessons.
                    </p>
                  </div>
                </div>
                {onNavigateToSyllabus && (
                  <button
                    onClick={onNavigateToSyllabus}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-750 dark:bg-slate-800 dark:hover:bg-slate-755 dark:text-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                  >
                    Open Roadmap <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Course and MCQ workspace tab */}
        {viewMode === 'course-mcq' && (
          <div className="lg:col-span-12">
            {isLoadingLesson ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center space-y-4 shadow-sm min-h-[500px] flex flex-col justify-center items-center">
              <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Syncing Module Curriculum...</h4>
              <p className="text-slate-500 dark:text-slate-450 text-xs max-w-sm">Generating comprehensive text lessons, custom MCQ checkpoints, and proctored compiler questions.</p>
            </div>
          ) : lessonContent ? (
            <div className="space-y-6">
              {/* Workspace Navigation Header / Steps */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4.5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs border border-blue-100 dark:border-blue-900">
                    {lessonContent.dayId.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 dark:text-white text-xs leading-none">{lessonContent.title}</h3>
                    <span className="text-[10px] text-slate-450 mt-1 font-semibold inline-block">Estimated Completion: {lessonContent.estimatedMinutes} mins</span>
                  </div>
                </div>

                {/* Steps Navigator */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-955 p-1 rounded-xl text-[10px] font-bold border border-slate-150 dark:border-slate-850">
                  <button 
                    onClick={() => setFlowStep('content')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${flowStep === 'content' ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-white shadow-xs' : 'text-slate-450'}`}
                  >
                    1. Study Lesson
                  </button>
                  <button 
                    disabled={!isMarkedAsLearned}
                    onClick={() => setFlowStep('mcq')}
                    className={`px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${flowStep === 'mcq' ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-white shadow-xs' : 'text-slate-450'}`}
                  >
                    2. MCQ Quiz
                  </button>
                  <button 
                    disabled={quizScore === null || quizScore < 60}
                    onClick={() => setFlowStep('exam')}
                    className={`px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${flowStep === 'exam' ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-white shadow-xs' : 'text-slate-450'}`}
                  >
                    3. Proctored Exam
                  </button>
                </div>
              </div>

              {/* Step 1: Learning Content Viewer */}
              {flowStep === 'content' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Lesson Material</span>
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white mt-1 border-b border-slate-100 dark:border-slate-850 pb-3">{lessonContent.title} Syllabus</h3>
                    
                    {/* Render lesson introduction/theory body */}
                    <div className="text-xs leading-relaxed space-y-4 whitespace-pre-line mt-4">
                      {lessonContent.theory}
                    </div>

                    {/* Conceptual Highlights */}
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4.5 rounded-2xl mt-6 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Key Concepts to Master</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-650 dark:text-slate-350">
                        {lessonContent.concepts.map((concept, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {concept}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Coding Example Box */}
                    <div className="mt-6 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Practical Syntax Example</h4>
                      <div className="bg-slate-950 text-emerald-400 font-mono text-[10.5px] p-4.5 rounded-2xl overflow-x-auto whitespace-pre leading-normal border border-slate-850 shadow-inner">
                        {lessonContent.examples}
                      </div>
                    </div>

                    {/* Practice Challenges */}
                    <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 p-4.5 rounded-2xl mt-6 space-y-2">
                      <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">Daily Sandbox Exercises</h4>
                      <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                        {lessonContent.practiceTasks.map((task, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold mt-0.5">↳</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Web References & Video tutorials */}
                    <div className="mt-6 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recommended Extra Materials</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {lessonContent.resources.map((res, idx) => (
                          <a 
                            key={idx} 
                            href={res.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-2"
                          >
                            <span className="text-sm">🌐</span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 dark:text-white text-[10px] truncate">{res.name}</p>
                              <span className="text-[8px] uppercase font-bold text-slate-400">{res.type}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Complete study block button */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <p className="text-[10px] text-slate-450 font-medium italic">Read thoroughly before taking the MCQ Assessment step.</p>
                    {isMarkedAsLearned ? (
                      <button 
                        onClick={() => setFlowStep('mcq')}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        Start 10 MCQ Checkpoint <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setIsMarkedAsLearned(true);
                          addProctorLog("📚 Lesson marked as Learned. MCQ Checkpoint unlocked!");
                        }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer animate-pulse"
                      >
                        <Check className="w-4 h-4" /> Complete & Mark as Learned
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: MCQ Quiz Engine */}
              {flowStep === 'mcq' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Conceptual Assessment</span>
                      <h3 className="text-lg font-black text-slate-950 dark:text-white mt-1">Syllabus Checkpoint MCQ (10 Questions)</h3>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-3 py-1 rounded-full">
                      Passing Criteria: &gt;= 60%
                    </span>
                  </div>

                  {/* Render questions list */}
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                    {lessonContent.mcqs.map((q, qIdx) => (
                      <div key={q.id} className="border border-slate-150 dark:border-slate-850 p-4.5 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          Question {qIdx + 1}: {q.question}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((option, optIdx) => {
                            const isSelected = selectedAnswers[q.id] === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => selectMcqOption(q.id, optIdx)}
                                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                                  isSelected 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-bold' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-350'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold border ${isSelected ? 'bg-blue-700 text-white border-blue-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 text-slate-500'}`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="truncate">{option}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submission triggers */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <p className="text-[10px] text-slate-450 font-medium">Please answer all 10 questions to qualify for instant valuation.</p>
                    <button
                      onClick={evaluateMCQ}
                      disabled={Object.keys(selectedAnswers).length < lessonContent.mcqs.length}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      Verify Assessment Answers <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Proctored Coding Exam Arena */}
              {flowStep === 'exam' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
                  
                  {/* secure assessment blocker overlay when not in fullscreen or camera is off */}
                  {(!isFullscreen || !cameraStream) && (
                    <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 rounded-3xl space-y-4">
                      <div className="p-4 bg-rose-500/10 border border-rose-300/20 text-rose-500 rounded-2xl">
                        <ShieldAlert className="w-12 h-12 animate-pulse text-rose-600" />
                      </div>
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Secure Assessment Locked</h3>
                      <p className="text-slate-400 text-xs max-w-sm leading-relaxed font-medium">
                        To access the proctored coding exam, you must activate **Fullscreen Mode** and enable your **Webcam Feed** for remote supervisor monitoring.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {!isFullscreen && (
                          <button
                            onClick={requestFullscreen}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            Enter Fullscreen Mode
                          </button>
                        )}
                        {!cameraStream && (
                          <button
                            onClick={() => {
                              navigator.mediaDevices.getUserMedia({ video: true })
                                .then(stream => {
                                  setCameraStream(stream);
                                  setCameraError(null);
                                  addProctorLog("🎥 Webcam Active: Live monitoring feed initialized successfully.");
                                })
                                .catch(err => {
                                  setCameraError("Camera access is required for proctored examination.");
                                  addProctorLog("🚨 Alert: Failed to access webcam feed.");
                                });
                            }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                          >
                            Enable Webcam Feed
                          </button>
                        )}
                      </div>
                      {cameraError && (
                        <p className="text-rose-500 text-[10px] font-semibold mt-2">{cameraError}</p>
                      )}
                    </div>
                  )}

                  {/* Glowing warning header about proctoring */}
                  <div className="bg-rose-500/10 border border-rose-300/30 text-rose-700 dark:text-rose-400 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide">Secure Software Proctoring Active</p>
                        <p className="text-[10px] opacity-90 leading-tight">Tab switching, screen adjustments, and typing cadence are monitored in real-time. Full-screen is required.</p>
                      </div>
                    </div>
                    {!isFullscreen && (
                      <button 
                        onClick={requestFullscreen}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                      >
                        Enable Fullscreen
                      </button>
                    )}
                  </div>

                  {/* Proctored Exam Split Workspace */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Exam Left: Software Proctoring HUD & Timer */}
                    <div className="lg:col-span-4 space-y-4">
                      {/* Secure Timer Widget */}
                      <div className="border border-slate-250 dark:border-slate-800 bg-slate-950 rounded-2xl p-5 shadow-lg flex flex-col justify-center items-center text-center space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-extrabold">Exam Duration Remaining</span>
                        <div className={`font-mono text-3xl font-black tracking-wider py-1.5 px-4 rounded-xl ${timeLeft < 120 ? 'text-rose-500 bg-rose-500/10 animate-pulse' : 'text-emerald-400 bg-emerald-500/10'}`}>
                          {timeLeft ? `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}` : "00:00"}
                        </div>
                        <p className="text-[9px] text-slate-400 leading-snug">Ensure all test cases compile and run successfully before submitting.</p>
                      </div>

                      {/* Live Proctoring Webcam Feed Card */}
                      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-md flex flex-col space-y-3 relative overflow-hidden">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-450 font-extrabold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                          Live Proctoring Cam Feed
                        </span>
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-150 dark:border-slate-850">
                          {cameraStream ? (
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover scale-x-[-1]"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-[10px] font-bold p-3 text-center">
                              <Camera className="w-6 h-6 mb-1 text-slate-400" />
                              Webcam feed connecting...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Proctoring Status Dashboard */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl space-y-3">
                        <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">Environment Metrics</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-2 rounded-xl flex flex-col">
                            <span className="text-slate-400">Fullscreen status:</span>
                            <span className={`font-bold ${isFullscreen ? 'text-emerald-500' : 'text-rose-500'}`}>{isFullscreen ? '● Active' : '✕ Exited'}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-2 rounded-xl flex flex-col">
                            <span className="text-slate-400">Tab Shields:</span>
                            <span className={`font-bold ${tabSwitchesCount < 3 ? 'text-emerald-500' : 'text-rose-500'}`}>TS Counts: {tabSwitchesCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Proctoring HUD Logs */}
                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl text-[10px] font-mono text-slate-400 space-y-2">
                        <span className="text-emerald-500 font-extrabold uppercase tracking-widest text-[9px] block font-mono">Live Proctoring Logs</span>
                        <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                          {proctorLogs.length === 0 ? (
                            <p className="text-slate-600 italic font-mono">No incidents logged. Proctoring is clean.</p>
                          ) : (
                            proctorLogs.map((log, idx) => (
                              <p key={idx} className="leading-snug font-mono">{log}</p>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Exam Right: Problem description & code editor */}
                    <div className="lg:col-span-8 space-y-4">
                      {/* Question Description */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl space-y-1.5">
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Programming Challenge</span>
                        <p className="text-xs font-black text-slate-950 dark:text-white leading-normal">
                          {lessonContent.codingExam.question}
                        </p>
                        
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 mt-2">
                          <span className="text-[8px] uppercase font-bold text-slate-400">Sample Test Cases:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {lessonContent.codingExam.testCases.map((tc, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-2 rounded-xl text-[9px] font-mono text-slate-500 flex justify-between">
                                <span>In: <strong className="text-slate-800 dark:text-slate-200">{tc.input}</strong></span>
                                <span>Out: <strong className="text-slate-800 dark:text-slate-200">{tc.output}</strong></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Code Editor Box */}
                      <div className="border border-slate-250 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md">
                        {/* Editor Controls Bar */}
                        <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 border-b border-slate-250 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider ml-1">Terminal Sandbox</span>
                          </div>

                          <div className="flex gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            {(['python', 'java', 'c'] as const).map(lang => (
                              <button
                                key={lang}
                                onClick={() => handleLanguageChange(lang)}
                                className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-md transition-all cursor-pointer ${selectedLanguage === lang ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Textarea code area */}
                        <textarea
                          value={editorCode}
                          onChange={(e) => setEditorCode(e.target.value)}
                          className="w-full min-h-[220px] bg-slate-950 text-slate-100 font-mono text-xs p-5 focus:outline-none focus:ring-0 leading-relaxed border-none resize-y"
                          spellCheck={false}
                        />
                      </div>

                      {/* Run Result Feedback Section */}
                      {runResult && (
                        <div className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed transition-all ${
                          runResult.status === 'success' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                        }`}>
                          <div className="flex items-center gap-2 mb-1.5 font-bold uppercase tracking-wider text-[10px]">
                            {runResult.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-500" />
                            )}
                            {runResult.status === 'success' ? 'Validation Status: Okay' : 'Validation Status: Failed'}
                          </div>
                          <p>{runResult.message}</p>
                          {runResult.compileLogs && (
                            <pre className="font-mono text-[9.5px] mt-2 p-2 bg-slate-950 text-slate-300 rounded overflow-x-auto max-h-[80px]">
                              {runResult.compileLogs}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission triggers */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-855 flex items-center justify-between flex-wrap gap-4">
                    <button 
                      onClick={() => { setFlowStep('mcq'); }}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Back to MCQ Quiz
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={runCodeCheck}
                        disabled={isEvaluatingCode}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isEvaluatingCode ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-emerald-500" />}
                        Run & Check Code
                      </button>

                      <button
                        onClick={submitCodingExam}
                        disabled={isEvaluatingCode}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        {isEvaluatingCode ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Submit Proctored Solution
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Exam Evaluation Results view */}
              {flowStep === 'result' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  
                  {quizScore !== null && quizScore < 60 ? (
                    /* MCQ Fail State */
                    <div className="space-y-6 text-center max-w-xl mx-auto py-6">
                      <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 flex items-center justify-center text-2xl font-black mx-auto">
                        ✕
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-black text-slate-950 dark:text-white">Checkpoint Assessment Failed</h3>
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">Revise "{activeDay?.title}" concepts and try again.</p>
                        <p className="text-slate-500 text-xs leading-normal">You scored {quizScore}% in the conceptual test. A minimum of 60% is required to pass the module checkpoints.</p>
                      </div>

                      {/* Custom Recommendations Block */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 p-5 rounded-2xl text-left space-y-3">
                        <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider">Revision Strategy Blueprint</span>
                        <div className="space-y-2 text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                          <p>💡 <strong>Identify Gaps</strong>: Read the Markdown theoretical notes once again, focused particularly on concepts.</p>
                          <p>💡 <strong>Hands-on practice</strong>: Run and modify the static code syntax examples inside your IDE.</p>
                          <p>💡 <strong>Academic Guidance</strong>: Ask the floating Career Mentor assistant about: <em>"{activeDay?.title}"</em>.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => { setFlowStep('content'); setQuizScore(null); }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                      >
                        Re-Study & Try Again
                      </button>
                    </div>
                  ) : !examResult ? (
                    /* MCQ Pass State -> Start Coding Exam */
                    <div className="space-y-6 text-center max-w-xl mx-auto py-6">
                      <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-2xl font-black mx-auto">
                        ✓
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-black tracking-widest text-blue-600">Conceptual Check Approved</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Conceptual Check Passed!</h3>
                        <p className="text-xs text-slate-500">You scored {quizScore}% on the concept checkpoint quiz. Start the coding exam to complete this unit.</p>
                      </div>

                      {/* Proctor Notice Block */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 p-5 rounded-2xl text-left space-y-3">
                        <span className="text-[9px] font-black uppercase text-indigo-650 tracking-wider">Supervised Exam Requirements</span>
                        <div className="space-y-2 text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                          <p>📸 <strong>Webcam Proctoring</strong>: Your camera feed will be active and monitored in real-time during the test.</p>
                          <p>🖥️ <strong>Fullscreen Enforcement</strong>: The exam screen must run in fullscreen. Exiting fullscreen locks the exam.</p>
                          <p>⏱️ <strong>Time Limit</strong>: You will have 10 minutes to write code and verify compilation test cases.</p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-850 flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setFlowStep('exam');
                          }}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          Start Proctored Coding Exam <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : !examResult.passed ? (
                    /* Coding Exam Failed State */
                    <div className="space-y-6 text-center max-w-xl mx-auto py-6">
                      <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-955/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 flex items-center justify-center text-2xl font-black mx-auto">
                        ✕
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-black text-slate-950 dark:text-white">Proctored Coding Exam Failed</h3>
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">Your submitted solution did not pass the sandboxed verification tests.</p>
                        <p className="text-slate-500 text-xs leading-normal">Review compilation results, test cases, and logic flow requirements.</p>
                      </div>

                      {/* Coding recommendations */}
                      <div className="bg-slate-50 dark:bg-slate-955 border border-slate-150 p-5 rounded-2xl text-left space-y-3">
                        <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider">Evaluation Log Details</span>
                        <div className="space-y-2 text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                          <p>💡 <strong>Compiler Feedback</strong>: {examResult.compileLogs || "Assertion failed on secure sample input test cases."}</p>
                          <p>💡 <strong>Advice</strong>: Pay attention to edge cases, variable bounds, and correct return types.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => { setFlowStep('exam'); setExamResult(null); }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                      >
                        Retake Proctored Coding Exam
                      </button>
                    </div>
                  ) : (
                    /* Coding Exam Passed State -> Module Mastered */
                    <div className="space-y-6 text-center max-w-xl mx-auto py-6">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-2xl font-black mx-auto">
                        ✓
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Module Verification Complete</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Congratulations! Module Completed</h3>
                        <p className="text-xs text-slate-500">You scored {quizScore}% on MCQs and successfully verified all compiler test cases.</p>
                      </div>

                      {/* Custom Achievements Block */}
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 p-5 rounded-2xl text-left space-y-3">
                        <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Milestones Mastered</span>
                        <div className="space-y-2 text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                          <p>🌟 <strong>Conceptual Master</strong>: Passed MCQ checkpoints with high confidence.</p>
                          <p>🌟 <strong>Practical Execution</strong>: Passed proctored compilation tests with active webcam validation.</p>
                          <p>🌟 <strong>Next Step</strong>: You have unlocked the next day in your learning track.</p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-850 flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            if (roadmap && activeDay) {
                              const days = roadmap.days || [];
                              const currentIdx = days.findIndex(d => d.id === activeDay.id);
                              if (currentIdx !== -1 && currentIdx + 1 < days.length) {
                                loadDayLesson(days[currentIdx + 1]);
                              } else {
                                setActiveDay(null);
                                setLessonContent(null);
                              }
                            }
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          Proceed to Next Day <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            /* Simple invitation without any background card */
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-95/40 text-blue-600 dark:text-blue-450 flex items-center justify-center text-xl shadow-xs">
                📚
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Ready to begin your study journey?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm">
                  Visit the <strong className="text-blue-600 dark:text-blue-400">Roadmap</strong> page to choose a study track module and launch customized, interactive learning lessons.
                </p>
              </div>
              {onNavigateToSyllabus && (
                <button
                  onClick={onNavigateToSyllabus}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  Open Roadmap <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
