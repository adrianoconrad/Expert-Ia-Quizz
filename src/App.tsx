/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  BrainCircuit,
  Loader2,
  FileText,
  Trophy,
  AlertCircle,
  Settings,
  History,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileQuestion,
  Pause,
  Play,
  Volume2,
  PlusCircle,
  Link as LinkIcon,
  Sun,
  Moon,
  Send,
  User,
  Palette
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateQuiz, QuizQuestion, QuizFormat, generateDeepDive, generateSpeech, ContentItem, chatWithProfessor } from './services/geminiService';
import { cn } from './lib/utils';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type QuizState = 'idle' | 'loading' | 'active' | 'finished';
type ThemeColor = 'emerald' | 'blue' | 'indigo' | 'violet' | 'rose' | 'amber';

const THEME_CONFIG = {
  emerald: {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    secondary: 'bg-emerald-500',
    secondaryHover: 'hover:bg-emerald-500',
    text: 'text-emerald-600',
    textDark: 'dark:text-emerald-500',
    textLight: 'text-emerald-700',
    textLightDark: 'dark:text-emerald-400',
    border: 'border-emerald-600',
    borderDark: 'dark:border-emerald-500',
    bg: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-900/20',
    accent: 'accent-emerald-600',
    accentDark: 'dark:accent-emerald-500',
    ring: 'focus:ring-emerald-500/10',
    focusBorder: 'focus:border-emerald-500',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-emerald-700',
    shadow: 'shadow-emerald-500/20',
    shadowLg: 'shadow-emerald-500/30',
    shadowXl: 'shadow-emerald-200',
    shadowXlDark: 'dark:shadow-emerald-900/20',
    prose: 'prose-emerald',
    selection: 'selection:bg-emerald-100 dark:selection:bg-emerald-900/30',
    icon: 'text-emerald-600 dark:text-emerald-500',
    difficultyEasy: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    deepDiveBg: 'bg-emerald-600/10',
    deepDiveIcon: 'bg-emerald-600',
    deepDiveAudio: 'bg-emerald-500',
    deepDiveLoader: 'text-emerald-400',
    deepDiveTip: 'bg-emerald-400/5 border-emerald-400/10 text-emerald-100/80',
    deepDiveTipIcon: 'text-emerald-400',
    chatUser: 'bg-emerald-600',
    chatUserBubble: 'bg-emerald-600/20 text-emerald-50',
    resultCircle: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50',
    bgLightDark: 'dark:bg-emerald-900/20',
    borderLight: 'border-emerald-600',
    borderLightDark: 'dark:border-emerald-500',
    shadowLight: 'shadow-emerald-500/20',
    shadowDark: 'dark:shadow-emerald-900/20',
    darkPrimary: 'bg-emerald-600'
  },
  blue: {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    secondary: 'bg-blue-500',
    secondaryHover: 'hover:bg-blue-500',
    text: 'text-blue-600',
    textDark: 'dark:text-blue-500',
    textLight: 'text-blue-700',
    textLightDark: 'dark:text-blue-400',
    border: 'border-blue-600',
    borderDark: 'dark:border-blue-500',
    bg: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/20',
    accent: 'accent-blue-600',
    accentDark: 'dark:accent-blue-500',
    ring: 'focus:ring-blue-500/10',
    focusBorder: 'focus:border-blue-500',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-700',
    shadow: 'shadow-blue-500/20',
    shadowLg: 'shadow-blue-500/30',
    shadowXl: 'shadow-blue-200',
    shadowXlDark: 'dark:shadow-blue-900/20',
    prose: 'prose-blue',
    selection: 'selection:bg-blue-100 dark:selection:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-500',
    difficultyEasy: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    deepDiveBg: 'bg-blue-600/10',
    deepDiveIcon: 'bg-blue-600',
    deepDiveAudio: 'bg-blue-500',
    deepDiveLoader: 'text-blue-400',
    deepDiveTip: 'bg-blue-400/5 border-blue-400/10 text-blue-100/80',
    deepDiveTipIcon: 'text-blue-400',
    chatUser: 'bg-blue-600',
    chatUserBubble: 'bg-blue-600/20 text-blue-50',
    resultCircle: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50',
    bgLightDark: 'dark:bg-blue-900/20',
    borderLight: 'border-blue-600',
    borderLightDark: 'dark:border-blue-500',
    shadowLight: 'shadow-blue-500/20',
    shadowDark: 'dark:shadow-blue-900/20',
    darkPrimary: 'bg-blue-600'
  },
  indigo: {
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    secondary: 'bg-indigo-500',
    secondaryHover: 'hover:bg-indigo-500',
    text: 'text-indigo-600',
    textDark: 'dark:text-indigo-500',
    textLight: 'text-indigo-700',
    textLightDark: 'dark:text-indigo-400',
    border: 'border-indigo-600',
    borderDark: 'dark:border-indigo-500',
    bg: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-900/20',
    accent: 'accent-indigo-600',
    accentDark: 'dark:accent-indigo-500',
    ring: 'focus:ring-indigo-500/10',
    focusBorder: 'focus:border-indigo-500',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-indigo-700',
    shadow: 'shadow-indigo-500/20',
    shadowLg: 'shadow-indigo-500/30',
    shadowXl: 'shadow-indigo-200',
    shadowXlDark: 'dark:shadow-indigo-900/20',
    prose: 'prose-indigo',
    selection: 'selection:bg-indigo-100 dark:selection:bg-indigo-900/30',
    icon: 'text-indigo-600 dark:text-indigo-500',
    difficultyEasy: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
    deepDiveBg: 'bg-indigo-600/10',
    deepDiveIcon: 'bg-indigo-600',
    deepDiveAudio: 'bg-indigo-500',
    deepDiveLoader: 'text-indigo-400',
    deepDiveTip: 'bg-indigo-400/5 border-indigo-400/10 text-indigo-100/80',
    deepDiveTipIcon: 'text-indigo-400',
    chatUser: 'bg-indigo-600',
    chatUserBubble: 'bg-indigo-600/20 text-indigo-50',
    resultCircle: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-50',
    bgLightDark: 'dark:bg-indigo-900/20',
    borderLight: 'border-indigo-600',
    borderLightDark: 'dark:border-indigo-500',
    shadowLight: 'shadow-indigo-500/20',
    shadowDark: 'dark:shadow-indigo-900/20',
    darkPrimary: 'bg-indigo-600'
  },
  violet: {
    primary: 'bg-violet-600',
    primaryHover: 'hover:bg-violet-700',
    secondary: 'bg-violet-500',
    secondaryHover: 'hover:bg-violet-500',
    text: 'text-violet-600',
    textDark: 'dark:text-violet-500',
    textLight: 'text-violet-700',
    textLightDark: 'dark:text-violet-400',
    border: 'border-violet-600',
    borderDark: 'dark:border-violet-500',
    bg: 'bg-violet-50',
    bgDark: 'dark:bg-violet-900/20',
    accent: 'accent-violet-600',
    accentDark: 'dark:accent-violet-500',
    ring: 'focus:ring-violet-500/10',
    focusBorder: 'focus:border-violet-500',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-violet-700',
    shadow: 'shadow-violet-500/20',
    shadowLg: 'shadow-violet-500/30',
    shadowXl: 'shadow-violet-200',
    shadowXlDark: 'dark:shadow-violet-900/20',
    prose: 'prose-violet',
    selection: 'selection:bg-violet-100 dark:selection:bg-violet-900/30',
    icon: 'text-violet-600 dark:text-violet-500',
    difficultyEasy: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
    deepDiveBg: 'bg-violet-600/10',
    deepDiveIcon: 'bg-violet-600',
    deepDiveAudio: 'bg-violet-500',
    deepDiveLoader: 'text-violet-400',
    deepDiveTip: 'bg-violet-400/5 border-violet-400/10 text-violet-100/80',
    deepDiveTipIcon: 'text-violet-400',
    chatUser: 'bg-violet-600',
    chatUserBubble: 'bg-violet-600/20 text-violet-50',
    resultCircle: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    bgLight: 'bg-violet-50',
    bgLightDark: 'dark:bg-violet-900/20',
    borderLight: 'border-violet-600',
    borderLightDark: 'dark:border-violet-500',
    shadowLight: 'shadow-violet-500/20',
    shadowDark: 'dark:shadow-violet-900/20',
    darkPrimary: 'bg-violet-600'
  },
  rose: {
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    secondary: 'bg-rose-500',
    secondaryHover: 'hover:bg-rose-500',
    text: 'text-rose-600',
    textDark: 'dark:text-rose-500',
    textLight: 'text-rose-700',
    textLightDark: 'dark:text-rose-400',
    border: 'border-rose-600',
    borderDark: 'dark:border-rose-500',
    bg: 'bg-rose-50',
    bgDark: 'dark:bg-rose-900/20',
    accent: 'accent-rose-600',
    accentDark: 'dark:accent-rose-500',
    ring: 'focus:ring-rose-500/10',
    focusBorder: 'focus:border-rose-500',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-rose-700',
    shadow: 'shadow-rose-500/20',
    shadowLg: 'shadow-rose-500/30',
    shadowXl: 'shadow-rose-200',
    shadowXlDark: 'dark:shadow-rose-900/20',
    prose: 'prose-rose',
    selection: 'selection:bg-rose-100 dark:selection:bg-rose-900/30',
    icon: 'text-rose-600 dark:text-rose-500',
    difficultyEasy: 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
    deepDiveBg: 'bg-rose-600/10',
    deepDiveIcon: 'bg-rose-600',
    deepDiveAudio: 'bg-rose-500',
    deepDiveLoader: 'text-rose-400',
    deepDiveTip: 'bg-rose-400/5 border-rose-400/10 text-rose-100/80',
    deepDiveTipIcon: 'text-rose-400',
    chatUser: 'bg-rose-600',
    chatUserBubble: 'bg-rose-600/20 text-rose-50',
    resultCircle: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-50',
    bgLightDark: 'dark:bg-rose-900/20',
    borderLight: 'border-rose-600',
    borderLightDark: 'dark:border-rose-500',
    shadowLight: 'shadow-rose-500/20',
    shadowDark: 'dark:shadow-rose-900/20',
    darkPrimary: 'bg-rose-600'
  },
  amber: {
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    secondary: 'bg-amber-500',
    secondaryHover: 'hover:bg-amber-500',
    text: 'text-amber-600',
    textDark: 'dark:text-amber-500',
    textLight: 'text-amber-700',
    textLightDark: 'dark:text-amber-400',
    border: 'border-amber-600',
    borderDark: 'dark:border-amber-500',
    bg: 'bg-amber-50',
    bgDark: 'dark:bg-amber-900/20',
    accent: 'accent-amber-600',
    accentDark: 'dark:accent-amber-500',
    ring: 'focus:ring-amber-500/10',
    focusBorder: 'focus:border-amber-500',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-amber-700',
    shadow: 'shadow-amber-500/20',
    shadowLg: 'shadow-amber-500/30',
    shadowXl: 'shadow-amber-200',
    shadowXlDark: 'dark:shadow-amber-900/20',
    prose: 'prose-amber',
    selection: 'selection:bg-amber-100 dark:selection:bg-amber-900/30',
    icon: 'text-amber-600 dark:text-amber-500',
    difficultyEasy: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    deepDiveBg: 'bg-amber-600/10',
    deepDiveIcon: 'bg-amber-600',
    deepDiveAudio: 'bg-amber-500',
    deepDiveLoader: 'text-amber-400',
    deepDiveTip: 'bg-amber-400/5 border-amber-400/10 text-amber-100/80',
    deepDiveTipIcon: 'text-amber-400',
    chatUser: 'bg-amber-600',
    chatUserBubble: 'bg-amber-600/20 text-amber-50',
    resultCircle: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50',
    bgLightDark: 'dark:bg-amber-900/20',
    borderLight: 'border-amber-600',
    borderLightDark: 'dark:border-amber-500',
    shadowLight: 'shadow-amber-500/20',
    shadowDark: 'dark:shadow-amber-900/20',
    darkPrimary: 'bg-amber-600'
  }
};

