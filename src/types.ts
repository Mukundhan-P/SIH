export interface StudentProfile {
  name: string;
  degree: string;
  branch: string;
  yearOfStudy: string;
  college: string;
  cgpa?: string;
  skills: string[];
  languages: string[];
  interests: string[];
  dreamCareer: string;
  preferredIndustry: string;
  preferredCountry: string;
  studyHours: number;
  preferredLanguage: string;
  learningStyle: 'Video' | 'Reading' | 'Practical' | 'Mixed';
  timelineGoal: string; // e.g. "6 months"
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
  audioData?: string; // base64 audio response if voiced
  mode?: string; // e.g. "Doubt Solver", "Translator"
}

export interface CareerRecommendation {
  name: string;
  description: string;
  skills: string[];
  roadmap: {
    prerequisites: string[];
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  expectedSalary: string;
  jobDemand: string;
  growthOpportunities: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  suitablePersonality: string;
}

export interface StudyTask {
  id: string;
  title: string;
  category: 'Study' | 'Revision' | 'Exam Preparation' | 'Mock Test';
  duration: string;
  status: 'pending' | 'completed' | 'missed';
  date: string; // YYYY-MM-DD
  timeSlot: string;
}

export interface Course {
  title: string;
  platform: 'YouTube' | 'NPTEL' | 'Coursera' | 'Udemy' | 'edX' | 'freeCodeCamp' | 'Official Doc';
  type: 'free' | 'paid';
  url: string;
  rating: string;
  duration: string;
}

export interface ResumeAnalysis {
  score: number;
  atsScore: number;
  missingSkills: string[];
  weakSections: string[];
  formatting: string;
  grammar: string;
  projectSuggestions: string[];
  certificationSuggestions: string[];
  improvementTips: string[];
  improvedResumeMarkdown: string;
}

export interface InterviewRoundState {
  active: boolean;
  role: string;
  roundType: 'HR' | 'Technical' | 'Coding' | 'Behavioral' | 'System Design' | 'Project Discussion';
  currentQuestionIndex: number;
  questions: string[];
  chatHistory: { role: 'interviewer' | 'user'; text: string }[];
  answers: {
    question: string;
    answer: string;
    feedback: string;
    mistakes: string[];
    correctAnswer: string;
    confidenceScore: number;
    communicationScore: number;
    technicalScore: number;
    overallRating: number;
  }[];
  isComplete: boolean;
}

export interface CareerComparisonData {
  careerA: string;
  careerB: string;
  comparison: {
    salary: string;
    demand: string;
    growth: string;
    skills: string;
    difficulty: string;
    learningTime: string;
    opportunities: string;
    workLifeBalance: string;
  };
}

export interface DayModule {
  id: string; // e.g. "w1-d1"
  dayNumber: number;
  weekNumber: number;
  title: string;
  objectives: string[];
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
}

export interface CodingExam {
  question: string;
  templatePython: string;
  templateJava: string;
  templateC: string;
  testCases: { input: string; output: string }[];
}

export interface DayLessonContent {
  dayId: string;
  title: string;
  theory: string;
  concepts: string[];
  examples: string; // Markdown code block or code string
  practiceTasks: string[];
  resources: { name: string; url: string; type: 'video' | 'article' | 'docs' }[];
  estimatedMinutes: number;
  mcqs: MCQQuestion[];
  codingExam: CodingExam;
}

export interface AdaptiveLockedRoadmap {
  id: string;
  courseName: string;
  duration: string;
  days: DayModule[];
}

export interface RoadmapProgress {
  courseId: string;
  completedDays: string[]; // List of day IDs (e.g. "w1-d1")
  unlockedDays: string[]; // List of day IDs that are unlocked
  quizScores: { [dayId: string]: number }; // e.g. { "w1-d1": 85 }
  codingScores: { [dayId: string]: number }; // e.g. { "w1-d1": 90 }
  timeSpent: { [dayId: string]: number }; // minutes spent on each day
  failedAttempts: { [dayId: string]: number }; // count of failed attempts
  lastAccessedDayId: string;
}

export interface LearningDNA {
  currentEducation: string;
  currentSemesterOrYear: string;
  careerGoal: string;
  existingSkills: string[];
  weakSkills: string[];
  strongSkills: string[];
  preferredLearningStyle: 'Visual' | 'Reading' | 'Hands-on' | 'Video';
  dailyStudyTime: number;
  weeklyAvailability: string;
  preferredLanguage: string;
  targetCompletionDate: string;
  completedProjects: string[];
  certificates: string[];
  mockInterviewScores: number[]; // overall ratings or percentages
  atsResumeScore: number;
  quizPerformance: {
    passed: number;
    failed: number;
    total: number;
    averageScore: number;
  };
  codingPerformance: {
    completedProblems: number;
    averageScore: number;
  };
  learningSpeed: 'Slow' | 'Moderate' | 'Fast';
  confidenceScore: number; // 0-100
  consistencyScore: number; // 0-100
  currentStreak: number;
  overallProgress: number; // 0-100
}


