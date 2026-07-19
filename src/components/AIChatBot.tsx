import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { StudentProfile, ChatMessage } from '@/src/types';
import AIPersonalityAvatar from './AIPersonalityAvatar';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import {
  Send, Volume2, VolumeX, Cpu, User, HelpCircle, Sparkles, MessageSquare, Globe, ArrowRight, BookOpen, Clock, Copy, Check, Mic, MicOff,
  Paperclip, Trash2, Loader2, UploadCloud, FileText, AlertCircle, Download
} from 'lucide-react';

interface ExtendedChatMessage extends ChatMessage {
  fileAttachment?: {
    name: string;
    size: string;
    type: string;
    text: string;
  };
}

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

const parsePptxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const zip = await JSZip.loadAsync(arrayBuffer);
  let text = "";
  const files = Object.keys(zip.files).filter(name => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"));
  files.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.match(/\d+/)?.[0] || "0");
    return numA - numB;
  });
  
  for (const filename of files) {
    const file = zip.files[filename];
    if (file) {
      const content = await file.async("text");
      const matches = content.match(/<a:t>([^<]+)<\/a:t>/g);
      if (matches) {
        const slideText = matches.map(m => m.replace(/<\/?a:t>/g, "")).join(" ");
        const slideNum = filename.match(/\d+/)?.[0] || "";
        text += `--- Slide ${slideNum} ---\n${slideText}\n\n`;
      }
    }
  }
  return text.trim();
};

