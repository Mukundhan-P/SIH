import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, HelpCircle, Sparkles, BookOpen, Clock, AlertTriangle, CheckCircle, 
  ChevronRight, ArrowRight, BookOpenCheck, TrendingDown, Info, RefreshCw
} from 'lucide-react';

interface Concept {
  id: string;
  name: string;
  category: string;
  notes: string;
  cheatsheet: string[];
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

const CONCEPTS_DATABASE: Concept[] = [
  {
    id: 'python-basics',
    name: 'Python Fundamentals & Loops',
    category: 'Programming',
    notes: 'Python uses dynamic typing and automatic memory management. Focus on comprehension lists, generator expressions, and dictionary methods.',
    cheatsheet: [
      'List Comprehension: [x**2 for x in range(10) if x % 2 == 0]',
      'Generators: Yield memory-efficient values iteratively instead of storing whole lists in RAM.',
      'Slicing Syntax: list[start:stop:step] (e.g., word[::-1] reverses a string).',
      'Dictionary defaults: dict.get(key, default_value) prevents KeyErrors.'
    ],
    questions: [
      {
        question: 'What is the space complexity of a Python Generator compared to a List Comprehension?',
        options: [
          'Generators are O(1) space, while list comprehensions are O(N) space',
          'Generators are O(N) space, while list comprehensions are O(1) space',
          'Both require O(N) auxiliary space',
          'Generators require double the memory of list comprehensions'
        ],
        correctIndex: 0,
        explanation: 'Generators yield values lazily one at a time, requiring O(1) auxiliary memory. List comprehensions build the complete list in RAM instantly, requiring O(N) space.'
      },
      {
        question: 'Which dictionary method is used to fetch a key while avoiding a KeyError if it does not exist?',
        options: [
          'dict.fetch()',
          'dict.get(key, default)',
          'dict.pop(key)',
          'dict.has_key()'
        ],
        correctIndex: 1,
        explanation: 'The get() method returns the default value (or None) if the key is not found in the dictionary, gracefully avoiding a KeyError exception.'
      },
      {
        question: 'What does the expression "hello"[::-2] return in Python?',
        options: [
          '"olh"',
          '"ol"',
          '"oe"',
          '"eh"'
        ],
        correctIndex: 0,
        explanation: 'The slice [::-2] starts from the end of the string "hello" (o) and steps backward by 2 characters, yielding "o", "h", "l" (from right to left: o - l - h).'
      }
    ]
  },
  {
    id: 'ml-foundations',
    name: 'Supervised Learning & Regression',
    category: 'Artificial Intelligence',
    notes: 'Supervised learning involves predicting a target label from inputs. Linear regression minimizes Mean Squared Error (MSE), whereas Logistic Regression uses the sigmoid function to map probabilities.',
    cheatsheet: [
      'Cost Function: Mean Squared Error (MSE) measures average squared differences.',
      'Overfitting: Model fits training noise. Mitigated via L1 (Lasso) or L2 (Ridge) regularization.',
      'Underfitting: Model too simple. Mitigated by increasing features or model capacity.',
      'Sigmoid Function: 1 / (1 + e^-z) maps linear outputs into a [0, 1] probability range.'
    ],
    questions: [
      {
        question: 'How does L1 Regularization (Lasso) differ from L2 Regularization (Ridge)?',
        options: [
          'L1 penalizes absolute weights and can drive parameters to zero (feature selection), while L2 penalizes squared weights.',
          'L2 can drive parameters to exactly zero, while L1 only shrinks them.',
          'L1 is used for linear regression only, while L2 is for logistic regression.',
          'There is no functional mathematical difference between L1 and L2.'
        ],
        correctIndex: 0,
        explanation: 'L1 regularization uses the L1-norm penalty, which promotes sparsity (driving some coefficients to exactly zero, facilitating automated feature selection). L2-norm shrinks coefficients toward zero but rarely sets them to exactly zero.'
      },
      {
        question: 'Which metric is most sensitive to outliers during regression model evaluation?',
        options: [
          'Mean Absolute Error (MAE)',
          'Mean Squared Error (MSE)',
          'Median Absolute Deviation (MAD)',
          'R-squared Index'
        ],
        correctIndex: 1,
        explanation: 'MSE squares the error terms, making large outlier errors disproportionately heavier in the cost calculations.'
      }
    ]
  },
  {
    id: 'sql-joins',
    name: 'SQL Query Joins & Indexing',
    category: 'Databases',
    notes: 'Database joins combine records based on matching keys. Indexes optimize read query speed at the expense of extra write latency.',
    cheatsheet: [
      'INNER JOIN: Returns matching rows in both tables.',
      'LEFT JOIN: Returns all rows from left table, and matching rows from right table.',
      'B-Tree Index: Default index structured for logarithmic O(log N) searches.',
      'Composite Index: Index on multiple columns. ORDER MATTERS (Leftmost prefix rule).'
    ],
    questions: [
      {
        question: 'What is the performance complexity of searching a row by key on a B-Tree indexed column with N records?',
        options: [
          'O(N) sequential search',
          'O(log N) tree traversal search',
          'O(1) direct access',
          'O(N log N) index scan'
        ],
        correctIndex: 1,
        explanation: 'B-Tree indexes maintain sorted balanced tree nodes, reducing row address seek lookups to logarithmic O(log N) depth complexity.'
      },
      {
        question: 'If you have a composite index on columns (A, B), which query will NOT benefit from the index?',
        options: [
          'SELECT * FROM t WHERE A = 5 AND B = 10',
          'SELECT * FROM t WHERE A = 5',
          'SELECT * FROM t WHERE B = 10',
          'Both index lookups are always fully optimized'
        ],
        correctIndex: 2,
        explanation: 'According to the leftmost prefix rule, queries filtering ONLY by the second column (B) cannot use the composite index (A, B) efficiently.'
      }
    ]
  }
];

export default function RevisionPredictor() {
  const [selectedConceptId, setSelectedConceptId] = useState<string>(CONCEPTS_DATABASE[0].id);
  const [initialFamiliarity, setInitialFamiliarity] = useState<number>(85);
  const [daysSinceStudy, setDaysSinceStudy] = useState<number>(0); // 0 = Today, 5 = 5 days, 10 = 10 days
  const [showCheatsheet, setShowCheatsheet] = useState<boolean>(false);
  
  // Quiz Module States
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [wrongAnswers, setWrongAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Active concept
  const activeConcept = CONCEPTS_DATABASE.find(c => c.id === selectedConceptId) || CONCEPTS_DATABASE[0];

  // Ebbinghaus Forgetting Curve Simulation: Retention % = e^(-t / S)
  // S (Stability/Strength factor) is scaled by initial familiarity. Better familiarity = slower decay.
  const calculateRetention = (fam: number, days: number) => {
    const stabilityFactor = (fam / 100) * 8 + 1; // scale from 1.8 to 9.0
    const retention = Math.exp(-days / stabilityFactor) * 100;
    return Math.round(retention);
  };

  const predictedRetention = calculateRetention(initialFamiliarity, daysSinceStudy);

  // Handle start test
  const handleStartTest = () => {
    setIsTesting(true);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setWrongAnswers([]);
    setShowResults(false);
  };

  // Handle option submit
  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    
    const isCorrect = selectedOption === activeConcept.questions[currentQuestionIdx].correctIndex;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    } else {
      setWrongAnswers(prev => [...prev, currentQuestionIdx]);
    }
  };

