import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { StudentProfile } from '../types';
import { BookOpen, Award, Target, Calendar, ChevronRight, ChevronLeft, Sparkles, Code, CheckCircle2, Flame, GraduationCap, Briefcase, Clock, Languages, Lightbulb, X, Bot } from 'lucide-react';
import RobotPet from './RobotPet';

interface StudentProfileFormProps {
  onSubmit: (profile: StudentProfile) => void;
  initialName?: string;
}

export default function StudentProfileForm({ onSubmit, initialName = '' }: StudentProfileFormProps) {
  const [step, setStep] = useState(1);
  const [isHexoOpen, setIsHexoOpen] = useState(true);

  useEffect(() => {
    setIsHexoOpen(true);
  }, [step]);

  const getSimpleHexoAction = () => {
    switch (step) {
      case 1:
        return "Fill in your name and college details so we can customize your workspace.";
      case 2:
        return "Select the programming languages and skills you already know.";
      case 3:
        return "Choose your dream career target and when you want to achieve it.";
      case 4:
        return "Set your daily study hours. We're ready to build your roadmap!";
      default:
        return "Configure your academic and professional path!";
    }
  };

  const [formData, setFormData] = useState<Partial<StudentProfile>>({
    name: initialName || 'Learner',
    degree: 'B.Tech',
    branch: 'Computer Science',
    yearOfStudy: '3rd Year',
    college: 'Stanford University',
    cgpa: '',
    skills: [],
    languages: [],
    interests: [],
    dreamCareer: 'AI Engineer',
    preferredIndustry: 'Tech / Software', // default industry behind the scenes
    preferredCountry: 'India', // default country behind the scenes
    studyHours: 4,
    preferredLanguage: 'English',
    learningStyle: 'Mixed',
    timelineGoal: '6 months',
  });

  const [customSkill, setCustomSkill] = useState('');
  const [customLang, setCustomLang] = useState('');
  const [customInterest, setCustomInterest] = useState('');

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Toggles pre-set skill/language/interest selections
  const toggleSelection = (field: 'skills' | 'languages' | 'interests', item: string) => {
    const currentArray = formData[field] as string[] || [];
    if (currentArray.includes(item)) {
      setFormData({
        ...formData,
        [field]: currentArray.filter((i) => i !== item)
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentArray, item]
      });
    }
  };

  // Adds custom manual entered inputs
  const handleAddCustom = (
    field: 'skills' | 'languages' | 'interests',
    value: string,
    setCustomValue: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      const currentArray = formData[field] as string[] || [];
      if (!currentArray.includes(value.trim())) {
        setFormData({ ...formData, [field]: [...currentArray, value.trim()] });
      }
      setCustomValue('');
    }
  };

  const handleRemoveField = (field: 'skills' | 'languages' | 'interests', value: string) => {
    const currentArray = formData[field] as string[] || [];
    setFormData({ ...formData, [field]: currentArray.filter((item) => item !== value) });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.degree && formData.college) {
      onSubmit(formData as StudentProfile);
    }
  };

  const stepsInfo = [
    { id: 1, title: 'Personal info', icon: BookOpen },
    { id: 2, title: 'Skills & Stack', icon: Award },
    { id: 3, title: 'Dream Goals', icon: Target },
    { id: 4, title: 'Preferences', icon: Calendar },
  ];

  // Lists of easy-add programming languages and technical skills
  const presetLangs = [
    'Python', 'JavaScript', 'TypeScript', 'C++', 'Java', 'Go', 'Rust', 'SQL', 'HTML/CSS'
  ];

  const presetSkills = [
    'React', 'Node.js', 'Express', 'Tailwind CSS', 'Git & GitHub', 'Docker', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'System Design'
  ];

  const presetInterests = [
    'Web Development', 'AI & Deep Learning', 'Mobile Apps', 'Cybersecurity', 'DevOps & Cloud', 'Blockchain', 'Data Engineering', 'Product Strategy'
  ];

  // Lists of Dream Careers for beautiful cards
  const dreamRoles = [
    { name: 'AI Engineer', desc: 'Build and fine-tune machine learning and LLM models', icon: Flame, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
    { name: 'Full Stack Developer', desc: 'Craft robust end-to-end client-server applications', icon: Code, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { name: 'Software Engineer', desc: 'Design core algorithms, performance, and databases', icon: GraduationCap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { name: 'Data Scientist', desc: 'Analyze complex data metrics and run predictions', icon: Target, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { name: 'DevOps Engineer', desc: 'Automate CI/CD, cloud deployments, and networks', icon: Sparkles, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { name: 'Cybersecurity Analyst', desc: 'Defend virtual assets and conduct ethical hacking', icon: Briefcase, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20' },
  ];

  const timelineOptions = [
    { label: '1 month', sub: 'Crash study (highly intensive)' },
    { label: '3 months', sub: 'Fast-track pacing (moderate speed)' },
    { label: '6 months', sub: 'Standard timeline (well-balanced)' },
    { label: '1 year', sub: 'Comprehensive syllabus (deep understanding)' },
  ];

  // Hexo the robot pet's custom prompt dialogues matching current step
  const getHexoMessage = () => {
    switch (step) {
      case 1:
        return `Hi! I'm Hexo, your robot companion pet. Let's start with your academic details so I can calibrate your workspace!`;
      case 2:
        return `Beep boop! Let's list your skills. Simply click any of the buttons below to toggle your programming languages and technical tools in an instant!`;
      case 3:
        return `Where do we want to go, friend? Select your dream career role and study timeline below! I am ready to design your learning roadmap around these.`;
      case 4:
        return `We are almost there! Tell me how many hours we should study daily and your preferred learning style, and let's unlock your portal!`;
      default:
        return `Welcome to HaloHex! Let's get started.`;
    }
  };

  const getHexoExpression = () => {
    switch (step) {
      case 1: return 'greeting';
      case 2: return 'happy';
      case 3: return 'thinking';
      case 4: return 'excited';
      default: return 'neutral';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="onboarding-flow-container">
      {/* Details Collecting Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300" id="profile-collection-card">
        {/* Header */}
        <div className="text-center md:text-left mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Onboard Your Profile</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Tell Hexo about your background to generate your tailored syllabus and mock assessments</p>
        </div>

        {/* Dynamic Horizontal Wizard Progress bar */}
        <div className="flex justify-between items-center mb-8 px-4">
          {stepsInfo.map((s, index) => {
            const Icon = s.icon;
            const isActive = step >= s.id;
            const isCurrent = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center relative z-10 cursor-pointer" onClick={() => setStep(s.id)}>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none scale-105 font-semibold'
                        : isActive
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-650'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${isCurrent ? 'text-blue-600 dark:text-blue-400' : isActive ? 'text-slate-700 dark:text-slate-300' : 'text-slate-450 dark:text-slate-500'}`}>
                    {s.title}
                  </span>
                </div>
                {index < stepsInfo.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 bg-slate-100 dark:bg-slate-800 relative -mt-4.5">
                    <div
                      className="absolute h-full bg-blue-500 transition-all duration-500"
                      style={{ width: step > s.id ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <form onSubmit={handleFormSubmit}>
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Academic Background */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/35 transition-all font-medium"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">College/University *</label>
                    <input
                      type="text"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/35 transition-all font-medium"
                      placeholder="e.g. Stanford University"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">Degree *</label>
                    <input
                      type="text"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/35 transition-all font-medium"
                      placeholder="e.g. B.Tech, B.Sc, MCA"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">Branch/Specialization *</label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/35 transition-all font-medium"
                      placeholder="e.g. Computer Science, AI, IT"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">Year of Study</label>
                    <select
                      value={formData.yearOfStudy}
                      onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/35 transition-all font-medium"
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>Graduate/Postgraduate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">Current CGPA / Percentage (Optional)</label>
                    <input
                      type="text"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/35 transition-all font-medium"
                      placeholder="e.g. 8.5 or 85%"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Skills & Tech Stack */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                {/* Programming Languages */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-500" />
                    <label className="block text-slate-800 dark:text-slate-200 text-xs font-extrabold uppercase tracking-wider">Programming Languages Known</label>
                  </div>
                  
                  {/* Quick-add toggle badges for programming languages */}
                  <div className="flex flex-wrap gap-2">
                    {presetLangs.map((lang) => {
                      const isSelected = (formData.languages || []).includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleSelection('languages', lang)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{lang}
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual custom language entered */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customLang}
                      onChange={(e) => setCustomLang(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom('languages', customLang, setCustomLang))}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Or enter any custom language... (Press Enter)"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustom('languages', customLang, setCustomLang)}
                      className="bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 rounded-xl transition-all border border-slate-200 dark:border-slate-750"
                    >
                      Add Custom
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(formData.languages || []).map((lang) => (
                      <span key={lang} className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full">
                        {lang}
                        <button type="button" onClick={() => handleRemoveField('languages', lang)} className="hover:text-red-500 font-extrabold ml-1 cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tech & Professional Skills */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-500" />
                    <label className="block text-slate-800 dark:text-slate-200 text-xs font-extrabold uppercase tracking-wider">Current Tech/Professional Skills</label>
                  </div>

                  {/* Quick toggle pre-set tech skills */}
                  <div className="flex flex-wrap gap-2">
                    {presetSkills.map((skill) => {
                      const isSelected = (formData.skills || []).includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSelection('skills', skill)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{skill}
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual entry fallback */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom('skills', customSkill, setCustomSkill))}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Or enter any other skill... (Press Enter)"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustom('skills', customSkill, setCustomSkill)}
                      className="bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 rounded-xl transition-all border border-slate-200 dark:border-slate-750"
                    >
                      Add Custom
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(formData.skills || []).map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/35 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full">
                        {skill}
                        <button type="button" onClick={() => handleRemoveField('skills', skill)} className="hover:text-red-500 font-extrabold ml-1 cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Areas of Interest */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <label className="block text-slate-800 dark:text-slate-200 text-xs font-extrabold uppercase tracking-wider">Areas of Interest</label>
                  </div>

                  {/* Preset quick toggle buttons */}
                  <div className="flex flex-wrap gap-2">
                    {presetInterests.map((interest) => {
                      const isSelected = (formData.interests || []).includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleSelection('interests', interest)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-350 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{interest}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customInterest}
                      onChange={(e) => setCustomInterest(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustom('interests', customInterest, setCustomInterest))}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Or enter other interest fields... (Press Enter)"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustom('interests', customInterest, setCustomInterest)}
                      className="bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 rounded-xl transition-all border border-slate-200 dark:border-slate-750"
                    >
                      Add Custom
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(formData.interests || []).map((interest) => (
                      <span key={interest} className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/35 border border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full">
                        {interest}
                        <button type="button" onClick={() => handleRemoveField('interests', interest)} className="hover:text-red-500 font-extrabold ml-1 cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Dream Goals */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                {/* 1. Highlight Dream Careers as visual grid cards */}
                <div className="space-y-3">
                  <label className="block text-slate-800 dark:text-slate-200 text-xs font-extrabold uppercase tracking-wider mb-2">Highlight Dream Career Role *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dreamRoles.map((role) => {
                      const isSelected = formData.dreamCareer === role.name;
                      const Icon = role.icon;
                      return (
                        <div
                          key={role.name}
                          onClick={() => setFormData({ ...formData, dreamCareer: role.name })}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md scale-[1.01]'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl ${role.color} shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{role.name}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">{role.desc}</p>
                          </div>
                          {isSelected && (
                            <div className="ml-auto shrink-0 mt-0.5">
                              <CheckCircle2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 fill-blue-50 dark:fill-blue-950" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Highlight Career Timeline Goal as visual grid cards */}
                <div className="space-y-3">
                  <label className="block text-slate-800 dark:text-slate-200 text-xs font-extrabold uppercase tracking-wider mb-2">Target Timeline Goal *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {timelineOptions.map((opt) => {
                      const isSelected = formData.timelineGoal === opt.label;
                      return (
                        <div
                          key={opt.label}
                          onClick={() => setFormData({ ...formData, timelineGoal: opt.label })}
                          className={`p-3.5 rounded-xl border-2 text-center cursor-pointer transition-all select-none flex flex-col justify-center ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <span className="text-sm font-extrabold text-slate-950 dark:text-white">{opt.label}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5">{opt.sub}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Preferences & Study details */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest">Study Hours / Day</label>
                    </div>
                    
                    {/* Easy-adjust Increment/Decrement controls */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, studyHours: Math.max(1, (formData.studyHours || 4) - 1) })}
                        className="w-12 h-12 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-center font-black text-xl transition-all shadow-sm hover:scale-[1.03] active:scale-[0.97] cursor-pointer select-none"
                        title="Decrease hours"
                      >
                        −
                      </button>
                      
                      <div className="flex-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-3 rounded-xl text-sm font-extrabold text-slate-900 dark:text-white shadow-sm">
                        {formData.studyHours} {formData.studyHours === 1 ? 'hour' : 'hours'} / day
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, studyHours: Math.min(16, (formData.studyHours || 4) + 1) })}
                        className="w-12 h-12 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-center font-black text-xl transition-all shadow-sm hover:scale-[1.03] active:scale-[0.97] cursor-pointer select-none"
                        title="Increase hours"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="w-4 h-4 text-indigo-500" />
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest">Learning Language</label>
                    </div>
                    <select
                      value={formData.preferredLanguage}
                      onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/35 transition-all font-bold shadow-sm h-12"
                    >
                      <option>English</option>
                      <option>Tamil</option>
                      <option>Hindi</option>
                      <option>Telugu</option>
                      <option>Malayalam</option>
                      <option>Kannada</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Japanese</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Wizard Controls */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                step === 1 ? 'opacity-30 cursor-not-allowed text-slate-400 bg-slate-50 dark:bg-slate-950' : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-100 dark:shadow-none cursor-pointer"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleFormSubmit}
                disabled={!formData.name || !formData.degree || !formData.college}
                className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest px-7 py-3 rounded-xl transition-all shadow-md shadow-emerald-100 dark:shadow-none cursor-pointer ${
                  (!formData.name || !formData.degree || !formData.college) && 'opacity-40 cursor-not-allowed'
                }`}
              >
                Access Career Workspace <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Floating Interactive Robot Companion Popup */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {isHexoOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="pointer-events-auto w-80 flex flex-col items-center relative transition-all duration-300"
            >
              <RobotPet 
                message="" 
                expression={getHexoExpression()}
                className="scale-90 pointer-events-none"
              />

              <div className="mt-3 text-center relative select-none">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsHexoOpen(false)}
                  className="absolute -top-1 -right-6 p-1 rounded-full hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  title="Hide HEXO"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-mono mb-0.5">
                  HEXO
                </p>
                <h4 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                  Fill the Details
                </h4>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble Badge trigger */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsHexoOpen(!isHexoOpen)}
          className="pointer-events-auto w-14 h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-indigo-500/30 transition-all cursor-pointer relative"
          title="Toggle Hexo helper"
        >
          {/* Pulsing indicator */}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full animate-pulse" />
          <Bot className="w-5 h-5 text-white" />
        </motion.button>
      </div>
    </div>
  );
}