// Custom lightweight structured text parser to highlight and style Markdown features elegantly
function StructuredMessageText({ text }: { text: string }) {
  const lines = text.split('\n');

  // Inline formatter to highlight **bold**, `code`, and *italic* structures inside lines
  const formatInline = (str: string) => {
    const parts: React.ReactNode[] = [];
    let currentIdx = 0;
    const regex = /(\*\*(.*?)\*\*|`(.*?)`|\*(.*?)\*)/g;
    let match;

    while ((match = regex.exec(str)) !== null) {
      const matchIdx = match.index;

      if (matchIdx > currentIdx) {
        parts.push(str.substring(currentIdx, matchIdx));
      }

      if (match[2] !== undefined) {
        // High-contrast, custom styled bold text for high readability
        parts.push(
          <strong key={matchIdx} className="text-blue-900 dark:text-blue-100 font-extrabold bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800 px-1 py-0.5 rounded-sm inline-block">
            {match[2]}
          </strong>
        );
      } else if (match[3] !== undefined) {
        // Inline technical code highlight
        parts.push(
          <code key={matchIdx} className="font-mono bg-slate-100 dark:bg-slate-800 text-amber-800 dark:text-amber-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] mx-0.5">
            {match[3]}
          </code>
        );
      } else if (match[4] !== undefined) {
        // Italic emphasize
        parts.push(
          <em key={matchIdx} className="text-blue-800 dark:text-blue-300 italic font-medium">
            {match[4]}
          </em>
        );
      }

      currentIdx = regex.lastIndex;
    }

    if (currentIdx < str.length) {
      parts.push(str.substring(currentIdx));
    }

    return parts.length > 0 ? parts : str;
  };

  return (
    <div className="space-y-2.5 font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed === '') {
          return <div key={idx} className="h-1.5" />;
        }

        // 1. Blockquote or notice format
        if (trimmed.startsWith('>')) {
          const content = trimmed.substring(1).trim();
          return (
            <div key={idx} className="pl-3.5 border-l-2 border-blue-500 text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/20 py-2 px-3 rounded-r-xl my-2 leading-relaxed">
              {formatInline(content)}
            </div>
          );
        }

        // 2. Sub-headings ###
        if (trimmed.startsWith('###')) {
          return (
            <h4 key={idx} className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mt-4 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-blue-600 rounded-sm inline-block" />
              {formatInline(trimmed.replace(/^###\s*/, ''))}
            </h4>
          );
        }

        // 3. Section Headings ## or #
        if (trimmed.startsWith('##') || trimmed.startsWith('#')) {
          const rawText = trimmed.replace(/^##?\s*/, '');
          return (
            <h3 key={idx} className="text-sm font-black text-slate-900 dark:text-white mt-5 mb-2.5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              {formatInline(rawText)}
            </h3>
          );
        }

        // 4. Unordered Bullet lists
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
          const content = trimmed.replace(/^[-*•]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1.5 my-1 leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 font-bold select-none mt-1 shrink-0 text-xs">✦</span>
              <div className="flex-1">{formatInline(content)}</div>
            </div>
          );
        }

        // 5. Ordered Step-by-Step lists
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const content = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1.5 my-1.5 leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-[10px] select-none mt-0.5 shrink-0">
                {num}
              </span>
              <div className="flex-1">{formatInline(content)}</div>
            </div>
          );
        }

        // 6. Regular plain text paragraphs
        return (
          <p key={idx} className="leading-relaxed text-slate-700 dark:text-slate-300 my-0.5">
            {formatInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// Helper functions to parse and convert OKLCH CSS colors to RGB/RGBA to prevent html2canvas parsing crashes on Tailwind CSS v4
function oklchToRgb(lStr: string, cStr: string, hStr: string, aStr?: string): string {
  let L = parseFloat(lStr);
  if (lStr.includes('%')) L = L / 100;
  
  let C = parseFloat(cStr);
  if (cStr.includes('%')) C = C / 100;
  
  let H = parseFloat(hStr);
  if (hStr.includes('deg')) H = parseFloat(hStr.replace('deg', ''));
  if (isNaN(H)) H = 0;

  let alpha = aStr ? parseFloat(aStr) : 1;
  if (aStr && aStr.includes('%')) alpha = parseFloat(aStr) / 100;

  const h_rad = (H * Math.PI) / 180;
  const a = C * Math.cos(h_rad);
  const b = C * Math.sin(h_rad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const gammaCorrect = (c: number) => {
    const absC = Math.abs(c);
    const corrected = absC <= 0.0031308 
      ? 12.92 * absC 
      : 1.055 * Math.pow(absC, 1 / 2.4) - 0.055;
    return c < 0 ? -corrected : corrected;
  };

  const rVal = gammaCorrect(rLin);
  const gVal = gammaCorrect(gLin);
  const bVal = gammaCorrect(bLin);

  const R = Math.max(0, Math.min(255, Math.round(rVal * 255)));
  const G = Math.max(0, Math.min(255, Math.round(gVal * 255)));
  const B = Math.max(0, Math.min(255, Math.round(bVal * 255)));

  if (isNaN(R) || isNaN(G) || isNaN(B)) {
    throw new Error('Invalid color calculation');
  }

  if (alpha === 1) {
    return `rgb(${R}, ${G}, ${B})`;
  } else {
    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }
}

function oklabToRgb(lStr: string, aStr: string, bStr: string, alphaStr?: string): string {
  let L = parseFloat(lStr);
  if (lStr.includes('%')) L = L / 100;
  
  let a = parseFloat(aStr);
  if (aStr.includes('%')) a = a / 100;
  
  let b = parseFloat(bStr);
  if (bStr.includes('%')) b = b / 100;

  let alpha = alphaStr ? parseFloat(alphaStr) : 1;
  if (alphaStr && alphaStr.includes('%')) alpha = parseFloat(alphaStr) / 100;
  if (isNaN(alpha)) alpha = 1;

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const gammaCorrect = (c: number) => {
    const absC = Math.abs(c);
    const corrected = absC <= 0.0031308 
      ? 12.92 * absC 
      : 1.055 * Math.pow(absC, 1 / 2.4) - 0.055;
    return c < 0 ? -corrected : corrected;
  };

  const rVal = gammaCorrect(rLin);
  const gVal = gammaCorrect(gLin);
  const bVal = gammaCorrect(bLin);

  const R = Math.max(0, Math.min(255, Math.round(rVal * 255)));
  const G = Math.max(0, Math.min(255, Math.round(gVal * 255)));
  const B = Math.max(0, Math.min(255, Math.round(bVal * 255)));

  if (isNaN(R) || isNaN(G) || isNaN(B)) {
    throw new Error('Invalid color calculation');
  }

  if (alpha === 1) {
    return `rgb(${R}, ${G}, ${B})`;
  } else {
    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }
}

function convertOklchInCss(cssText: string): string {
  let result = '';
  let i = 0;
  while (i < cssText.length) {
    if (cssText.substring(i, i + 6).toLowerCase() === 'oklch(' || cssText.substring(i, i + 6).toLowerCase() === 'oklab(') {
      const isOklch = cssText.substring(i, i + 5).toLowerCase() === 'oklch';
      i += 6; // skip "oklch(" or "oklab("
      let parenCount = 1;
      let content = '';
      while (i < cssText.length && parenCount > 0) {
        const char = cssText[i];
        if (char === '(') parenCount++;
        else if (char === ')') parenCount--;
        
        if (parenCount > 0) {
          content += char;
        }
        i++;
      }
      
      let replacement = '#64748b'; // default safe slate gray
      try {
        const parts = content.replace(/[,/]/g, ' ').trim().split(/\s+/);
        if (parts.length >= 3) {
          if (isOklch) {
            replacement = oklchToRgb(parts[0], parts[1], parts[2], parts[3]);
          } else {
            replacement = oklabToRgb(parts[0], parts[1], parts[2], parts[3]);
          }
        }
      } catch (err) {
        replacement = '#64748b';
      }
      result += replacement;
    } else {
      result += cssText[i];
      i++;
    }
  }
  return result;
}

function compileAndSanitizeStylesheets(): string {
  let combinedCSS = '';

  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            combinedCSS += rule.cssText + '\n';
          }
        }
      } catch (err) {
        // Fallback for CORS restricted stylesheets
      }
    }
  } catch (err) {
    console.error('Failed to read document stylesheets:', err);
  }

  document.querySelectorAll('style').forEach((styleTag) => {
    combinedCSS += (styleTag.textContent || '') + '\n';
  });

  return convertOklchInCss(combinedCSS);
}

interface AIChatBotProps {
  profile: StudentProfile;
}

