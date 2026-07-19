import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { StudyTask, StudentProfile } from '@/src/types';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Circle, AlertCircle, Plus, Sparkles, RefreshCw } from 'lucide-react';

interface StudyPlannerProps {
  profile: StudentProfile;
  tasks: StudyTask[];
  onAddTask: (task: Omit<StudyTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onRescheduleMissed: () => void;
  isLoading: boolean;
  onGenerateAIPlan: (extraGoal: string, examDates: string) => void;
}

export default function StudyPlanner({
  profile,
  tasks,
  onAddTask,
  onToggleTask,
  onRescheduleMissed,
  isLoading,
  onGenerateAIPlan,
}: StudyPlannerProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'all'>('daily');
  const [extraGoal, setExtraGoal] = useState('');
  const [examDates, setExamDates] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states for custom task
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Study' | 'Revision' | 'Exam Preparation' | 'Mock Test'>('Study');
  const [newDuration, setNewDuration] = useState('1.5 hours');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlot, setNewSlot] = useState('10:00 AM - 11:30 AM');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering tasks
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'daily') {
      return t.date === todayStr;
    } else if (activeTab === 'weekly') {
      // Show next 7 days
      const diffTime = Math.abs(new Date(t.date).getTime() - new Date(todayStr).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    return true; // all
  });

  const handleCustomTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAddTask({
        title: newTitle.trim(),
        category: newCategory,
        duration: newDuration,
        date: newDate,
        timeSlot: newSlot,
        status: 'pending',
      });
      setNewTitle('');
      setShowAddForm(false);
    }
  };

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateAIPlan(extraGoal, examDates);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5.5 h-5.5 text-blue-600" /> Personalized Study Planner
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Based on your target of {profile.studyHours} study hours per day</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRescheduleMissed}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 dark:border-amber-900/30 dark:text-amber-300 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
            title="Move missed tasks from the past to today"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reschedule Missed Tasks
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: AI generator & Custom Input form */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm">
            <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Generate Dynamic AI Schedule
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-semibold">
              HaloHex AI will structure an optimized 7-day study timetable integrating your exams and learning goals.
            </p>

            <form onSubmit={handleAISubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1.5 uppercase tracking-wider">What is your core focus this week?</label>
                <input
                  type="text"
                  value={extraGoal}
                  onChange={(e) => setExtraGoal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                  placeholder="e.g. Master Neural Networks, Prep for interview"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1.5 uppercase tracking-wider">Upcoming Exam Dates / Milestones</label>
                <input
                  type="text"
                  value={examDates}
                  onChange={(e) => setExamDates(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                  placeholder="e.g. DBMS midterms on Friday"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {isLoading ? 'Generating Schedule...' : 'Generate AI Weekly Timetable'}
              </button>
            </form>
          </div>

          {/* Collapsible custom task addition form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-hidden shadow-sm"
              >
                <h3 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider mb-4">Add Custom Study Task</h3>
                <form onSubmit={handleCustomTaskSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-xs mb-1 font-bold">Task Title</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-semibold"
                      placeholder="e.g. Revise Big O Notation"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 text-xs mb-1 font-bold">Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none font-semibold"
                      >
                        <option>Study</option>
                        <option>Revision</option>
                        <option>Exam Preparation</option>
                        <option>Mock Test</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 text-xs mb-1 font-bold">Duration</label>
                      <input
                        type="text"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none font-semibold"
                        placeholder="e.g. 2 hours"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 text-xs mb-1 font-bold">Target Date</label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 text-xs mb-1 font-bold">Suggested Slot</label>
                      <input
                        type="text"
                        value={newSlot}
                        onChange={(e) => setNewSlot(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none font-semibold"
                        placeholder="e.g. 2:00 PM - 4:00 PM"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Save Task
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Task List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar filter tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {(['daily', 'weekly', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  activeTab === tab
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab === 'daily' ? 'Today' : tab === 'weekly' ? 'This Week' : 'All Tasks'}
              </button>
            ))}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const isMissed = task.status === 'missed';
                const isPast = new Date(task.date) < new Date(todayStr);

                return (
                  <motion.div
                    key={task.id}
                    layoutId={task.id}
                    className={`border dark:border-slate-800 p-4.5 rounded-2xl flex items-center justify-between gap-4 transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850 opacity-60'
                        : isMissed
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="mt-1 focus:outline-none"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50 dark:fill-emerald-950/20" />
                        ) : isMissed ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 hover:text-blue-600" />
                        )}
                      </button>
                      <div>
                        <h4 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {task.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                          <span className={`px-2 py-0.5 rounded-md border ${
                            task.category === 'Study' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-300' :
                            task.category === 'Revision' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-300' :
                            task.category === 'Exam Preparation' ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-300' : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {task.category}
                          </span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-600" /> {task.timeSlot}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{task.date} ({task.duration})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPast && !isCompleted && !isMissed && (
                        <span className="text-[9px] bg-red-55/40 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Missed
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                          Done
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                <CalendarIcon className="w-8 h-8 text-slate-450 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">No study tasks allocated for this period.</p>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1 font-medium">Generate an AI schedule or add standard custom tasks above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