interface QuizResult {
  id: string;
  date: Date;
  correct: number;
  total: number;
  timeSpent: number; // in seconds
  fileName: string;
  questions: QuizQuestion[];
  answers: (string | null)[];
  content?: ContentItem | ContentItem[];
}

export default function App() {
  const [state, setState] = useState<QuizState>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isQuestionStarted, setIsQuestionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [lastContent, setLastContent] = useState<ContentItem | ContentItem[] | null>(null);
  const [lastFileName, setLastFileName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(true);
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  // Chat with Professor
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Settings
  const [questionCount, setQuestionCount] = useState(20);
  const [quizFormat, setQuizFormat] = useState<QuizFormat>('both');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    return (localStorage.getItem('themeColor') as ThemeColor) || 'emerald';
  });

  const theme = THEME_CONFIG[themeColor];

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
  }, [themeColor]);
  const [timeAlertThreshold, setTimeAlertThreshold] = useState(100); // Default 1:40
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Timer
  const [totalTime, setTotalTime] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history from SQLite
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // Local mode
        const storedKey = localStorage.getItem('GEMINI_API_KEY');
        if (!storedKey && !process.env.GEMINI_API_KEY && !process.env.API_KEY) {
          setHasApiKey(false);
          setShowApiKeyInput(true);
        }
      }
    };
    checkApiKey();

    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.map((h: any) => {
            let content = h.content;
            if (content && (content.startsWith('{') || content.startsWith('['))) {
              try { content = JSON.parse(content); } catch(e) {}
            }
            return { 
              ...h, 
              date: new Date(h.date),
              questions: JSON.parse(h.questions || '[]'),
              answers: JSON.parse(h.answers || '[]'),
              content: content
            };
          }));
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    };
    fetchHistory();
  }, []);

  // Timer Logic
  useEffect(() => {
    if (state === 'active' && answers[currentIndex] === null && isQuestionStarted && !isPaused) {
      timerRef.current = setInterval(() => {
        setQuestionTime(prev => prev + 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, currentIndex, answers, isQuestionStarted, isPaused]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setState('loading');
    setError(null);

    try {
      const contents: ContentItem[] = [];
      const fileNames: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileNames.push(file.name);
        
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          contents.push(result.value);
        } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
          contents.push(await file.text());
        } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file);
          contents.push({ data: base64, mimeType: file.type });
        } else {
          try {
            contents.push(await file.text());
          } catch {
            throw new Error(`Formato de arquivo não suportado: ${file.name}`);
          }
        }
      }

      const combinedFileName = fileNames.length > 1 
        ? `${fileNames.length} arquivos (${fileNames[0]}...)` 
        : fileNames[0];

      startQuiz(contents, combinedFileName);
    } catch (err: any) {
      setError(err.message || "Erro ao processar os arquivos.");
      setState('idle');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const startQuiz = async (content: ContentItem | ContentItem[], fileName: string) => {
    setState('loading');
    setError(null);
    setLastContent(content);
    setLastFileName(fileName);
    try {
      const generatedQuestions = await generateQuiz(content, questionCount, quizFormat);
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(null));
      setQuestionTimes(new Array(generatedQuestions.length).fill(0));
      setCurrentIndex(0);
      setTotalTime(0);
      setQuestionTime(0);
      setIsQuestionStarted(false);
      setIsPaused(false);
      setState('active');
      setShowDeepDive(false);
      setIsReviewMode(false);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError("A chave de API selecionada não foi encontrada ou expirou. Por favor, selecione novamente.");
      } else if (err.message?.includes("API_KEY_INVALID") || err.message?.includes("Chave de API inválida")) {
        setHasApiKey(false);
        setError("Chave de API inválida. Por favor, configure uma chave válida nas configurações.");
      } else {
        setError(err.message || "Erro ao gerar o quiz.");
      }
      setState('idle');
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    
    const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) {
      setError("Por favor, insira pelo menos um link válido (começando com http).");
      return;
    }
    
    startQuiz(urls, urls.length === 1 ? urls[0] : `${urls.length} links`);
    setUrlInput('');
  };

  const handleOpenSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError(null);
    } else {
      setShowApiKeyInput(true);
    }
  };

  const handleSaveManualKey = () => {
    if (manualApiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', manualApiKey.trim());
      setHasApiKey(true);
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const fetchDeepDiveForCurrentQuestion = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ || currentQ.deepDive || !lastContent) return;

    setIsDeepDiveLoading(true);
    setChatHistory([]); // Reset chat for new question
    try {
      const deepDive = await generateDeepDive(lastContent, currentQ);
      const updatedQuestions = [...questions];
      updatedQuestions[currentIndex] = { ...currentQ, deepDive };
      setQuestions(updatedQuestions);
    } catch (err: any) {
      console.error("Failed to fetch deep dive", err);
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API_KEY_INVALID")) {
        setHasApiKey(false);
        setError("Erro de autenticação com a API. Por favor, verifique sua chave.");
      }
    } finally {
      setIsDeepDiveLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatHistory, { role: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const response = await chatWithProfessor(questions[currentIndex], chatHistory, userMsg);
      setChatHistory([...newHistory, { role: 'model' as const, text: response }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory([...newHistory, { role: 'model' as const, text: "Desculpe, tive um problema ao processar sua pergunta." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (answers[currentIndex] !== null) return;

    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);

    const newQuestionTimes = [...questionTimes];
    newQuestionTimes[currentIndex] = questionTime;
    setQuestionTimes(newQuestionTimes);

    // No automatic deep dive trigger
  };

  const handlePlayAudio = async (text: string) => {
    if (isAudioPlaying || isAudioLoading) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ((window as any)._currentAudioSource) {
        try { (window as any)._currentAudioSource.stop(); } catch(e) {}
      }
      setIsAudioPlaying(false);
      setIsAudioLoading(false);
      return;
    }

    try {
      setIsAudioLoading(true);
      // Strip markdown for cleaner TTS
      const cleanText = text.replace(/[#*`_~\[\]()]/g, '').trim();
      if (!cleanText) {
        setIsAudioLoading(false);
        return;
      }
      
      const { data, mimeType } = await generateSpeech(cleanText);
      
      if (mimeType.includes('pcm')) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        
        const binaryString = window.atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const pcmData = new Int16Array(bytes.buffer);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0;
        }
        
        const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000);
        audioBuffer.getChannelData(0).set(floatData);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsAudioPlaying(false);
        (window as any)._currentAudioSource = source;
        
        setIsAudioLoading(false);
        setIsAudioPlaying(true);
        source.start();
      } else {
        const audioUrl = `data:${mimeType};base64,${data}`;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = audioUrl;
          audioRef.current.load();
        } else {
          audioRef.current = new Audio(audioUrl);
        }
        
        audioRef.current.onended = () => setIsAudioPlaying(false);
        audioRef.current.onerror = () => {
          setIsAudioPlaying(false);
          setIsAudioLoading(false);
        };
        
        setIsAudioLoading(false);
        setIsAudioPlaying(true);
        await audioRef.current.play();
      }
    } catch (err: any) {
      console.error("Failed to play audio", err);
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API_KEY_INVALID")) {
        setHasApiKey(false);
        setError("Erro de autenticação com a API ao gerar áudio.");
      }
      setIsAudioPlaying(false);
      setIsAudioLoading(false);
    }
  };

  const handleToggleDeepDive = () => {
    const nextShow = !showDeepDive;
    setShowDeepDive(nextShow);
    if (nextShow) {
      setChatHistory([]); // Reset chat when opening
      fetchDeepDiveForCurrentQuestion();
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuestionTime(0);
      setIsQuestionStarted(true); // Auto-start for subsequent questions
      if (!isReviewMode) setShowDeepDive(false);
    } else {
      if (isReviewMode) {
        setState('finished');
      } else {
        finishQuiz();
      }
    }
  };

  const finishQuiz = async () => {
    const correct = answers.filter((ans, idx) => ans === questions[idx]?.correctAnswer).length;
    const result: QuizResult = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date(),
      correct,
      total: questions.length,
      timeSpent: totalTime,
      fileName: lastFileName || 'Documento',
      questions,
      answers,
      content: lastContent
    };

    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result,
          questions: JSON.stringify(questions),
          answers: JSON.stringify(answers),
          content: typeof lastContent === 'string' ? lastContent : JSON.stringify(lastContent)
        })
      });
      setHistory(prev => [result, ...prev]);
    } catch (e) {
      console.error("Failed to save history to server", e);
    }
    
    setState('finished');
  };

  const resetQuiz = () => {
    setState('idle');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setQuestionTimes([]);
    setTotalTime(0);
    setQuestionTime(0);
    setShowDeepDive(false);
    setIsReviewMode(false);
  };

  const redoQuiz = () => {
    setAnswers(new Array(questions.length).fill(null));
    setQuestionTimes(new Array(questions.length).fill(0));
    setCurrentIndex(0);
    setTotalTime(0);
    setQuestionTime(0);
    setIsQuestionStarted(false);
    setState('active');
    setShowDeepDive(false);
    setIsReviewMode(false);
  };

  const reviewQuiz = () => {
    setIsReviewMode(true);
    setCurrentIndex(0);
    setIsQuestionStarted(true);
    setState('active');
    setShowDeepDive(true);
  };

  const handleHistoryClick = (res: QuizResult) => {
    setQuestions(res.questions);
    setAnswers(res.answers);
    setQuestionTimes(new Array(res.questions.length).fill(0));
    setCurrentIndex(0);
    setTotalTime(res.timeSpent);
    setQuestionTime(0);
    setIsQuestionStarted(true);
    setIsReviewMode(true);
    setState('active');
    setShowDeepDive(true);
    setSidebarOpen(false);
    setLastContent(res.content || null);
    setLastFileName(res.fileName);
  };

  const generateAnother = () => {
    if (lastContent) {
      startQuiz(lastContent, lastFileName);
    }
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (e) {
      console.error("Failed to delete history item", e);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/backup');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      alert("Erro ao fazer backup");
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const response = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (response.ok) {
          alert("Backup restaurado com sucesso!");
          window.location.reload();
        } else {
          alert("Erro ao restaurar backup");
        }
      } catch (e) {
        alert("Arquivo de backup inválido");
      }
    };
    input.click();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const correctCount = answers.filter((ans, idx) => ans === questions[idx]?.correctAnswer).length;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const isCorrect = currentAnswer === currentQuestion?.correctAnswer;

  return (
    <div className={cn("min-h-screen bg-[#F5F5F0] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 font-sans flex overflow-hidden", theme.selection)}>
      
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="bg-white dark:bg-slate-900 border-r border-black/5 dark:border-slate-800 flex-shrink-0 relative overflow-hidden flex flex-col"
      >
        <div className="w-[320px] h-full flex flex-col p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-slate-100">
              <Settings size={20} className={theme.icon} />
              Configurações
            </h3>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:text-slate-400">
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="space-y-4 relative">
            <label className="block text-sm font-medium text-black/60 dark:text-slate-400 uppercase tracking-wider">Cor do Tema</label>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all bg-white dark:bg-slate-800",
                  showColorPicker ? theme.border : "border-black/5 dark:border-slate-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10" 
                    style={{ backgroundColor: THEME_CONFIG[themeColor].primary.replace('bg-', '').replace('-600', '') === 'emerald' ? '#059669' : 
                                            THEME_CONFIG[themeColor].primary.replace('bg-', '').replace('-600', '') === 'blue' ? '#2563eb' :
                                            THEME_CONFIG[themeColor].primary.replace('bg-', '').replace('-600', '') === 'indigo' ? '#4f46e5' :
                                            THEME_CONFIG[themeColor].primary.replace('bg-', '').replace('-600', '') === 'violet' ? '#7c3aed' :
                                            THEME_CONFIG[themeColor].primary.replace('bg-', '').replace('-600', '') === 'rose' ? '#e11d48' : '#d97706' }} 
                  />
                  <span className="text-sm font-medium dark:text-slate-200">
                    {themeColor === 'emerald' ? 'Esmeralda' :
                     themeColor === 'blue' ? 'Azul' :
                     themeColor === 'indigo' ? 'Índigo' :
                     themeColor === 'violet' ? 'Violeta' :
                     themeColor === 'rose' ? 'Rosa' : 'Âmbar'}
                  </span>
                </div>
                <Palette size={18} className={cn("transition-transform duration-300", showColorPicker ? "rotate-12" : "", theme.icon)} />
              </button>

              <AnimatePresence>
                {showColorPicker && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute left-0 right-0 top-full mt-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/5 dark:border-slate-700 shadow-xl z-50 grid grid-cols-3 gap-2"
                    >
                      {[
                        { id: 'emerald', label: 'Esmeralda', color: '#059669' },
                        { id: 'blue', label: 'Azul', color: '#2563eb' },
                        { id: 'indigo', label: 'Índigo', color: '#4f46e5' },
                        { id: 'violet', label: 'Violeta', color: '#7c3aed' },
                        { id: 'rose', label: 'Rosa', color: '#e11d48' },
                        { id: 'amber', label: 'Âmbar', color: '#d97706' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setThemeColor(opt.id as ThemeColor);
                            setShowColorPicker(false);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-2 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5",
                            themeColor === opt.id ? "bg-black/5 dark:bg-white/5" : ""
                          )}
                        >
                          <div 
                            className={cn(
                              "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform",
                              themeColor === opt.id ? "border-black dark:border-white scale-110" : "border-transparent"
                            )}
                            style={{ backgroundColor: opt.color }}
                          >
                            {themeColor === opt.id && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                          <span className="text-[10px] font-medium dark:text-slate-300">{opt.label}</span>
                        </button>
                      ))}
                    </motion.div>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowColorPicker(false)} 
                    />
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-black/60 dark:text-slate-400 uppercase tracking-wider">Quantidade de Questões</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className={cn("flex-1", theme.accent, theme.accentDark)}
              />
              <span className={cn("font-mono font-bold w-8", theme.text, theme.textDark)}>{questionCount}</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-black/60 dark:text-slate-400 uppercase tracking-wider">Formato do Quiz</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'multiple-choice', label: 'Múltipla Escolha' },
                { id: 'cebraspe', label: 'Cebraspe' },
                { id: 'both', label: 'Ambos' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setQuizFormat(f.id as QuizFormat)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all text-left",
                    quizFormat === f.id 
                      ? cn(theme.border, theme.bg, theme.textLight, theme.textLightDark) 
                      : "border-black/5 dark:border-slate-800 hover:border-black/10 dark:hover:border-slate-700 text-black/60 dark:text-slate-400"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-2xl" style={{ backgroundColor: '#f8f8f8' }}>
            <label className="block text-sm font-medium text-black/60 dark:text-slate-400 uppercase tracking-wider">Alerta de Tempo (segundos)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="30" 
                max="300" 
                step="10"
                value={timeAlertThreshold}
                onChange={(e) => setTimeAlertThreshold(parseInt(e.target.value))}
                className={cn("flex-1", theme.accent, theme.accentDark)}
              />
              <span className={cn("font-mono font-bold w-12 text-right", theme.text, theme.textDark)}>{timeAlertThreshold}s</span>
            </div>
            <p className="text-[10px] text-black/40 dark:text-slate-500 italic">O cronômetro piscará em vermelho após este tempo.</p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-black/60 dark:text-slate-400 uppercase tracking-wider">Backup e Restauração</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleBackup}
                className={cn("flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-black/80 transition-all", theme.darkPrimary, theme.primaryHover)}
              >
                Fazer Backup
              </button>
              <button
                onClick={handleRestore}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 border-black/5 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 dark:text-slate-300 transition-all"
              >
                Refazer Backup
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4 dark:text-slate-100">
              <History size={20} className={theme.icon} />
              Histórico
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-8 text-black/30 text-sm italic">
                  Nenhum resultado ainda.
                </div>
              ) : (
                history.map((res) => (
                  <div 
                    key={res.id} 
                    onClick={() => handleHistoryClick(res)}
                    className={cn("bg-[#F5F5F0] dark:bg-slate-800 p-4 rounded-2xl group relative transition-colors cursor-pointer", `hover:${theme.bg}`, `dark:hover:${theme.bgDark}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-black/40 dark:text-slate-500 uppercase tracking-widest">
                        {format(res.date, "dd MMM, HH:mm", { locale: ptBR })}
                      </span>
                      <button 
                        onClick={(e) => deleteHistoryItem(res.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 transition-all dark:text-slate-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-medium truncate mb-2 pr-4 dark:text-slate-200">{res.fileName}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy size={14} className="text-amber-500" />
                        <span className="text-xs font-bold dark:text-slate-300">{res.correct}/{res.total}</span>
                      </div>
                      <div className="flex items-center gap-2 text-black/40 dark:text-slate-500">
                        <Clock size={14} />
                        <span className="text-xs">{formatTime(res.timeSpent)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Header */}
        <header className="border-b border-black/5 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group"
              >
                {sidebarOpen ? <ChevronLeft size={20} className="dark:text-slate-400" /> : <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500 dark:text-slate-400" />}
                <span className="text-sm font-bold uppercase tracking-wider text-black/60 dark:text-slate-500">Ajuste</span>
              </button>
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-lg", theme.gradientFrom, theme.gradientTo, theme.shadow)}>
                  <BrainCircuit size={20} className="text-white" />
                </div>
                <span className="font-semibold text-lg tracking-tight hidden sm:inline dark:text-slate-100">Quiz AI Expert</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-slate-400 transition-colors"
                title={darkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              {state === 'active' && (
              <div className="flex items-center gap-4 md:gap-8">
                <div className="flex items-center gap-6">
                  <div className="text-sm font-medium text-black/50 hidden md:block">
                    Questão {currentIndex + 1} de {questions.length}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border",
                      isPaused 
                        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" 
                        : "bg-black/5 text-black/60 border-black/5 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/20"
                    )}
                  >
                    {isPaused ? <Play size={18} /> : <Pause size={18} />}
                    <span>{isPaused ? 'Retomar' : 'Pausar'}</span>
                  </button>
                  <button
                    onClick={resetQuiz}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors border border-rose-100 dark:border-rose-900/30 dark:text-rose-400"
                  >
                    <PlusCircle size={18} />
                    <span className="hidden sm:inline">Novo Quiz</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1800px] mx-auto px-6 py-12">
            <AnimatePresence mode="wait">
              {state === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto text-center space-y-8"
                >
                  <div className="flex justify-center">
                    <div className={cn("w-20 h-20 bg-gradient-to-br rounded-3xl flex items-center justify-center shadow-2xl rotate-3", theme.gradientFrom, theme.gradientTo, theme.shadowLg)}>
                      <BrainCircuit size={48} className="text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-5xl font-medium tracking-tight leading-tight dark:text-slate-100">
                      Transforme seus documentos em <span className={cn("italic font-serif", theme.textLight, theme.textLightDark)}>conhecimento vivo</span>.
                    </h1>
                    <p className="text-lg text-black/60 dark:text-slate-400">
                      Envie qualquer arquivo (PDF, Word, Imagem, Texto) e nossa IA criará um quiz personalizado com o número de questões que você desejar.
                    </p>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0) {
                        const event = { target: { files } } as any;
                        handleFileUpload(event);
                      }
                    }}
                    className={cn("group relative border-2 border-dashed border-black/10 dark:border-slate-800 rounded-3xl p-12 cursor-pointer transition-all duration-300", `hover:${theme.border}/50`, `hover:${theme.bg}/30`, `dark:hover:${theme.bgDark}`)}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      multiple
                      className="hidden" 
                      accept=".txt,.md,.pdf,.docx,image/*"
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Upload className={theme.icon} size={32} />
                      </div>
                      <div>
                        <p className="font-medium text-lg dark:text-slate-100">Clique para enviar seus arquivos</p>
                        <p className="text-sm text-black/40 dark:text-slate-500">Suporta múltiplos arquivos PDF, DOCX, Imagens, TXT e MD</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-4">
                    <div className="flex-1 h-px bg-black/5 dark:bg-slate-800"></div>
                    <span className="text-xs font-bold text-black/20 dark:text-slate-600 uppercase tracking-widest">ou use links</span>
                    <div className="flex-1 h-px bg-black/5 dark:bg-slate-800"></div>
                  </div>

                  <form onSubmit={handleUrlSubmit} className="space-y-4">
                    <div className="relative group">
                      <div className={cn("absolute left-4 top-4 text-black/20 dark:text-slate-600 transition-colors", `group-focus-within:${theme.text}`)}>
                        <LinkIcon size={20} />
                      </div>
                      <textarea
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Cole links da web ou YouTube (um por linha)..."
                        className={cn("w-full bg-white dark:bg-slate-900 border-2 border-black/5 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 min-h-[100px] transition-all outline-none resize-none text-sm dark:text-slate-100 dark:placeholder:text-slate-600", `focus:${theme.border}`, theme.ring)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!urlInput.trim()}
                      className={cn("w-full bg-black text-white py-4 rounded-2xl font-bold disabled:opacity-50 disabled:hover:bg-black transition-all shadow-lg shadow-black/5", theme.darkPrimary, theme.primaryHover, theme.shadowXlDark)}
                    >
                      Gerar Quiz a partir de Links
                    </button>
                  </form>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <AlertCircle size={18} className="shrink-0" />
                        <p className="font-medium">{error}</p>
                      </div>
                      {(error.includes('API') || error.includes('chave')) && (
                        <button 
                          onClick={handleOpenSelectKey}
                          className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors whitespace-nowrap"
                        >
                          Configurar Chave
                        </button>
                      )}
                    </motion.div>
                  )}

                  {!hasApiKey && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl text-amber-700 dark:text-amber-400 text-sm flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-left">
                          <AlertCircle size={18} className="shrink-0" />
                          <p className="font-medium">Uma chave de API é necessária para usar os modelos avançados.</p>
                        </div>
                        <button 
                          onClick={handleOpenSelectKey}
                          className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors whitespace-nowrap"
                        >
                          {window.aistudio ? 'Selecionar Chave' : 'Inserir Chave'}
                        </button>
                      </div>

                      {showApiKeyInput && !window.aistudio && (
                        <div className="flex gap-2 mt-2">
                          <input 
                            type="password"
                            placeholder="Insira sua Gemini API Key..."
                            value={manualApiKey}
                            onChange={(e) => setManualApiKey(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-slate-100"
                          />
                          <button 
                            onClick={handleSaveManualKey}
                            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors"
                          >
                            Salvar
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {state === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 space-y-6"
                >
                  <div className="relative">
                    <Loader2 className={cn("w-16 h-16 animate-spin", theme.text, theme.textDark)} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BrainCircuit className={cn("opacity-50 dark:opacity-30", theme.text, theme.textDark)} size={24} />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-medium dark:text-slate-100">Gerando seu Quiz...</h2>
                    <p className="text-black/40 dark:text-slate-500">Analisando o conteúdo para criar {questionCount} questões estratégicas.</p>
                  </div>
                </motion.div>
              )}

              {state === 'active' && currentQuestion && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                  {/* Question Area */}
                  <div className={cn(
                    "lg:col-span-12 transition-all duration-500",
                    showDeepDive && "lg:col-span-5"
                  )}>
                      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl shadow-black/5 border border-black/5 dark:border-slate-800 relative overflow-hidden flex flex-col">
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-black/5 dark:bg-slate-800 relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            className={cn("h-full relative", theme.bg, theme.bgDark)}
                          >
                            {/* Bubble */}
                            <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 backdrop-blur-sm px-2 py-1 rounded-full border shadow-sm z-30", theme.bgLight, theme.bgLightDark, theme.borderLight, theme.borderLightDark)}>
                              <span className="text-[10px] font-bold text-[#333] dark:text-slate-100 whitespace-nowrap">
                                Questão {currentIndex + 1}
                              </span>
                            </div>
                          </motion.div>
                        </div>

                        <div className="p-6 md:p-10 space-y-6 relative">
                          {isPaused && (
                            <div className="absolute inset-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-6">
                              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
                                <Pause size={40} />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-2xl font-bold dark:text-slate-100">Quiz Pausado</h3>
                                <p className="text-black/60 dark:text-slate-400">O tempo está parado. Clique em retomar para continuar.</p>
                              </div>
                              <button
                                onClick={() => setIsPaused(false)}
                                className={cn("flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-white transition-all transform hover:scale-105", theme.primary, theme.primaryHover, theme.shadow)}
                              >
                                <Play size={24} />
                                Retomar Quiz
                              </button>
                            </div>
                          )}

                          {!isQuestionStarted && !isReviewMode && currentIndex === 0 && (
                            <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center space-y-8">
                              <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn("w-24 h-24 bg-gradient-to-br rounded-[2rem] flex items-center justify-center shadow-2xl rotate-12", theme.gradientFrom, theme.gradientTo, theme.shadowLg)}
                              >
                                <BrainCircuit size={48} className="text-white" />
                              </motion.div>
                              <div className="space-y-3 max-w-sm">
                                <h3 className="text-3xl font-bold tracking-tight dark:text-slate-100">Pronto para o desafio?</h3>
                                <p className="text-black/50 dark:text-slate-400 leading-relaxed">
                                  Analise a questão com calma. O tempo começará a contar assim que você iniciar.
                                </p>
                              </div>
                              <button
                                onClick={() => setIsQuestionStarted(true)}
                                className={cn("group relative flex items-center gap-4 px-12 py-5 rounded-[2rem] font-bold text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl", theme.primary, theme.primaryHover, theme.shadow)}
                              >
                                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                <span className="text-lg">Iniciar Questão</span>
                              </button>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-black/30 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Dificuldade</span>
                                <span className={cn(
                                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider w-fit",
                                  currentQuestion.difficulty === 'easy' ? theme.difficultyEasy :
                                  currentQuestion.difficulty === 'medium' ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" :
                                  "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                                )}>
                                  {currentQuestion.difficulty === 'easy' ? 'Fácil' : 
                                   currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                                </span>
                              </div>
                              <div className="h-8 w-px bg-black/5 dark:bg-slate-800" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-black/30 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Tempo</span>
                                <div className={cn(
                                  "flex items-center gap-1.5 font-mono font-bold transition-all duration-300",
                                  questionTime >= timeAlertThreshold 
                                    ? "text-rose-600 text-xl animate-pulse" 
                                    : cn(theme.text, theme.textDark, "text-lg")
                                )}>
                                  <Clock size={questionTime >= timeAlertThreshold ? 20 : 16} />
                                  {formatTime(questionTime)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-black/30 dark:text-slate-600 uppercase tracking-[0.2em] block mb-1">Questão</span>
                              <span className="text-sm font-mono font-bold text-black/60 dark:text-slate-400">
                                {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <span className={cn("text-xs font-serif italic", theme.textLight, theme.textLightDark)}>
                              {currentQuestion.type === 'cebraspe' ? 'Julgue o item abaixo:' : 'Selecione a alternativa correta:'}
                            </span>
                            <h2 className="text-xl md:text-2xl font-medium leading-tight tracking-tight text-balance dark:text-slate-100">
                              {currentQuestion.question}
                            </h2>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {currentQuestion.type === 'cebraspe' ? (
                              ['Certo', 'Errado'].map((option, idx) => (
                                <motion.button
                                  key={option}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  disabled={currentAnswer !== null || isReviewMode}
                                  onClick={() => handleAnswer(option)}
                                  className={cn(
                                    "group flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden",
                                    currentAnswer === null ? cn("border-black/5 dark:border-slate-800", `hover:${theme.border}`, `dark:hover:${theme.border}`, `hover:${theme.bg}/50`, `dark:hover:${theme.bgDark}`, `hover:${theme.shadowLight}`, `dark:hover:${theme.shadowDark}`) :
                                    option === currentQuestion.correctAnswer ? cn(theme.border, theme.bg, "shadow-inner") :
                                    currentAnswer === option ? "border-rose-500 bg-rose-50 dark:bg-rose-900/10" : "border-black/5 dark:border-slate-800 opacity-50"
                                  )}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                                      currentAnswer === null ? cn("bg-black/5 dark:bg-slate-800 transition-colors", `group-hover:${theme.bgLight}`, `dark:group-hover:${theme.bgLightDark}`, `group-hover:${theme.textLight}`, `dark:group-hover:${theme.textLightDark}`, "dark:text-slate-400") :
                                      option === currentQuestion.correctAnswer ? cn(theme.primary, "text-white") :
                                      currentAnswer === option ? "bg-rose-600 text-white" : "bg-black/5 dark:bg-slate-800 dark:text-slate-600"
                                    )}>
                                      {option === 'Certo' ? 'C' : 'E'}
                                    </div>
                                    <span className="font-medium text-lg dark:text-slate-200">{option}</span>
                                  </div>
                                  {currentAnswer !== null && option === currentQuestion.correctAnswer && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <CheckCircle2 className={theme.text} size={28} />
                                    </motion.div>
                                  )}
                                  {currentAnswer === option && option !== currentQuestion.correctAnswer && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <XCircle className="text-rose-600" size={28} />
                                    </motion.div>
                                  )}
                                </motion.button>
                              ))
                            ) : (
                              currentQuestion.options?.map((option, idx) => (
                                <motion.button
                                  key={option}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  disabled={currentAnswer !== null || isReviewMode}
                                  onClick={() => handleAnswer(option)}
                                  className={cn(
                                    "group flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden",
                                    currentAnswer === null ? cn("border-black/5 dark:border-slate-800", `hover:${theme.border}`, `dark:hover:${theme.border}`, `hover:${theme.bg}/50`, `dark:hover:${theme.bgDark}`, `hover:${theme.shadowLight}`, `dark:hover:${theme.shadowDark}`) :
                                    option === currentQuestion.correctAnswer ? cn(theme.border, theme.bg, "shadow-inner") :
                                    currentAnswer === option ? "border-rose-500 bg-rose-50 dark:bg-rose-900/10" : "border-black/5 dark:border-slate-800 opacity-50"
                                  )}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors",
                                      currentAnswer === null ? cn("bg-black/5 dark:bg-slate-800 transition-colors", `group-hover:${theme.bgLight}`, `dark:group-hover:${theme.bgLightDark}`, `group-hover:${theme.textLight}`, `dark:group-hover:${theme.textLightDark}`, "dark:text-slate-400") :
                                      option === currentQuestion.correctAnswer ? cn(theme.primary, "text-white") :
                                      currentAnswer === option ? "bg-rose-600 text-white" : "bg-black/5 dark:bg-slate-800 dark:text-slate-600"
                                    )}>
                                      {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="font-medium text-base leading-snug dark:text-slate-200">{option}</span>
                                  </div>
                                  {currentAnswer !== null && option === currentQuestion.correctAnswer && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <CheckCircle2 className={theme.text} size={28} />
                                    </motion.div>
                                  )}
                                  {currentAnswer === option && option !== currentQuestion.correctAnswer && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <XCircle className="text-rose-600" size={28} />
                                    </motion.div>
                                  )}
                                </motion.button>
                              ))
                            )}
                          </div>

                          {(currentAnswer !== null || isReviewMode) && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="pt-8 border-t border-black/5 dark:border-slate-800 space-y-8"
                            >
                              <div className={cn(
                                "p-6 rounded-3xl flex items-start gap-5",
                                isCorrect ? cn(theme.bgLight, theme.bgLightDark, theme.borderLight, theme.borderLightDark, "p-6 rounded-3xl flex items-start gap-5") : "bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20"
                              )}>
                                <div className={cn(
                                  "w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm",
                                  isCorrect ? cn(theme.primary, "text-white") : "bg-rose-600 text-white"
                                )}>
                                  {isCorrect ? <Trophy size={28} /> : <AlertCircle size={28} />}
                                </div>
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className={cn(
                                      "text-xl font-bold",
                                      isCorrect ? theme.textLight : "text-rose-800 dark:text-rose-400"
                                    )}>
                                      {isCorrect ? 'Resposta Correta!' : 'Quase lá...'}
                                    </h4>
                                    <button
                                      onClick={() => handlePlayAudio(currentQuestion.explanation)}
                                      disabled={isAudioLoading}
                                      className={cn(
                                        "p-2 rounded-lg transition-all",
                                        isAudioPlaying ? cn(theme.bgLight, theme.bgLightDark, theme.text, theme.textDark, "animate-pulse") : "hover:bg-black/5 dark:hover:bg-slate-800 text-black/40 dark:text-slate-500",
                                        isAudioLoading && "opacity-50 cursor-wait"
                                      )}
                                      title="Ouvir Explicação"
                                    >
                                      {isAudioLoading ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20} />}
                                    </button>
                                  </div>
                                  <p className="text-black/70 dark:text-slate-400 leading-relaxed">
                                    {currentQuestion.explanation}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  {isReviewMode && currentIndex > 0 && (
                                    <button
                                      onClick={() => setCurrentIndex(prev => prev - 1)}
                                      className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold border-2 border-black/5 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-slate-800 transition-all active:scale-95 dark:text-slate-100"
                                    >
                                      <ChevronLeft size={20} />
                                      Anterior
                                    </button>
                                  )}
                                  {isReviewMode && (
                                    <button
                                      onClick={redoQuiz}
                                      className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-100 dark:shadow-amber-900/20"
                                    >
                                      <RotateCcw size={20} />
                                      Refazer
                                    </button>
                                  )}
                                  {!showDeepDive && (
                                    <button
                                      onClick={handleToggleDeepDive}
                                      className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold bg-black dark:bg-slate-800 text-white hover:bg-black/80 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-black/10 dark:shadow-black/20"
                                    >
                                      <BrainCircuit size={20} />
                                      Explicar Matéria
                                    </button>
                                  )}
                                </div>
                                <button
                                  onClick={nextQuestion}
                                  className={cn(
                                    "w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-bold text-white transition-all active:scale-95",
                                    theme.primary,
                                    theme.primaryHover,
                                    theme.shadowXl,
                                    theme.shadowXlDark
                                  )}
                                >
                                  <span>{currentIndex === questions.length - 1 ? (isReviewMode ? 'Voltar ao Início' : 'Finalizar') : 'Próxima Questão'}</span>
                                  <ArrowRight size={20} />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                  </div>

                  {/* Deep Dive Panel */}
                  <AnimatePresence>
                    {showDeepDive && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="lg:col-span-7"
                      >
                        <div className="dark bg-slate-900 text-white rounded-[32px] shadow-2xl border border-white/10 sticky top-24 overflow-hidden flex flex-col min-h-[70vh]">
                          <div className={cn("p-6 border-b border-white/5", theme.deepDiveBg)}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", theme.deepDiveIcon)}>
                                  <BookOpen className="text-white" size={20} />
                                </div>
                                <h3 className="font-bold text-xl tracking-tight">Aprofundamento</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                 {currentQuestion.deepDive && (
                                   <button
                                     onClick={() => handlePlayAudio(currentQuestion.deepDive!)}
                                     disabled={isAudioLoading}
                                     className={cn(
                                       "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                       isAudioPlaying ? cn(theme.deepDiveAudio, "text-white animate-pulse") : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
                                       isAudioLoading && "opacity-50 cursor-wait"
                                     )}
                                     title="Ouvir Explicação"
                                   >
                                     {isAudioLoading ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20} />}
                                   </button>
                                 )}
                                <button 
                                  onClick={() => setShowDeepDive(false)}
                                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                >
                                  <XCircle size={20} />
                                </button>
                              </div>
                            </div>
                            <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Contexto e Detalhes Técnicos</p>
                          </div>
                          
                          <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar flex-1 flex flex-col">
                            {isDeepDiveLoading ? (
                              <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
                                <Loader2 className={cn("w-10 h-10 animate-spin", theme.text, theme.textDark)} />
                                <p className="text-white/40 text-sm font-medium animate-pulse">Gerando explicação detalhada...</p>
                              </div>
                            ) : currentQuestion.deepDive ? (
                              <>
                                <div className={cn("prose prose-invert max-w-none", theme.prose)}>
                                  <div className="text-white/90 leading-relaxed text-lg font-normal">
                                    <Markdown remarkPlugins={[remarkGfm]}>{currentQuestion.deepDive}</Markdown>
                                  </div>
                                </div>

                                {chatHistory.length > 0 && (
                                  <div className="space-y-6 pt-8 border-t border-white/5">
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4">Conversa com o Professor</p>
                                    {chatHistory.map((msg, idx) => (
                                      <div key={idx} className={cn(
                                        "flex gap-4",
                                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                      )}>
                                        <div className={cn(
                                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                          msg.role === 'user' ? theme.chatUser : "bg-white/10"
                                        )}>
                                          {msg.role === 'user' ? <User size={16} /> : <BrainCircuit size={16} />}
                                        </div>
                                        <div className={cn(
                                          "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed prose prose-invert prose-sm",
                                          msg.role === 'user' ? cn(theme.chatUserBubble, theme.prose, "rounded-tr-none") : "bg-white/5 text-white/80 rounded-tl-none"
                                        )}>
                                          <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
                                        </div>
                                      </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                  </div>
                                )}

                                <div className="pt-8 border-t border-white/5">
                                  <div className="flex items-center gap-2 mb-4">
                                    <BrainCircuit size={16} className={theme.deepDiveTipIcon} />
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Dica de Estudo</p>
                                  </div>
                                  <div className={cn("border rounded-2xl p-6 text-sm italic leading-relaxed", theme.deepDiveTip)}>
                                    "O erro é a melhor oportunidade para o cérebro consolidar novas conexões. Revise este trecho com atenção para fixar o conceito."
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
                                <AlertCircle className="text-white/20" size={48} />
                                <p className="text-white/40 text-sm">Clique em "Ver Explicação" para carregar os detalhes.</p>
                              </div>
                            )}
                          </div>

                          {currentQuestion.deepDive && (
                            <div className="p-4 bg-white/5 border-t border-white/5">
                              <form onSubmit={handleSendMessage} className="relative">
                                <input
                                  type="text"
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  placeholder="Ficou com dúvida? Pergunte ao Professor..."
                                  disabled={isChatLoading}
                                  className={cn("w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all", `focus:${theme.border}/50`)}
                                />
                                <button
                                  type="submit"
                                  disabled={!chatInput.trim() || isChatLoading}
                                  className={cn("absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all", theme.primary, theme.primaryHover)}
                                >
                                  {isChatLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {state === 'finished' && (
                <motion.div
                  key="finished"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="bg-white dark:bg-slate-900 rounded-[40px] p-12 shadow-sm border border-black/5 dark:border-slate-800 text-center space-y-12">
                    <div className="space-y-4">
                      <div className={cn("w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6", theme.bgLight, theme.bgLightDark, theme.text, theme.textDark)}>
                        <Trophy size={48} />
                      </div>
                      <h2 className="text-4xl font-medium tracking-tight dark:text-slate-100">Quiz Concluído!</h2>
                      <p className="text-black/40 dark:text-slate-500">Veja como você se saiu no conteúdo analisado.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-[#F5F5F0] dark:bg-slate-800 rounded-3xl p-8">
                        <p className="text-sm font-bold uppercase tracking-widest text-black/30 dark:text-slate-500 mb-2">Acertos</p>
                        <p className={cn("text-5xl font-medium", theme.text, theme.textDark)}>{correctCount}</p>
                      </div>
                      <div className="bg-[#F5F5F0] dark:bg-slate-800 rounded-3xl p-8">
                        <p className="text-sm font-bold uppercase tracking-widest text-black/30 dark:text-slate-500 mb-2">Erros</p>
                        <p className="text-5xl font-medium text-rose-600 dark:text-rose-400">{questions.length - correctCount}</p>
                      </div>
                      <div className="bg-[#F5F5F0] dark:bg-slate-800 rounded-3xl p-8">
                        <p className="text-sm font-bold uppercase tracking-widest text-black/30 dark:text-slate-500 mb-2">Precisão</p>
                        <p className="text-5xl font-medium text-black dark:text-slate-100">
                          {Math.round((correctCount / questions.length) * 100)}%
                        </p>
                      </div>
                      <div className="bg-[#F5F5F0] dark:bg-slate-800 rounded-3xl p-8">
                        <p className="text-sm font-bold uppercase tracking-widest text-black/30 dark:text-slate-500 mb-2">Tempo Total</p>
                        <p className="text-5xl font-medium text-black dark:text-slate-100">{formatTime(totalTime)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                      <button
                        onClick={redoQuiz}
                        className={cn("flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white transition-all shadow-lg", theme.primary, theme.primaryHover, theme.shadow)}
                      >
                        <RotateCcw size={20} />
                        Refazer
                      </button>
                      <button
                        onClick={reviewQuiz}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-black dark:bg-slate-800 text-white hover:bg-black/80 dark:hover:bg-slate-700 transition-all"
                      >
                        <BookOpen size={20} />
                        Rever
                      </button>
                      <button
                        onClick={generateAnother}
                        className={cn("flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold border-2 transition-all", theme.border, theme.text, theme.textDark, `hover:${theme.bg}`, `dark:hover:${theme.bgDark}`)}
                      >
                        <BrainCircuit size={20} />
                        Novo do Mesmo Material
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold border-2 border-black/5 dark:border-slate-800 text-black dark:text-slate-100 hover:bg-black/5 dark:hover:bg-slate-800 transition-all"
                      >
                        <FileText size={20} />
                        Salvar Resultados
                      </button>
                      <button
                        onClick={resetQuiz}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-black/40 dark:text-slate-500 hover:text-black dark:hover:text-slate-300 transition-all"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
