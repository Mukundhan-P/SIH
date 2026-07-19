import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, BookOpen, GraduationCap, Calendar, 
  ShieldAlert, CheckCircle2, UploadCloud, AlertTriangle, 
  RefreshCw, Settings, Trash2, Edit2, Check, HelpCircle, ArrowRight, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { StudentProfile } from '../types';

interface DatabaseInspectorProps {
  theme?: 'light' | 'dark';
  profile: StudentProfile;
  onProfileUpdate?: (profile: StudentProfile) => void;
}

export default function DatabaseInspector({ theme = 'light', profile, onProfileUpdate }: DatabaseInspectorProps) {
  // Local edit states
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Extend profile fields dynamically or fallback to image-similar default values
  const [fullName, setFullName] = useState(profile.name || 'MUKUNDHAN P');
  const [registerNumber, setRegisterNumber] = useState((profile as any).registerNumber || '312324243139');
  const [email, setEmail] = useState((profile as any).email || 'mukundanuma07@gmail.com');
  const [phone, setPhone] = useState((profile as any).phone || '8870585903');
  const [department, setDepartment] = useState(profile.branch || 'ADS');
  const [batch, setBatch] = useState((profile as any).batch || '2022-26');
  const [section, setSection] = useState((profile as any).section || 'C');
  const [gender, setGender] = useState((profile as any).gender || 'Male');
  const [college, setCollege] = useState(profile.college || "St. Joseph's College of Engineering");
  const [cgpa, setCgpa] = useState(profile.cgpa || '8.45');
  const [arrears, setArrears] = useState((profile as any).arrears || '0');
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<string | null>(() => {
    try {
      const cached = localStorage.getItem('halohex_profile_pic');
      return cached || (profile as any).profilePicture || null;
    } catch {
      return null;
    }
  });

  // Domain/Career track switching states
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [selectedNewDomain, setSelectedNewDomain] = useState(profile.dreamCareer || 'AI Engineer');
  const [domainWarningConfirmed, setDomainWarningConfirmed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Initials calculation
  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0][0];
      const last = parts[parts.length - 1][0];
      if (first && last) return (first + last).toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : 'U';
  };

  // Profile Picture File Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfilePicture(result);
      localStorage.setItem('halohex_profile_pic', result);
      
      // Notify parent of updated profile picture
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          name: fullName,
          branch: department,
          college: college,
          cgpa: cgpa,
          profilePicture: result
        } as any);
      }
      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Save changes to local profile and sync with parent / server
  const handleSaveProfile = () => {
    const updated: StudentProfile = {
      ...profile,
      name: fullName,
      branch: department,
      college: college,
      cgpa: cgpa,
    };
    
    // Attach dynamic fields
    (updated as any).registerNumber = registerNumber;
    (updated as any).email = email;
    (updated as any).phone = phone;
    (updated as any).batch = batch;
    (updated as any).section = section;
    (updated as any).gender = gender;
    (updated as any).arrears = arrears;
    (updated as any).profilePicture = profilePicture;

    if (onProfileUpdate) {
      onProfileUpdate(updated);
    }

    setIsEditing(false);
    setSuccessMessage('Account details saved successfully!');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Trigger clearing of historical progress upon changing domain
  const handleDomainChangeConfirm = () => {
    if (!domainWarningConfirmed) return;

    // Clear user roadmap cache so a fresh AI Roadmap can be generated
    try {
      localStorage.removeItem('halohex_profile_pic'); // Clear picture if needed, or leave it
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('roadmap_progress_') || key.startsWith('roadmap_structure_') || key === 'learning_dna')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Update profile domain
    const updated: StudentProfile = {
      ...profile,
      name: fullName,
      dreamCareer: selectedNewDomain,
      branch: department,
      college: college,
      cgpa: cgpa,
    };
    
    (updated as any).registerNumber = registerNumber;
    (updated as any).email = email;
    (updated as any).phone = phone;
    (updated as any).batch = batch;
    (updated as any).section = section;
    (updated as any).gender = gender;
    (updated as any).arrears = arrears;
    (updated as any).profilePicture = profilePicture;

    if (onProfileUpdate) {
      onProfileUpdate(updated);
    }

    setShowDomainModal(false);
    setDomainWarningConfirmed(false);
    
    setSuccessMessage(`Domain successfully changed to ${selectedNewDomain}! Initializing fresh roadmap.`);
    setTimeout(() => {
      setSuccessMessage(null);
      window.location.reload(); // Reload to trigger immediate calculations
    }, 2000);
  };

  const careerOptions = [
    'AI Engineer', 'Machine Learning Engineer', 'Data Scientist', 'Data Analyst',
    'Software Engineer', 'Full Stack Developer', 'DevOps Engineer', 'Cloud Engineer',
    'Cybersecurity Analyst', 'UI/UX Designer', 'Product Manager', 'Blockchain Developer',
    'Mobile App Developer', 'Game Developer', 'Research Scientist'
  ];

  return (
    <div className="space-y-8" id="account-profile-tab">
      
      {/* Upper header segment: Replacing DNA Profile with User picture & name */}
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
        id="profile-display-card"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Profile Avatar with Drag & Drop */}
        <div 
          onClick={triggerFileSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative group cursor-pointer w-24 h-24 rounded-full border-2 overflow-hidden flex items-center justify-center shrink-0 transition-all ${
            dragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 scale-105' 
              : 'border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-950'
          }`}
          title="Click or drag an image here to change your profile picture"
        >
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt="Profile Avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-2xl font-bold text-slate-600 dark:text-slate-300 tracking-wider">
              {getInitials(fullName)}
            </span>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] text-white font-bold transition-opacity">
            <UploadCloud className="w-4 h-4 mb-1 text-slate-100" />
            <span>UPDATE</span>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* User identification info */}
        <div className="flex-1 text-center md:text-left space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            {fullName}
            <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 rounded-full border border-blue-100 dark:border-blue-900/40 w-fit mx-auto md:mx-0">
              {profile.dreamCareer || 'AI Engineer'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Registered Email: {email}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            ID: {registerNumber} | College: {college}
          </p>
        </div>

        {/* Top bar interactive alerts */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 right-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm font-medium z-20"
            >
              <CheckCircle2 className="w-4 h-4" /> {successMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Grid: Replacing all former DNA inspector blocks with Personal & Academic details form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Form Title banner */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" /> Personal & Academic Details
          </h2>
          
          <button
            onClick={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
              isEditing 
                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {isEditing ? 'Save Details' : 'EDITABLE'}
          </button>
        </div>

        {/* Form Fields Grid mimicking the screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Full Name</label>
            <input 
              type="text"
              disabled={!isEditing}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
            />
          </div>

          {/* Register Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Register Number</label>
            <input 
              type="text"
              disabled={!isEditing}
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Email</label>
            <input 
              type="email"
              disabled={!isEditing}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Phone</label>
            <input 
              type="text"
              disabled={!isEditing}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-850 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Department</label>
            {isEditing ? (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium transition-all"
              >
                <option value="ADS">ADS (AI & Data Science)</option>
                <option value="CSE">CSE (Computer Science)</option>
                <option value="IT">IT (Information Technology)</option>
                <option value="ECE">ECE (Electronics & Comm)</option>
                <option value="EEE">EEE (Electrical Engineering)</option>
              </select>
            ) : (
              <input 
                type="text"
                disabled
                value={department}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
              />
            )}
          </div>

          {/* Batch */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Batch</label>
            {isEditing ? (
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium transition-all"
              >
                <option value="2021-25">2021-25</option>
                <option value="2022-26">2022-26</option>
                <option value="2023-27">2023-27</option>
                <option value="2024-28">2024-28</option>
              </select>
            ) : (
              <input 
                type="text"
                disabled
                value={batch}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
              />
            )}
          </div>

          {/* Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Section</label>
            <input 
              type="text"
              disabled={!isEditing}
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Gender</label>
            {isEditing ? (
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <input 
                type="text"
                disabled
                value={gender}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
              />
            )}
          </div>

          {/* College */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">College</label>
            {isEditing ? (
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium transition-all"
              >
                <option value="St. Joseph's College of Engineering">St. Joseph's College of Engineering</option>
                <option value="Anna University">Anna University</option>
                <option value="IIT Madras">IIT Madras</option>
                <option value="PSG College of Technology">PSG College of Technology</option>
              </select>
            ) : (
              <input 
                type="text"
                disabled
                value={college}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
              />
            )}
          </div>

          {/* CGPA */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">CGPA</label>
            <input 
              type="text"
              disabled={!isEditing}
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
            />
          </div>

          {/* Arrears */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Arrears</label>
            <input 
              type="number"
              disabled={!isEditing}
              value={arrears}
              onChange={(e) => setArrears(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium transition-all"
            />
          </div>
        </div>

        {/* Trigger save block when in editing mode */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-750 transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Profile
            </button>
          </div>
        )}
      </div>

      {/* Domain/Career Path Modification Action Block */}
      <div className="bg-gradient-to-r from-red-500/5 via-orange-500/5 to-transparent p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <button
          onClick={() => setShowDomainModal(true)}
          className="px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-900/40 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /> Change Career
        </button>
      </div>

      {/* Switch Domain Modal with absolute explicit warning triggers */}
      <AnimatePresence>
        {showDomainModal && (
          <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 backdrop-blur-sm" id="domain-warning-dialog">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="space-y-2">
                <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl w-fit">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Confirm Domain Change & Progress Reset
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 rounded-xl leading-relaxed font-semibold">
                  ⚠️ WARNING: Changing your registered target domain will result in a complete loss of your recorded student roadmap achievements, daily quiz grades, study schedule histories, and active personalized timelines. THIS PROCESS CANNOT BE REVERSED.
                </p>
              </div>

              {/* Selector for new domain */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Choose New Target Domain</label>
                <select
                  value={selectedNewDomain}
                  onChange={(e) => setSelectedNewDomain(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-805 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-semibold text-xs"
                >
                  {careerOptions.map((opt) => (
                    <option key={opt} className="dark:bg-slate-900 dark:text-slate-200">{opt}</option>
                  ))}
                </select>
              </div>

              {/* Confirmation trigger checkbox */}
              <label className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl cursor-pointer">
                <input 
                  type="checkbox"
                  checked={domainWarningConfirmed}
                  onChange={(e) => setDomainWarningConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                />
                <span className="text-[11px] text-slate-600 dark:text-slate-350 select-none font-medium leading-relaxed">
                  I understand that all my learning metrics, exam summaries, and verified skill achievements will be permanently erased.
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowDomainModal(false);
                    setDomainWarningConfirmed(false);
                  }}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-750 transition-all active:scale-95 cursor-pointer"
                >
                  Keep My Current Path
                </button>
                <button
                  onClick={handleDomainChangeConfirm}
                  disabled={!domainWarningConfirmed}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  Proceed with Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
