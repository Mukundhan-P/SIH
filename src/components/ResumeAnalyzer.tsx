import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ResumeAnalysis, StudentProfile } from '@/src/types';
import { 
  FileText, Sparkles, AlertCircle, Copy, Check, FileCheck, HelpCircle, ArrowUpRight,
  UploadCloud, Trash2, Loader2 
} from 'lucide-react';

const parsePdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error("PDF parser library is still loading. Please wait a few seconds and try again!");
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }
  return fullText.trim();
};

const parseDocxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const mammoth = (window as any).mammoth;
  if (!mammoth) {
    throw new Error("Word document parser library is still loading. Please wait a few seconds and try again!");
  }
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
};

const parseTxtText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve((e.target?.result as string) || "");
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};

interface ResumeAnalyzerProps {
  profile: StudentProfile;
  onAnalyze: (resumeText: string) => void;
  analysis: ResumeAnalysis | null;
  isLoading: boolean;
}

export default function ResumeAnalyzer({
  profile,
  onAnalyze,
  analysis,
  isLoading,
}: ResumeAnalyzerProps) {
  const [resumeText, setResumeText] = useState('');
  const [copied, setCopied] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Preset resume templates to make it incredibly easy for the user to try out the scanning feature
  const presets = [
    {
      title: "Entry Level Developer Resume",
      text: `John Doe\nE-mail: john@test.com\nCollege: XYZ Institute of Technology\nCGPA: 8.2\nDegree: B.Tech Computer Science\nSkills: Python, HTML, CSS\nExperience:\n- Done 1 simple HTML project.\n- Learned coding in class.\nObjective: Looking for a software engineering role to start my career.`
    },
    {
      title: "Simple Web Resume with Gaps",
      text: `Jane Smith\nContact: 9999999999\nSkills: Javascript, React\nEducation: Bachelor of Engineering (CS), 2025\nProjects:\n- Portfolio website\n- Weather app using some APIs`
    }
  ];

  const handlePresetSelect = (text: string) => {
    setResumeText(text);
  };

  const handleCopy = () => {
    if (analysis?.improvedResumeMarkdown) {
      navigator.clipboard.writeText(analysis.improvedResumeMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    setUploadedFile({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`
    });

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let extractedText = "";

      if (extension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await parsePdfText(arrayBuffer);
      } else if (extension === 'docx' || extension === 'doc') {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await parseDocxText(arrayBuffer);
      } else if (extension === 'txt') {
        extractedText = await parseTxtText(file);
      } else {
        throw new Error("Unsupported file format! Please upload a PDF, Word document (.docx, .doc), or text file (.txt).");
      }

      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error("Could not extract sufficient text from the file. Please ensure it is not scanned/image-only, or copy/paste its content instead.");
      }

      setResumeText(extractedText);
    } catch (err: any) {
      console.error("File parsing error:", err);
      setParseError(err.message || "Failed to parse the file. Please try pasting the text manually.");
      setUploadedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setResumeText('');
    setParseError(null);
  };

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeText.trim()) {
      onAnalyze(resumeText.trim());
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5.5 h-5.5 text-blue-600" /> AI Resume Analyzer & ATS Optimizer
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Scan your resume file or paste text against applicant tracking systems (ATS) for your target {profile.dreamCareer} role
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all ${
                    inputMode === 'upload' 
                      ? 'text-blue-600 border-blue-600' 
                      : 'text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-750 dark:hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all ${
                    inputMode === 'text' 
                      ? 'text-blue-600 border-blue-600' 
                      : 'text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-750 dark:hover:text-white'
                  }`}
                >
                  Paste Text
                </button>
              </div>
              <span className="text-[9px] text-blue-700 dark:text-blue-300 font-bold uppercase bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-900/40 tracking-wider">
                ATS SCAN
              </span>
            </div>

            <form onSubmit={handleAnalyzeSubmit} className="space-y-4">
              {inputMode === 'upload' && (
                <div className="space-y-4">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      dragActive
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="file"
                      id="resume-file-upload"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-3 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                        {isParsing ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isParsing ? 'Processing document...' : 'Drag & drop your resume file here'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Supports PDF, Word (.docx, .doc), or Text (.txt)
                        </p>
                      </div>
                      <button
                        type="button"
                        className="bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors relative z-20 pointer-events-none"
                      >
                        Select File From Device
                      </button>
                    </div>
                  </div>

                  {/* Display File Parsing Errors */}
                  {parseError && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3 flex gap-2.5 items-start">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-700 dark:text-red-300 leading-relaxed font-semibold">{parseError}</p>
                    </div>
                  )}

                  {/* Uploaded File Details */}
                  {uploadedFile && (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{uploadedFile.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono">{uploadedFile.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="text-slate-450 dark:text-slate-500 hover:text-red-650 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Remove uploaded file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Extracted Text Preview Area so they have edit control */}
                  {resumeText.trim() && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Extracted Plain Text Editor:</span>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready for ATS Analysis
                        </span>
                      </div>
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        rows={8}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[11px] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                        placeholder="You can edit or polish the extracted text here before scanning..."
                      />
                    </div>
                  )}
                </div>
              )}

              {inputMode === 'text' && (
                <div className="space-y-4">
                  {/* Presets */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Try quick presets:</span>
                    <div className="flex flex-wrap gap-2">
                      {presets.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePresetSelect(p.text)}
                          className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] font-semibold px-3 py-1.5 rounded-xl transition-all"
                        >
                          {p.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    required
                    rows={12}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-250 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                    placeholder="Paste your plain text resume details (Contact, Education, Skills, Projects, Experience, Certifications)..."
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !resumeText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-sm"
              >
                {isLoading ? 'Scanning ATS compatibility...' : 'Run ATS Laser Analysis'}
              </button>
            </form>
          </div>
        </div>

        {/* Output Column (Right) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center relative overflow-hidden h-full flex flex-col items-center justify-center min-h-[400px] shadow-sm"
              >
                {/* Visual Laser scanning beam effect */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_#3b82f6]"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <Sparkles className="w-12 h-12 text-blue-500 mb-4 animate-pulse" />
                <h4 className="text-slate-900 dark:text-white font-bold text-base">AI Resumizer Scanner Active</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 max-w-xs mx-auto">
                  Deconstructing sections, scoring semantic keyword depth, mapping job descriptions, and rewriting bullet point structures...
                </p>
              </motion.div>
            ) : analysis ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {/* Score panel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">ATS Score</span>
                    <span className="text-2xl font-extrabold text-blue-600 block mt-1">{analysis.atsScore}/100</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">Parse compatibility</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Overall Score</span>
                    <span className="text-2xl font-extrabold text-emerald-600 block mt-1">{analysis.score}/100</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">General resume strength</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Formatting</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-1.5 truncate">{analysis.formatting}</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">Layout rating</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Grammar</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-1.5 truncate">{analysis.grammar}</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">Tense/Spellings</span>
                  </div>
                </div>

                {/* Bullets, missing skills, weak sections */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-red-700 dark:text-red-400 font-bold text-sm flex items-center gap-1.5 mb-3">
                        <AlertCircle className="w-4 h-4" /> Crucial Gaps & Weak Sections
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-300 list-disc list-inside">
                        {analysis.weakSections.map((sec, idx) => (
                          <li key={idx} className="leading-relaxed">{sec}</li>
                        ))}
                        {analysis.weakSections.length === 0 && <p className="text-slate-500 dark:text-slate-400 italic">No critical weak sections found.</p>}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-blue-700 dark:text-blue-400 font-bold text-sm flex items-center gap-1.5 mb-3">
                        <Sparkles className="w-4 h-4" /> Recommended Projects
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-300 list-disc list-inside">
                        {analysis.projectSuggestions.map((proj, idx) => (
                          <li key={idx} className="leading-relaxed">{proj}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-3">
                      Certification Path & Missing Skills
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Missing Core Competencies:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.missingSkills.map((s) => (
                            <span key={s} className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 text-[10px] font-semibold px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Highest Value Certifications:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.certificationSuggestions.map((cert) => (
                            <span key={cert} className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 text-[10px] font-semibold px-2 py-0.5 rounded">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Improved Resume Markdown Viewer */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" /> AI Optimized Resume Blueprint
                    </h4>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs px-3.5 py-1.5 rounded-xl transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Blueprint
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl max-h-[300px] overflow-y-auto">
                    <pre className="text-slate-750 dark:text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                      {analysis.improvedResumeMarkdown}
                    </pre>
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 italic text-center">
                    Copy this ATS-optimized markdown blueprint to build a professional PDF on standard editors!
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h4 className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Waiting for Resume Input</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                  Upload your resume file or try a quick template preset to start the ATS scan.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