  // Handle next question
  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    if (currentQuestionIdx + 1 < activeConcept.questions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  // Determine retention visual feedback colors
  const getRetentionColor = (val: number) => {
    if (val >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
    if (val >= 50) return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
  };

  const getRetentionBarColor = (val: number) => {
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6" id="revision-retention-predictor-root">
      {/* Title block matching the uploaded image */}
      <div>
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Revision & Retention Predictor</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verify retention and study topic notes instantly based on your studied concepts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Retention Predictor card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
          
          {/* Card header */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
              <Brain className="w-5.5 h-5.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Retention Predictor</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Predict forgetting curves and launch revisions instantly</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Inputs block */}
            <div className="space-y-5">
              
              {/* Select Concept */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Select Concept
                  </label>
                  <span className="text-[9px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-1.5 py-0.5 rounded uppercase">
                    Roadmap Linked
                  </span>
                </div>
                
                <select
                  value={selectedConceptId}
                  onChange={(e) => {
                    setSelectedConceptId(e.target.value);
                    setIsTesting(false);
                    setShowCheatsheet(false);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {CONCEPTS_DATABASE.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status warning mimicking the image */}
              <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/20 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                  <span>Topic Assessment Status</span>
                </div>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 leading-relaxed">
                  You haven't locked full marks in this module assessment yet. Study this lesson, run testing runs in the <strong>Code Editor</strong>, and pass the revision challenge below to update your live retention score!
                </p>
              </div>

            </div>

            {/* Right Sliders / Metrics block */}
            <div className="space-y-5">
              
              {/* Slider 1: Initial Familiarity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Initial Familiarity
                  </span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{initialFamiliarity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={initialFamiliarity}
                  onChange={(e) => {
                    setInitialFamiliarity(Number(e.target.value));
                    setIsTesting(false);
                  }}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>Vague (10%)</span>
                  <span>Proficient (70%)</span>
                  <span>Master (100%)</span>
                </div>
              </div>

              {/* Slider 2: Last Studied */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Last Studied / Reviewed
                  </span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase text-[10px]">
                    {daysSinceStudy === 0 ? 'Today' : `${daysSinceStudy} Days Ago`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={daysSinceStudy}
                  onChange={(e) => {
                    setDaysSinceStudy(Number(e.target.value));
                    setIsTesting(false);
                  }}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>Today</span>
                  <span>5 Days Ago</span>
                  <span>10 Days Ago</span>
                </div>
              </div>

              {/* Action Buttons styled like the uploaded image */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  onClick={() => setShowCheatsheet(prev => !prev)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border ${
                    showCheatsheet 
                      ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300' 
                      : 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Cheatsheet
                </button>
                <button
                  onClick={handleStartTest}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  Revision →
                </button>
              </div>

            </div>

          </div>

          {/* Retention predictor info card */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
                <Clock className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ebbinghaus Prediction</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Estimated Retention Capacity</h4>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Dynamic status colored text */}
              <div className={`px-3 py-1.5 rounded-full border text-xs font-bold ${getRetentionColor(predictedRetention)}`}>
                {predictedRetention}% Retained
              </div>
              <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex-1 sm:flex-initial">
                <div 
                  className={`h-full transition-all duration-300 ${getRetentionBarColor(predictedRetention)}`} 
                  style={{ width: `${predictedRetention}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Ebbinghaus Forgetting Curve description card */}
        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4 text-blue-600" /> Forgetting Curve Insights
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            According to the <strong>Ebbinghaus Forgetting Curve</strong>, memory retention decays exponentially over time without periodic revisions.
          </p>
          <div className="space-y-2 text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-500 font-bold">•</span>
              <span><strong>Familiarity factor:</strong> Higher initial mastery substantially slows memory decay curves.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-blue-500 font-bold">•</span>
              <span><strong>Sieve rule:</strong> Revising concepts after 5 days boosts retention from 35% back up to 90%+.</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-200">Current Decay Level:</span>
            <div className="text-xs font-bold mt-1 text-slate-800 dark:text-slate-200">
              {predictedRetention >= 80 ? '🟢 Stable Retention State' : predictedRetention >= 50 ? '🟡 Moderate Decay State' : '🔴 Critical Review Required!'}
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Drawer Sections: Cheatsheet Notes or Active Interactive Test */}
      <AnimatePresence mode="wait">
        
        {/* Cheatsheet drawer */}
        {showCheatsheet && !isTesting && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/70 dark:border-amber-900/30 p-5 rounded-3xl space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/40 pb-2">
              <span className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5" />
                {activeConcept.name} CheatSheet Notes
              </span>
              <button 
                onClick={() => setShowCheatsheet(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold italic">
              "{activeConcept.notes}"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {activeConcept.cheatsheet.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 p-3 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono"
                >
                  <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold block mb-1">Key Note #{idx + 1}:</span>
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Quiz Assessment Interface */}
        {isTesting && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5"
          >
            
            {/* Header / Tracker */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
                  Interactive Retention Assessment
                </span>
                <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Topic: {activeConcept.name}</span>
              </div>
              <button 
                onClick={() => setIsTesting(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                Quit Test
              </button>
            </div>

            {!showResults ? (
              <div className="space-y-4">
                {/* Question progress */}
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Question {currentQuestionIdx + 1} of {activeConcept.questions.length}</span>
                  <span className="text-blue-600 dark:text-blue-400">XP Reward: +120 XP</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIdx) / activeConcept.questions.length) * 100}%` }}
                  />
                </div>

                {/* Question text */}
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-relaxed pt-2">
                  {activeConcept.questions[currentQuestionIdx].question}
                </h4>

                {/* Options List */}
                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  {activeConcept.questions[currentQuestionIdx].options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === activeConcept.questions[currentQuestionIdx].correctIndex;
                    let optionClass = "bg-slate-50 hover:bg-slate-100/80 border-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200";
                    
                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        optionClass = "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 font-bold";
                      } else if (isSelected) {
                        optionClass = "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400";
                      } else {
                        optionClass = "bg-slate-50/55 border-slate-100 text-slate-400 dark:bg-slate-950/30 dark:border-slate-900/50 dark:text-slate-600";
                      }
                    } else if (isSelected) {
                      optionClass = "bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-400 font-bold";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerSubmitted}
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${optionClass}`}
                      >
                        <span className="flex-1 pr-3">{option}</span>
                        {isAnswerSubmitted && isCorrect && (
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback on answer submission */}
                {isAnswerSubmitted && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1 text-[9px]">
                      Explanation Insight:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400">
                      {activeConcept.questions[currentQuestionIdx].explanation}
                    </p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-end pt-3">
                  {!isAnswerSubmitted ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedOption === null}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Verify Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      {currentQuestionIdx + 1 < activeConcept.questions.length ? 'Next Question' : 'View Summary'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            ) : (
              // Results dashboard
              <div className="space-y-5 text-center py-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/30">
                  <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Retention Verification Complete!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Assessment analyzed: Your concepts have been verified.</p>
                </div>

                <div className="grid grid-cols-2 max-w-sm mx-auto gap-3 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                    <span className="text-[20px] font-black text-slate-800 dark:text-slate-100">
                      {quizScore} / {activeConcept.questions.length}
                    </span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mt-1">Accuracy Score</span>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                    <span className="text-[20px] font-black text-emerald-600 dark:text-emerald-400">
                      +{quizScore * 40} XP
                    </span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mt-1">XP Points Gained</span>
                  </div>
                </div>

                {/* Suggested weakest categories */}
                <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/20 text-left p-4 rounded-2xl max-w-md mx-auto space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-800 dark:text-rose-400">
                    <TrendingDown className="w-4 h-4" />
                    <span>AI Weak Topics Discovery</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Based on your response indexes, you showed minor hesitation in: 
                    <strong className="text-rose-700 dark:text-rose-400 ml-1">
                      {wrongAnswers.length > 0 
                        ? 'Algorithm/Complex constraints analysis' 
                        : 'None! Absolute perfect score.'}
                    </strong>.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {wrongAnswers.length > 0 
                      ? 'Recommendation: Re-test concepts in 5 days to consolidate short-term synaptic connections.' 
                      : 'Recommendation: Exceptional retention depth. Ready for the live leaderboards!'}
                  </p>
                </div>

                <div className="flex justify-center gap-3 pt-3">
                  <button
                    onClick={() => {
                      setDaysSinceStudy(0);
                      setInitialFamiliarity(wrongAnswers.length === 0 ? 100 : Math.min(100, Math.max(10, initialFamiliarity + 15)));
                      setIsTesting(false);
                    }}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Apply & Sync Retention Score
                  </button>
                  <button
                    onClick={handleStartTest}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Retake Test
                  </button>
                </div>

              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
