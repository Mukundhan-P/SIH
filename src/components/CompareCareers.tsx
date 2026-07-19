import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CareerRecommendation, StudentProfile, CareerComparisonData } from '../types';
import { GitMerge, DollarSign, Activity, AlertTriangle, Sparkles, Compass, ArrowRightLeft, ShieldCheck, Heart, Users, Clock, Award } from 'lucide-react';

interface CompareCareersProps {
  profile: StudentProfile;
  careerData: CareerRecommendation | null;
}

export default function CompareCareers({ profile, careerData }: CompareCareersProps) {
  const [careerB, setCareerB] = useState('Full Stack Developer');
  const [comparisonResult, setComparisonResult] = useState<CareerComparisonData['comparison'] | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // List of careers to compare
  const careerOptions = [
    'AI Engineer', 'Machine Learning Engineer', 'Data Scientist', 'Data Analyst',
    'Software Engineer', 'Full Stack Developer', 'DevOps Engineer', 'Cloud Engineer',
    'Cybersecurity Analyst', 'UI/UX Designer', 'Product Manager', 'Blockchain Developer',
    'Mobile App Developer', 'Game Developer', 'Research Scientist'
  ];

  const handleCompare = () => {
    setIsComparing(true);
    // Simulate smart comparative reasoning based on target roles
    setTimeout(() => {
      const currentRole = careerData?.name || 'AI Engineer';
      const getComparison = (roleA: string, roleB: string) => {
        return {
          salary: `${roleA}: $120,000 - $180,000/yr vs ${roleB}: $95,000 - $145,000/yr`,
          demand: `${roleA}: Extremely High (35% Growth) vs ${roleB}: Very High (22% Growth)`,
          growth: `${roleA}: Exponential (AI transformation wave) vs ${roleB}: Solid & Steady`,
          skills: `${roleA}: Python, PyTorch, LLMs, Math vs ${roleB}: React, Node, SQL, AWS`,
          difficulty: `${roleA}: Advanced/Expert (Math intensive) vs ${roleB}: Intermediate/Advanced`,
          learningTime: `${roleA}: 6 - 12 Months vs ${roleB}: 4 - 8 Months`,
          opportunities: `${roleA}: AI research, model customization vs ${roleB}: SaaS development, enterprise software`,
          workLifeBalance: `${roleA}: Flexible but high mental load vs ${roleB}: Good standard work hours`,
        };
      };
      setComparisonResult(getComparison(currentRole, careerB));
      setIsComparing(false);
    }, 800);
  };

  return (
    <div className="space-y-8" id="compare-careers-root">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-5.5 h-5.5 text-blue-600" /> Compare Careers Side-by-Side
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Evaluate other technical and product disciplines alongside your recommended primary target
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Career A (Current Recommended)</label>
            <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 font-semibold text-sm">
              {careerData?.name || 'AI Engineer'}
            </div>
          </div>
          <div className="text-slate-400 dark:text-slate-500 font-bold self-end mb-3">VS</div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Career B (Compare With)</label>
            <select
              value={careerB}
              onChange={(e) => setCareerB(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-semibold text-sm"
            >
              {careerOptions
                .filter((c) => c !== (careerData?.name || 'AI Engineer'))
                .map((opt) => (
                  <option key={opt} className="dark:bg-slate-900 dark:text-slate-255">{opt}</option>
                ))}
            </select>
          </div>
          <button
            onClick={handleCompare}
            disabled={isComparing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all shadow-sm self-end h-[46px] cursor-pointer"
          >
            {isComparing ? 'Analyzing...' : 'Compare Side-by-Side'}
          </button>
        </div>

        {/* Comparison results */}
        <AnimatePresence mode="wait">
          {comparisonResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="border-t border-slate-100 dark:border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="col-span-1 md:col-span-2 text-center bg-slate-50 dark:bg-slate-950 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl mb-2">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  Comparing: {careerData?.name || 'AI Engineer'} vs {careerB}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-xl h-fit">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider block">Expected Salary Range</span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-medium mt-1">{comparisonResult.salary}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-450 rounded-xl h-fit">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider block">Job Market Demand</span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-medium mt-1">{comparisonResult.demand}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex gap-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-455 rounded-xl h-fit">
                  <GitMerge className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider block">Required Skills Focus</span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-medium mt-1">{comparisonResult.skills}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-450 rounded-xl h-fit">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-amber-700 dark:text-amber-450 font-bold uppercase tracking-wider block">Difficulty & Learning Time</span>
                  <p className="text-slate-800 dark:text-slate-200 text-xs font-medium mt-1">{comparisonResult.difficulty} (Est: {comparisonResult.learningTime})</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl col-span-1 md:col-span-2 space-y-2">
                <span className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider block">Long-Term Growth & Path Overview</span>
                <p className="text-slate-800 dark:text-slate-250 text-xs font-medium">{comparisonResult.growth}</p>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">{comparisonResult.opportunities}</p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-medium border-t border-slate-100 dark:border-slate-800 pt-6">
              Click 'Compare Side-by-Side' to view structural differences, average salaries, hiring demand, and skill levels.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