export default function AIChatBot({ profile }: AIChatBotProps) {
  // 1. Message History State
  const [chatMessages, setChatMessages] = useState<ExtendedChatMessage[]>([]);

  // File Upload and Parsing States
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string; text: string } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize welcome message using useEffect to avoid state dependency updates during render
  useEffect(() => {
    setChatMessages([
      {
        id: 'init-1',
        sender: 'bot',
        text: `Hello **${profile.name}**! I am your **HaloHex AI Career Mentor**.\n\nI have fully synchronized with your academic profile. Here are your custom-tailored guidance parameters:\n- 🎓 **Degree**: ${profile.degree} in *${profile.branch}* (${profile.college})\n- 🎯 **Career Goal**: ${profile.dreamCareer} in the *${profile.preferredIndustry}* sector\n- 🌍 **Target Country**: ${profile.preferredCountry}\n- 📚 **Learning Preference**: ${profile.learningStyle} style with ${profile.studyHours} daily hours\n\nI can help you break down technical questions, design custom project concepts, generate structured revision notes, and prepare for high-impact interview milestones.\n\nWhat career milestone or technical concept should we demystify today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, [profile.name, profile.degree, profile.branch, profile.college, profile.dreamCareer, profile.preferredIndustry, profile.preferredCountry, profile.learningStyle, profile.studyHours]);

  // 2. Chat Input and Configurations
  const [inputText, setInputText] = useState('');
  const [chatMode, setChatMode] = useState('General Mentor');
  const [translatorLang, setTranslatorLang] = useState(profile.preferredLanguage || 'English');
  const [chatStatus, setChatStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDownloadMenu, setActiveDownloadMenu] = useState<string | null>(null);

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Map user selections to standard ISO language/locale codes for voice synthesis and typing
  const getLangCode = (lang: string): string => {
    switch (lang) {
      case 'Tamil': return 'ta-IN';
      case 'Hindi': return 'hi-IN';
      case 'Telugu': return 'te-IN';
      case 'Malayalam': return 'ml-IN';
      case 'Kannada': return 'kn-IN';
      case 'French': return 'fr-FR';
      case 'German': return 'de-DE';
      case 'Japanese': return 'ja-JP';
      case 'Chinese': return 'zh-CN';
      default: return 'en-US';
    }
  };

  // Initialize Speech-to-Text Engine
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSttSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setSttError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSttError('Microphone permission is blocked. Please allow mic in browser/iframe, or open in a new tab.');
        } else if (event.error === 'service-not-allowed') {
          setSttError('Speech recognition service not allowed on this browser/environment.');
        } else if (event.error === 'no-speech') {
          setSttError('No speech detected. Please speak clearly into your mic.');
        } else {
          setSttError(`Speech recognition: ${event.error}`);
        }
        setTimeout(() => setSttError(null), 5000);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      // Set to true so button is visible, but can report "unsupported" gracefully on click
      setSttSupported(true);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSttError("Speech recognition is not fully supported or allowed in this browser/iframe. Please try opening the app in a new tab!");
      setTimeout(() => setSttError(null), 6000);
      return;
    }

    setSttError(null);
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Set language dynamically to support native typing in Selected Output Language
      recognitionRef.current.lang = getLangCode(translatorLang);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setSttError("Failed to access microphone. Please try again.");
        setTimeout(() => setSttError(null), 5000);
      }
    }
  };

  const handleCopyText = (id: string, text: string) => {
    try {
      // Remove any helper markdown markings before copying to keep it pristine for user pasting
      const cleanText = text.replace(/\*\*/g, '').replace(/`/g, '');
      navigator.clipboard.writeText(cleanText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // 3. Scroll Container Reference
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Download Chat as Image States & Function
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadNotification, setDownloadNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDownloadChatImage = async () => {
    const element = scrollContainerRef.current;
    if (!element) {
      setDownloadNotification({ type: 'error', message: 'Chat window content not found.' });
      setTimeout(() => setDownloadNotification(null), 5000);
      return;
    }

    if (chatMessages.length === 0) {
      setDownloadNotification({ type: 'error', message: 'No messages to download yet.' });
      setTimeout(() => setDownloadNotification(null), 4000);
      return;
    }

    setIsDownloadingImage(true);
    setDownloadNotification(null);

    // 1. Pre-compile and sanitize all document stylesheets to be entirely free of oklch/oklab
    const sanitizedCSS = compileAndSanitizeStylesheets();

    // 2. Create a temporary style tag in the main document with the sanitized CSS
    const tempParentStyle = document.createElement('style');
    tempParentStyle.id = 'html2canvas-temp-parent-style';
    tempParentStyle.textContent = sanitizedCSS;
    document.head.appendChild(tempParentStyle);

    // 3. Temporarily override document.styleSheets so html2canvas only processes our oklch-free styles
    const originalStyleSheetsDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'styleSheets') || 
                                          Object.getOwnPropertyDescriptor(document, 'styleSheets');
    
    const mockStyleSheets = [tempParentStyle.sheet].filter(Boolean);

    let descriptorOverridden = false;
    try {
      Object.defineProperty(document, 'styleSheets', {
        get() {
          return mockStyleSheets;
        },
        configurable: true
      });
      descriptorOverridden = true;
    } catch (e) {
      try {
        Object.defineProperty(Document.prototype, 'styleSheets', {
          get() {
            return mockStyleSheets;
          },
          configurable: true
        });
        descriptorOverridden = true;
      } catch (e2) {
        console.error('Could not redefine styleSheets:', e2);
      }
    }

    // 4. Temporarily prepare the original container for a full-height screenshot
    const originalHeight = element.style.height;
    const originalMaxHeight = element.style.maxHeight;
    const originalOverflowY = element.style.overflowY;
    const originalPaddingRight = element.style.paddingRight;

    element.style.height = 'auto';
    element.style.maxHeight = 'none';
    element.style.overflowY = 'visible';
    element.style.paddingRight = '12px'; // keep standard padding

    try {
      // 5. Generate Canvas directly from the original container to ensure all messages are included
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // 2x resolution for retina and crisp text
        backgroundColor: '#ffffff', // clean white background for PDF style export
        logging: false,
        onclone: (clonedDoc) => {
          // Double safety: remove other stylesheets in the cloned document
          clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
            if (node.id !== 'html2canvas-temp-parent-style') {
              node.remove();
            }
          });

          // Append a single, sanitized style element inside the cloned document
          const styleElement = clonedDoc.createElement('style');
          styleElement.textContent = sanitizedCSS;
          clonedDoc.head.appendChild(styleElement);

          // Force-expand the cloned scroll element
          const clonedScrollElement = clonedDoc.getElementById('chat-scroll-container') as HTMLDivElement;
          if (clonedScrollElement) {
            clonedScrollElement.style.height = 'auto';
            clonedScrollElement.style.maxHeight = 'none';
            clonedScrollElement.style.overflowY = 'visible';
            clonedScrollElement.style.paddingRight = '12px';
          }

          // Sanitize inline styles on any element in the cloned document
          clonedDoc.querySelectorAll('[style]').forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style && htmlEl.style.cssText && (htmlEl.style.cssText.includes('oklch') || htmlEl.style.cssText.includes('oklab'))) {
              htmlEl.style.cssText = convertOklchInCss(htmlEl.style.cssText);
            }
          });
        }
      });

      // 6. Generate filename with YYYY-MM-DD_HH-MM format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const filename = `Chat_History_${year}-${month}-${day}_${hours}-${minutes}.png`;

      // 7. Download triggering
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadNotification({ 
        type: 'success', 
        message: `Successfully captured and downloaded ${chatMessages.length} messages as high-res PNG!` 
      });
      setTimeout(() => setDownloadNotification(null), 5000);
    } catch (err: any) {
      console.error('Failed to export chat as image:', err);
      setDownloadNotification({ 
        type: 'error', 
        message: `Image export failed: ${err.message || 'Unknown browser rendering error'}` 
      });
      setTimeout(() => setDownloadNotification(null), 5000);
    } finally {
      // 8. Revert original element styling immediately
      element.style.height = originalHeight;
      element.style.maxHeight = originalMaxHeight;
      element.style.overflowY = originalOverflowY;
      element.style.paddingRight = originalPaddingRight;

      // Restore original styleSheets descriptor
      if (descriptorOverridden) {
        if (originalStyleSheetsDescriptor) {
          try {
            Object.defineProperty(document, 'styleSheets', originalStyleSheetsDescriptor);
          } catch (_) {}
          try {
            Object.defineProperty(Document.prototype, 'styleSheets', originalStyleSheetsDescriptor);
          } catch (_) {}
        } else {
          try {
            delete (document as any).styleSheets;
          } catch (_) {}
          try {
            delete (Document.prototype as any).styleSheets;
          } catch (_) {}
        }
      }

      // Remove temporary stylesheet
      if (tempParentStyle.parentNode) {
        tempParentStyle.parentNode.removeChild(tempParentStyle);
      }

      setIsDownloadingImage(false);
    }
  };

  const handleDownloadSingleMessage = async (msg: ExtendedChatMessage, format: 'text' | 'image') => {
    if (format === 'text') {
      const cleanText = msg.text
        .replace(/✦/g, '-')
        .replace(/###/g, '')
        .replace(/\*\*/g, '');
      const blob = new Blob([`HaloHex Career Mentor Advice\nTimestamp: ${msg.timestamp}\nMode: ${msg.mode || chatMode}\n\n${cleanText}`], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HaloHex_Advice_${msg.id.split('-')[1] || Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDownloadNotification({ 
        type: 'success', 
        message: 'Successfully downloaded response as a text file (.txt)!' 
      });
      setTimeout(() => setDownloadNotification(null), 3000);
      return;
    }

    const element = document.getElementById(`msg-bubble-${msg.id}`);
    if (!element) {
      setDownloadNotification({ 
        type: 'error', 
        message: 'Could not find the message element to export.' 
      });
      setTimeout(() => setDownloadNotification(null), 3000);
      return;
    }

    setIsDownloadingImage(true);
    setDownloadNotification(null);

    const sanitizedCSS = compileAndSanitizeStylesheets();
    const tempParentStyle = document.createElement('style');
    tempParentStyle.id = 'html2canvas-temp-parent-style';
    tempParentStyle.textContent = sanitizedCSS;
    document.head.appendChild(tempParentStyle);

    const originalStyleSheetsDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'styleSheets') || 
                                          Object.getOwnPropertyDescriptor(document, 'styleSheets');
    const mockStyleSheets = [tempParentStyle.sheet].filter(Boolean);
    let descriptorOverridden = false;

    try {
      Object.defineProperty(document, 'styleSheets', {
        get() { return mockStyleSheets; },
        configurable: true
      });
      descriptorOverridden = true;
    } catch (e) {
      try {
        Object.defineProperty(Document.prototype, 'styleSheets', {
          get() { return mockStyleSheets; },
          configurable: true
        });
        descriptorOverridden = true;
      } catch (e2) {}
    }

    const originalBorder = element.style.border;
    const originalPadding = element.style.padding;
    const originalBorderRadius = element.style.borderRadius;
    const originalShadow = element.style.boxShadow;

    element.style.border = '1px solid #e2e8f0';
    element.style.padding = '24px';
    element.style.borderRadius = '24px';
    element.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
            if (node.id !== 'html2canvas-temp-parent-style') {
              node.remove();
            }
          });
          const styleElement = clonedDoc.createElement('style');
          styleElement.textContent = sanitizedCSS;
          clonedDoc.head.appendChild(styleElement);

          const clonedBubble = clonedDoc.getElementById(`msg-bubble-${msg.id}`) as HTMLDivElement;
          if (clonedBubble) {
            clonedBubble.style.border = '1px solid #e2e8f0';
            clonedBubble.style.padding = '24px';
            clonedBubble.style.borderRadius = '24px';
            clonedBubble.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
            clonedBubble.style.maxWidth = '600px';
            clonedBubble.style.margin = '0 auto';
          }

          clonedDoc.querySelectorAll('[style]').forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style && htmlEl.style.cssText && (htmlEl.style.cssText.includes('oklch') || htmlEl.style.cssText.includes('oklab'))) {
              htmlEl.style.cssText = convertOklchInCss(htmlEl.style.cssText);
            }
          });
        }
      });

      const filename = `HaloHex_Advice_${msg.id.split('-')[1] || Date.now()}.png`;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadNotification({ 
        type: 'success', 
        message: 'Successfully exported individual message response as a high-res PNG image!' 
      });
      setTimeout(() => setDownloadNotification(null), 4000);
    } catch (err: any) {
      console.error('Failed to export message bubble:', err);
      setDownloadNotification({ 
        type: 'error', 
        message: `Message export failed: ${err.message || 'Unknown browser rendering error'}` 
      });
      setTimeout(() => setDownloadNotification(null), 5000);
    } finally {
      element.style.border = originalBorder;
      element.style.padding = originalPadding;
      element.style.borderRadius = originalBorderRadius;
      element.style.boxShadow = originalShadow;

      if (descriptorOverridden && originalStyleSheetsDescriptor) {
        try {
          Object.defineProperty(document, 'styleSheets', originalStyleSheetsDescriptor);
        } catch (_) {}
        try {
          Object.defineProperty(Document.prototype, 'styleSheets', originalStyleSheetsDescriptor);
        } catch (_) {}
      }

      if (tempParentStyle.parentNode) {
        tempParentStyle.parentNode.removeChild(tempParentStyle);
      }
      setIsDownloadingImage(false);
    }
  };

  // Auto-scroll effect whenever chatMessages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatMessages, chatStatus]);

  // Clean up any playing audio when the component unmounts
  useEffect(() => {
    return () => {
      if (activeAudio) {
        activeAudio.pause();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeAudio]);

  // 4. Quick Suggestion Prompt Chips
  const quickPrompts = [
    { label: 'Suggest a Project', text: 'Recommend 3 intermediate-level full-stack or technical projects I can build to impress recruiters in my dream career path, specifying the tech stack.' },
    { label: 'What skills am I missing?', text: `Based on my target career of ${profile.dreamCareer} and my current skills, what are the top 3 high-impact skill gaps I should prioritize, and how can I learn them?` },
    { label: 'Explain interview questions', text: `Give me 3 common technical interview questions for a junior ${profile.dreamCareer} role and a brief tip on how to answer them.` },
    { label: 'Structure a study schedule', text: 'Draft a 1-week intensive study timetable tailored for my profile to master a core skill required for my target career.' },
  ];

  // 5. Handle message submission to Gemini API
  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let extractedText = "";

      if (extension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await parsePdfText(arrayBuffer);
      } else if (extension === 'docx' || extension === 'doc') {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await parseDocxText(arrayBuffer);
      } else if (extension === 'pptx') {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await parsePptxText(arrayBuffer);
      } else if (extension === 'txt') {
        extractedText = await parseTxtText(file);
      } else {
        throw new Error("Unsupported format! Upload PDF, DOCX, PPTX, or TXT.");
      }

      if (!extractedText || extractedText.trim().length < 5) {
        throw new Error("Could not extract enough text from this file. Ensure it is not empty or image-only.");
      }

      setAttachedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: extension || 'txt',
        text: extractedText
      });
    } catch (err: any) {
      console.error("File extraction failed:", err);
      setParseError(err.message || "Failed to parse file.");
      setAttachedFile(null);
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

  const handleSendMessage = async (textToSend: string, apiTextToSend?: string, fileAttachmentInfo?: { name: string; size: string; type: string; text: string }) => {
    if (!textToSend.trim() || chatStatus === 'thinking') return;

    // Create and append user message
    const userMsg: ExtendedChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fileAttachment: fileAttachmentInfo ? {
        name: fileAttachmentInfo.name,
        size: fileAttachmentInfo.size,
        type: fileAttachmentInfo.type,
        text: fileAttachmentInfo.text
      } : undefined
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setAttachedFile(null); // Clear active attachment on send
    setChatStatus('thinking');

    // Stop currently playing voice if any
    if (activeAudio) {
      activeAudio.pause();
      setActiveAudio(null);
    }

    try {
      // If there is an attachment but no apiTextToSend was explicitly set, pack it
      let finalMessageForAPI = apiTextToSend || userMsg.text;
      if (fileAttachmentInfo && !apiTextToSend) {
        finalMessageForAPI = `I am referencing my uploaded file: **${fileAttachmentInfo.name}**.
My question is: ${userMsg.text}

Here is the extracted text content of the file for reference:
${fileAttachmentInfo.text}`;
      }

      let learningDNAVal = null;
      try {
        const cached = localStorage.getItem('learning_dna');
        if (cached) learningDNAVal = JSON.parse(cached);
      } catch (e) {}

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalMessageForAPI,
          history: chatMessages.map(m => ({
            sender: m.sender,
            text: m.text
          })),
          profile,
          mode: chatMode,
          language: translatorLang,
          learningDNA: learningDNAVal,
        }),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (data && data.text) {
        const botMsg: ExtendedChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: chatMode,
        };
        setChatMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Malformed chatbot response');
      }
    } catch (err) {
      console.error('Failed to communicate with career chatbot API:', err);
      // Fallback message
      const errorMsg: ExtendedChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ **Connection Note**: I experienced a temporary hiccup communicating with my core intelligence module. Let me assist you with standard guidelines for **${profile.dreamCareer}** preparation instead.\n\nKeep focusing on practical skill acquisition and metrics-driven resume bullet points. Please feel free to try sending your query again in a moment!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: chatMode,
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatStatus('idle');
    }
  };

  const handleFileAction = (file: { name: string; size: string; type: string; text: string }, action: 'explain' | 'summarize' | 'quiz') => {
    let displayText = "";
    let apiText = "";
    
    if (action === 'explain') {
      displayText = `Explain the core concepts and lessons of **${file.name}**`;
      apiText = `Please analyze and explain the core concepts, lessons, and key takeaways from the following uploaded file **${file.name}** in a clear, educational structure with markdown bullets and sub-sections.\n\nFile Extracted Content:\n${file.text}`;
    } else if (action === 'summarize') {
      displayText = `Provide a structured summary of **${file.name}**`;
      apiText = `Please summarize the following uploaded file **${file.name}** by providing a comprehensive, structured overview, cheat-sheet notes, and key takeaways.\n\nFile Extracted Content:\n${file.text}`;
    } else if (action === 'quiz') {
      displayText = `Generate a 5-question multiple-choice quiz from **${file.name}**`;
      apiText = `Please generate an interactive learning quiz with 5 multiple-choice questions based on the content of the uploaded file **${file.name}**. Format it clearly with options (A, B, C, D) and specify the answers and explanations at the end.\n\nFile Extracted Content:\n${file.text}`;
    }
    
    handleSendMessage(displayText, apiText, file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attachedFile) {
      handleSendMessage(inputText || `Analyze my uploaded file: **${attachedFile.name}**`, undefined, attachedFile);
    } else {
      handleSendMessage(inputText);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // High-fidelity fallback Speech Synthesis
  const speakWithBrowserSynthesis = (cleanText: string, langCode: string) => {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis is not supported in this browser.");
      setChatStatus('idle');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick localized voice if available
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(langCode.split('-')[0])) || 
                  voices.find((v) => v.lang.startsWith('en'));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setChatStatus('speaking');
    };
    utterance.onend = () => {
      setChatStatus('idle');
    };
    utterance.onerror = (e) => {
      const errorCode = e.error as string;
      if (errorCode === 'interrupted' || errorCode === 'canceled' || errorCode === 'removed') {
        console.log("Speech synthesis interrupted or stopped:", errorCode);
      } else {
        console.warn("SpeechSynthesis non-fatal status:", errorCode);
      }
      setChatStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // 6. Speech synthesis for AI Mentor Responses (Dual-Driver for Clear & Audible Voice)
  const handlePlayVoice = async (text: string) => {
    // Clear any active audio or system speech speaking
    if (activeAudio) {
      activeAudio.pause();
      setActiveAudio(null);
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Toggle off if already speaking
    if (chatStatus === 'speaking') {
      setChatStatus('idle');
      return;
    }

    const cleanSpokenText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#+/g, '')
      .replace(/- /g, '')
      .replace(/✦/g, '')
      .trim();

    if (!cleanSpokenText) return;

    setChatStatus('speaking');
    const langCode = getLangCode(translatorLang);

    // If output language is non-English, use client-side localized voice synthesis instantly
    if (translatorLang !== 'English') {
      speakWithBrowserSynthesis(cleanSpokenText, langCode);
      return;
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanSpokenText, voiceName: 'Kore' }),
      });

      if (!res.ok) throw new Error('Speech synthesis API failed');

      const data = await res.json();
      if (data && data.audio) {
        const audioSrc = `data:audio/mp3;base64,${data.audio}`;
        const audio = new Audio(audioSrc);
        setActiveAudio(audio);
        audio.play().catch((playErr) => {
          console.warn("Audio playback blocked by browser/iframe restrictions, trying Web Speech Synthesis:", playErr);
          speakWithBrowserSynthesis(cleanSpokenText, langCode);
        });
        audio.onended = () => {
          setChatStatus('idle');
          setActiveAudio(null);
        };
      } else {
        throw new Error('No audio data received');
      }
    } catch (err) {
      console.warn('API TTS failed, falling back seamlessly to Web SpeechSynthesis fallback:', err);
      speakWithBrowserSynthesis(cleanSpokenText, langCode);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto" id="ai-career-chatbot-module">
      
      {/* CHAT INTERFACE: Conversational Container & History Thread */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`w-full flex flex-col bg-white dark:bg-black border rounded-3xl shadow-sm p-6 min-h-[580px] h-[650px] overflow-hidden relative transition-all ${
          dragActive 
            ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10' 
            : 'border-slate-200 dark:border-slate-850'
        }`} 
        id="career-chat-window-container"
      >
        
        {dragActive && (
          <div className="absolute inset-0 bg-blue-50/90 dark:bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-50 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-950 border-2 border-dashed border-blue-500 flex items-center justify-center shadow-lg animate-bounce">
              <UploadCloud className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-400">Drop your file here to upload</p>
            <p className="text-xs text-blue-650 dark:text-blue-500 font-semibold">Supports PDF, DOCX, PPTX, and TXT</p>
          </div>
        )}

        {isDownloadingImage && (
          <div className="absolute inset-0 bg-white/80 dark:bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-50">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-lg animate-pulse">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <p className="text-sm font-bold text-slate-850 dark:text-slate-100">Generating High-Res PNG...</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Capturing entire chat conversation log</p>
          </div>
        )}
        
        {/* Chat Window Header */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">AI Assistant</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Translation: <span className="text-blue-600 font-semibold">{translatorLang}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Output Language Selector */}
            <select
              value={translatorLang}
              onChange={(e) => setTranslatorLang(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-600 dark:text-slate-350 focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
              title="Change output translation language"
            >
              {['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'French', 'German', 'Japanese', 'Chinese'].map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDownloadChatImage}
              disabled={isDownloadingImage || chatMessages.length === 0}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
              title="Download entire chat history as high-res PNG image"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Download Chat</span>
            </button>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>UTC Sync Ready</span>
            </div>
          </div>
        </div>

        {/* Scrollable conversation log thread */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto space-y-4 pr-1.5 mb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
          id="chat-scroll-container"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  layout="position"
                  className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Sender Avatar Bubble */}
                  <div className={`p-2.5 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center ${
                    isUser 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-blue-600 dark:text-blue-400'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Box */}
                  <div 
                    id={`msg-bubble-${msg.id}`}
                    className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 relative group shadow-sm transition-all ${
                      isUser 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-250 rounded-tl-none hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Tiny Mode Tag inside bubble */}
                    {!isUser && msg.mode && (
                      <span className="text-[8px] uppercase tracking-wider font-bold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md absolute -top-2 left-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                        {msg.mode}
                      </span>
                    )}

                    {/* Chat Text */}
                    <div className={isUser ? 'text-white' : 'text-slate-850 dark:text-slate-200'}>
                      <StructuredMessageText text={msg.text} />
                    </div>

                    {/* If message has an attachment, render a nice file card */}
                    {msg.fileAttachment && (
                      <div className={`mt-2 mb-1 p-2.5 rounded-xl border flex items-center gap-2.5 text-left ${
                        isUser 
                          ? 'bg-white/10 border-white/20 text-white' 
                          : 'bg-white dark:bg-black border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-slate-250 shadow-xs'
                      }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isUser ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40'
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isUser ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {msg.fileAttachment.name}
                          </p>
                          <p className={`text-[10px] font-mono ${isUser ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                            {msg.fileAttachment.size} • Extracted
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Timestamp & Copy/TTS Actions */}
                    <div className={`flex items-center justify-between gap-4 mt-3.5 border-t pt-2 ${isUser ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'}`}>
                      <span className={`text-[9px] block font-mono ${isUser ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {msg.timestamp}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Copy Option */}
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className={`transition-colors p-1 rounded-md flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
                            isUser 
                              ? 'text-blue-100 hover:text-white hover:bg-white/10' 
                              : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Copy advice to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[9px] text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[9px]">Copy</span>
                            </>
                          )}
                        </button>

                        {!isUser && (
                          <button
                            onClick={() => handlePlayVoice(msg.text)}
                            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-[10px]"
                            title="Read this recommendation out loud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[9px]">Read Out Loud</span>
                          </button>
                        )}

                        {/* Download Options Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDownloadMenu(activeDownloadMenu === msg.id ? null : msg.id);
                            }}
                            className={`transition-colors p-1 rounded-md flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
                              isUser 
                                ? 'text-blue-100 hover:text-white hover:bg-white/10' 
                                : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                            }`}
                            title="Download options for this response"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[9px]">Download</span>
                          </button>

                          {activeDownloadMenu === msg.id && (
                            <>
                              {/* Overlay click catcher to close the dropdown */}
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDownloadMenu(null);
                                }} 
                              />
                              <div className="absolute right-0 bottom-full mb-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 w-36 z-20 text-slate-800 dark:text-slate-100 text-left">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadSingleMessage(msg, 'text');
                                    setActiveDownloadMenu(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>Save as Text</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadSingleMessage(msg, 'image');
                                    setActiveDownloadMenu(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>Save as Image</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing/Thinking Indicator */}
          {chatStatus === 'thinking' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-3 max-w-[80%]"
            >
              <div className="p-2.5 bg-slate-50 border border-slate-200 text-blue-600 rounded-xl animate-pulse">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-500 italic flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span>HaloHex AI is researching dynamic roadmaps and formulating customized recommendations...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* BOTTOM: Quick Prompt Suggestion Chips */}
        {chatMessages.length < 5 && (
          <div className="mb-3 shrink-0">
            <p className="text-[10px] text-slate-500 mb-1.5 font-semibold flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              Quick Career Inquiries:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  disabled={chatStatus === 'thinking'}
                  className="bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-slate-900 transition-all text-slate-600 text-[10px] px-3 py-1.5 rounded-xl border border-slate-200 font-semibold whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attached file preview chip or parsing indicator */}
        {(isParsing || attachedFile || parseError || sttError || downloadNotification) && (
          <div className="px-4 py-3 border-t border-slate-150 bg-slate-50/50 flex flex-col gap-2 shrink-0">
            {isParsing && (
              <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting document text...</span>
              </div>
            )}
            
            {parseError && (
              <div className="flex items-center justify-between gap-2 bg-red-50 border border-red-150 rounded-xl px-3.5 py-2.5 text-red-700 text-[11px] font-semibold">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
                <button type="button" onClick={() => setParseError(null)} className="text-red-500 hover:text-red-700 font-bold text-xs px-1">✕</button>
              </div>
            )}

            {sttError && (
              <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-150 rounded-xl px-3.5 py-2.5 text-amber-800 text-[11px] font-semibold">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{sttError}</span>
                </div>
                <button type="button" onClick={() => setSttError(null)} className="text-amber-500 hover:text-amber-700 font-bold text-xs px-1">✕</button>
              </div>
            )}

            {downloadNotification && (
              <div className={`flex items-center justify-between gap-2 border rounded-xl px-3.5 py-2.5 text-[11px] font-semibold ${
                downloadNotification.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-150 text-emerald-800' 
                  : 'bg-red-50 border-red-150 text-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {downloadNotification.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{downloadNotification.message}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setDownloadNotification(null)} 
                  className={`font-bold text-xs px-1 ${
                    downloadNotification.type === 'success' ? 'text-emerald-500 hover:text-emerald-700' : 'text-red-500 hover:text-red-700'
                  }`}
                >
                  ✕
                </button>
              </div>
            )}
            
            {attachedFile && (
              <div className="flex flex-col gap-2">
                {/* Attachment Card */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      attachedFile.type === 'pdf' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                      attachedFile.type === 'docx' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                      attachedFile.type === 'pptx' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                      'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{attachedFile.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">{attachedFile.size} • Extracted successfully</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Quick action helper buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleFileAction(attachedFile, 'explain')}
                    disabled={chatStatus === 'thinking'}
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 disabled:opacity-50 text-[10px] font-bold py-1.5 px-3.5 rounded-xl transition-all shadow-xs"
                  >
                    ✦ Explain File
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFileAction(attachedFile, 'summarize')}
                    disabled={chatStatus === 'thinking'}
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 disabled:opacity-50 text-[10px] font-bold py-1.5 px-3.5 rounded-xl transition-all shadow-xs"
                  >
                    ✦ Summarize File
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFileAction(attachedFile, 'quiz')}
                    disabled={chatStatus === 'thinking'}
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 disabled:opacity-50 text-[10px] font-bold py-1.5 px-3.5 rounded-xl transition-all shadow-xs"
                  >
                    ✦ Generate Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive Input Form */}
        <form onSubmit={handleFormSubmit} className="flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.pptx,.txt"
            className="hidden"
          />

          <button
            type="button"
            onClick={triggerFileSelect}
            title="Attach a PDF, Word, PowerPoint or Text file"
            className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-850 dark:hover:text-slate-200 flex items-center justify-center transition-all shrink-0 cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {sttSupported && (
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Start Voice Typing (Speech-to-Text)"}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                  : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </button>
          )}

          <div className="relative flex-1">
            <input
              type="text"
              required={!attachedFile}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={chatStatus === 'thinking'}
              placeholder={
                isListening 
                  ? `Listening carefully in ${translatorLang}... speak now!` 
                  : chatStatus === 'thinking' 
                  ? 'Generating mentoring output...' 
                  : attachedFile 
                  ? `Ask a question about ${attachedFile.name}, or click quick actions...`
                  : `Ask AI Assistant in ${chatMode} mode...`
              }
              className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-2xl px-4 py-3.5 pr-14 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 ${
                isListening ? 'border-rose-500/50 shadow-[0_0_10px_rgba(225,29,72,0.15)]' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {isListening && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="w-0.5 h-3 bg-rose-500 rounded-full animate-[pulse_0.4s_infinite_alternate]" />
                <span className="w-0.5 h-4 bg-rose-500 rounded-full animate-[pulse_0.2s_infinite_alternate]" />
                <span className="w-0.5 h-3 bg-rose-500 rounded-full animate-[pulse_0.3s_infinite_alternate]" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={chatStatus === 'thinking' || (!inputText.trim() && !attachedFile)}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold text-xs px-5 h-11 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
