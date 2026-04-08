/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, loginWithGoogle, logout, onAuthStateChanged, collection, query, where, orderBy, onSnapshot, setDoc, doc, Timestamp, handleFirestoreError, OperationType, getDoc, getDocs, deleteDoc, writeBatch, updateDoc } from './firebase';
import { User } from 'firebase/auth';
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  X,
  Sparkles,
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
  Timer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileQuestion,
  Flame,
  Pause,
  Play,
  Volume2,
  PlusCircle,
  Plus,
  Link as LinkIcon,
  Sun,
  Moon,
  Send,
  User as UserIcon,
  Palette,
  LogOut,
  LogIn,
  ExternalLink,
  ArrowUpRight,
  LayoutDashboard,
  BarChart2,
  TrendingUp,
  Target,
  Zap,
  Award,
  Calendar,
  Search,
  Maximize2,
  Minimize2,
  Folder,
  FolderOpen,
  Hash,
  Check,
  CheckSquare,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth';
import { 
  format, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  isToday 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { generateQuiz, QuizQuestion, QuizFormat, generateDeepDive, generateSpeech, ContentItem, chatWithProfessor } from './services/geminiService';
import { cn } from './lib/utils';
import Logo from './components/Logo';

const normalizeSubject = (s: string) => {
  if (!s) return 'Geral';
  const clean = s.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  return clean.trim().replace(/\s+/g, ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type QuizState = 'idle' | 'loading' | 'active' | 'finished';
type ThemeColor = 'emerald' | 'navy' | 'brown' | 'slate' | 'yellow' | 'amber' | 'moss' | 'rose' | 'violet' | 'cyan' | 'orange' | 'fuchsia' | 'indigo' | 'black' | 'custom';

const THEME_CONFIG = {
  emerald: {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    secondary: 'bg-emerald-500',
    secondaryHover: 'hover:bg-emerald-500',
    text: 'text-emerald-600',
    textDark: 'dark:text-white',
    textLight: 'text-emerald-700',
    textLightDark: 'dark:text-slate-200',
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
    deepDiveTip: 'bg-emerald-50 border-emerald-100 text-emerald-900/80 dark:bg-emerald-400/5 dark:border-emerald-400/10 dark:text-emerald-100/80',
    deepDiveTipIcon: 'text-emerald-600 dark:text-emerald-400',
    chatUser: 'bg-emerald-600',
    chatUserBubble: 'bg-emerald-600/10 text-emerald-900 dark:bg-emerald-600/20 dark:text-emerald-50',
    resultCircle: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50',
    bgLightDark: 'dark:bg-emerald-900/20',
    borderLight: 'border-emerald-600',
    borderLightDark: 'dark:border-emerald-500',
    shadowLight: 'shadow-emerald-500/20',
    shadowDark: 'dark:shadow-emerald-900/20',
    darkPrimary: 'bg-emerald-600',
    contrastText: 'text-white'
  },
  navy: {
    primary: 'bg-blue-900',
    primaryHover: 'hover:bg-blue-950',
    secondary: 'bg-blue-800',
    secondaryHover: 'hover:bg-blue-800',
    text: 'text-blue-900',
    textDark: 'dark:text-white',
    textLight: 'text-blue-950',
    textLightDark: 'dark:text-slate-200',
    border: 'border-blue-900',
    borderDark: 'dark:border-blue-400',
    bg: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/20',
    accent: 'accent-blue-900',
    accentDark: 'dark:accent-blue-400',
    ring: 'focus:ring-blue-800/10',
    focusBorder: 'focus:border-blue-800',
    gradientFrom: 'from-blue-800',
    gradientTo: 'to-blue-950',
    shadow: 'shadow-blue-900/20',
    shadowLg: 'shadow-blue-900/30',
    shadowXl: 'shadow-blue-200',
    shadowXlDark: 'dark:shadow-blue-950/20',
    prose: 'prose-blue',
    selection: 'selection:bg-blue-100 dark:selection:bg-blue-950/30',
    icon: 'text-blue-900 dark:text-blue-400',
    difficultyEasy: 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300',
    deepDiveBg: 'bg-blue-900/10',
    deepDiveIcon: 'bg-blue-900',
    deepDiveAudio: 'bg-blue-800',
    deepDiveLoader: 'text-blue-400',
    deepDiveTip: 'bg-blue-50 border-blue-100 text-blue-900/80 dark:bg-blue-400/5 dark:border-blue-400/10 dark:text-blue-100/80',
    deepDiveTipIcon: 'text-blue-900 dark:text-blue-400',
    chatUser: 'bg-blue-900',
    chatUserBubble: 'bg-blue-900/10 text-blue-900 dark:bg-blue-900/20 dark:text-blue-50',
    resultCircle: 'bg-blue-100 dark:bg-blue-950/20 text-blue-900 dark:text-blue-400',
    bgLight: 'bg-blue-50',
    bgLightDark: 'dark:bg-blue-950/20',
    borderLight: 'border-blue-900',
    borderLightDark: 'dark:border-blue-400',
    shadowLight: 'shadow-blue-900/20',
    shadowDark: 'dark:shadow-blue-950/20',
    darkPrimary: 'bg-blue-900',
    contrastText: 'text-white'
  },
  brown: {
    primary: 'bg-amber-900',
    primaryHover: 'hover:bg-amber-950',
    secondary: 'bg-amber-800',
    secondaryHover: 'hover:bg-amber-800',
    text: 'text-amber-900',
    textDark: 'dark:text-white',
    textLight: 'text-amber-950',
    textLightDark: 'dark:text-slate-200',
    border: 'border-amber-900',
    borderDark: 'dark:border-amber-400',
    bg: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/20',
    accent: 'accent-amber-900',
    accentDark: 'dark:accent-amber-400',
    ring: 'focus:ring-amber-800/10',
    focusBorder: 'focus:border-amber-800',
    gradientFrom: 'from-amber-800',
    gradientTo: 'to-amber-950',
    shadow: 'shadow-amber-900/20',
    shadowLg: 'shadow-amber-900/30',
    shadowXl: 'shadow-amber-200',
    shadowXlDark: 'dark:shadow-amber-950/20',
    prose: 'prose-amber',
    selection: 'selection:bg-amber-100 dark:selection:bg-amber-950/30',
    icon: 'text-amber-900 dark:text-amber-400',
    difficultyEasy: 'bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
    deepDiveBg: 'bg-amber-900/10',
    deepDiveIcon: 'bg-amber-900',
    deepDiveAudio: 'bg-amber-800',
    deepDiveLoader: 'text-amber-400',
    deepDiveTip: 'bg-amber-50 border-amber-100 text-amber-900/80 dark:bg-amber-400/5 dark:border-amber-400/10 dark:text-amber-100/80',
    deepDiveTipIcon: 'text-amber-900 dark:text-amber-400',
    chatUser: 'bg-amber-900',
    chatUserBubble: 'bg-amber-900/10 text-amber-900 dark:bg-amber-900/20 dark:text-amber-50',
    resultCircle: 'bg-amber-100 dark:bg-amber-900/20 text-amber-900 dark:text-amber-400',
    bgLight: 'bg-amber-50',
    bgLightDark: 'dark:bg-amber-950/20',
    borderLight: 'border-amber-900',
    borderLightDark: 'dark:border-amber-400',
    shadowLight: 'shadow-amber-900/20',
    shadowDark: 'dark:shadow-amber-950/20',
    darkPrimary: 'bg-amber-900',
    contrastText: 'text-white'
  },
  slate: {
    primary: 'bg-slate-600',
    primaryHover: 'hover:bg-slate-700',
    secondary: 'bg-slate-500',
    secondaryHover: 'hover:bg-slate-500',
    text: 'text-slate-600',
    textDark: 'dark:text-white',
    textLight: 'text-slate-700',
    textLightDark: 'dark:text-slate-200',
    border: 'border-slate-600',
    borderDark: 'dark:border-slate-500',
    bg: 'bg-slate-50',
    bgDark: 'dark:bg-slate-900/20',
    accent: 'accent-slate-600',
    accentDark: 'dark:accent-slate-500',
    ring: 'focus:ring-slate-500/10',
    focusBorder: 'focus:border-slate-500',
    gradientFrom: 'from-slate-500',
    gradientTo: 'to-slate-700',
    shadow: 'shadow-slate-500/20',
    shadowLg: 'shadow-slate-500/30',
    shadowXl: 'shadow-slate-200',
    shadowXlDark: 'dark:shadow-slate-900/20',
    prose: 'prose-slate',
    selection: 'selection:bg-slate-100 dark:selection:bg-slate-900/30',
    icon: 'text-slate-600 dark:text-slate-500',
    difficultyEasy: 'bg-slate-100 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400',
    deepDiveBg: 'bg-slate-600/10',
    deepDiveIcon: 'bg-slate-600',
    deepDiveAudio: 'bg-slate-500',
    deepDiveLoader: 'text-slate-400',
    deepDiveTip: 'bg-slate-50 border-slate-100 text-slate-900/80 dark:bg-slate-400/5 dark:border-slate-400/10 dark:text-slate-100/80',
    deepDiveTipIcon: 'text-slate-600 dark:text-slate-400',
    chatUser: 'bg-slate-600',
    chatUserBubble: 'bg-slate-600/10 text-slate-900 dark:bg-slate-600/20 dark:text-slate-50',
    resultCircle: 'bg-slate-100 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400',
    bgLight: 'bg-slate-50',
    bgLightDark: 'dark:bg-slate-900/20',
    borderLight: 'border-slate-600',
    borderLightDark: 'dark:border-slate-500',
    shadowLight: 'shadow-slate-500/20',
    shadowDark: 'dark:shadow-slate-900/20',
    darkPrimary: 'bg-slate-600',
    contrastText: 'text-white'
  },
  yellow: {
    primary: 'bg-yellow-500',
    primaryHover: 'hover:bg-yellow-600',
    secondary: 'bg-yellow-400',
    secondaryHover: 'hover:bg-yellow-400',
    text: 'text-yellow-600',
    textDark: 'dark:text-white',
    textLight: 'text-yellow-700',
    textLightDark: 'dark:text-slate-200',
    border: 'border-yellow-500',
    borderDark: 'dark:border-yellow-400',
    bg: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-900/20',
    accent: 'accent-yellow-500',
    accentDark: 'dark:accent-yellow-400',
    ring: 'focus:ring-yellow-400/10',
    focusBorder: 'focus:border-yellow-400',
    gradientFrom: 'from-yellow-400',
    gradientTo: 'to-yellow-600',
    shadow: 'shadow-yellow-500/20',
    shadowLg: 'shadow-yellow-500/30',
    shadowXl: 'shadow-yellow-200',
    shadowXlDark: 'dark:shadow-yellow-900/20',
    prose: 'prose-yellow',
    selection: 'selection:bg-yellow-100 dark:selection:bg-yellow-900/30',
    icon: 'text-yellow-600 dark:text-yellow-500',
    difficultyEasy: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    deepDiveBg: 'bg-yellow-500/10',
    deepDiveIcon: 'bg-yellow-500',
    deepDiveAudio: 'bg-yellow-400',
    deepDiveLoader: 'text-yellow-400',
    deepDiveTip: 'bg-yellow-50 border-yellow-100 text-yellow-900/80 dark:bg-yellow-400/5 dark:border-yellow-400/10 dark:text-yellow-100/80',
    deepDiveTipIcon: 'text-yellow-600 dark:text-yellow-400',
    chatUser: 'bg-yellow-500',
    chatUserBubble: 'bg-yellow-500/10 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-50',
    resultCircle: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    bgLight: 'bg-yellow-50',
    bgLightDark: 'dark:bg-yellow-900/20',
    borderLight: 'border-yellow-500',
    borderLightDark: 'dark:border-yellow-400',
    shadowLight: 'shadow-yellow-500/20',
    shadowDark: 'dark:shadow-yellow-900/20',
    darkPrimary: 'bg-yellow-500',
    contrastText: 'text-black'
  },
  amber: {
    primary: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    secondary: 'bg-amber-500',
    secondaryHover: 'hover:bg-amber-500',
    text: 'text-amber-600',
    textDark: 'dark:text-white',
    textLight: 'text-amber-700',
    textLightDark: 'dark:text-slate-200',
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
    deepDiveTip: 'bg-amber-50 border-amber-100 text-amber-900/80 dark:bg-amber-400/5 dark:border-amber-400/10 dark:text-amber-100/80',
    deepDiveTipIcon: 'text-amber-600 dark:text-amber-400',
    chatUser: 'bg-amber-600',
    chatUserBubble: 'bg-amber-600/10 text-amber-900 dark:bg-amber-600/20 dark:text-amber-50',
    resultCircle: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50',
    bgLightDark: 'dark:bg-amber-900/20',
    borderLight: 'border-amber-600',
    borderLightDark: 'dark:border-amber-500',
    shadowLight: 'shadow-amber-500/20',
    shadowDark: 'dark:shadow-amber-900/20',
    darkPrimary: 'bg-amber-600',
    contrastText: 'text-white'
  },
  moss: {
    primary: 'bg-lime-800',
    primaryHover: 'hover:bg-lime-900',
    secondary: 'bg-lime-700',
    secondaryHover: 'hover:bg-lime-700',
    text: 'text-lime-800',
    textDark: 'dark:text-lime-400',
    textLight: 'text-lime-900',
    textLightDark: 'dark:text-lime-300',
    border: 'border-lime-800',
    borderDark: 'dark:border-lime-400',
    bg: 'bg-lime-50',
    bgDark: 'dark:bg-lime-950/20',
    accent: 'accent-lime-800',
    accentDark: 'dark:accent-lime-400',
    ring: 'focus:ring-lime-700/10',
    focusBorder: 'focus:border-lime-700',
    gradientFrom: 'from-lime-700',
    gradientTo: 'to-lime-900',
    shadow: 'shadow-lime-800/20',
    shadowLg: 'shadow-lime-800/30',
    shadowXl: 'shadow-lime-200',
    shadowXlDark: 'dark:shadow-lime-950/20',
    prose: 'prose-lime',
    selection: 'selection:bg-lime-100 dark:selection:bg-lime-950/30',
    icon: 'text-lime-800 dark:text-lime-400',
    difficultyEasy: 'bg-lime-100 dark:bg-lime-950/20 text-lime-700 dark:text-lime-300',
    deepDiveBg: 'bg-lime-800/10',
    deepDiveIcon: 'bg-lime-800',
    deepDiveAudio: 'bg-lime-700',
    deepDiveLoader: 'text-lime-400',
    deepDiveTip: 'bg-lime-50 border-lime-100 text-lime-900/80 dark:bg-lime-400/5 dark:border-lime-400/10 dark:text-lime-100/80',
    deepDiveTipIcon: 'text-lime-800 dark:text-lime-400',
    chatUser: 'bg-lime-800',
    chatUserBubble: 'bg-lime-800/10 text-lime-900 dark:bg-lime-800/20 dark:text-lime-50',
    resultCircle: 'bg-lime-100 dark:bg-lime-950/20 text-lime-800 dark:text-lime-400',
    bgLight: 'bg-lime-50',
    bgLightDark: 'dark:bg-lime-950/20',
    borderLight: 'border-lime-800',
    borderLightDark: 'dark:border-lime-400',
    shadowLight: 'shadow-lime-800/20',
    shadowDark: 'dark:shadow-lime-950/20',
    darkPrimary: 'bg-lime-800',
    contrastText: 'text-white'
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
    deepDiveTip: 'bg-rose-50 border-rose-100 text-rose-900/80 dark:bg-rose-400/5 dark:border-rose-400/10 dark:text-rose-100/80',
    deepDiveTipIcon: 'text-rose-600 dark:text-rose-400',
    chatUser: 'bg-rose-600',
    chatUserBubble: 'bg-rose-600/10 text-rose-900 dark:bg-rose-600/20 dark:text-rose-50',
    resultCircle: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-50',
    bgLightDark: 'dark:bg-rose-900/20',
    borderLight: 'border-rose-600',
    borderLightDark: 'dark:border-rose-500',
    shadowLight: 'shadow-rose-500/20',
    shadowDark: 'dark:shadow-rose-900/20',
    darkPrimary: 'bg-rose-600',
    contrastText: 'text-white'
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
    deepDiveTip: 'bg-violet-50 border-violet-100 text-violet-900/80 dark:bg-violet-400/5 dark:border-violet-400/10 dark:text-violet-100/80',
    deepDiveTipIcon: 'text-violet-600 dark:text-violet-400',
    chatUser: 'bg-violet-600',
    chatUserBubble: 'bg-violet-600/10 text-violet-900 dark:bg-violet-600/20 dark:text-violet-50',
    resultCircle: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    bgLight: 'bg-violet-50',
    bgLightDark: 'dark:bg-violet-900/20',
    borderLight: 'border-violet-600',
    borderLightDark: 'dark:border-violet-500',
    shadowLight: 'shadow-violet-500/20',
    shadowDark: 'dark:shadow-violet-900/20',
    darkPrimary: 'bg-violet-600',
    contrastText: 'text-white'
  },
  cyan: {
    primary: 'bg-cyan-600',
    primaryHover: 'hover:bg-cyan-700',
    secondary: 'bg-cyan-500',
    secondaryHover: 'hover:bg-cyan-500',
    text: 'text-cyan-600',
    textDark: 'dark:text-cyan-500',
    textLight: 'text-cyan-700',
    textLightDark: 'dark:text-cyan-400',
    border: 'border-cyan-600',
    borderDark: 'dark:border-cyan-500',
    bg: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-900/20',
    accent: 'accent-cyan-600',
    accentDark: 'dark:accent-cyan-500',
    ring: 'focus:ring-cyan-500/10',
    focusBorder: 'focus:border-cyan-500',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-cyan-700',
    shadow: 'shadow-cyan-500/20',
    shadowLg: 'shadow-cyan-500/30',
    shadowXl: 'shadow-cyan-200',
    shadowXlDark: 'dark:shadow-cyan-900/20',
    prose: 'prose-cyan',
    selection: 'selection:bg-cyan-100 dark:selection:bg-cyan-900/30',
    icon: 'text-cyan-600 dark:text-cyan-500',
    difficultyEasy: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400',
    deepDiveBg: 'bg-cyan-600/10',
    deepDiveIcon: 'bg-cyan-600',
    deepDiveAudio: 'bg-cyan-500',
    deepDiveLoader: 'text-cyan-400',
    deepDiveTip: 'bg-cyan-50 border-cyan-100 text-cyan-900/80 dark:bg-cyan-400/5 dark:border-cyan-400/10 dark:text-cyan-100/80',
    deepDiveTipIcon: 'text-cyan-600 dark:text-cyan-400',
    chatUser: 'bg-cyan-600',
    chatUserBubble: 'bg-cyan-600/10 text-cyan-900 dark:bg-cyan-600/20 dark:text-cyan-50',
    resultCircle: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    bgLight: 'bg-cyan-50',
    bgLightDark: 'dark:bg-cyan-900/20',
    borderLight: 'border-cyan-600',
    borderLightDark: 'dark:border-cyan-500',
    shadowLight: 'shadow-cyan-500/20',
    shadowDark: 'dark:shadow-cyan-900/20',
    darkPrimary: 'bg-cyan-600',
    contrastText: 'text-white'
  },
  orange: {
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    secondary: 'bg-orange-500',
    secondaryHover: 'hover:bg-orange-500',
    text: 'text-orange-600',
    textDark: 'dark:text-orange-500',
    textLight: 'text-orange-700',
    textLightDark: 'dark:text-orange-400',
    border: 'border-orange-600',
    borderDark: 'dark:border-orange-500',
    bg: 'bg-orange-50',
    bgDark: 'dark:bg-orange-900/20',
    accent: 'accent-orange-600',
    accentDark: 'dark:accent-orange-500',
    ring: 'focus:ring-orange-500/10',
    focusBorder: 'focus:border-orange-500',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-orange-700',
    shadow: 'shadow-orange-500/20',
    shadowLg: 'shadow-orange-500/30',
    shadowXl: 'shadow-orange-200',
    shadowXlDark: 'dark:shadow-orange-900/20',
    prose: 'prose-orange',
    selection: 'selection:bg-orange-100 dark:selection:bg-orange-900/30',
    icon: 'text-orange-600 dark:text-orange-500',
    difficultyEasy: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
    deepDiveBg: 'bg-orange-600/10',
    deepDiveIcon: 'bg-orange-600',
    deepDiveAudio: 'bg-orange-500',
    deepDiveLoader: 'text-orange-400',
    deepDiveTip: 'bg-orange-50 border-orange-100 text-orange-900/80 dark:bg-orange-400/5 dark:border-orange-400/10 dark:text-orange-100/80',
    deepDiveTipIcon: 'text-orange-600 dark:text-orange-400',
    chatUser: 'bg-orange-600',
    chatUserBubble: 'bg-orange-600/10 text-orange-900 dark:bg-orange-600/20 dark:text-orange-50',
    resultCircle: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    bgLight: 'bg-orange-50',
    bgLightDark: 'dark:bg-orange-900/20',
    borderLight: 'border-orange-600',
    borderLightDark: 'dark:border-orange-500',
    shadowLight: 'shadow-orange-500/20',
    shadowDark: 'dark:shadow-orange-900/20',
    darkPrimary: 'bg-orange-600',
    contrastText: 'text-white'
  },
  fuchsia: {
    primary: 'bg-fuchsia-600',
    primaryHover: 'hover:bg-fuchsia-700',
    secondary: 'bg-fuchsia-500',
    secondaryHover: 'hover:bg-fuchsia-500',
    text: 'text-fuchsia-600',
    textDark: 'dark:text-fuchsia-500',
    textLight: 'text-fuchsia-700',
    textLightDark: 'dark:text-fuchsia-400',
    border: 'border-fuchsia-600',
    borderDark: 'dark:border-fuchsia-500',
    bg: 'bg-fuchsia-50',
    bgDark: 'dark:bg-fuchsia-900/20',
    accent: 'accent-fuchsia-600',
    accentDark: 'dark:accent-fuchsia-500',
    ring: 'focus:ring-fuchsia-500/10',
    focusBorder: 'focus:border-fuchsia-500',
    gradientFrom: 'from-fuchsia-500',
    gradientTo: 'to-fuchsia-700',
    shadow: 'shadow-fuchsia-500/20',
    shadowLg: 'shadow-fuchsia-500/30',
    shadowXl: 'shadow-fuchsia-200',
    shadowXlDark: 'dark:shadow-fuchsia-900/20',
    prose: 'prose-fuchsia',
    selection: 'selection:bg-fuchsia-100 dark:selection:bg-fuchsia-900/30',
    icon: 'text-fuchsia-600 dark:text-fuchsia-500',
    difficultyEasy: 'bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400',
    deepDiveBg: 'bg-fuchsia-600/10',
    deepDiveIcon: 'bg-fuchsia-600',
    deepDiveAudio: 'bg-fuchsia-500',
    deepDiveLoader: 'text-fuchsia-400',
    deepDiveTip: 'bg-fuchsia-50 border-fuchsia-100 text-fuchsia-900/80 dark:bg-fuchsia-400/5 dark:border-fuchsia-400/10 dark:text-fuchsia-100/80',
    deepDiveTipIcon: 'text-fuchsia-600 dark:text-fuchsia-400',
    chatUser: 'bg-fuchsia-600',
    chatUserBubble: 'bg-fuchsia-600/10 text-fuchsia-900 dark:bg-fuchsia-600/20 dark:text-fuchsia-50',
    resultCircle: 'bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400',
    bgLight: 'bg-fuchsia-50',
    bgLightDark: 'dark:bg-fuchsia-900/20',
    borderLight: 'border-fuchsia-600',
    borderLightDark: 'dark:border-fuchsia-500',
    shadowLight: 'shadow-fuchsia-500/20',
    shadowDark: 'dark:shadow-fuchsia-900/20',
    darkPrimary: 'bg-fuchsia-600',
    contrastText: 'text-white'
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
    deepDiveTip: 'bg-indigo-50 border-indigo-100 text-indigo-900/80 dark:bg-indigo-400/5 dark:border-indigo-400/10 dark:text-indigo-100/80',
    deepDiveTipIcon: 'text-indigo-600 dark:text-indigo-400',
    chatUser: 'bg-indigo-600',
    chatUserBubble: 'bg-indigo-600/10 text-indigo-900 dark:bg-indigo-600/20 dark:text-indigo-50',
    resultCircle: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-50',
    bgLightDark: 'dark:bg-indigo-900/20',
    borderLight: 'border-indigo-600',
    borderLightDark: 'dark:border-indigo-500',
    shadowLight: 'shadow-indigo-500/20',
    shadowDark: 'dark:shadow-indigo-900/20',
    darkPrimary: 'bg-indigo-600',
    contrastText: 'text-white'
  },
  black: {
    primary: 'bg-slate-900',
    primaryHover: 'hover:bg-black',
    secondary: 'bg-slate-800',
    secondaryHover: 'hover:bg-slate-800',
    text: 'text-slate-900',
    textDark: 'dark:text-white',
    textLight: 'text-slate-700',
    textLightDark: 'dark:text-slate-300',
    border: 'border-slate-900',
    borderDark: 'dark:border-white',
    bg: 'bg-slate-50',
    bgDark: 'dark:bg-slate-900/20',
    accent: 'accent-slate-900',
    accentDark: 'dark:accent-white',
    ring: 'focus:ring-slate-800/10',
    focusBorder: 'focus:border-slate-800',
    gradientFrom: 'from-slate-800',
    gradientTo: 'to-black',
    shadow: 'shadow-slate-900/20',
    shadowLg: 'shadow-slate-900/30',
    shadowXl: 'shadow-slate-200',
    shadowXlDark: 'dark:shadow-slate-900/20',
    prose: 'prose-slate',
    selection: 'selection:bg-slate-200 dark:selection:bg-slate-800',
    icon: 'text-slate-900 dark:text-white',
    difficultyEasy: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
    deepDiveBg: 'bg-slate-900/10',
    deepDiveIcon: 'bg-slate-900',
    deepDiveAudio: 'bg-slate-800',
    deepDiveLoader: 'text-slate-400',
    deepDiveTip: 'bg-slate-50 border-slate-200 text-slate-900/80 dark:bg-slate-400/5 dark:border-slate-400/10 dark:text-slate-100/80',
    deepDiveTipIcon: 'text-slate-900 dark:text-white',
    chatUser: 'bg-slate-900',
    chatUserBubble: 'bg-slate-900/10 text-slate-900 dark:bg-slate-900/20 dark:text-white',
    resultCircle: 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white',
    bgLight: 'bg-slate-50',
    bgLightDark: 'dark:bg-slate-900/20',
    borderLight: 'border-slate-900',
    borderLightDark: 'dark:border-white',
    shadowLight: 'shadow-slate-900/20',
    shadowDark: 'dark:shadow-slate-900/20',
    darkPrimary: 'bg-slate-900',
    contrastText: 'text-white'
  },
  custom: {
    primary: 'bg-[var(--theme-primary)]',
    primaryHover: 'hover:opacity-90',
    secondary: 'bg-[var(--theme-secondary)]',
    secondaryHover: 'hover:opacity-90',
    text: 'text-[var(--theme-primary)]',
    textDark: 'dark:text-[var(--theme-primary)]',
    textLight: 'text-[var(--theme-primary)]',
    textLightDark: 'dark:text-[var(--theme-primary)]',
    border: 'border-[var(--theme-primary)]',
    borderDark: 'dark:border-[var(--theme-primary)]',
    bg: 'bg-[var(--theme-bg)]',
    bgDark: 'dark:bg-[var(--theme-bg-dark)]',
    accent: 'accent-[var(--theme-primary)]',
    accentDark: 'dark:accent-[var(--theme-primary)]',
    ring: 'focus:ring-[var(--theme-primary)]/10',
    focusBorder: 'focus:border-[var(--theme-primary)]',
    gradientFrom: 'from-[var(--theme-primary)]',
    gradientTo: 'to-[var(--theme-secondary)]',
    shadow: 'shadow-[var(--theme-primary)]/20',
    shadowLg: 'shadow-[var(--theme-primary)]/30',
    shadowXl: 'shadow-[var(--theme-primary)]/20',
    shadowXlDark: 'dark:shadow-[var(--theme-primary)]/20',
    prose: 'prose-slate',
    selection: 'selection:bg-[var(--theme-primary)]/10',
    icon: 'text-[var(--theme-primary)]',
    difficultyEasy: 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]',
    deepDiveBg: 'bg-[var(--theme-primary)]/10',
    deepDiveIcon: 'bg-[var(--theme-primary)]',
    deepDiveAudio: 'bg-[var(--theme-primary)]',
    deepDiveLoader: 'text-[var(--theme-primary)]',
    deepDiveTip: 'bg-[var(--theme-bg)] border-[var(--theme-primary)]/20 text-[var(--theme-primary)]',
    deepDiveTipIcon: 'text-[var(--theme-primary)]',
    chatUser: 'bg-[var(--theme-primary)]',
    chatUserBubble: 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]',
    resultCircle: 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]',
    bgLight: 'bg-[var(--theme-bg)]',
    bgLightDark: 'dark:bg-[var(--theme-bg-dark)]',
    borderLight: 'border-[var(--theme-primary)]',
    borderLightDark: 'dark:border-[var(--theme-primary)]',
    shadowLight: 'shadow-[var(--theme-primary)]/20',
    shadowDark: 'dark:shadow-[var(--theme-primary)]/20',
    darkPrimary: 'bg-[var(--theme-primary)]',
    contrastText: 'text-white'
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
  deleted?: boolean;
  deletedAt?: Date;
}

const MultiDateCalendar = ({ 
  selectedDates, 
  onToggleDate, 
  onApply, 
  onCancel,
  theme 
}: { 
  selectedDates: string[], 
  onToggleDate: (date: string) => void, 
  onApply: () => void,
  onCancel: () => void,
  theme: any 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-4 w-72 z-[100]"
    >
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft size={18} className="dark:text-white" />
        </button>
        <h3 className="font-bold text-sm dark:text-white capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <ChevronRight size={18} className="dark:text-white" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={`${day}-${i}`} className="text-center text-[10px] font-bold text-black/40 dark:text-slate-500 py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDates.includes(dateStr);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isTodayDate = isToday(day);
          
          return (
            <button
              key={dateStr}
              onClick={() => onToggleDate(dateStr)}
              className={cn(
                "h-8 w-8 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center relative",
                !isCurrentMonth && "opacity-20",
                isSelected 
                  ? cn(theme.primary, theme.contrastText, "shadow-md scale-110 z-10") 
                  : "hover:bg-black/5 dark:hover:bg-white/5 dark:text-white",
                isTodayDate && !isSelected && "border border-blue-500/50"
              )}
            >
              {format(day, 'd')}
              {isTodayDate && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />}
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
        <button 
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-[10px] font-bold hover:bg-black/5 dark:hover:bg-white/5 dark:text-white transition-all"
        >
          Cancelar
        </button>
        <button 
          onClick={onApply}
          className={cn("flex-1 py-2 rounded-xl text-[10px] font-bold transition-all shadow-lg", theme.primary, theme.contrastText)}
        >
          Filtrar ({selectedDates.length})
        </button>
      </div>
    </motion.div>
  );
};

const Dashboard = ({ 
  history, 
  theme, 
  onClose, 
  themeColor, 
  onPracticeTopic,
  dateFilter,
  setDateFilter,
  subjectFilter,
  setSubjectFilter,
  subjects,
  handleAddSubject,
  handleRemoveSubject,
  newSubjectInput,
  setNewSubjectInput,
  onDeleteSubjectHistory,
  onDeleteQuiz,
  userProfile,
  itemsDue,
  onStartSRSReview,
  selectedSubjects,
  setSelectedSubjects,
  onDeleteQuizzes,
  onDeleteSubjectsHistory
}: { 
  history: QuizResult[], 
  theme: any, 
  onClose: () => void, 
  themeColor: ThemeColor,
  onPracticeTopic: (topic: string, quizIds?: string[]) => void,
  dateFilter: string[],
  setDateFilter: (val: string[]) => void,
  subjectFilter: string,
  setSubjectFilter: (val: string) => void,
  subjects: string[],
  handleAddSubject: (e: React.FormEvent) => void,
  handleRemoveSubject: (subject: string) => void,
  newSubjectInput: string,
  setNewSubjectInput: (val: string) => void,
  onDeleteSubjectHistory: (subject: string) => void,
  onDeleteQuiz: (id: string) => void,
  userProfile: any,
  itemsDue: any[],
  onStartSRSReview: () => void,
  selectedSubjects: string[],
  setSelectedSubjects: React.Dispatch<React.SetStateAction<string[]>>,
  onDeleteQuizzes: (ids: string[]) => void,
  onDeleteSubjectsHistory: (subjects: string[]) => void
}) => {
  const [activeFolder, setActiveFolder] = React.useState<string | null>(null);
  const [selectedQuizzes, setSelectedQuizzes] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);

  const toggleQuizSelection = (id: string) => {
    setSelectedQuizzes(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSubjectSelection = (subject: string) => {
    setSelectedSubjects(
      selectedSubjects.includes(subject)
        ? selectedSubjects.filter(s => s !== subject)
        : [...selectedSubjects, subject]
    );
  };

  const handleDeepenSelected = () => {
    if (selectedSubjects.length === 0 && selectedQuizzes.length === 0) return;
    
    // Combine all quiz IDs from selected subjects and selected quizzes
    const allQuizIds = new Set<string>(selectedQuizzes);
    
    selectedSubjects.forEach(subject => {
      const quizzes = history.filter(res => {
        const quizSubjects = new Set(res.questions.map(q => normalizeSubject(q.subject || res.fileName)));
        return quizSubjects.has(subject);
      });
      quizzes.forEach(q => allQuizIds.add(q.id));
    });

    if (allQuizIds.size > 0) {
      const labels = [...selectedSubjects];
      if (selectedQuizzes.length > 0) {
        labels.push(`${selectedQuizzes.length} Quizzes`);
      }
      onPracticeTopic(labels.join(", "), Array.from(allQuizIds));
    }
  };
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [tempSelectedDates, setTempSelectedDates] = React.useState<string[]>([]);

  // Reset selection when changing folder
  React.useEffect(() => {
    setSelectedQuizzes([]);
  }, [activeFolder]);

  const filteredHistory = React.useMemo(() => {
    return history.filter(res => {
      const date = res.date instanceof Date ? res.date : (res.date as any).toDate();
      
      // Date filter
      let dateMatch = true;
      if (dateFilter.includes('all')) {
        dateMatch = true;
      } else if (dateFilter.includes('today')) {
        const today = new Date();
        dateMatch = date.toDateString() === today.toDateString();
      } else if (dateFilter.includes('week')) {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateMatch = date >= lastWeek;
      } else if (dateFilter.includes('month')) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateMatch = date >= lastMonth;
      } else if (dateFilter.length > 0) {
        dateMatch = dateFilter.some(df => {
          const filterDate = new Date(df);
          return !isNaN(filterDate.getTime()) && date.toDateString() === filterDate.toDateString();
        });
      }

      // Subject filter (now checks if ANY question in the quiz matches the subject filter)
      let subjectMatch = true;
      if (subjectFilter !== 'all') {
        subjectMatch = res.questions.some(q => q.subject === subjectFilter) || (res.fileName === subjectFilter);
      }

      return dateMatch && subjectMatch;
    });
  }, [history, dateFilter, subjectFilter]);

  const stats = React.useMemo(() => {
    if (filteredHistory.length === 0) return {
      totalQuizzes: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      avgAccuracy: 0,
      recentAccuracy: 0,
      trend: 'stable' as const,
      totalTime: 0,
      avgTimePerQuestion: 0,
      subjectData: [],
      strengths: [],
      weaknesses: [],
      focusTopics: []
    };

    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalTime = 0;
    const subjectStats: { [key: string]: { correct: number, total: number, lastDate: Date, attempts: number } } = {};

    filteredHistory.forEach(res => {
      const date = res.date instanceof Date ? res.date : (res.date as any).toDate();
      totalTime += res.timeSpent;

      res.questions.forEach((q, idx) => {
        const subject = normalizeSubject(q.subject || res.fileName);
        const isCorrect = res.answers[idx] === q.correctAnswer;
        
        if (!subjectStats[subject]) {
          subjectStats[subject] = { correct: 0, total: 0, lastDate: date, attempts: 0 };
        }
        
        subjectStats[subject].total += 1;
        if (isCorrect) subjectStats[subject].correct += 1;
        if (date > subjectStats[subject].lastDate) subjectStats[subject].lastDate = date;
        
        totalQuestions += 1;
        if (isCorrect) totalCorrect += 1;
      });
      
      // Count attempts per subject per quiz
      const quizSubjects = new Set(res.questions.map(q => normalizeSubject(q.subject || res.fileName)));
      quizSubjects.forEach(s => {
        if (subjectStats[s]) subjectStats[s].attempts += 1;
      });
    });

    const totalQuizzes = history.length;
    const totalIncorrect = totalQuestions - totalCorrect;
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;
    
    const subjectData = Object.entries(subjectStats).map(([name, data]) => ({
      name,
      accuracy: Math.round((data.correct / data.total) * 100),
      correct: data.correct,
      total: data.total,
      attempts: data.attempts,
      lastDate: data.lastDate,
      status: (data.correct / data.total) >= 0.8 ? 'Mastered' : (data.correct / data.total) >= 0.6 ? 'Improving' : 'Critical'
    })).sort((a, b) => {
      if (a.name === 'Outros') return 1;
      if (b.name === 'Outros') return -1;
      return a.name.localeCompare(b.name);
    });

    // Ensure all subjects from settings are present in subjectData
    subjects.forEach(s => {
      if (!subjectData.some(sd => sd.name === s)) {
        subjectData.push({
          name: s,
          accuracy: 0,
          correct: 0,
          total: 0,
          attempts: 0,
          lastDate: new Date(),
          status: 'Critical'
        });
      }
    });

    const recentHistory = history.slice(-5);
    let recentCorrect = 0;
    let recentTotal = 0;
    recentHistory.forEach(res => {
      recentCorrect += res.correct;
      recentTotal += res.total;
    });
    const recentAccuracy = recentTotal > 0 ? (recentCorrect / recentTotal) * 100 : 0;
    const trend = recentAccuracy > avgAccuracy ? 'up' : recentAccuracy < avgAccuracy ? 'down' : 'stable';

    const strengths = subjectData.filter(s => s.accuracy >= 80);
    const weaknesses = subjectData.filter(s => s.accuracy < 60);
    const focusTopics = subjectData
      .filter(s => s.accuracy < 75)
      .sort((a, b) => (b.total * (1 - b.accuracy/100)) - (a.total * (1 - a.accuracy/100)))
      .slice(0, 3);

    // Group quizzes by subject for the folder view
    const quizzesBySubject: { [key: string]: QuizResult[] } = {};
    filteredHistory.forEach(res => {
      const subject = normalizeSubject(res.questions[0]?.subject || res.fileName);
      if (!quizzesBySubject[subject]) quizzesBySubject[subject] = [];
      quizzesBySubject[subject].push(res);
    });

    return {
      totalQuizzes: filteredHistory.length,
      totalQuestions,
      totalCorrect,
      totalIncorrect,
      avgAccuracy,
      recentAccuracy,
      trend,
      totalTime,
      avgTimePerQuestion,
      subjectData,
      strengths,
      weaknesses,
      focusTopics,
      quizzesBySubject
    };
  }, [filteredHistory, history]);

  const allSubjectsFromHistory = React.useMemo(() => {
    const set = new Set<string>();
    history.forEach(res => {
      res.questions.forEach(q => {
        if (q.subject) set.add(normalizeSubject(q.subject));
      });
      if (res.fileName) set.add(normalizeSubject(res.fileName));
    });
    return Array.from(set).sort();
  }, [history]);

  if (history.length === 0) return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 min-h-[60vh]">
      <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
        <LayoutDashboard size={48} className="text-black/20 dark:text-white/20" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold dark:text-white">Nenhum dado disponível</h3>
        <p className="text-black/40 dark:text-slate-400 max-w-xs mx-auto">Realize alguns quizzes para começar a visualizar seu desempenho nos estudos.</p>
      </div>
      <button onClick={onClose} className={cn("px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg", theme.primary, theme.contrastText, theme.shadow)}>Voltar para o Início</button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/20 dark:border-slate-800/50 shadow-2xl">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className={cn("p-4 sm:p-5 rounded-[2rem] shadow-xl transform -rotate-3", theme.primary, theme.contrastText)}>
            <LayoutDashboard size={32} />
          </div>
          <div>
            <span className="text-[10px] font-black text-black/20 dark:text-slate-600 tracking-[0.3em] uppercase mb-1 block">ESTATÍSTICAS</span>
            <h2 className="text-2xl sm:text-3xl font-black dark:text-white tracking-tight">Análise Estratégica</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-black/40 dark:text-slate-400 font-bold">Status de Desempenho:</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                stats.totalQuizzes > 0 ? (stats.avgAccuracy >= 70 ? "bg-emerald-500 text-white" :
                stats.avgAccuracy >= 50 ? "bg-amber-500 text-white" :
                "bg-rose-500 text-white") : "bg-slate-200 text-slate-500"
              )}>
                {stats.totalQuizzes > 0 ? (stats.avgAccuracy >= 70 ? 'Consistente' : stats.avgAccuracy >= 50 ? 'Em Evolução' : 'Atenção Crítica') : 'Sem Dados'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) {
                setSelectedSubjects([]);
                setSelectedQuizzes([]);
              }
            }}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-xs active:scale-95 flex-1 sm:flex-none border",
              isSelectionMode 
                ? "bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                : "bg-black/5 dark:bg-white/5 dark:text-white border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10"
            )}
          >
            <CheckCircle2 size={18} />
            {isSelectionMode ? 'Cancelar Seleção' : 'Selecionar'}
          </button>

          <div className="flex flex-col gap-1 bg-black/5 dark:bg-white/5 p-2 rounded-2xl border border-black/5 dark:border-white/5 flex-1 sm:flex-none min-w-[160px] relative">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-black/40 dark:text-slate-500 ml-1" />
              <select 
                value={dateFilter.length === 1 && ['all', 'today', 'week', 'month'].includes(dateFilter[0]) ? dateFilter[0] : 'specific'}
                onChange={(e) => {
                  if (e.target.value === 'specific') {
                    setTempSelectedDates(dateFilter.filter(d => !['all', 'today', 'week', 'month'].includes(d)));
                    setIsCalendarOpen(true);
                  } else {
                    setDateFilter([e.target.value]);
                    setIsCalendarOpen(false);
                  }
                }}
                className="bg-transparent text-xs font-black dark:text-white outline-none cursor-pointer pr-1 w-full"
              >
                <option value="all" className="bg-white dark:bg-slate-900 dark:text-white">Todo Período</option>
                <option value="today" className="bg-white dark:bg-slate-900 dark:text-white">Hoje</option>
                <option value="week" className="bg-white dark:bg-slate-900 dark:text-white">Últimos 7 dias</option>
                <option value="month" className="bg-white dark:bg-slate-900 dark:text-white">Último mês</option>
                <option value="specific" className="bg-white dark:bg-slate-900 dark:text-white">Datas Específicas...</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-2 rounded-2xl border border-black/5 dark:border-white/5 flex-1 sm:flex-none">
            <BookOpen size={14} className="text-black/40 dark:text-slate-500 ml-1" />
            <select 
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-transparent text-xs font-black dark:text-white outline-none cursor-pointer pr-1 w-full max-w-[150px]"
            >
              <option value="all" className="bg-white dark:bg-slate-900 dark:text-white">Todas Matérias</option>
              {allSubjectsFromHistory.map(s => (
                <option key={s} value={s} className="bg-white dark:bg-slate-900 dark:text-white">{s}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={onClose} 
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all font-black text-xs dark:text-white active:scale-95 flex-1 sm:flex-none border border-black/5 dark:border-white/5"
          >
            <ChevronLeft size={18} />
            Voltar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {stats.totalQuizzes > 0 ? (
          <>
            {/* Main Column */}
            <div className="lg:col-span-3 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black dark:text-white">{stats.totalCorrect}</p>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">+{Math.round(stats.avgAccuracy)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
                <h3 className="text-[10px] font-black text-black/30 dark:text-slate-600 uppercase tracking-[0.2em]">Acertos</h3>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black dark:text-white">{stats.totalIncorrect}</p>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">-{Math.round(100 - stats.avgAccuracy)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <XCircle size={18} className="text-rose-500" />
                </div>
                <h3 className="text-[10px] font-black text-black/30 dark:text-slate-600 uppercase tracking-[0.2em]">Erros</h3>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-end gap-2">
                <p className="text-2xl font-black dark:text-white truncate">{formatTime(stats.totalTime)}</p>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">Total</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Clock size={18} className="text-amber-500" />
                </div>
                <h3 className="text-[10px] font-black text-black/30 dark:text-slate-600 uppercase tracking-[0.2em]">Tempo</h3>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black dark:text-white">{stats.totalQuizzes}</p>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Sessões</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Target size={18} className="text-blue-500" />
                </div>
                <h3 className="text-[10px] font-black text-black/30 dark:text-slate-600 uppercase tracking-[0.2em]">Quizzes</h3>
              </div>
            </motion.div>
          </div>

          {/* Achievements Card */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 dark:border-slate-800/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <Trophy size={20} className="text-amber-500" />
                </div>
                <h3 className="text-lg font-bold dark:text-white">Conquistas</h3>
              </div>
              <span className="text-[10px] font-bold text-black/40 dark:text-slate-500 uppercase tracking-widest">
                {userProfile?.achievements?.length || 0} Desbloqueadas
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { id: 'streak_7', title: 'Fogo nos Estudos', desc: '7 dias seguidos', icon: <Flame size={20} /> },
                { id: 'quizzes_10', title: 'Decatlo', desc: '10 quizzes feitos', icon: <Award size={20} /> },
                { id: 'correct_100', title: 'Centurião', desc: '100 acertos', icon: <Target size={20} /> },
                { id: 'streak_30', title: 'Mestre da Constância', desc: '30 dias seguidos', icon: <Zap size={20} /> },
              ].map(achievement => {
                const isUnlocked = userProfile?.achievements?.includes(achievement.id);
                return (
                  <div 
                    key={achievement.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-2",
                      isUnlocked 
                        ? "bg-amber-500/5 border-amber-500/20 text-amber-900 dark:text-amber-400" 
                        : "bg-black/5 border-transparent opacity-40 grayscale"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl", isUnlocked ? "bg-amber-500/20" : "bg-black/10")}>
                      {achievement.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{achievement.title}</p>
                      <p className="text-[10px] opacity-60">{achievement.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

              {/* Main Grid (Subject Performance) */}
              <div className="space-y-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-black/20 dark:text-slate-600 tracking-[0.3em] uppercase mb-1">MÉTRICAS</span>
                  <h3 className="text-2xl font-black dark:text-white flex items-center gap-3">
                    <FolderOpen size={28} className={theme.text} />
                    Desempenho por Matéria
                  </h3>
                </div>

              <div className="grid grid-cols-1 gap-4">
                {stats.subjectData.map((s, i) => {
                  const isExpanded = activeFolder === s.name;
                  const isSelected = selectedSubjects.includes(s.name);
                  const isStrength = stats.strengths.some(st => st.name === s.name);
                  const isFocus = stats.focusTopics.some(ft => ft.name === s.name);
                  const subjectQuizzes = stats.quizzesBySubject[s.name] || [];
                  
                    return (
                      <motion.div 
                        key={i}
                        layout
                        className={cn(
                          "group relative rounded-[2rem] border shadow-xl overflow-hidden transition-all backdrop-blur-2xl",
                          isSelected ? "bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20" :
                          isExpanded 
                            ? "bg-white/60 dark:bg-slate-900/60 border-blue-500/40 shadow-blue-500/10" 
                            : "bg-white/40 dark:bg-slate-900/40 border-white/20 dark:border-slate-800/50 hover:border-white/40 dark:hover:border-slate-700/50 shadow-black/5"
                        )}
                      >
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubjectSelection(s.name);
                            }}
                            className={cn(
                              "absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 cursor-pointer",
                              isSelected 
                                ? "bg-blue-500 border-blue-500 text-white scale-110 shadow-lg shadow-blue-500/20" 
                                : "bg-white/50 dark:bg-slate-800/50 border-black/10 dark:border-white/10 hover:border-blue-500/50"
                            )}
                          >
                            {isSelected && <CheckCircle2 size={14} />}
                          </div>
                        )}

                        {/* Folder Tab Effect (Vertical) */}
                        <div className={cn(
                          "absolute top-6 left-0 w-1.5 h-12 rounded-r-xl",
                          isStrength ? "bg-emerald-500" : isFocus ? "bg-rose-500" : theme.primary
                        )} />
                        
                        <div 
                          onClick={() => {
                            setActiveFolder(isExpanded ? null : s.name);
                          }}
                          className="p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-6"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={cn(
                              "p-4 rounded-2xl shadow-sm shrink-0",
                              isStrength ? "bg-emerald-500/10 text-emerald-500" :
                              isFocus ? "bg-rose-500/10 text-rose-500" :
                              "bg-black/5 dark:bg-white/5 text-black/40 dark:text-slate-400"
                            )}>
                              <Folder size={24} />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-black/30 dark:text-slate-500 uppercase tracking-widest">
                                  {s.total} Questões
                                </span>
                                <span className={cn(
                                  "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                  isStrength ? "bg-emerald-500/10 text-emerald-600" :
                                  isFocus ? "bg-rose-500/10 text-rose-600" :
                                  "bg-black/10 text-black/40 dark:text-slate-500"
                                )}>
                                  {isStrength ? 'Ponto Forte' : isFocus ? 'Foco Necessário' : 'Em Evolução'}
                                </span>
                              </div>
                              <h4 className={cn(
                                "font-black dark:text-white leading-tight truncate",
                                s.name.length > 30 ? "text-base" : "text-lg sm:text-xl"
                              )} title={s.name}>
                                {s.name}
                              </h4>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 sm:ml-auto">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-emerald-500">{s.correct}</span>
                                <span className="text-[8px] font-bold text-black/30 uppercase">Acertos</span>
                              </div>
                              <div className="w-px h-6 bg-black/5 dark:bg-white/5" />
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-rose-500">{s.total - s.correct}</span>
                                <span className="text-[8px] font-bold text-black/30 uppercase">Erros</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <p className={cn("text-xl font-black", 
                                  s.accuracy >= 80 ? "text-emerald-500" : 
                                  s.accuracy >= 60 ? "text-amber-500" : "text-rose-500"
                                )}>
                                  {s.accuracy}%
                                </p>
                                <div className="h-10 w-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden relative">
                                  <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${s.accuracy}%` }}
                                    className={cn("w-full rounded-full absolute bottom-0", 
                                      s.accuracy >= 80 ? "bg-emerald-500" : 
                                      s.accuracy >= 60 ? "bg-amber-500" : "bg-rose-500"
                                    )}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPracticeTopic(s.name);
                                }}
                                className={cn(
                                  "px-4 py-2 rounded-xl font-black text-[10px] transition-all active:scale-95 flex items-center gap-2 shadow-lg",
                                  theme.primary, theme.contrastText
                                )}
                              >
                                <Zap size={14} />
                                APROFUNDAR
                              </button>
                              <div className={cn(
                                "p-2 rounded-full transition-all",
                                isExpanded ? "bg-blue-500/10 text-blue-500 rotate-180" : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-slate-600"
                              )}>
                                <ChevronDown size={20} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content (Quiz History) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-6 pb-6"
                            >
                              <div className="pt-6 border-t border-black/5 dark:border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-black text-black/30 dark:text-slate-600 uppercase tracking-[0.2em]">Histórico Recente</h5>
                                  <button 
                                    onClick={() => onDeleteSubjectHistory(s.name)}
                                    className="text-[10px] font-black text-rose-500/60 hover:text-rose-500 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                                  >
                                    <Trash2 size={12} />
                                    Limpar Histórico
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {subjectQuizzes.slice().reverse().map((res, idx) => {
                                    const isQuizSelected = selectedQuizzes.includes(res.id);
                                    return (
                                      <div 
                                        key={idx} 
                                        onClick={() => isSelectionMode && toggleQuizSelection(res.id)}
                                        className={cn(
                                          "flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border transition-all group cursor-pointer",
                                          isQuizSelected ? "border-blue-500 bg-blue-500/5" : "border-transparent hover:border-black/5 dark:hover:border-white/5"
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          {isSelectionMode && (
                                            <div className={cn(
                                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                              isQuizSelected ? "bg-blue-500 border-blue-500 text-white" : "border-black/10 dark:border-white/10"
                                            )}>
                                              {isQuizSelected && <Check size={12} />}
                                            </div>
                                          )}
                                          <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm",
                                            (res.correct / res.total) >= 0.8 ? "bg-emerald-500/10 text-emerald-600" :
                                            (res.correct / res.total) >= 0.6 ? "bg-amber-500/10 text-amber-600" :
                                            "bg-rose-500/10 text-rose-600"
                                          )}>
                                            {Math.round((res.correct / res.total) * 100)}%
                                          </div>
                                          <div>
                                            <p className="text-xs font-black dark:text-white truncate max-w-[150px]" title={res.fileName}>{res.fileName}</p>
                                            <p className="text-[9px] font-bold text-black/40 dark:text-slate-500">{format(res.date instanceof Date ? res.date : (res.date as any).toDate(), "dd/MM/yyyy")}</p>
                                          </div>
                                        </div>
                                        {!isSelectionMode && (
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteQuiz(res.id);
                                            }}
                                            className="p-2 text-black/10 dark:text-white/10 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {subjectQuizzes.length === 0 && (
                                    <div className="col-span-full py-8 text-center bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                                      <p className="text-xs font-bold text-black/30 dark:text-slate-500">Nenhum quiz realizado nesta matéria ainda.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
            </div>

        </div>

        {/* Side Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Streak Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-orange-500 to-rose-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
              <Flame size={80} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Flame size={20} className="text-white" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">Sua Ofensiva</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{userProfile?.streak || 0}</span>
                <span className="text-lg font-bold opacity-80">Dias</span>
              </div>
              <p className="mt-3 text-[11px] font-medium opacity-90 leading-tight">
                {userProfile?.streak > 0 ? "Continue assim! Você está no caminho certo." : "Comece sua jornada hoje!"}
              </p>
            </div>
          </motion.div>

          {/* SRS Review Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[180px]"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <RotateCcw size={18} className="text-indigo-500" />
                </div>
                <h3 className="text-base font-bold dark:text-white">Repetição Espaçada</h3>
              </div>
              <p className="text-[11px] text-black/60 dark:text-slate-400 mb-4 leading-tight">
                Revise questões no momento ideal para fixar o conhecimento.
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-auto">
              <div>
                <span className="text-xl font-black dark:text-white">{itemsDue.length}</span>
                <span className="text-[9px] font-bold text-black/40 dark:text-slate-500 ml-2">Pendentes</span>
              </div>
              <button 
                disabled={itemsDue.length === 0}
                onClick={onStartSRSReview}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all active:scale-95",
                  itemsDue.length > 0 
                    ? cn(theme.primary, theme.contrastText, "shadow-lg shadow-indigo-500/20") 
                    : "bg-black/5 text-black/20 cursor-not-allowed"
                )}
              >
                Revisar
              </button>
            </div>
          </motion.div>

          {/* Quick Action Summary (Focus Topics) */}
          {stats.focusTopics.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold text-black/40 dark:text-slate-500 uppercase tracking-widest mb-4">Focar Agora</h3>
              <div className="space-y-3">
                {stats.focusTopics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 text-[10px] font-bold">
                        {topic.accuracy}%
                      </div>
                      <span className="text-xs font-bold dark:text-white truncate max-w-[80px]">{topic.name}</span>
                    </div>
                    <button 
                      onClick={() => onPracticeTopic(topic.name)}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/20 dark:text-slate-600 hover:text-blue-500 transition-all"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
          </>
        ) : (
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-24 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-black/5 dark:border-slate-800 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
              <Search size={40} className="text-black/20 dark:text-white/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold dark:text-white">Nenhum resultado encontrado</h3>
              <p className="text-xs text-black/40 dark:text-slate-400 max-w-xs mx-auto">Não encontramos dados para os filtros selecionados. Tente ajustar o período ou a matéria.</p>
            </div>
            <button 
              onClick={() => { setDateFilter(['all']); setSubjectFilter('all'); }}
              className={cn("px-6 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg", theme.primary, theme.contrastText, theme.shadow)}
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Bar for Selection */}
      <AnimatePresence>
        {(isSelectionMode && (selectedQuizzes.length > 0 || selectedSubjects.length > 0)) && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl"
          >
            <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-xl p-4 rounded-3xl border border-white/10 dark:border-black/10 shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 ml-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-white/40 dark:text-black/40 uppercase tracking-widest">Ações em Massa</p>
                  <p className="text-sm font-black text-white dark:text-black">
                    {selectedQuizzes.length > 0 && selectedSubjects.length > 0 
                      ? `${selectedSubjects.length} matérias e ${selectedQuizzes.length} quizzes`
                      : selectedQuizzes.length > 0 
                        ? `${selectedQuizzes.length} quizzes selecionados` 
                        : `${selectedSubjects.length} matérias selecionadas`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDeepenSelected}
                  className={cn(
                    "px-6 py-3 rounded-2xl font-black text-xs transition-all active:scale-95 flex items-center gap-2 shadow-lg",
                    theme.primary, theme.contrastText
                  )}
                >
                  <Zap size={16} />
                  APROFUNDAR SELECIONADOS
                </button>
                
                <button 
                  onClick={() => {
                    if (selectedQuizzes.length > 0) {
                      onDeleteQuizzes(selectedQuizzes);
                      setSelectedQuizzes([]);
                    }
                    if (selectedSubjects.length > 0) {
                      onDeleteSubjectsHistory(selectedSubjects);
                      setSelectedSubjects([]);
                    }
                  }}
                  className="p-3 rounded-2xl bg-rose-500 text-white hover:bg-rose-600 transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                  title="Excluir Selecionados"
                >
                  <Trash2 size={20} />
                </button>

                <button 
                  onClick={() => {
                    setSelectedQuizzes([]);
                    setSelectedSubjects([]);
                    setIsSelectionMode(false);
                  }}
                  className="p-3 rounded-2xl bg-white/10 dark:bg-black/10 text-white dark:text-black hover:bg-white/20 dark:hover:bg-black/20 transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StudyMode = ({ 
  history, 
  theme, 
  onClose, 
  onPracticeIncorrect,
  dateFilter,
  setDateFilter,
  subjectFilter,
  setSubjectFilter,
  subjects,
  handleAddSubject,
  handleRemoveSubject,
  newSubjectInput,
  setNewSubjectInput,
  onDeleteSubjectHistory,
  onDeleteQuiz,
  onDeleteQuizzes,
  onDeleteSubjectsHistory,
  onOpenRecycleBin,
  recycleBinCount,
  selectedSubjects,
  setSelectedSubjects
}: { 
  history: QuizResult[], 
  theme: any, 
  onClose: () => void,
  onPracticeIncorrect: (questions: QuizQuestion[], fileName: string) => void,
  dateFilter: string[],
  setDateFilter: (val: string[]) => void,
  subjectFilter: string,
  setSubjectFilter: (val: string) => void,
  subjects: string[],
  handleAddSubject: (e: React.FormEvent) => void,
  handleRemoveSubject: (subject: string) => void,
  newSubjectInput: string,
  setNewSubjectInput: (val: string) => void,
  onDeleteSubjectHistory: (subject: string) => void,
  onDeleteQuiz: (id: string) => void,
  onDeleteQuizzes: (ids: string[]) => void,
  onDeleteSubjectsHistory: (subjects: string[]) => void,
  onOpenRecycleBin: () => void,
  recycleBinCount: number,
  selectedSubjects: string[],
  setSelectedSubjects: React.Dispatch<React.SetStateAction<string[]>>
}) => {
  const [activeFolder, setActiveFolder] = React.useState<string | null>(null);
  const [selectedQuizzes, setSelectedQuizzes] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [tempSelectedDates, setTempSelectedDates] = React.useState<string[]>([]);

  const toggleQuizSelection = (id: string) => {
    setSelectedQuizzes(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSubjectSelection = (name: string) => {
    setSelectedSubjects(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const clearSelection = () => {
    setSelectedQuizzes([]);
    setSelectedSubjects([]);
    setIsSelectionMode(false);
  };

  const filteredHistory = React.useMemo(() => {
    return history.filter(res => {
      const date = res.date instanceof Date ? res.date : (res.date as any).toDate();
      
      // Date filter
      let dateMatch = true;
      if (dateFilter.includes('all')) {
        dateMatch = true;
      } else if (dateFilter.includes('today')) {
        const today = new Date();
        dateMatch = date.toDateString() === today.toDateString();
      } else if (dateFilter.includes('week')) {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateMatch = date >= lastWeek;
      } else if (dateFilter.includes('month')) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateMatch = date >= lastMonth;
      } else if (dateFilter.length > 0) {
        dateMatch = dateFilter.some(df => {
          const filterDate = new Date(df);
          return !isNaN(filterDate.getTime()) && date.toDateString() === filterDate.toDateString();
        });
      }

      // Subject filter
      let subjectMatch = true;
      if (subjectFilter !== 'all') {
        subjectMatch = res.questions.some(q => q.subject === subjectFilter) || (res.fileName === subjectFilter);
      }

      return dateMatch && subjectMatch;
    });
  }, [history, dateFilter, subjectFilter]);

  const subjectStats = React.useMemo(() => {
    const stats: { [key: string]: { correct: number, total: number, lastDate: Date, attempts: number, questions: QuizQuestion[], incorrectCount: number, quizzes: QuizResult[] } } = {};
    
    const getCanonicalSubject = (raw: string) => {
      if (!raw) return 'Outros';
      const normalizedRaw = raw.toLowerCase().trim();
      
      // Try to find a match in the subjects list
      const match = subjects.find(s => 
        normalizedRaw.includes(s.toLowerCase()) || 
        s.toLowerCase().includes(normalizedRaw)
      );
      
      return match || 'Outros';
    };

    filteredHistory.forEach(res => {
      const date = res.date instanceof Date ? res.date : (res.date as any).toDate();
      
      // Group the entire quiz under one canonical subject
      const rawSubject = res.questions[0]?.subject || res.fileName;
      const topic = getCanonicalSubject(rawSubject);

      if (!stats[topic]) stats[topic] = { correct: 0, total: 0, lastDate: date, attempts: 0, questions: [], incorrectCount: 0, quizzes: [] };

      res.questions.forEach((q, idx) => {
        stats[topic].total += 1;
        if (res.answers[idx] === q.correctAnswer) {
          stats[topic].correct += 1;
        } else {
          if (!stats[topic].questions.some(existing => existing.question === q.question)) {
            stats[topic].questions.push(q);
            stats[topic].incorrectCount++;
          }
        }
        if (date > stats[topic].lastDate) stats[topic].lastDate = date;
      });

      if (!stats[topic].quizzes.some(quiz => quiz.id === res.id)) {
        stats[topic].quizzes.push(res);
      }
      stats[topic].attempts += 1;
    });

    // Ensure all subjects from settings are present
    subjects.forEach(s => {
      if (!stats[s]) {
        stats[s] = { correct: 0, total: 0, lastDate: new Date(), attempts: 0, questions: [], incorrectCount: 0, quizzes: [] };
      }
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        incorrectCount: data.incorrectCount,
        questions: data.questions,
        total: data.total,
        correct: data.correct,
        attempts: data.attempts,
        lastDate: data.lastDate,
        quizzes: data.quizzes
      }))
      .sort((a, b) => {
        if (a.name === 'Outros') return 1;
        if (b.name === 'Outros') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [filteredHistory, subjects]);

  const allSubjectsFromHistory = React.useMemo(() => {
    const set = new Set<string>();
    history.forEach(res => {
      res.questions.forEach(q => {
        if (q.subject) set.add(normalizeSubject(q.subject));
      });
      if (res.fileName) set.add(normalizeSubject(res.fileName));
    });
    return Array.from(set).sort();
  }, [history]);

  const totalIncorrect = subjectStats.reduce((acc, s) => acc + s.incorrectCount, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={cn("p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-lg transform -rotate-3", theme.primary, theme.contrastText)}>
            <BookOpen size={20} className="sm:hidden" />
            <BookOpen size={28} className="hidden sm:block" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold dark:text-white tracking-tight">Modo de Estudo</h2>
            <p className="text-[10px] sm:text-xs text-black/40 dark:text-slate-400 font-medium">Revise seus erros e foque nos pontos de atenção</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Filters moved next to Voltar button */}
          <div className="flex flex-col gap-1 bg-black/5 dark:bg-white/5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-black/5 dark:border-white/5 flex-1 sm:flex-none min-w-[140px] relative">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-black/40 dark:text-slate-500 ml-1" />
              <div className="flex items-center gap-1.5 w-full">
                <select 
                  value={dateFilter.length === 1 && ['all', 'today', 'week', 'month'].includes(dateFilter[0]) ? dateFilter[0] : 'specific'}
                  onChange={(e) => {
                    if (e.target.value === 'specific') {
                      setTempSelectedDates(dateFilter.filter(d => !['all', 'today', 'week', 'month'].includes(d)));
                      setIsCalendarOpen(true);
                    } else {
                      setDateFilter([e.target.value]);
                      setIsCalendarOpen(false);
                    }
                  }}
                  className="bg-transparent text-[10px] sm:text-xs font-bold dark:text-white outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 dark:text-white">Todo Período</option>
                  <option value="today" className="bg-white dark:bg-slate-900 dark:text-white">Hoje</option>
                  <option value="week" className="bg-white dark:bg-slate-900 dark:text-white">Últimos 7 dias</option>
                  <option value="month" className="bg-white dark:bg-slate-900 dark:text-white">Último mês</option>
                  <option value="specific" className="bg-white dark:bg-slate-900 dark:text-white">Datas Específicas...</option>
                </select>
                {(dateFilter.length === 0 || !['all', 'today', 'week', 'month'].includes(dateFilter[0])) && (
                  <button 
                    onClick={() => {
                      setTempSelectedDates(dateFilter.filter(d => !['all', 'today', 'week', 'month'].includes(d)));
                      setIsCalendarOpen(!isCalendarOpen);
                    }}
                    className="flex items-center gap-1 border-l border-black/10 dark:border-white/10 pl-1.5 hover:text-blue-500 transition-colors"
                  >
                    <Plus size={10} />
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {isCalendarOpen && (
                <MultiDateCalendar 
                  selectedDates={tempSelectedDates}
                  onToggleDate={(date) => {
                    setTempSelectedDates(prev => 
                      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
                    );
                  }}
                  onApply={() => {
                    if (tempSelectedDates.length > 0) {
                      setDateFilter(tempSelectedDates);
                    } else {
                      setDateFilter(['all']);
                    }
                    setIsCalendarOpen(false);
                  }}
                  onCancel={() => setIsCalendarOpen(false)}
                  theme={theme}
                />
              )}
            </AnimatePresence>

            {dateFilter.length > 0 && !['all', 'today', 'week', 'month'].includes(dateFilter[0]) && (
              <div className="flex flex-wrap gap-1 px-1">
                {dateFilter.map(date => (
                  <span key={date} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-[8px] font-bold">
                    {format(new Date(date + 'T12:00:00'), 'dd/MM')}
                    <button onClick={() => setDateFilter(dateFilter.filter(d => d !== date))} className="hover:text-rose-500">
                      <X size={8} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-black/5 dark:border-white/5 flex-1 sm:flex-none">
            <BookOpen size={12} className="text-black/40 dark:text-slate-500 ml-1" />
            <select 
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-transparent text-[10px] sm:text-xs font-bold dark:text-white outline-none cursor-pointer pr-1 w-full max-w-[100px] sm:max-w-[130px]"
            >
              <option value="all" className="bg-white dark:bg-slate-900 dark:text-white">Todas Matérias</option>
              {allSubjectsFromHistory.map(s => (
                <option key={s} value={s} className="bg-white dark:bg-slate-900 dark:text-white">{s}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={onClose} 
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all font-bold text-[10px] sm:text-xs dark:text-white active:scale-95 flex-1 sm:flex-none"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>
        </div>
      </div>

      {(isSelectionMode || selectedQuizzes.length > 0 || selectedSubjects.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 p-4 rounded-2xl mb-6 shadow-lg sticky top-20 z-30"
        >
          <div className="flex items-center gap-4">
            <span className={cn("text-sm font-bold", theme.text)}>
              {activeFolder ? `${selectedQuizzes.length} quizzes selecionados` : `${selectedSubjects.length} matérias selecionadas`}
            </span>
            <button 
              onClick={clearSelection}
              className="text-xs font-bold text-black/40 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
          <div className="flex items-center gap-3">
            {activeFolder && selectedQuizzes.length > 0 && (
              <button 
                onClick={() => {
                  const selectedQuestions = filteredHistory
                    .filter(res => selectedQuizzes.includes(res.id))
                    .flatMap(res => res.questions.filter((q, idx) => res.answers[idx] !== q.correctAnswer));
                  
                  if (selectedQuestions.length > 0) {
                    onPracticeIncorrect(selectedQuestions, `Revisão: ${activeFolder} (Seleção)`);
                    clearSelection();
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all",
                  theme.primary, theme.contrastText
                )}
              >
                <RotateCcw size={16} />
                Praticar Erros Selecionados
              </button>
            )}
            <button 
              onClick={() => {
                if (activeFolder) {
                  onDeleteQuizzes(selectedQuizzes);
                } else {
                  onDeleteSubjectsHistory(selectedSubjects);
                }
                clearSelection();
              }}
              disabled={activeFolder ? selectedQuizzes.length === 0 : selectedSubjects.length === 0}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-rose-500 text-white font-bold text-sm shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
            >
              <Trash2 size={16} />
              Excluir Selecionados
            </button>
          </div>
        </motion.div>
      )}

      {subjectStats.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Summary Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-black/5 dark:border-slate-700 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 rounded-2xl">
                  <XCircle size={24} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-bold dark:text-white">Total de Erros</h3>
              </div>
              <div className="space-y-2">
                <p className="text-4xl sm:text-5xl font-bold dark:text-white">{totalIncorrect}</p>
                <p className="text-xs sm:text-sm text-black/40 dark:text-slate-400 font-medium">Questões que precisam de revisão</p>
              </div>
              <button 
                disabled={totalIncorrect === 0}
                onClick={() => {
                  const allIncorrect = subjectStats.flatMap(s => s.questions);
                  onPracticeIncorrect(allIncorrect, "Revisão Geral de Erros");
                }}
                className={cn(
                  "w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base",
                  totalIncorrect === 0 ? "bg-black/5 text-black/20 cursor-not-allowed" : cn(theme.primary, theme.contrastText, theme.shadow)
                )}
              >
                <RotateCcw size={20} />
                Praticar Todos os Erros
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-amber-100 dark:border-amber-900/20 space-y-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <Zap size={20} />
                <h4 className="font-bold uppercase tracking-widest text-[10px] sm:text-xs">Dica de Estudo</h4>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                Focar nos erros é a forma mais rápida de evoluir. Tente explicar para si mesmo por que a resposta correta é a certa.
              </p>
            </div>
          </div>

          {/* Topics List / Folders */}
          <div className="lg:col-span-2 space-y-6">
            {activeFolder ? (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/20 dark:border-slate-800/50 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setActiveFolder(null)}
                      className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                    >
                      <ChevronLeft size={24} className="dark:text-white" />
                    </button>
                    <div>
                      <h3 className="text-2xl font-bold dark:text-white flex items-center gap-3">
                        <FolderOpen size={28} className={theme.text} />
                        {activeFolder}
                      </h3>
                      <p className="text-sm text-black/40 dark:text-slate-500 font-medium">
                        {subjectStats.find(s => s.name === activeFolder)?.quizzes.length || 0} arquivos encontrados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      disabled={subjectStats.find(s => s.name === activeFolder)?.incorrectCount === 0}
                      onClick={() => {
                        const s = subjectStats.find(s => s.name === activeFolder);
                        if (s) onPracticeIncorrect(s.questions, `Revisão: ${s.name}`);
                      }}
                      className={cn(
                        "px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg",
                        subjectStats.find(s => s.name === activeFolder)?.incorrectCount === 0 
                          ? "bg-black/5 text-black/20 cursor-not-allowed" 
                          : cn(theme.primary, theme.contrastText, theme.shadow)
                      )}
                    >
                      Praticar Todos os Erros
                    </button>
                  </div>
              </div>

                <div className="space-y-8">
                  {(() => {
                    const subject = subjectStats.find(s => s.name === activeFolder);
                    if (!subject) return null;

                    const grouped: { [key: string]: QuizResult[] } = {};
                    subject.quizzes.sort((a, b) => b.date.getTime() - a.date.getTime()).forEach(q => {
                      const dateStr = format(q.date, "dd.MM.yyyy", { locale: ptBR });
                      if (!grouped[dateStr]) grouped[dateStr] = [];
                      grouped[dateStr].push(q);
                    });

                    return Object.entries(grouped).map(([date, dateQuizzes]) => (
                      <div key={date} className="space-y-4">
                        <div className="flex items-center gap-2 ml-2">
                          <Folder size={16} className="text-amber-500" />
                          <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-slate-500">
                            {date}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-3 ml-6">
                          {dateQuizzes.map((res) => {
                            const isSelected = selectedQuizzes.includes(res.id);
                            const incorrectInThisQuiz = res.questions.filter((q, idx) => res.answers[idx] !== q.correctAnswer);
                            return (
                              <div 
                                key={res.id} 
                                onClick={() => toggleQuizSelection(res.id)}
                                className={cn(
                                  "group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer gap-4",
                                  isSelected 
                                    ? "bg-rose-500/5 border-rose-500/20 shadow-sm" 
                                    : "bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border-white/20 dark:border-slate-700/50 hover:border-white/40 dark:hover:border-slate-600/50"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                                    isSelected ? "bg-rose-500 border-rose-500" : "border-black/10 dark:border-white/10"
                                  )}>
                                    {isSelected && <Check size={12} className="text-white" />}
                                  </div>
                                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                                    <FileText size={20} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold dark:text-white truncate max-w-[200px] sm:max-w-[300px]" title={res.fileName}>
                                      {res.fileName}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                      <p className="text-[10px] text-black/40 dark:text-slate-500 font-medium">
                                        {res.total} questões
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/10" />
                                        <span className={cn(
                                          "text-[10px] font-bold",
                                          incorrectInThisQuiz.length === 0 ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                          {incorrectInThisQuiz.length} erros
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-9 sm:ml-0">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPracticeIncorrect(res.questions, res.fileName);
                                    }}
                                    className={cn(
                                      "px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all active:scale-95 flex items-center gap-1.5",
                                      theme.primary, theme.contrastText
                                    )}
                                  >
                                    <RotateCcw size={12} />
                                    Refazer Tudo
                                  </button>
                                  {incorrectInThisQuiz.length > 0 && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onPracticeIncorrect(incorrectInThisQuiz, `Erros: ${res.fileName}`);
                                      }}
                                      className="px-3 py-1.5 rounded-lg font-bold text-[10px] bg-rose-500 text-white transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                                    >
                                      <XCircle size={12} />
                                      Praticar Erros
                                    </button>
                                  )}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteQuiz(res.id);
                                    }}
                                    className="p-2 text-black/10 dark:text-white/10 hover:text-rose-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-black/20 dark:text-slate-600 tracking-[0.3em] uppercase mb-1">EXERCÍCIOS</span>
                    <h3 className="text-2xl font-black dark:text-white flex items-center gap-3">
                      <FolderOpen size={28} className={theme.text} />
                      Pastas por Matéria
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsSelectionMode(!isSelectionMode)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all",
                        isSelectionMode ? "bg-rose-500 text-white" : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-slate-400"
                      )}
                    >
                      <CheckSquare size={16} />
                      {isSelectionMode ? "Sair da Seleção" : "Selecionar Várias"}
                    </button>
                    <button 
                      onClick={onOpenRecycleBin}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-black/5 dark:bg-white/5 text-black/60 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 transition-all relative"
                    >
                      <Trash2 size={16} />
                      Lixeira
                      {recycleBinCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                          {recycleBinCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  {subjectStats.map((s) => {
                    const isSelected = selectedSubjects.includes(s.name);
                    return (
                      <motion.div 
                        key={s.name}
                        whileHover={{ x: 8, scale: 1.005 }}
                        onClick={() => isSelectionMode ? toggleSubjectSelection(s.name) : setActiveFolder(s.name)}
                        className={cn(
                          "group relative p-6 rounded-[2rem] border shadow-xl flex flex-col sm:flex-row sm:items-center gap-6 overflow-hidden transition-all backdrop-blur-2xl",
                          isSelected 
                            ? "bg-rose-500/10 border-rose-500/30" 
                            : "bg-white/40 dark:bg-slate-900/40 border-white/20 dark:border-slate-800/50 hover:border-white/40 dark:hover:border-slate-700/50 shadow-black/5"
                        )}
                      >
                        {/* Folder Tab Effect (Vertical) */}
                        <div className={cn("absolute top-6 left-0 w-1 h-12 rounded-r-xl", theme.primary)} />
                        
                        <div className="flex items-center gap-4 shrink-0">
                          {isSelectionMode ? (
                            <div className={cn(
                              "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all",
                              isSelected ? "bg-rose-500 border-rose-500" : "border-black/10 dark:border-white/10"
                            )}>
                              {isSelected && <Check size={16} className="text-white" />}
                            </div>
                          ) : (
                            <div className={cn("p-4 rounded-2xl bg-black/5 dark:bg-white/5", theme.text)}>
                              <Folder size={24} />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <h4 className="text-lg font-black dark:text-white leading-tight" title={s.name}>{s.name}</h4>
                            <span className="text-[10px] font-black text-black/30 dark:text-slate-500 uppercase tracking-widest">
                              {s.quizzes.length} {s.quizzes.length === 1 ? 'Arquivo' : 'Arquivos'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full flex items-center gap-1.5">
                              <XCircle size={12} />
                              {s.incorrectCount} erros
                            </span>
                            <span className="text-[10px] font-bold px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center gap-1.5">
                              <CheckCircle2 size={12} />
                              {s.correct} acertos
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <p className={cn("text-xl font-black", 
                                s.accuracy >= 80 ? "text-emerald-500" : 
                                s.accuracy >= 60 ? "text-amber-500" : "text-rose-500"
                              )}>
                                {s.accuracy}%
                              </p>
                              <span className="text-[8px] font-bold text-black/30 dark:text-slate-600 uppercase tracking-widest">Precisão</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isSelectionMode && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSubjectHistory(s.name);
                                }}
                                className="p-2 text-black/10 dark:text-white/10 hover:text-rose-500 transition-colors"
                                title="Excluir histórico desta matéria"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                            <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px] uppercase ml-2">
                              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-24 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-black/5 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
            <Search size={40} className="text-black/20 dark:text-white/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold dark:text-white">Nenhum erro encontrado</h3>
            <p className="text-xs text-black/40 dark:text-slate-400 max-w-xs mx-auto">Não encontramos erros para os filtros selecionados. Tente ajustar o período ou a matéria.</p>
          </div>
          <button 
            onClick={() => { setDateFilter(['all']); setSubjectFilter('all'); }}
            className={cn("px-6 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg", theme.primary, theme.contrastText, theme.shadow)}
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </motion.div>
  );
};

const RecycleBin = ({ 
  items, 
  theme, 
  onClose, 
  onRestore, 
  onRestoreMultiple,
  onDelete,
  onDeleteMultiple
}: { 
  items: QuizResult[], 
  theme: any, 
  onClose: () => void,
  onRestore: (id: string) => void,
  onRestoreMultiple: (ids: string[]) => void,
  onDelete: (id: string) => void,
  onDeleteMultiple: (ids: string[]) => void
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setIsSelectionMode(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-xl max-w-4xl mx-auto w-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={20} className="dark:text-white" />
          </button>
          <div>
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <Trash2 size={24} className="text-rose-500" />
              Lixeira
            </h3>
            <p className="text-[10px] text-black/40 dark:text-slate-500 font-medium">
              {items.length} itens excluídos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button 
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all",
                isSelectionMode ? "bg-rose-500 text-white" : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-slate-400"
              )}
            >
              <CheckSquare size={16} />
              {isSelectionMode ? "Sair da Seleção" : "Selecionar Vários"}
            </button>
          )}
        </div>
      </div>

      {isSelectionMode && selectedItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-6"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-rose-600">
              {selectedItems.length} itens selecionados
            </span>
            <button 
              onClick={clearSelection}
              className="text-xs font-bold text-black/40 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                onRestoreMultiple(selectedItems);
                clearSelection();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
            >
              <RotateCcw size={14} />
              Restaurar
            </button>
            <button 
              onClick={() => {
                onDeleteMultiple(selectedItems);
                clearSelection();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
            >
              <Trash2 size={14} />
              Excluir Permanentemente
            </button>
          </div>
        </motion.div>
      )}

      {items.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Trash2 size={40} className="text-black/10 dark:text-white/10" />
          </div>
          <p className="text-black/40 dark:text-slate-500 font-medium">Sua lixeira está vazia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div 
              key={item.id}
              onClick={() => isSelectionMode && toggleSelection(item.id)}
              className={cn(
                "group flex items-center justify-between p-5 rounded-3xl border transition-all",
                isSelectionMode ? "cursor-pointer" : "cursor-default",
                selectedItems.includes(item.id)
                  ? "bg-rose-500/10 border-rose-500/30" 
                  : "bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10 dark:hover:border-white/10"
              )}
            >
              <div className="flex items-center gap-4">
                {isSelectionMode ? (
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    selectedItems.includes(item.id) ? "bg-rose-500 border-rose-500" : "border-black/10 dark:border-white/10"
                  )}>
                    {selectedItems.includes(item.id) && <Check size={14} className="text-white" />}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                    <Trash2 size={24} className="text-rose-500" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold dark:text-white truncate max-w-[200px]" title={item.fileName}>
                    {item.fileName}
                  </h4>
                  <p className="text-[10px] text-black/40 dark:text-slate-500 font-medium">
                    Excluído em: {item.deletedAt ? format(item.deletedAt, "dd/MM/yyyy HH:mm") : 'Desconhecido'}
                  </p>
                </div>
              </div>
              {!isSelectionMode && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onRestore(item.id)}
                    className="p-2 text-black/20 dark:text-white/20 hover:text-emerald-500 transition-colors"
                    title="Restaurar"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-black/20 dark:text-white/20 hover:text-rose-500 transition-colors"
                    title="Excluir Permanentemente"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorInfo: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message || String(error) };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let isFirestoreError = false;
      let firestoreError: any = null;
      try {
        firestoreError = JSON.parse(this.state.errorInfo || '');
        if (firestoreError.operationType) isFirestoreError = true;
      } catch (e) {}

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-red-100 dark:border-red-900/30 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-red-500" size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold dark:text-white">Ops! Algo deu errado</h1>
              <p className="text-slate-500 dark:text-slate-400">
                {isFirestoreError 
                  ? "Ocorreu um erro de permissão ou acesso ao banco de dados." 
                  : "Ocorreu um erro inesperado na aplicação."}
              </p>
            </div>
            
            {this.state.errorInfo && (
              <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-xl text-left overflow-auto max-h-40">
                <code className="text-xs text-red-600 dark:text-red-400 break-all">
                  {isFirestoreError ? `Erro no Firestore (${firestoreError.operationType}): ${firestoreError.error}` : this.state.errorInfo}
                </code>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  theme 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string,
  theme: any
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-black/5 dark:border-white/10 space-y-6"
      >
        <div className="flex items-center gap-4 text-rose-500">
          <div className="p-3 bg-rose-500/10 rounded-2xl">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-2xl font-bold dark:text-white">{title}</h3>
        </div>
        <p className="text-black/60 dark:text-slate-400 font-medium leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3 pt-2">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all dark:text-white"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className={cn("flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95", theme.primary)}
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <QuizApp />
    </ErrorBoundary>
  );
}

const QuizSummary = ({ questions, answers, theme }: { questions: QuizQuestion[], answers: (string | null)[], theme: any }) => {
  const results = questions.map((q, i) => ({
    ...q,
    userAnswer: answers[i],
    isCorrect: answers[i] === q.correctAnswer
  }));

  // Difficulty data
  const difficultyData = ['easy', 'medium', 'hard'].map(diff => {
    const diffResults = results.filter(r => r.difficulty === diff);
    const correct = diffResults.filter(r => r.isCorrect).length;
    const incorrect = diffResults.length - correct;
    return {
      name: diff === 'easy' ? 'Fácil' : diff === 'medium' ? 'Médio' : 'Difícil',
      correct,
      incorrect,
      total: diffResults.length
    };
  }).filter(d => d.total > 0);

  // Subject data
  const subjectStats: Record<string, { correct: number, total: number }> = {};
  results.forEach((r) => {
    const subject = r.subject || 'Geral';
    if (!subjectStats[subject]) subjectStats[subject] = { correct: 0, total: 0 };
    subjectStats[subject].total++;
    if (r.isCorrect) subjectStats[subject].correct++;
  });

  const subjectRanking = Object.entries(subjectStats)
    .map(([name, stats]) => ({
      name,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      correct: stats.correct,
      total: stats.total
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div className="space-y-12 mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Difficulty Chart */}
        <div className="bg-[#F5F5F0] dark:bg-slate-800 rounded-[32px] p-8 space-y-6">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <Target size={20} className={theme.icon} />
            Desempenho por Dificuldade
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#00000005' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="correct" name="Acertos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="incorrect" name="Erros" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Ranking */}
        <div className="bg-[#F5F5F0] dark:bg-slate-800 rounded-[32px] p-8 space-y-6">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <Award size={20} className={theme.icon} />
            Ranking por Matéria
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {subjectRanking.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    idx === 0 ? "bg-yellow-100 text-yellow-700" : 
                    idx === subjectRanking.length - 1 ? "bg-rose-100 text-rose-700" : 
                    "bg-slate-100 text-slate-700"
                  )}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-black/40 dark:text-slate-500 font-medium">{item.correct}/{item.total} acertos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold",
                    item.accuracy >= 70 ? "text-emerald-600" : 
                    item.accuracy >= 40 ? "text-amber-600" : 
                    "text-rose-600"
                  )}>
                    {item.accuracy}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function QuizApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [state, setState] = useState<QuizState>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [deepDiveProgress, setDeepDiveProgress] = useState(0);
  const [deepDiveStatus, setDeepDiveStatus] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [isDeepDiveExpanded, setIsDeepDiveExpanded] = useState(false);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isQuestionStarted, setIsQuestionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string>(() => localStorage.getItem('app_background') || 'none');
  const [backgroundBlur, setBackgroundBlur] = useState<number>(() => Number(localStorage.getItem('app_background_blur')) || 8);
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(() => Number(localStorage.getItem('app_background_opacity')) || 15);
  const fileInputBackgroundRef = useRef<HTMLInputElement>(null);

  const defaultBackgrounds = [
    { id: 'none', name: 'Padrão', url: '' }
  ];

  const [customBackgrounds, setCustomBackgrounds] = useState<{id: string, name: string, url: string}[]>(() => {
    const saved = localStorage.getItem('app_custom_backgrounds');
    return saved ? JSON.parse(saved) : [];
  });

  const handleCustomBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (customBackgrounds.length >= 15) {
        alert("Você atingiu o limite máximo de 15 planos de fundo personalizados. Remova algum para adicionar um novo.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1024px to save space in Firestore
          const maxDim = 1024;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress as JPEG with 0.6 quality to stay under 1MB limit for 15 images
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            
            const newBg = {
              id: `custom-${Date.now()}`,
              name: file.name.split('.')[0] || 'Personalizado',
              url: compressedBase64
            };
            const updated = [...customBackgrounds, newBg];
            setCustomBackgrounds(updated);
            localStorage.setItem('app_custom_backgrounds', JSON.stringify(updated));
            setBackgroundUrl(compressedBase64);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteBackground = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customBackgrounds.filter(bg => bg.id !== id);
    setCustomBackgrounds(updated);
    localStorage.setItem('app_custom_backgrounds', JSON.stringify(updated));
    if (backgroundUrl === customBackgrounds.find(bg => bg.id === id)?.url) {
      setBackgroundUrl('none');
    }
  };

  // Sync background and theme settings with Firestore
  useEffect(() => {
    if (userProfile) {
      if (userProfile.backgroundUrl !== undefined && userProfile.backgroundUrl !== backgroundUrl) {
        setBackgroundUrl(userProfile.backgroundUrl);
      }
      if (userProfile.backgroundBlur !== undefined && userProfile.backgroundBlur !== backgroundBlur) {
        setBackgroundBlur(userProfile.backgroundBlur);
      }
      if (userProfile.backgroundOpacity !== undefined && userProfile.backgroundOpacity !== backgroundOpacity) {
        setBackgroundOpacity(userProfile.backgroundOpacity);
      }
      if (userProfile.themeColor !== undefined && userProfile.themeColor !== themeColor) {
        setThemeColor(userProfile.themeColor);
      }
      if (userProfile.customThemeColor !== undefined && userProfile.customThemeColor !== customColor) {
        setCustomColor(userProfile.customThemeColor);
      }
      if (userProfile.customBackgrounds !== undefined) {
        // Only update if different to avoid loops
        const currentIds = customBackgrounds.map(b => b.id).sort().join(',');
        const profileIds = (userProfile.customBackgrounds as any[]).map(b => b.id).sort().join(',');
        if (currentIds !== profileIds) {
          setCustomBackgrounds(userProfile.customBackgrounds);
        }
      }
      if (userProfile.subjects !== undefined) {
        const currentSubjects = subjects.sort().join(',');
        const profileSubjects = (userProfile.subjects as string[]).sort().join(',');
        if (currentSubjects !== profileSubjects) {
          setSubjects(userProfile.subjects);
        }
      }
    }
  }, [userProfile]);

  // Debounced background settings sync
  useEffect(() => {
    localStorage.setItem('app_background', backgroundUrl);
    localStorage.setItem('app_background_blur', backgroundBlur.toString());
    localStorage.setItem('app_background_opacity', backgroundOpacity.toString());
    localStorage.setItem('app_custom_backgrounds', JSON.stringify(customBackgrounds));
    localStorage.setItem('studySubjects', JSON.stringify(subjects));
    
    if (!user) return;

    const timer = setTimeout(() => {
      const userRef = doc(db, 'users', user.uid);
      
      // Only write if different from userProfile to avoid unnecessary writes
      const hasChanges = 
        userProfile?.backgroundUrl !== backgroundUrl ||
        userProfile?.backgroundBlur !== backgroundBlur ||
        userProfile?.backgroundOpacity !== backgroundOpacity ||
        JSON.stringify(userProfile?.customBackgrounds) !== JSON.stringify(customBackgrounds) ||
        JSON.stringify(userProfile?.subjects) !== JSON.stringify(subjects);

      if (!hasChanges) return;

      const settingsToSave = {
        backgroundUrl,
        backgroundBlur,
        backgroundOpacity,
        customBackgrounds,
        subjects
      };
      
      const estimatedSize = JSON.stringify(settingsToSave).length;
      
      if (estimatedSize < 800000) { // 800KB safety margin
        setDoc(userRef, settingsToSave, { merge: true })
          .catch(e => console.error("Error updating background in Firestore", e));
      } else {
        console.warn("Background settings too large to save to Firestore. Try removing some custom backgrounds.");
        setDoc(userRef, {
          backgroundUrl: backgroundUrl.length > 100000 ? 'none' : backgroundUrl,
          backgroundBlur,
          backgroundOpacity
        }, { merge: true }).catch(e => console.error("Error updating minimal background in Firestore", e));
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [backgroundUrl, backgroundBlur, backgroundOpacity, customBackgrounds, user, userProfile]);
  const [lastContent, setLastContent] = useState<ContentItem | ContentItem[] | null>(null);
  const [lastFileName, setLastFileName] = useState('');
  const [pendingContent, setPendingContent] = useState<ContentItem | ContentItem[] | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(true);
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [srsItems, setSrsItems] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect'>('all');
  const [showDashboard, setShowDashboard] = useState(false);
  const [showStudyMode, setShowStudyMode] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showBancaDropdown, setShowBancaDropdown] = useState(false);
  const [showQuantityDropdown, setShowQuantityDropdown] = useState(false);
  
  // Chat with Professor
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Settings
  const [questionCount, setQuestionCount] = useState(20);
  const [selectedExamBoards, setSelectedExamBoards] = useState<string[]>(['Geral']);
  const [isBancaMindset, setIsBancaMindset] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [recycleBin, setRecycleBin] = useState<QuizResult[]>([]);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [showExitQuizConfirmation, setShowExitQuizConfirmation] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('themeColor') as ThemeColor;
    return (saved && THEME_CONFIG[saved]) ? saved : 'emerald';
  });

  const [customColor, setCustomColor] = useState<string>(() => {
    return localStorage.getItem('customThemeColor') || '#6366f1';
  });

  useEffect(() => {
    if (themeColor === 'custom') {
      document.documentElement.style.setProperty('--theme-primary', customColor);
      document.documentElement.style.setProperty('--theme-secondary', customColor);
      // Add opacity for background colors if it's a hex color
      if (customColor.startsWith('#')) {
        document.documentElement.style.setProperty('--theme-bg', customColor + '10');
        document.documentElement.style.setProperty('--theme-bg-dark', customColor + '20');
      } else {
        document.documentElement.style.setProperty('--theme-bg', customColor);
        document.documentElement.style.setProperty('--theme-bg-dark', customColor);
      }
      localStorage.setItem('customThemeColor', customColor);
      
      if (user && userProfile?.customThemeColor !== customColor) {
        const timer = setTimeout(() => {
          const userRef = doc(db, 'users', user.uid);
          setDoc(userRef, { customThemeColor: customColor }, { merge: true })
            .catch(e => console.error("Error updating customThemeColor in Firestore", e));
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [themeColor, customColor, user, userProfile]);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Dashboard Filters
  const [dashboardDateFilter, setDashboardDateFilter] = useState<string[]>(['all']);
  const [dashboardSubjectFilter, setDashboardSubjectFilter] = useState<string>('all');

  // Study Mode Filters
  const [studyModeDateFilter, setStudyModeDateFilter] = useState<string[]>(['all']);
  const [studyModeSubjectFilter, setStudyModeSubjectFilter] = useState<string>('all');

  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('studySubjects');
    if (saved) return JSON.parse(saved);
    return [
      'Seguridade Social',
      'Direito Constitucional',
      'Direito Administrativo',
      'Ética no Serviço Público',
      'Português',
      'Raciocínio Lógico Matemático',
      'Informática',
      'Redação Oficial'
    ];
  });

  useEffect(() => {
    localStorage.setItem('studySubjects', JSON.stringify(subjects));
  }, [subjects]);

  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectInput.trim()) return;
    if (subjects.includes(newSubjectInput.trim())) {
      setNewSubjectInput('');
      return;
    }
    setSubjects(prev => [...prev, newSubjectInput.trim()].sort());
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subject: string) => {
    setSubjects(prev => prev.filter(s => s !== subject));
  };

  const handleDeleteSubjectHistory = async (subject: string) => {
    if (!user) return;
    
    try {
      const resultsToDelete = history.filter(res => {
        const quizSubjects = new Set(res.questions.map(q => normalizeSubject(q.subject || res.fileName)));
        return quizSubjects.has(subject);
      });

      if (resultsToDelete.length === 0) return;

      const batch = writeBatch(db);
      resultsToDelete.forEach(res => {
        const docRef = doc(db, 'results', res.id);
        batch.update(docRef, { 
          deleted: true, 
          deletedAt: Timestamp.now() 
        });
      });

      await batch.commit();
      setSubjectToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir histórico:", error);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'results', id), { 
        deleted: true, 
        deletedAt: Timestamp.now() 
      });
      setQuizToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `results/${id}`);
    }
  };

  const handleDeleteQuizzes = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, 'results', id), { 
          deleted: true, 
          deletedAt: Timestamp.now() 
        });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'results/multiple');
    }
  };

  const handleDeleteSubjectsHistory = async (subjects: string[]) => {
    if (!user || subjects.length === 0) return;
    try {
      const batch = writeBatch(db);
      const subjectsSet = new Set(subjects);
      
      const resultsToDelete = history.filter(res => {
        const quizSubjects = new Set(res.questions.map(q => normalizeSubject(q.subject || res.fileName)));
        return Array.from(quizSubjects).some(s => subjectsSet.has(s));
      });

      resultsToDelete.forEach(res => {
        batch.update(doc(db, 'results', res.id), { 
          deleted: true, 
          deletedAt: Timestamp.now() 
        });
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'results/subjects');
    }
  };

  const handleRestoreQuiz = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'results', id), { 
        deleted: false, 
        deletedAt: null 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `results/${id}`);
    }
  };

  const handleRestoreQuizzes = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, 'results', id), { 
          deleted: false, 
          deletedAt: null 
        });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'results/multiple');
    }
  };

  const handlePermanentlyDeleteQuiz = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'results', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `results/${id}`);
    }
  };

  const handlePermanentlyDeleteQuizzes = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, 'results', id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'results/multiple');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;
    
    const statuses = [
      "Analisando materiais...",
      "Extraindo conceitos chave...",
      "Estruturando questões...",
      "Simulando estilo da banca...",
      "Refinando alternativas...",
      "Finalizando quiz personalizado..."
    ];

    if (state === 'loading') {
      setLoadingProgress(0);
      setLoadingStatus(statuses[0]);
      
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 98) return prev;
          const increment = Math.max(0.05, (100 - prev) / 40);
          return Math.min(98, prev + increment);
        });
      }, 100);

      let statusIdx = 0;
      statusInterval = setInterval(() => {
        statusIdx = (statusIdx + 1) % statuses.length;
        setLoadingStatus(statuses[statusIdx]);
      }, 3000);
    } else {
      setLoadingProgress(0);
      setLoadingStatus('');
    }
    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [state]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;

    const statuses = [
      "Consultando base de conhecimento...",
      "Aprofundando conceitos...",
      "Criando mnemônicos...",
      "Buscando referências extras...",
      "Formatando conteúdo pedagógico..."
    ];

    if (isDeepDiveLoading) {
      setDeepDiveProgress(0);
      setDeepDiveStatus(statuses[0]);

      interval = setInterval(() => {
        setDeepDiveProgress(prev => {
          if (prev >= 98) return prev;
          const increment = Math.max(0.1, (100 - prev) / 30);
          return Math.min(98, prev + increment);
        });
      }, 100);

      let statusIdx = 0;
      statusInterval = setInterval(() => {
        statusIdx = (statusIdx + 1) % statuses.length;
        setDeepDiveStatus(statuses[statusIdx]);
      }, 2500);
    } else {
      setDeepDiveProgress(0);
      setDeepDiveStatus('');
    }
    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [isDeepDiveLoading]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const theme = THEME_CONFIG[themeColor];

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
    if (user && userProfile?.themeColor !== themeColor) {
      const timer = setTimeout(() => {
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, { themeColor }, { merge: true })
          .catch(e => console.error("Error updating themeColor in Firestore", e));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [themeColor, user, userProfile]);
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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Create/Update user profile in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              createdAt: Timestamp.now(),
              role: 'user'
            });
          }
        } catch (error) {
          console.error("Error updating user profile", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Load history from Firestore
  useEffect(() => {
    if (!isAuthReady || !user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'results'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : (data.deletedAt ? new Date(data.deletedAt) : undefined)
        } as QuizResult;
      });
      setHistory(results.filter(r => r.deleted !== true));
      setRecycleBin(results.filter(r => r.deleted === true));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'results');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // User Profile Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setUserProfile(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // SRS Items Listener (Registry Version)
  useEffect(() => {
    if (!isAuthReady || !user) {
      setSrsItems([]);
      return;
    }

    const registryRef = doc(db, 'srs_registries', user.uid);
    const unsubscribe = onSnapshot(registryRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const items = Object.entries(data.items || {}).map(([id, item]: [string, any]) => ({
          ...item,
          id,
          nextReviewDate: item.nextReviewDate instanceof Timestamp ? item.nextReviewDate.toDate() : new Date(item.nextReviewDate)
        }));
        // Sort by nextReviewDate in memory
        items.sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
        setSrsItems(items);
      } else {
        // Fallback to legacy srs collection if registry doesn't exist yet
        const q = query(
          collection(db, 'srs'),
          where('uid', '==', user.uid),
          orderBy('nextReviewDate', 'asc')
        );
        
        getDocs(q).then(snapshot => {
          if (!snapshot.empty) {
            const legacyItems = snapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id,
              nextReviewDate: doc.data().nextReviewDate instanceof Timestamp ? doc.data().nextReviewDate.toDate() : new Date(doc.data().nextReviewDate)
            }));
            setSrsItems(legacyItems);
          }
        }).catch(e => console.error("Error loading legacy SRS", e));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'srs_registries');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // Check API Key
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
  }, []);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [jumpToQuestion, setJumpToQuestion] = useState('');
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const deepDivePdfRef = useRef<HTMLDivElement>(null);

  const handleJumpToQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpToQuestion);
    if (!isNaN(num) && num >= 1 && num <= questions.length) {
      setCurrentIndex(num - 1);
      setJumpToQuestion('');
    }
  };

  // Timer Logic
  useEffect(() => {
    if (state === 'active' && answers[currentIndex] === null && isQuestionStarted && !isPaused) {
      timerRef.current = setInterval(() => {
        setQuestionTime(prev => {
          if (prev <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
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
        } else if (file.type && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
          const base64 = await fileToBase64(file);
          contents.push({ data: base64, mimeType: file.type });
        } else {
          // Fallback for unknown or empty types - try to read as text
          try {
            const text = await file.text();
            if (text && text.trim().length > 0) {
              contents.push(text);
            }
          } catch (err) {
            console.warn(`Could not read file ${file.name} as text:`, err);
          }
        }
      }

      const cleanFileNames = fileNames.map(name => name.replace(/^\d+[\s\.\-\:]*/, '').trim());
      const combinedFileName = cleanFileNames.join(', ');

      setPendingContent(contents);
      setPendingFileName(combinedFileName);
      // Don't call startQuiz immediately
      setState('idle');
    } catch (err: any) {
      setError(err.message || "Erro ao processar os materiais.");
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
    console.log("Iniciando geração de quiz...", { count: questionCount, fileName, selectedSubject });
    setState('loading');
    setError(null);
    setShowDashboard(false);
    setLastContent(content);
    const cleanName = selectedSubject || fileName
      .replace(/^\d+[\s\.\-\:]*/, '')
      .replace(/\d+\s*arquivos\s*\(/i, '')
      .replace(/\s*arquivos\s*/i, '')
      .replace(/\(|\)/g, '')
      .replace(/\.\.\.$/, '')
      .trim();
    setLastFileName(cleanName);
    setActiveResultId(null);
    try {
      setLoadingProgress(10);
      
      // Derive format based on selections
      const hasCebraspe = selectedExamBoards.includes('Cebraspe');
      const hasMC = selectedExamBoards.includes('Múltipla Escolha') || 
                  selectedExamBoards.some(b => b !== 'Cebraspe' && b !== 'Múltipla Escolha') || 
                  selectedExamBoards.includes('Geral');
      
      let derivedFormat: QuizFormat = 'multiple-choice';
      if (hasCebraspe && hasMC) derivedFormat = 'both';
      else if (hasCebraspe) derivedFormat = 'cebraspe';
      
      const boardsToPass = selectedExamBoards.filter(b => b !== 'Múltipla Escolha' && b !== 'Geral');
      const examBoardStr = boardsToPass.length > 0 ? boardsToPass.join(', ') : 'Geral';

      console.log("Chamando generateQuiz...", { count: questionCount, format: derivedFormat, board: examBoardStr, isBancaMindset });
      const generatedQuestions = await generateQuiz(content, questionCount, derivedFormat, examBoardStr, isBancaMindset, subjects);
      
      // If a subject was selected, ensure all questions are categorized under it
      const finalQuestions = generatedQuestions.map(q => ({
        ...q,
        subject: selectedSubject || q.subject || 'Geral',
        options: q.options || [],
        explanation: q.explanation || '',
        hint: q.hint || '',
        id: q.id || Math.random().toString(36).substr(2, 9)
      }));

      setLoadingProgress(90);
      console.log("Quiz gerado com sucesso!", { count: finalQuestions?.length });
      
      if (!finalQuestions || finalQuestions.length === 0) {
        throw new Error("Não foi possível gerar o quiz com o conteúdo fornecido.");
      }

      setQuestions(finalQuestions);
      setAnswers(new Array(finalQuestions.length).fill(null));
      setQuestionTimes(new Array(finalQuestions.length).fill(0));
      setCurrentIndex(0);
      setTotalTime(0);
      setQuestionTime(timeAlertThreshold);
      setIsQuestionStarted(false);
      setIsPaused(false);
      setState('active');
      setShowDeepDive(false);
      setIsDeepDiveExpanded(false);
      setIsReviewMode(false);
      
      // Clear pending content
      setPendingContent(null);
      setPendingFileName('');
      setSelectedSubject('');
    } catch (err: any) {
      console.error("Erro ao gerar quiz:", err);
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

  const handleCreateQuiz = () => {
    let contentToUse = pendingContent;
    let nameToUse = pendingFileName;

    if (!contentToUse && urlInput.trim()) {
      const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
      if (urls.length > 0) {
        contentToUse = urls;
        nameToUse = urls.length === 1 ? urls[0] : `${urls.length} links`;
      }
    }

    if (!contentToUse) {
      setError("Por favor, selecione um arquivo ou insira um link primeiro.");
      return;
    }
    if (!selectedSubject.trim()) {
      setError("Por favor, informe o nome da matéria para organizar seu quiz.");
      return;
    }
    startQuiz(contentToUse, nameToUse);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    
    const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) {
      setError("Por favor, insira pelo menos um link válido (começando com http).");
      return;
    }
    
    setPendingContent(urls);
    setPendingFileName(urls.length === 1 ? urls[0] : `${urls.length} links`);
    setUrlInput('');
  };

  const getDynamicFontSize = (text: string, baseSize: string = "text-sm") => {
    if (!text) return baseSize;
    if (text.length > 100) return "text-[10px]";
    if (text.length > 60) return "text-[11px]";
    if (text.length > 30) return "text-xs";
    return baseSize;
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
    
    // Update history with user message first
    const currentHistory = [...chatHistory, { role: 'user' as const, text: userMsg }];
    setChatHistory(currentHistory);
    
    setIsChatLoading(true);
    try {
      // Pass the history BEFORE the current message, as chatWithProfessor adds the current message
      const response = await chatWithProfessor(questions[currentIndex], chatHistory, userMsg);
      setChatHistory(current => [...current, { role: 'model' as const, text: response }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory(current => [...current, { role: 'model' as const, text: "Desculpe, tive um problema ao processar sua pergunta. Tente novamente." }]);
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
    newQuestionTimes[currentIndex] = timeAlertThreshold - questionTime;
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
    if (!nextShow) setIsDeepDiveExpanded(false);
    if (nextShow) {
      setChatHistory([]); // Reset chat when opening
      fetchDeepDiveForCurrentQuestion();
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      let nextIdx = currentIndex + 1;
      
      if (isReviewMode && reviewFilter === 'incorrect') {
        while (nextIdx < questions.length && answers[nextIdx] === questions[nextIdx].correctAnswer) {
          nextIdx++;
        }
      }

      if (nextIdx < questions.length) {
        setCurrentIndex(nextIdx);
        setQuestionTime(timeAlertThreshold);
        setIsQuestionStarted(true);
        setShowHint(false);
        if (!isReviewMode) {
          setShowDeepDive(false);
          setIsDeepDiveExpanded(false);
        }
      } else {
        if (isReviewMode) {
          setState('finished');
        } else {
          finishQuiz();
        }
      }
    } else {
      if (isReviewMode) {
        setState('finished');
      } else {
        finishQuiz();
      }
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      let prevIdx = currentIndex - 1;
      
      if (isReviewMode && reviewFilter === 'incorrect') {
        while (prevIdx >= 0 && answers[prevIdx] === questions[prevIdx].correctAnswer) {
          prevIdx--;
        }
      }

      if (prevIdx >= 0) {
        setCurrentIndex(prevIdx);
        setShowHint(false);
      }
    }
  };

  const updateStreakAndStats = async (correct: number, total: number) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const now = new Date();
        const lastActivity = data.lastActivity ? (data.lastActivity instanceof Timestamp ? data.lastActivity.toDate() : new Date(data.lastActivity)) : null;
        
        let newStreak = data.streak || 0;
        if (lastActivity) {
          // Reset time to start of day for comparison
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const lastDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
          const diffTime = today.getTime() - lastDay.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          } else if (diffDays === 0) {
            // Already active today, streak stays the same
          }
        } else {
          newStreak = 1;
        }

        const updates: any = {
          streak: newStreak,
          lastActivity: Timestamp.fromDate(now),
          totalCorrectAnswers: (data.totalCorrectAnswers || 0) + correct,
          totalQuizzesTaken: (data.totalQuizzesTaken || 0) + 1
        };

        // Check achievements
        const currentAchievements = data.achievements || [];
        const newAchievements = [...currentAchievements];
        
        if (newStreak >= 7 && !newAchievements.includes('streak_7')) newAchievements.push('streak_7');
        if (newStreak >= 30 && !newAchievements.includes('streak_30')) newAchievements.push('streak_30');
        if (updates.totalQuizzesTaken >= 10 && !newAchievements.includes('quizzes_10')) newAchievements.push('quizzes_10');
        if (updates.totalCorrectAnswers >= 100 && !newAchievements.includes('correct_100')) newAchievements.push('correct_100');

        if (newAchievements.length > currentAchievements.length) {
          updates.achievements = newAchievements;
        }

        await setDoc(userRef, updates, { merge: true });
      }
    } catch (error) {
      console.error("Error updating streak and stats", error);
    }
  };

  const addToSRS = async (questions: QuizQuestion[], answers: (string | null)[]) => {
    if (!user) return;
    
    try {
      const registryRef = doc(db, 'srs_registries', user.uid);
      const registryDoc = await getDoc(registryRef);
      const registryData = registryDoc.exists() ? registryDoc.data() : { items: {} };
      const items = { ...registryData.items };
      
      let hasNewItems = false;
      questions.forEach((q, idx) => {
        const isCorrect = answers[idx] === q.correctAnswer;
        const questionId = q.id || q.question.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_');
        
        const nextReview = new Date();
        if (isCorrect) {
          nextReview.setDate(nextReview.getDate() + 1);
        }
        
        items[questionId] = {
          uid: user.uid,
          questionId: questionId,
          question: q.question || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer || '',
          explanation: q.explanation || '',
          subject: q.subject || 'Geral',
          interval: isCorrect ? 1 : 0,
          easeFactor: 2.5,
          nextReviewDate: Timestamp.fromDate(nextReview),
          consecutiveCorrect: isCorrect ? 1 : 0
        };
        hasNewItems = true;
      });
      
      if (hasNewItems) {
        await setDoc(registryRef, { uid: user.uid, items, lastUpdated: Timestamp.now() }, { merge: true });
      }
    } catch (error) {
      console.error("Error adding to SRS registry", error);
      handleFirestoreError(error, OperationType.WRITE, `srs_registries/${user.uid}`);
    }
  };

  const updateSRSAfterReview = async (results: any[]) => {
    if (!user) return;
    
    try {
      const registryRef = doc(db, 'srs_registries', user.uid);
      const registryDoc = await getDoc(registryRef);
      
      if (registryDoc.exists()) {
        const registryData = registryDoc.data();
        const items = { ...registryData.items };
        
        results.forEach(res => {
          const item = items[res.id];
          if (item) {
            const isCorrect = res.userAnswer === res.correctAnswer;
            
            // Simple SRS algorithm (SuperMemo-2 like)
            let interval = item.interval || 0;
            let easeFactor = item.easeFactor || 2.5;
            let consecutiveCorrect = item.consecutiveCorrect || 0;
            
            if (isCorrect) {
              consecutiveCorrect += 1;
              if (consecutiveCorrect === 1) interval = 1;
              else if (consecutiveCorrect === 2) interval = 6;
              else interval = Math.round(interval * easeFactor);
              
              easeFactor = Math.max(1.3, easeFactor + 0.1);
            } else {
              consecutiveCorrect = 0;
              interval = 1;
              easeFactor = Math.max(1.3, easeFactor - 0.2);
            }
            
            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + interval);
            
            items[res.id] = {
              ...item,
              interval,
              easeFactor,
              consecutiveCorrect,
              nextReviewDate: Timestamp.fromDate(nextReview),
              lastReviewed: Timestamp.fromDate(new Date())
            };
          }
        });
        
        await setDoc(registryRef, { uid: user.uid, items, lastUpdated: Timestamp.now() }, { merge: true });
      } else {
        // Fallback to legacy individual updates if registry doesn't exist
        const batch = writeBatch(db);
        results.forEach(res => {
          const srsItem = srsItems.find(item => item.questionId === res.id);
          if (srsItem) {
            const isCorrect = res.userAnswer === res.correctAnswer;
            let { interval, easeFactor, consecutiveCorrect } = srsItem;
            
            if (isCorrect) {
              consecutiveCorrect += 1;
              if (consecutiveCorrect === 1) interval = 1;
              else if (consecutiveCorrect === 2) interval = 6;
              else interval = Math.round(interval * easeFactor);
              easeFactor = Math.max(1.3, easeFactor + 0.1);
            } else {
              consecutiveCorrect = 0;
              interval = 1;
              easeFactor = Math.max(1.3, easeFactor - 0.2);
            }
            
            const nextReviewDate = new Date();
            nextReviewDate.setDate(nextReviewDate.getDate() + interval);
            
            const itemRef = doc(db, 'srs', srsItem.id);
            batch.update(itemRef, {
              interval,
              easeFactor,
              consecutiveCorrect,
              nextReviewDate: Timestamp.fromDate(nextReviewDate),
              lastReviewed: Timestamp.fromDate(new Date())
            });
          }
        });
        await batch.commit();
      }
    } catch (error) {
      console.error("Error updating SRS registry after review", error);
      handleFirestoreError(error, OperationType.WRITE, `srs_registries/${user.uid}`);
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

    // Finish UI immediately
    setState('finished');
    setShowDeepDive(false);
    setIsDeepDiveExpanded(false);

    if (user) {
      // Save to Firestore in background
      (async () => {
        try {
          const resultRef = doc(collection(db, 'results'));
          
          // Estimate size and omit content if it's likely too large for Firestore (1MB limit)
          // A rough estimate: string length + some overhead
          const contentStr = JSON.stringify(lastContent || '');
          const resultToSave = {
            ...result,
            uid: user.uid,
            date: Timestamp.fromDate(result.date),
            id: resultRef.id,
            // If content is too large (> 800KB to be safe), omit it from Firestore
            content: contentStr.length > 800000 ? { type: 'text', content: 'Conteúdo muito grande para ser salvo no histórico.' } : lastContent
          };

          await setDoc(resultRef, resultToSave);
          
          // Update stats and SRS
          await updateStreakAndStats(correct, questions.length);
          
          if (isReviewMode) {
            // If we are in review mode, update existing SRS items
            const reviewResults = questions.map((q, i) => ({
              id: q.id,
              userAnswer: answers[i],
              correctAnswer: q.correctAnswer
            }));
            await updateSRSAfterReview(reviewResults);
          } else {
            // If it's a new quiz, add questions to SRS
            await addToSRS(questions, answers);
          }
        } catch (e) {
          console.error("Failed to save history to Firestore in background", e);
          if (e instanceof Error) {
            try {
              const errInfo = JSON.parse(e.message);
              setError(errInfo.error);
            } catch {
              setError("Erro ao salvar histórico no banco de dados.");
            }
          }
        }
      })();
    } else {
      // Fallback to local history if not logged in
      setHistory(prev => [result, ...prev]);
    }
  };

  const resetQuiz = () => {
    setState('idle');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setQuestionTimes([]);
    setTotalTime(0);
    setQuestionTime(timeAlertThreshold);
    setShowDeepDive(false);
    setIsDeepDiveExpanded(false);
    setIsReviewMode(false);
  };

  const downloadResults = async () => {
    if (!pdfContentRef.current) {
      console.error("PDF content ref is null");
      return;
    }
    
    setIsGeneratingPDF(true);
    try {
      // Small delay to ensure any dynamic content is ready
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const container = pdfContentRef.current;
      
      // Temporarily make it visible for capture if needed, 
      // but html2canvas onclone should handle it.
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        onclone: (clonedDoc) => {
          const element = clonedDoc.getElementById('pdf-content-container');
          if (element) {
            element.style.position = 'relative';
            element.style.left = '0';
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.zIndex = '1000';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`resultado_quiz_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      // Fallback to text only if PDF fails completely
      const correct = answers.filter((ans, idx) => ans === questions[idx]?.correctAnswer).length;
      const precision = Math.round((correct / questions.length) * 100);
      let text = `RESULTADOS DO QUIZ - ${lastFileName || 'Documento'}\n`;
      text += `Data: ${format(new Date(), "dd/MM/yyyy HH:mm")}\n`;
      text += `Acertos: ${correct}\nErros: ${questions.length - correct}\nPrecisão: ${precision}%\nTempo Total: ${formatTime(totalTime)}\n\n`;
      text += `--- DETALHES DAS QUESTÕES ---\n\n`;
      questions.forEach((q, i) => {
        text += `Questão ${i + 1}: ${q.question}\n`;
        text += `Sua Resposta: ${answers[i] || 'Não respondida'}\n`;
        text += `Resposta Correta: ${q.correctAnswer}\n`;
        text += `Resultado: ${answers[i] === q.correctAnswer ? 'CORRETO' : 'INCORRETO'}\n`;
        text += `Explicação: ${q.explanation}\n\n`;
      });
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resultado_quiz_${format(new Date(), "yyyyMMdd_HHmm")}.txt`;
      a.click();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadDeepDivePDF = async () => {
    if (!deepDivePdfRef.current || !currentQuestion.deepDive) return;
    
    setIsGeneratingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const container = deepDivePdfRef.current;
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        onclone: (clonedDoc) => {
          const element = clonedDoc.getElementById('deep-dive-pdf-container');
          if (element) {
            element.style.position = 'relative';
            element.style.left = '0';
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.zIndex = '1000';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`explicacao_questao_${currentIndex + 1}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF do aprofundamento:", error);
      const text = `APROFUNDAMENTO - QUESTÃO ${currentIndex + 1}\n\n${currentQuestion.question}\n\nEXPLICAÇÃO:\n${currentQuestion.deepDive}`;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `explicacao_questao_${currentIndex + 1}.txt`;
      a.click();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const redoQuiz = () => {
    setAnswers(new Array(questions.length).fill(null));
    setQuestionTimes(new Array(questions.length).fill(0));
    setCurrentIndex(0);
    setTotalTime(0);
    setQuestionTime(timeAlertThreshold);
    setIsQuestionStarted(false);
    setState('active');
    setShowDeepDive(false);
    setIsDeepDiveExpanded(false);
    setIsReviewMode(false);
  };

  const reviewQuiz = (filter: 'all' | 'incorrect' = 'all') => {
    setReviewFilter(filter);
    setIsReviewMode(true);
    
    if (filter === 'incorrect') {
      const firstIncorrect = questions.findIndex((q, i) => answers[i] !== q.correctAnswer);
      setCurrentIndex(firstIncorrect !== -1 ? firstIncorrect : 0);
    } else {
      setCurrentIndex(0);
    }
    
    setIsQuestionStarted(true);
    setState('active');
    setShowDeepDive(false);
  };

  const practiceIncorrect = (incorrectQuestions: QuizQuestion[], fileName: string) => {
    const sanitizedQuestions = incorrectQuestions.map(q => ({
      ...q,
      options: q.options || [],
      explanation: q.explanation || '',
      hint: q.hint || '',
      id: q.id || Math.random().toString(36).substr(2, 9)
    }));
    setQuestions(sanitizedQuestions);
    setAnswers(new Array(sanitizedQuestions.length).fill(null));
    setQuestionTimes(new Array(sanitizedQuestions.length).fill(0));
    setCurrentIndex(0);
    setTotalTime(0);
    setQuestionTime(timeAlertThreshold);
    setIsQuestionStarted(false);
    setState('active');
    setShowDeepDive(false);
    setIsDeepDiveExpanded(false);
    setIsReviewMode(false);
    setShowStudyMode(false);
    setShowDashboard(false);
    setLastFileName(fileName);
    setLastContent(null); // We don't have the content for a mixed review
  };

  const retryIncorrectOnly = () => {
    const incorrectQuestions = questions.filter((q, i) => answers[i] !== q.correctAnswer);
    if (incorrectQuestions.length > 0) {
      practiceIncorrect(incorrectQuestions, lastFileName);
    }
  };

  const onPracticeTopic = (topicName: string, quizIds?: string[]) => {
    console.log("Tentando praticar tópico:", topicName, "com quizzes:", quizIds);
    
    if (quizIds && quizIds.length > 0) {
      const selectedResults = history.filter(res => quizIds.includes(res.id));
      const combinedContent: ContentItem[] = [];
      
      selectedResults.forEach(res => {
        if (res.content) {
          if (Array.isArray(res.content)) {
            combinedContent.push(...res.content);
          } else {
            combinedContent.push(res.content);
          }
        }
      });

      if (combinedContent.length > 0) {
        console.log("Iniciando quiz com conteúdo combinado de", selectedResults.length, "quizzes");
        startQuiz(combinedContent, topicName);
        setShowDashboard(false);
        setShowStudyMode(false);
      } else {
        setError("Não foi possível recuperar o conteúdo dos quizzes selecionados.");
      }
      return;
    }

    // Fallback to original behavior if no quizIds provided
    const lastResult = history.find(res => 
      res.questions.some(q => normalizeSubject(q.subject || res.fileName) === topicName) ||
      normalizeSubject(res.fileName) === topicName
    );
    
    if (lastResult && lastResult.content) {
      // Check if it's the "too large" placeholder
      if (typeof lastResult.content === 'object' && 'content' in lastResult.content && (lastResult.content as any).content === 'Conteúdo muito grande para ser salvo no histórico.') {
        setError("O conteúdo original deste assunto é muito grande para ser recuperado do histórico.");
        return;
      }
      console.log("Conteúdo encontrado, iniciando quiz...", lastResult.fileName);
      startQuiz(lastResult.content, lastResult.fileName);
      setShowDashboard(false);
      setShowStudyMode(false);
    } else {
      console.warn("Could not find content for topic:", topicName);
      setError(`Não foi possível encontrar o conteúdo original para a matéria "${topicName}". Tente gerar um novo quiz a partir de um arquivo.`);
    }
  };

  const handleHistoryClick = (res: QuizResult) => {
    const sanitizedQuestions = res.questions.map(q => ({
      ...q,
      options: q.options || [],
      explanation: q.explanation || '',
      hint: q.hint || '',
      id: q.id || Math.random().toString(36).substr(2, 9)
    }));
    setQuestions(sanitizedQuestions);
    setAnswers(res.answers);
    setQuestionTimes(new Array(sanitizedQuestions.length).fill(0));
    setCurrentIndex(0);
    setTotalTime(res.timeSpent);
    setQuestionTime(timeAlertThreshold);
    setIsQuestionStarted(true);
    setIsReviewMode(true);
    setState('active');
    setShowDeepDive(false);
    setSidebarOpen(false);
    setLastContent(res.content || null);
    const cleanName = res.fileName
      .replace(/^\d+[\s\.\-\:]*/, '')
      .replace(/\d+\s*arquivos\s*\(/i, '')
      .replace(/\s*arquivos\s*/i, '')
      .replace(/\(|\)/g, '')
      .replace(/\.\.\.$/, '')
      .trim();
    setLastFileName(cleanName);
    setActiveResultId(res.id);
  };

  const generateAnother = () => {
    if (lastContent) {
      startQuiz(lastContent, lastFileName);
    }
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      try {
        await updateDoc(doc(db, 'results', id), { 
          deleted: true, 
          deletedAt: Timestamp.now() 
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `results/${id}`);
      }
    } else {
      // Local fallback
      setHistory(prev => prev.filter(h => h.id !== id));
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

  const correctCount = answers.filter((ans, idx) => ans === questions[idx]?.correctAnswer).length;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const isCorrect = currentAnswer === currentQuestion?.correctAnswer;

  const itemsDue = React.useMemo(() => {
    const now = new Date();
    return srsItems.filter(item => item.nextReviewDate <= now);
  }, [srsItems]);

  const handleStartSRSReview = () => {
    if (itemsDue.length === 0) return;
    
    setQuestions(itemsDue.map(item => ({
      id: item.questionId,
      question: item.question,
      options: item.options,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      subject: item.subject,
      hint: '',
      type: 'multiple-choice',
      difficulty: 'medium'
    })));
    setAnswers(new Array(itemsDue.length).fill(null));
    setCurrentIndex(0);
    setState('active');
    setIsReviewMode(true);
    setShowDashboard(false);
  };

  return (
    <div className={cn("min-h-screen bg-[#F5F5F0] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 font-sans flex overflow-hidden relative", theme.selection)}>
      
      {/* Background Watermark */}
      {backgroundUrl !== 'none' && (
        <div 
          className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000"
          style={{ 
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${backgroundBlur}px)`,
            opacity: backgroundOpacity / 100
          }}
        />
      )}

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: sidebarOpen ? 320 : 0, 
          opacity: sidebarOpen ? 1 : 0,
          x: sidebarOpen ? 0 : -320
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/20 dark:border-slate-800/50 flex-shrink-0 relative overflow-hidden flex flex-col z-[70]",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0"
        )}
      >
        <div className="w-[320px] h-full flex flex-col p-6 space-y-8">
          <div 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between cursor-pointer group/header"
          >
            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-slate-100 group-hover/header:opacity-70 transition-opacity">
              <Settings size={20} className={cn(theme.icon, "group-hover/header:rotate-45 transition-transform")} />
              Configurações
            </h3>
            <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg dark:text-slate-400 transition-colors">
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-black/60 dark:text-slate-400 uppercase tracking-wider">Plano de Fundo</label>
                <span className="text-[10px] text-black/40 dark:text-white/40 font-bold uppercase">
                  {customBackgrounds.length}/15 Arquivos
                </span>
              </div>
              <button 
                onClick={() => fileInputBackgroundRef.current?.click()}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <PlusCircle size={10} />
                Adicionar
              </button>
              <input 
                type="file" 
                ref={fileInputBackgroundRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleCustomBackgroundUpload}
              />
            </div>

            {/* Controls */}
            <div className="space-y-3 p-3 bg-black/5 dark:bg-white/5 rounded-2xl">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-black/40 dark:text-white/40 uppercase">
                  <span>Desfoque</span>
                  <span>{backgroundBlur}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  value={backgroundBlur} 
                  onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                  className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-black/40 dark:text-white/40 uppercase">
                  <span>Opacidade</span>
                  <span>{backgroundOpacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={backgroundOpacity} 
                  onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                  className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {[...defaultBackgrounds, ...customBackgrounds].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setBackgroundUrl(opt.url || 'none')}
                  className={cn(
                    "relative h-16 rounded-xl overflow-hidden border-2 transition-all group cursor-pointer",
                    (backgroundUrl === opt.url || (opt.id === 'none' && backgroundUrl === 'none'))
                      ? theme.border 
                      : "border-black/5 dark:border-slate-800 hover:border-black/20 dark:hover:border-white/20"
                  )}
                >
                  {opt.id === 'none' ? (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-[10px] font-bold opacity-40 uppercase">Nenhum</span>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={opt.url} 
                        alt={opt.name} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-end p-1.5">
                        <span className="text-[8px] font-bold text-white uppercase truncate">{opt.name}</span>
                      </div>
                      
                      {/* Delete Button for custom backgrounds */}
                      {opt.id.startsWith('custom-') && (
                        <button
                          onClick={(e) => handleDeleteBackground(opt.id, e)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-10"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
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
                    style={{ backgroundColor: 
                      themeColor === 'emerald' ? '#059669' : 
                      themeColor === 'navy' ? '#1e3a8a' :
                      themeColor === 'brown' ? '#78350f' :
                      themeColor === 'moss' ? '#3f6212' :
                      themeColor === 'slate' ? '#475569' :
                      themeColor === 'yellow' ? '#eab308' :
                      themeColor === 'amber' ? '#d97706' :
                      themeColor === 'rose' ? '#e11d48' :
                      themeColor === 'violet' ? '#7c3aed' :
                      themeColor === 'cyan' ? '#0891b2' :
                      themeColor === 'orange' ? '#ea580c' :
                      themeColor === 'fuchsia' ? '#c026d3' :
                      themeColor === 'indigo' ? '#4f46e5' :
                      themeColor === 'black' ? '#0f172a' : customColor
                    }} 
                  />
                  <span className="text-sm font-medium dark:text-slate-200">
                    {themeColor === 'emerald' ? 'Esmeralda' :
                     themeColor === 'navy' ? 'Azul Marinho' :
                     themeColor === 'brown' ? 'Marrom Clássico' :
                     themeColor === 'moss' ? 'Verde Musgo' :
                     themeColor === 'slate' ? 'Cinza' :
                     themeColor === 'yellow' ? 'Amarelo' :
                     themeColor === 'amber' ? 'Âmbar' :
                     themeColor === 'rose' ? 'Rosa' :
                     themeColor === 'violet' ? 'Violeta' :
                     themeColor === 'cyan' ? 'Ciano' :
                     themeColor === 'orange' ? 'Laranja' :
                     themeColor === 'fuchsia' ? 'Fúcsia' :
                     themeColor === 'indigo' ? 'Índigo' :
                     themeColor === 'black' ? 'Preto' : 'Personalizado'}
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
                        className="absolute left-0 right-0 top-full mt-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border-2 border-black/5 dark:border-slate-700 shadow-xl z-50 flex flex-col gap-4"
                      >
                        <div className="grid grid-cols-4 gap-2 max-h-[240px] overflow-y-auto p-1">
                          {[
                            { id: 'emerald', label: 'Esmeralda', color: '#059669' },
                            { id: 'navy', label: 'Azul Marinho', color: '#1e3a8a' },
                            { id: 'brown', label: 'Marrom Clássico', color: '#78350f' },
                            { id: 'moss', label: 'Verde Musgo', color: '#3f6212' },
                            { id: 'slate', label: 'Cinza', color: '#475569' },
                            { id: 'yellow', label: 'Amarelo', color: '#eab308' },
                            { id: 'amber', label: 'Âmbar', color: '#d97706' },
                            { id: 'rose', label: 'Rosa', color: '#e11d48' },
                            { id: 'violet', label: 'Violeta', color: '#7c3aed' },
                            { id: 'cyan', label: 'Ciano', color: '#0891b2' },
                            { id: 'orange', label: 'Laranja', color: '#ea580c' },
                            { id: 'fuchsia', label: 'Fúcsia', color: '#c026d3' },
                            { id: 'indigo', label: 'Índigo', color: '#4f46e5' },
                            { id: 'black', label: 'Preto', color: '#0f172a' },
                            { id: 'custom', label: 'Personalizado', color: customColor },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => {
                                setThemeColor(opt.id as ThemeColor);
                                if (opt.id !== 'custom') setShowColorPicker(false);
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
                              <span className="text-[10px] font-medium dark:text-slate-300 text-center leading-tight">{opt.label}</span>
                            </button>
                          ))}
                        </div>

                        {themeColor === 'custom' && (
                          <div className="pt-3 border-t border-black/5 dark:border-slate-700 space-y-2">
                            <label className="text-[10px] font-bold text-black/40 dark:text-slate-500 uppercase tracking-widest px-1">Escolher Cor</label>
                            <div className="flex items-center gap-3 px-1">
                              <input 
                                type="color" 
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                              />
                              <input 
                                type="text" 
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                className="flex-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg px-3 py-2 text-xs font-mono dark:text-slate-200"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        )}
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



          <div className="space-y-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <label className="block text-sm font-medium text-black/60 dark:text-slate-400 uppercase tracking-wider">Gerenciar Matérias</label>
            <form onSubmit={handleAddSubject} className="flex gap-2">
              <input 
                type="text"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                placeholder="Nova matéria..."
                className="flex-1 bg-white dark:bg-slate-800 border-2 border-black/5 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all dark:text-slate-200"
              />
              <button 
                type="submit"
                className={cn("p-2 rounded-xl text-white transition-all", theme.primary, theme.primaryHover)}
              >
                <PlusCircle size={18} />
              </button>
            </form>
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
              {subjects.map(subject => (
                <div 
                  key={subject}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-black/5 dark:border-slate-700 rounded-lg group"
                >
                  <span className="text-[10px] font-bold dark:text-slate-300">{subject}</span>
                  <button 
                    onClick={() => handleRemoveSubject(subject)}
                    className="text-black/20 dark:text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
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

            {/* Calendar Filter */}
            <div className="bg-black/5 dark:bg-slate-800/50 rounded-2xl p-3 mb-4 border border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-slate-500">
                  {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={16} className="text-black/40 dark:text-slate-500" />
                  </button>
                  <button 
                    onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ChevronRight size={16} className="text-black/40 dark:text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                  <span key={i} className="text-[10px] font-black text-black/20 dark:text-slate-600">{day}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const start = startOfWeek(startOfMonth(calendarMonth));
                  const end = endOfWeek(endOfMonth(calendarMonth));
                  const days = eachDayOfInterval({ start, end });
                  
                  return days.map((day, i) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                    const hasHistory = history.some(h => isSameDay(h.date, day));
                    const isTodayDate = isToday(day);

                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] font-bold transition-all relative",
                          !isCurrentMonth && "opacity-20",
                          isSelected ? "bg-black text-white dark:bg-white dark:text-black shadow-lg scale-110 z-10" : 
                          isTodayDate ? "bg-amber-500/20 text-amber-600 border border-amber-500/20" :
                          "hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-slate-400"
                        )}
                      >
                        {day.getDate()}
                        {hasHistory && !isSelected && (
                          <div className={cn("absolute bottom-1 w-1 h-1 rounded-full", isTodayDate ? "bg-amber-500" : "bg-black/20 dark:bg-white/20")} />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {(() => {
                const filteredHistory = history.filter(res => isSameDay(res.date, selectedDate));
                
                if (filteredHistory.length === 0) {
                  return (
                    <div className="text-center py-12 px-4">
                      <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                        <History size={20} className="text-black/20 dark:text-slate-600" />
                      </div>
                      <p className="text-xs font-bold text-black/30 dark:text-slate-500 uppercase tracking-widest">
                        Sem atividades em
                      </p>
                      <p className="text-sm font-black text-black/60 dark:text-slate-300">
                        {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  );
                }

                return filteredHistory.map((res) => {
                  const accuracy = res.total > 0 ? (res.correct / res.total) : 0;
                  const accuracyPercent = Math.round(accuracy * 100);
                  const incorrectCount = res.total - res.correct;
                  
                  const displayFileName = res.fileName
                    .replace(/^\d+[\s\.\-\:]*/, '')
                    .replace(/\d+\s*arquivos\s*\(/i, '')
                    .replace(/\s*arquivos\s*/i, '')
                    .replace(/\(|\)/g, '')
                    .replace(/\.\.\.$/, '')
                    .trim();
                  
                  return (
                    <div 
                      key={res.id} 
                      onClick={() => handleHistoryClick(res)}
                      className={cn(
                        "bg-[#F5F5F0] dark:bg-slate-800 p-4 rounded-2xl group relative transition-all cursor-pointer border-2",
                        activeResultId === res.id 
                          ? cn(theme.border, theme.borderDark, "border-opacity-40 dark:border-opacity-30") 
                          : "border-transparent",
                        `hover:${theme.bg}`, 
                        `dark:hover:${theme.bgDark}`, 
                        "hover:shadow-md active:scale-[0.98]"
                      )}
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
                      
                      <p className={cn("font-bold mb-3 pr-4 dark:text-slate-200 leading-tight", getDynamicFontSize(displayFileName, "text-sm"))}>
                        {displayFileName}
                      </p>
                      
                      {/* Detailed Accuracy Stacked Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-black/30 dark:text-slate-500 uppercase tracking-tighter">Desempenho</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{res.correct} C</span>
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{incorrectCount} E</span>
                            <span className={cn(
                              "text-[10px] font-black px-1.5 py-0.5 rounded-md ml-1",
                              accuracy >= 0.8 ? "bg-emerald-500/10 text-emerald-600" : 
                              accuracy >= 0.5 ? "bg-amber-500/10 text-amber-600" : 
                              "bg-rose-500/10 text-rose-600"
                            )}>
                              {accuracyPercent}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-black/5 dark:bg-slate-700 rounded-full overflow-hidden flex gap-[1px]">
                          {/* Correct Segment */}
                          {res.correct > 0 && (
                            <motion.div 
                              initial={{ flexGrow: 0 }}
                              animate={{ flexGrow: res.correct }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-emerald-500"
                              style={{ flexBasis: 0 }}
                            />
                          )}
                          {/* Incorrect Segment */}
                          {incorrectCount > 0 && (
                            <motion.div 
                              initial={{ flexGrow: 0 }}
                              animate={{ flexGrow: incorrectCount }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                              className="h-full bg-rose-500"
                              style={{ flexBasis: 0 }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-amber-500/10 rounded-lg">
                            <Trophy size={12} className="text-amber-500" />
                          </div>
                          <span className="text-xs font-bold dark:text-slate-300">{res.correct} / {res.total}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg text-black/60 dark:text-slate-400 border border-black/5 dark:border-white/5">
                          <Clock size={12} className="opacity-60" />
                          <span className="text-[10px] font-bold tracking-tight">{formatTime(res.timeSpent)}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Header */}
        <header className="border-b border-white/20 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group"
              >
                {sidebarOpen ? <ChevronLeft size={20} className="dark:text-slate-400" /> : <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500 dark:text-slate-400" />}
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-black/60 dark:text-slate-500 hidden xs:inline">Ajuste</span>
              </button>
              <Logo theme={theme} />
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs font-bold dark:text-slate-200 leading-none">{user.displayName}</span>
                    <span className="text-[10px] text-black/40 dark:text-slate-500 font-medium">{user.email}</span>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 border-black/5 dark:border-white/10 overflow-hidden shadow-sm">
                    <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <button 
                    onClick={logout}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-black/40 hover:text-rose-600 dark:text-slate-500 rounded-xl transition-all"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={async () => {
                    try {
                      await loginWithGoogle();
                    } catch (err: any) {
                      console.error("Login error:", err);
                      if (err.code === 'auth/unauthorized-domain') {
                        setError("Este domínio não está autorizado no Firebase. Por favor, adicione este domínio no console do Firebase ou execute a configuração do Firebase novamente.");
                      } else if (err.code === 'auth/popup-blocked') {
                        setError("O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site.");
                      } else {
                        setError(err.message || "Erro ao fazer login com Google.");
                      }
                    }
                  }}
                  className={cn("flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95", theme.primary, theme.contrastText, theme.shadow)}
                >
                  <LogIn size={16} />
                  <span className="hidden xs:inline">Entrar</span>
                </button>
              )}
              <div className="w-px h-6 bg-black/5 dark:bg-white/10 mx-1 hidden sm:block" />
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all text-black/40 dark:text-slate-500"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>

            {state === 'active' && (
              <div className="hidden md:flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 px-4 py-2 rounded-full mx-4">
                <Clock size={16} className="text-black/40 dark:text-slate-500" />
                <span className="text-sm font-mono font-bold text-black/60 dark:text-slate-300">
                  {format(currentTime, "HH:mm")}
                </span>
              </div>
            )}

            {state === 'active' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={resetQuiz}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-black/60 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 font-bold text-sm transition-all border border-transparent"
                >
                  <ChevronLeft size={18} />
                  <span className="hidden sm:inline">Voltar</span>
                </button>
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
                  <span className="hidden sm:inline">{isPaused ? 'Retomar' : 'Pausar'}</span>
                </button>
                <button
                  onClick={resetQuiz}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors border border-rose-100 dark:border-rose-900/30 dark:text-rose-400"
                >
                  <PlusCircle size={18} />
                  <span className="hidden sm:inline">Novo Quiz</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-full mx-auto px-2 py-2">
            <AnimatePresence mode="wait">
              {showDashboard ? (
                <Dashboard 
                  key="dashboard"
                  history={history} 
                  theme={theme} 
                  themeColor={themeColor}
                  onClose={() => setShowDashboard(false)} 
                  onPracticeTopic={onPracticeTopic}
                  dateFilter={dashboardDateFilter}
                  setDateFilter={setDashboardDateFilter}
                  subjectFilter={dashboardSubjectFilter}
                  setSubjectFilter={setDashboardSubjectFilter}
                  subjects={subjects}
                  handleAddSubject={handleAddSubject}
                  handleRemoveSubject={handleRemoveSubject}
                  newSubjectInput={newSubjectInput}
                  setNewSubjectInput={setNewSubjectInput}
                  onDeleteSubjectHistory={(s) => setSubjectToDelete(s)}
                  onDeleteQuiz={(id) => setQuizToDelete(id)}
                  userProfile={userProfile}
                  itemsDue={itemsDue}
                  onStartSRSReview={handleStartSRSReview}
                  selectedSubjects={selectedSubjects}
                  setSelectedSubjects={setSelectedSubjects}
                  onDeleteQuizzes={handleDeleteQuizzes}
                  onDeleteSubjectsHistory={handleDeleteSubjectsHistory}
                />
              ) : showRecycleBin ? (
                <RecycleBin 
                  items={recycleBin}
                  theme={theme}
                  onClose={() => setShowRecycleBin(false)}
                  onRestore={handleRestoreQuiz}
                  onRestoreMultiple={handleRestoreQuizzes}
                  onDelete={handlePermanentlyDeleteQuiz}
                  onDeleteMultiple={handlePermanentlyDeleteQuizzes}
                />
              ) : showStudyMode ? (
                <StudyMode 
                  key="studymode"
                  history={history}
                  theme={theme}
                  onClose={() => setShowStudyMode(false)}
                  onPracticeIncorrect={practiceIncorrect}
                  dateFilter={studyModeDateFilter}
                  setDateFilter={setStudyModeDateFilter}
                  subjectFilter={studyModeSubjectFilter}
                  setSubjectFilter={setStudyModeSubjectFilter}
                  subjects={subjects}
                  handleAddSubject={handleAddSubject}
                  handleRemoveSubject={handleRemoveSubject}
                  newSubjectInput={newSubjectInput}
                  setNewSubjectInput={setNewSubjectInput}
                  onDeleteSubjectHistory={(s) => setSubjectToDelete(s)}
                  onDeleteQuiz={(id) => setQuizToDelete(id)}
                  onDeleteQuizzes={handleDeleteQuizzes}
                  onDeleteSubjectsHistory={handleDeleteSubjectsHistory}
                  onOpenRecycleBin={() => setShowRecycleBin(true)}
                  recycleBinCount={recycleBin.length}
                  selectedSubjects={selectedSubjects}
                  setSelectedSubjects={setSelectedSubjects}
                />
              ) : state === 'idle' ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-5xl mx-auto text-center space-y-8"
                >
                  <div className="flex justify-center items-center pt-6" style={{ height: '90px' }}>
                    <Logo theme={theme} className="scale-150" />
                  </div>

                  {/* Streak Indicator on Main Screen */}
                  {userProfile?.streak > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-600 dark:text-orange-400 font-bold text-sm"
                    >
                      <Flame size={16} />
                      <span>{userProfile.streak} Dias de Ofensiva!</span>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <h1 
                      className="text-5xl font-medium tracking-tight leading-tight dark:text-slate-100"
                      style={{ 
                        height: '124px', 
                        width: '1023px', 
                        marginBottom: '14px',
                        marginRight: '0px',
                        marginLeft: '0px',
                        marginTop: '0px',
                        padding: '0px',
                        borderRadius: '1px',
                        borderStyle: 'solid',
                        borderWidth: '0px',
                        color: '#1f2022'
                      }}
                    >
                      Transforme seus documentos em <span className={cn("italic font-serif", theme.textLight, theme.textLightDark)} style={{ color: '#2b842b' }}>conhecimento</span>
                      <br />
                      <span className={cn("italic font-serif", theme.textLight, theme.textLightDark)} style={{ color: '#2b842b' }}>vivo</span>.
                    </h1>
                    <p className="text-lg text-black/60 dark:text-slate-400 max-w-3xl mx-auto">
                      Envie qualquer arquivo (PDF, Word, Imagem, Texto) e nossa IA criará um quiz personalizado.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="flex justify-center gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit shadow-sm">
                      <button 
                        onClick={() => { setShowDashboard(false); setShowStudyMode(false); }}
                        className={cn("flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all", !showDashboard && !showStudyMode ? cn(theme.primary, theme.contrastText, "shadow-md") : "text-black/40 dark:text-slate-500 hover:bg-black/5 dark:hover:bg-white/5")}
                      >
                        <BrainCircuit size={16} />
                        Modo Quiz
                      </button>
                      <button 
                        onClick={() => { setShowStudyMode(true); setShowDashboard(false); }}
                        className={cn("flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all relative", showStudyMode ? cn(theme.primary, theme.contrastText, "shadow-md") : "text-black/40 dark:text-slate-500 hover:bg-black/5 dark:hover:bg-white/5")}
                      >
                        <BookOpen size={16} />
                        Modo Estudo
                      </button>
                      <button 
                        onClick={() => { setShowDashboard(true); setShowStudyMode(false); }}
                        className={cn("flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all relative", showDashboard ? cn(theme.primary, theme.contrastText, "shadow-md") : "text-black/40 dark:text-slate-500 hover:bg-black/5 dark:hover:bg-white/5")}
                      >
                        <BarChart2 size={16} />
                        Meu Dashboard
                      </button>
                    </div>

                    {/* Compact Quiz Settings Bar */}
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                      {/* Banca Dropdown */}
                      <div className="relative">
                        <button 
                          onClick={() => {
                            setShowBancaDropdown(!showBancaDropdown);
                            setShowQuantityDropdown(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all font-bold text-sm shadow-sm active:scale-95",
                            showBancaDropdown 
                              ? cn(theme.border, theme.bg, theme.text) 
                              : "bg-white dark:bg-slate-900 border-black/5 dark:border-white/10 text-black/60 dark:text-slate-400 hover:border-black/10 dark:hover:border-white/20"
                          )}
                        >
                          <Target size={18} className={theme.icon} />
                          <span>
                            Banca: {selectedExamBoards.length === 1 && selectedExamBoards[0] === 'Geral' 
                              ? 'Geral' 
                              : selectedExamBoards.length === 1 
                                ? selectedExamBoards[0] 
                                : `${selectedExamBoards.length} Selecionadas`}
                          </span>
                          <ChevronRight size={16} className={cn("transition-transform", showBancaDropdown ? "rotate-90" : "")} />
                        </button>

                        <AnimatePresence>
                          {showBancaDropdown && (
                            <>
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full left-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-3xl border border-black/5 dark:border-white/10 shadow-2xl z-50 p-5 space-y-4 backdrop-blur-xl"
                              >
                                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-slate-500">Banca e Estilo</span>
                                  <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full uppercase">Multiseleção</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {['Geral', 'Múltipla Escolha', 'Cebraspe', 'FGV', 'FCC', 'Vunesp', 'Cesgranrio'].map((board) => (
                                    <button
                                      key={board}
                                      onClick={() => {
                                        if (board === 'Geral') {
                                          setSelectedExamBoards(['Geral']);
                                        } else {
                                          setSelectedExamBoards(prev => {
                                            const filtered = prev.filter(b => b !== 'Geral');
                                            if (filtered.includes(board)) {
                                              const next = filtered.filter(b => b !== board);
                                              return next.length === 0 ? ['Geral'] : next;
                                            } else {
                                              return [...filtered, board];
                                            }
                                          });
                                        }
                                      }}
                                      className={cn(
                                        "px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition-all text-center flex items-center justify-center gap-1.5",
                                        selectedExamBoards.includes(board)
                                          ? cn(theme.border, theme.bg, theme.textLight, theme.textLightDark)
                                          : "border-black/5 dark:border-slate-800 hover:border-black/10 dark:hover:border-slate-700 text-black/40 dark:text-slate-500"
                                      )}
                                    >
                                      {selectedExamBoards.includes(board) && <CheckCircle2 size={10} />}
                                      {board}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                              <div className="fixed inset-0 z-40" onClick={() => setShowBancaDropdown(false)} />
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Quantity Dropdown */}
                      <div className="relative">
                        <button 
                          onClick={() => {
                            setShowQuantityDropdown(!showQuantityDropdown);
                            setShowBancaDropdown(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all font-bold text-sm shadow-sm active:scale-95",
                            showQuantityDropdown 
                              ? cn(theme.border, theme.bg, theme.text) 
                              : "bg-white dark:bg-slate-900 border-black/5 dark:border-white/10 text-black/60 dark:text-slate-400 hover:border-black/10 dark:hover:border-white/20"
                          )}
                        >
                          <Hash size={18} className={theme.icon} />
                          <span>{questionCount} Questões</span>
                          <ChevronRight size={16} className={cn("transition-transform", showQuantityDropdown ? "rotate-90" : "")} />
                        </button>

                        <AnimatePresence>
                          {showQuantityDropdown && (
                            <>
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 md:left-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-3xl border border-black/5 dark:border-white/10 shadow-2xl z-50 p-6 space-y-6 backdrop-blur-xl"
                              >
                                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-slate-500">Volume de Estudo</span>
                                  <div className="flex items-center gap-1 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg">
                                    <Hash size={12} className={theme.icon} />
                                    <span className="text-xs font-bold dark:text-white">{questionCount}</span>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <input 
                                    type="range" 
                                    min="5" 
                                    max="100" 
                                    step="5"
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                    className={cn("w-full h-2 bg-black/10 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-current", theme.text, theme.textDark)}
                                  />
                                  <div className="flex justify-between px-1">
                                    <span className="text-[10px] font-bold text-black/20 dark:text-slate-700">MÍN (5)</span>
                                    <span className="text-[10px] font-bold text-black/20 dark:text-slate-700">MÁX (100)</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    {[10, 20, 50, 100].map(val => (
                                      <button
                                        key={val}
                                        onClick={() => setQuestionCount(val)}
                                        className={cn(
                                          "py-2 rounded-xl text-[10px] font-bold border transition-all",
                                          questionCount === val 
                                            ? cn(theme.bg, theme.border, theme.text)
                                            : "border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-slate-500"
                                        )}
                                      >
                                        {val}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                              <div className="fixed inset-0 z-40" onClick={() => setShowQuantityDropdown(false)} />
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Própria Banca Toggle */}
                      <button
                        onClick={() => setIsBancaMindset(!isBancaMindset)}
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all font-bold text-sm shadow-sm active:scale-95",
                          isBancaMindset
                            ? cn(theme.border, theme.bg, theme.text, "ring-2 ring-offset-2", theme.ring)
                            : "bg-white dark:bg-slate-900 border-black/5 dark:border-white/10 text-black/60 dark:text-slate-400 hover:border-black/10 dark:hover:border-white/20"
                        )}
                        title="Ativa o modo de elaboração rigoroso, simulando a mente dos examinadores da banca."
                      >
                        <Award size={18} className={isBancaMindset ? theme.icon : "text-black/20 dark:text-slate-600"} />
                        <span>Própria Banca</span>
                        {isBancaMindset && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-2 w-2 rounded-full bg-amber-500"
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Subject Selection */}
                    <div className="max-w-xl mx-auto space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-slate-500">1. Nome da Matéria</label>
                        {selectedSubject && (
                          <button onClick={() => setSelectedSubject('')} className="text-[10px] font-bold text-rose-500 hover:underline">Limpar</button>
                        )}
                      </div>
                      <div className="relative group">
                        <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-black/20 dark:text-slate-600 transition-colors", selectedSubject ? theme.text : "")}>
                          <Folder size={20} />
                        </div>
                        <input 
                          type="text"
                          list="existing-subjects"
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          placeholder="Ex: Direito Constitucional, Português..."
                          className={cn("w-full bg-white dark:bg-slate-900 border-2 border-black/5 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 transition-all outline-none font-bold dark:text-white", `focus:${theme.border}`, theme.ring)}
                        />
                        <datalist id="existing-subjects">
                          {subjects.map(s => <option key={s} value={s} />)}
                        </datalist>
                      </div>
                    </div>

                    <div className="max-w-xl mx-auto space-y-3">
                      <label className="block text-left px-1 text-xs font-bold uppercase tracking-widest text-black/40 dark:text-slate-500">2. Selecione o Material</label>
                      
                      <div 
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
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
                        className={cn(
                          "group relative border-2 border-dashed rounded-3xl p-8 cursor-pointer transition-all duration-300", 
                          pendingContent && pendingFileName ? cn(theme.border, theme.bg, "border-solid") : "border-black/10 dark:border-slate-800",
                          `hover:${theme.border}/50`, `hover:${theme.bg}/30`, `dark:hover:${theme.bgDark}`
                        )}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          multiple
                          className="hidden" 
                          accept=".txt,.md,.pdf,.docx,image/*"
                        />
                        <div className="flex flex-col items-center gap-3">
                          <div className={cn("w-12 h-12 rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300", pendingContent ? cn(theme.primary, theme.contrastText) : "bg-white dark:bg-slate-800")}>
                            {pendingContent ? <Check size={24} /> : <Upload className={theme.icon} size={24} />}
                          </div>
                          <div>
                            <p className="font-bold text-base dark:text-slate-100">
                              {pendingContent ? "Material Selecionado" : "Carregar Arquivos"}
                            </p>
                            <p className="text-xs text-black/40 dark:text-slate-500">
                              {pendingContent ? pendingFileName : "PDF, DOCX, Imagens, TXT ou MD"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="relative flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-black/5 dark:bg-slate-800"></div>
                        <span className="text-[10px] font-bold text-black/20 dark:text-slate-600 uppercase tracking-widest text-center">ou use links</span>
                        <div className="flex-1 h-px bg-black/5 dark:bg-slate-800"></div>
                      </div>

                      <div className="space-y-3">
                        <div className="relative group">
                          <div className={cn("absolute left-4 top-4 text-black/20 dark:text-slate-600 transition-colors", urlInput ? theme.text : "")}>
                            <LinkIcon size={18} />
                          </div>
                          <textarea
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="Cole links da web ou YouTube..."
                            className={cn("w-full bg-white dark:bg-slate-900 border-2 border-black/5 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 min-h-[80px] transition-all outline-none resize-none text-sm dark:text-slate-100 dark:placeholder:text-slate-600", `focus:${theme.border}`, theme.ring)}
                          />
                        </div>
                        {urlInput.trim() && (
                          <button 
                            onClick={() => {
                              const urls = urlInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
                              if (urls.length > 0) {
                                setPendingContent(urls);
                                setPendingFileName(urls.length === 1 ? urls[0] : `${urls.length} links`);
                                setUrlInput('');
                              }
                            }}
                            className={cn("w-full py-2 rounded-xl text-xs font-bold transition-all", theme.bg, theme.text, "hover:opacity-80")}
                          >
                            Confirmar Links
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-w-xl mx-auto pt-4">
                      <button
                        type="button"
                        disabled={(!pendingContent && !urlInput.trim()) || !selectedSubject.trim()}
                        onClick={handleCreateQuiz}
                        className={cn(
                          "w-full py-5 rounded-[2rem] font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98]",
                          (pendingContent || urlInput.trim()) && selectedSubject.trim()
                            ? cn(theme.primary, theme.contrastText, theme.shadow, theme.primaryHover)
                            : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-slate-700 cursor-not-allowed"
                        )}
                      >
                        <BrainCircuit size={24} />
                        CRIAR QUIZ AGORA
                      </button>
                      
                      {!pendingContent && !urlInput.trim() && (
                        <p className="mt-3 text-[10px] font-bold text-black/30 dark:text-slate-600 uppercase tracking-widest">Selecione um material para habilitar</p>
                      )}
                      {(pendingContent || urlInput.trim()) && !selectedSubject.trim() && (
                        <p className="mt-3 text-[10px] font-bold text-amber-500 uppercase tracking-widest">Informe a matéria para continuar</p>
                      )}
                    </div>
                  </div>

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
              ) : state === 'loading' ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 space-y-10 max-w-2xl mx-auto w-full px-6"
                >
                  <div className="w-full space-y-6">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className={cn("animate-pulse", theme.text, theme.textDark)} size={18} />
                        <span className="dark:text-slate-300">
                          Formulando Questionário...
                        </span>
                      </div>
                      <span className={cn("font-mono", theme.text, theme.textDark)}>{Math.round(loadingProgress)}%</span>
                    </div>
                    
                    <div className="h-3 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${loadingProgress}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                        className={cn("h-full rounded-full shadow-lg", theme.primary)}
                      />
                    </div>

                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-black/40 dark:text-slate-500">Status</p>
                        <p className="text-sm dark:text-slate-300">
                          {loadingStatus || (
                            loadingProgress < 20 ? "Iniciando análise de conteúdo..." :
                            loadingProgress < 40 ? "Mapeando conceitos fundamentais..." :
                            loadingProgress < 60 ? "Estruturando questões estratégicas..." :
                            loadingProgress < 80 ? "Refinando alternativas e explicações..." :
                            loadingProgress < 95 ? "Finalizando detalhes técnicos..." :
                            "Quase pronto! Organizando sua sessão..."
                          )}
                        </p>
                      </div>
                      <div className="flex-1 space-y-1 text-right">
                        <p className="text-xs font-medium uppercase tracking-wider text-black/40 dark:text-slate-500">Objetivo</p>
                        <p className="text-sm dark:text-slate-300">
                          {questionCount} Questões
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-2 pt-4">
                    <h2 className="text-xl font-medium dark:text-slate-100">Quase pronto!</h2>
                    <p className="text-sm text-black/40 dark:text-slate-500">A inteligência artificial está processando seu material para garantir o melhor aprendizado.</p>
                  </div>
                </motion.div>
              ) : state === 'active' && currentQuestion ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
                    isDeepDiveExpanded && "lg:grid-cols-1"
                  )}
                >
                  {/* Question Area */}
                  {!isDeepDiveExpanded && (
                    <div className={cn(
                      "lg:col-span-12 transition-all duration-500",
                      showDeepDive && "lg:col-span-5"
                    )}>
                      <div className="bg-white dark:bg-slate-900 rounded-t-2xl rounded-b-[32px] shadow-xl shadow-black/5 border border-black/5 dark:border-slate-800 relative overflow-hidden flex flex-col h-[calc(100vh-80px)] sm:min-h-[750px] min-h-[500px]">
                        {/* Timeline Progress */}
                        <div className="px-4 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 h-14">
                            {questions.map((_, idx) => {
                              const isAnswered = answers[idx] !== null;
                              const isCorrect = isAnswered && answers[idx] === questions[idx]?.correctAnswer;
                              const isWrong = isAnswered && answers[idx] !== questions[idx]?.correctAnswer;
                              const isCurrent = idx === currentIndex;

                              return (
                                <button 
                                  key={idx} 
                                  onClick={() => {
                                    setCurrentIndex(idx);
                                    setQuestionTime(timeAlertThreshold);
                                    setIsQuestionStarted(true);
                                  }}
                                  className={cn(
                                    "transition-all duration-500 flex items-center justify-center font-mono font-bold rounded-md shadow-sm h-full flex-1 min-w-0 border border-black/5 dark:border-white/5 relative",
                                    (isCurrent || isAnswered) 
                                      ? cn(theme.primary, isCurrent && "z-10 shadow-lg scale-y-105") 
                                      : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                                  )}
                                >
                                  <span className={cn(
                                    "transition-all duration-300 flex items-center justify-center shrink-0",
                                    isCurrent ? "text-2xl font-black" : "text-base font-bold",
                                    (isCurrent || isAnswered) ? theme.contrastText : "text-black/40 dark:text-white/20"
                                  )}>
                                    {idx + 1}
                                  </span>
                                  {isWrong && (
                                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#B91C1C] shadow-[0_0_8px_rgba(185,28,28,0.8)] rounded-full" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex-1 p-6 md:p-8 flex flex-col space-y-6 relative overflow-y-auto custom-scrollbar">
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
                                className={cn("flex items-center gap-3 px-10 py-4 rounded-2xl font-bold transition-all transform hover:scale-105", theme.primary, theme.contrastText, theme.primaryHover, theme.shadow)}
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
                                className={cn("group relative flex items-center gap-4 px-12 py-5 rounded-[2rem] font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl", theme.primary, theme.contrastText, theme.primaryHover, theme.shadow)}
                              >
                                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                <span className="text-lg">Iniciar Questão</span>
                              </button>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                            <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar w-full sm:w-auto">
                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <span className="text-[8px] sm:text-[10px] font-bold text-black/30 dark:text-slate-600 uppercase tracking-[0.2em]">Dificuldade</span>
                                <span 
                                  className={cn(
                                    "px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-wider w-fit cursor-help",
                                    currentQuestion.difficulty === 'easy' ? theme.difficultyEasy :
                                    currentQuestion.difficulty === 'medium' ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" :
                                    "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                                  )}
                                  title={
                                    currentQuestion.difficulty === 'easy' ? "Fácil: Questões com conceitos diretos e fundamentais." :
                                    currentQuestion.difficulty === 'medium' ? "Médio: Questões que exigem aplicação de conceitos e análise moderada." :
                                    "Difícil: Questões complexas que exigem síntese de múltiplos conceitos e análise profunda."
                                  }
                                >
                                  {currentQuestion.difficulty === 'easy' ? 'Fácil' : 
                                   currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <span className="text-[8px] sm:text-[10px] font-bold text-black/30 dark:text-slate-600 uppercase tracking-[0.2em]">Tempo</span>
                                <div className={cn(
                                  "flex items-center gap-1 sm:gap-1.5 font-mono font-bold transition-all duration-300",
                                  questionTime <= 15 
                                    ? "text-rose-600 text-lg sm:text-xl animate-pulse" 
                                    : cn(theme.text, theme.textDark, "text-base sm:text-lg")
                                )}>
                                  <Clock size={questionTime <= 15 ? 18 : 14} />
                                  {formatTime(questionTime)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <span className="text-[8px] sm:text-[10px] font-bold text-black/30 dark:text-slate-600 uppercase tracking-[0.2em]">Total</span>
                                <div className={cn("flex items-center gap-1 sm:gap-1.5 font-mono font-bold text-base sm:text-lg", theme.text, theme.textDark)}>
                                  <Timer size={14} />
                                  {formatTime(totalTime)}
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={() => setShowExitQuizConfirmation(true)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-600 transition-all text-[10px] font-bold dark:text-slate-400 shrink-0"
                            >
                              <X size={14} />
                              Sair
                            </button>
                          </div>

                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentIndex}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="flex flex-col gap-6"
                            >
                              <div className="space-y-4">
                              <span className={cn("text-sm font-serif italic", theme.textLight, theme.textLightDark)}>
                                {currentQuestion.type === 'cebraspe' ? 'Julgue o item abaixo:' : 'Selecione a alternativa correta:'}
                              </span>
                              <div className="p-6 md:p-10 rounded-3xl bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-inner">
                                <h2 className="text-xl md:text-2xl font-medium leading-relaxed tracking-tight text-balance text-black dark:text-white">
                                  {currentQuestion.question}
                                </h2>
                              </div>

                              {currentQuestion.hint && currentAnswer === null && !isReviewMode && (
                                <div className="flex flex-col items-center">
                                  <button
                                    onClick={() => setShowHint(!showHint)}
                                    className={cn(
                                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all",
                                      showHint 
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                                        : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:text-amber-600"
                                    )}
                                  >
                                    <Lightbulb size={16} className={cn(showHint && "fill-amber-500")} />
                                    {showHint ? 'Esconder Dica' : 'Ver Dica'}
                                  </button>
                                  
                                  <AnimatePresence>
                                    {showHint && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3 w-full"
                                      >
                                        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 text-center">
                                          <p className="text-sm font-medium text-amber-800 dark:text-amber-300 italic">
                                            "{currentQuestion.hint}"
                                          </p>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>

                            <div className={cn(
                              "grid gap-4",
                              currentQuestion.type === 'cebraspe' ? "grid-cols-1" : "grid-cols-1"
                            )}>
                            {currentQuestion.type === 'cebraspe' ? (
                              ['Certo', 'Errado'].map((option, idx) => (
                                <motion.div
                                  key={option}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  role="button"
                                  tabIndex={currentAnswer !== null || isReviewMode ? -1 : 0}
                                  onClick={() => {
                                    if (!(currentAnswer !== null || isReviewMode)) {
                                      handleAnswer(option);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if ((e.key === 'Enter' || e.key === ' ') && !(currentAnswer !== null || isReviewMode)) {
                                      e.preventDefault();
                                      handleAnswer(option);
                                    }
                                  }}
                                  className={cn(
                                    "group flex flex-col px-6 py-5 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden",
                                    !(currentAnswer !== null || isReviewMode) && "cursor-pointer",
                                    currentAnswer === null ? cn("border-black/5 dark:border-slate-800", `hover:${theme.border}`, `dark:hover:${theme.border}`, `hover:${theme.bg}/50`, `dark:hover:${theme.bgDark}`, `hover:${theme.shadowLight}`, `dark:hover:${theme.shadowDark}`) :
                                    option === currentQuestion.correctAnswer ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-inner" :
                                    currentAnswer === option ? "border-rose-500 bg-rose-50 dark:bg-rose-900/10" : "border-black/5 dark:border-slate-800 opacity-50"
                                  )}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                      <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors shrink-0",
                                        currentAnswer === null ? cn(theme.bgLight, theme.bgLightDark, "text-black dark:text-white") :
                                        option === currentQuestion.correctAnswer ? "bg-emerald-600 text-white" :
                                        currentAnswer === option ? "bg-rose-600 text-white" : "bg-black/5 dark:bg-slate-800 dark:text-slate-600"
                                      )}>
                                        {option === 'Certo' ? 'C' : 'E'}
                                      </div>
                                      <span className={cn(
                                        "font-medium text-lg transition-colors text-black dark:text-white line-clamp-2"
                                      )}>{option}</span>
                                    </div>
                                    {currentAnswer !== null && option === currentQuestion.correctAnswer && (
                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <CheckCircle2 className="text-emerald-600" size={28} />
                                      </motion.div>
                                    )}
                                    {currentAnswer === option && option !== currentQuestion.correctAnswer && (
                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <XCircle className="text-rose-600" size={28} />
                                      </motion.div>
                                    )}
                                  </div>

                                  {(currentAnswer !== null ? currentAnswer === option : (isReviewMode && option === currentQuestion.correctAnswer)) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-4 pt-4 border-t border-black/5 dark:border-white/5"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={cn(
                                          "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                                          option === currentQuestion.correctAnswer ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                                        )}>
                                          {option === currentQuestion.correctAnswer ? <Trophy size={16} /> : <AlertCircle size={16} />}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center justify-between">
                                            <h4 className={cn(
                                              "text-sm font-bold",
                                              option === currentQuestion.correctAnswer ? "text-emerald-900 dark:text-emerald-300" : "text-rose-900 dark:text-rose-300"
                                            )}>
                                              {option === currentQuestion.correctAnswer ? 'Resposta Correta!' : 'Quase lá...'}
                                            </h4>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayAudio(currentQuestion.explanation);
                                              }}
                                              disabled={isAudioLoading}
                                              className={cn(
                                                "p-1.5 rounded-lg transition-all",
                                                isAudioPlaying ? cn(theme.bgLight, theme.bgLightDark, theme.text, theme.textDark, "animate-pulse") : "hover:bg-black/5 dark:hover:bg-slate-800 text-black/40 dark:text-slate-500",
                                                isAudioLoading && "opacity-50 cursor-wait"
                                              )}
                                            >
                                              {isAudioLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                                            </button>
                                          </div>
                                          <div className={cn("prose prose-xs max-w-none prose-slate dark:prose-invert prose-p:text-black/70 dark:prose-p:text-white/70", theme.prose)}>
                                            <Markdown 
                                              remarkPlugins={[remarkGfm]}
                                              components={{
                                                strong: ({node, ...props}) => (
                                                  <strong className={cn("font-bold", theme.text, theme.textDark)} {...props} />
                                                )
                                              }}
                                            >
                                              {currentQuestion.explanation}
                                            </Markdown>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </motion.div>
                              ))
                            ) : (
                              currentQuestion.options?.map((option, idx) => (
                                <motion.div
                                  key={option}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  role="button"
                                  tabIndex={currentAnswer !== null || isReviewMode ? -1 : 0}
                                  onClick={() => {
                                    if (!(currentAnswer !== null || isReviewMode)) {
                                      handleAnswer(option);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if ((e.key === 'Enter' || e.key === ' ') && !(currentAnswer !== null || isReviewMode)) {
                                      e.preventDefault();
                                      handleAnswer(option);
                                    }
                                  }}
                                  className={cn(
                                    "group flex flex-col px-6 py-5 rounded-3xl border-2 transition-all duration-300 text-left relative overflow-hidden",
                                    !(currentAnswer !== null || isReviewMode) && "cursor-pointer",
                                    currentAnswer === null ? cn("border-black/5 dark:border-slate-800", `hover:${theme.border}`, `dark:hover:${theme.border}`, `hover:${theme.bg}/50`, `dark:hover:${theme.bgDark}`, `hover:${theme.shadowLight}`, `dark:hover:${theme.shadowDark}`) :
                                    option === currentQuestion.correctAnswer ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-inner" :
                                    currentAnswer === option ? "border-rose-500 bg-rose-50 dark:bg-rose-900/10" : "border-black/5 dark:border-slate-800 opacity-50"
                                  )}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                      <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors shrink-0",
                                        currentAnswer === null ? cn(theme.bgLight, theme.bgLightDark, "text-black dark:text-white") :
                                        option === currentQuestion.correctAnswer ? "bg-emerald-600 text-white" :
                                        currentAnswer === option ? "bg-rose-600 text-white" : "bg-black/5 dark:bg-slate-800 dark:text-slate-600"
                                      )}>
                                        {String.fromCharCode(65 + idx)}
                                      </div>
                                      <span className={cn(
                                        "font-medium text-base md:text-lg transition-colors text-black dark:text-white line-clamp-2"
                                      )}>{option}</span>
                                    </div>
                                    {currentAnswer !== null && option === currentQuestion.correctAnswer && (
                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <CheckCircle2 className="text-emerald-600" size={28} />
                                      </motion.div>
                                    )}
                                    {currentAnswer === option && option !== currentQuestion.correctAnswer && (
                                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <XCircle className="text-rose-600" size={28} />
                                      </motion.div>
                                    )}
                                  </div>

                                  {(currentAnswer !== null ? currentAnswer === option : (isReviewMode && option === currentQuestion.correctAnswer)) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-4 pt-4 border-t border-black/5 dark:border-white/5"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={cn(
                                          "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                                          option === currentQuestion.correctAnswer ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                                        )}>
                                          {option === currentQuestion.correctAnswer ? <Trophy size={16} /> : <AlertCircle size={16} />}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center justify-between">
                                            <h4 className={cn(
                                              "text-sm font-bold",
                                              option === currentQuestion.correctAnswer ? "text-emerald-900 dark:text-emerald-300" : "text-rose-900 dark:text-rose-300"
                                            )}>
                                              {option === currentQuestion.correctAnswer ? 'Resposta Correta!' : 'Quase lá...'}
                                            </h4>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayAudio(currentQuestion.explanation);
                                              }}
                                              disabled={isAudioLoading}
                                              className={cn(
                                                "p-1.5 rounded-lg transition-all",
                                                isAudioPlaying ? cn(theme.bgLight, theme.bgLightDark, theme.text, theme.textDark, "animate-pulse") : "hover:bg-black/5 dark:hover:bg-slate-800 text-black/40 dark:text-slate-500",
                                                isAudioLoading && "opacity-50 cursor-wait"
                                              )}
                                            >
                                              {isAudioLoading ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                                            </button>
                                          </div>
                                          <div className={cn("prose prose-xs max-w-none prose-slate dark:prose-invert prose-p:text-black/70 dark:prose-p:text-white/70", theme.prose)}>
                                            <Markdown 
                                              remarkPlugins={[remarkGfm]}
                                              components={{
                                                strong: ({node, ...props}) => (
                                                  <strong className={cn("font-bold", theme.text, theme.textDark)} {...props} />
                                                )
                                              }}
                                            >
                                              {currentQuestion.explanation}
                                            </Markdown>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </motion.div>
                              ))
                            )}
                            </div>
                            </motion.div>
                          </AnimatePresence>

                          {(currentAnswer !== null || isReviewMode) && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="pt-4 border-t border-black/5 dark:border-slate-800"
                            >
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  {isReviewMode && currentIndex > 0 && (
                                    <button
                                      onClick={prevQuestion}
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
                                  <button
                                    onClick={handleToggleDeepDive}
                                    className={cn(
                                      "flex items-center gap-2 px-6 py-4 rounded-xl font-normal transition-all active:scale-95 shadow-lg",
                                      showDeepDive ? "bg-rose-600 text-white" : "bg-black dark:bg-slate-800 text-white hover:bg-black/80 dark:hover:bg-slate-700"
                                    )}
                                  >
                                    <BrainCircuit size={20} />
                                    {showDeepDive ? 'Fechar Explicação' : 'Explicar Matéria'}
                                  </button>
                                </div>
                                <button
                                  onClick={nextQuestion}
                                  className={cn(
                                   "w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg",
                                    theme.primary,
                                    theme.primaryHover
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
                  )}

                  {/* Deep Dive Panel */}
                  <AnimatePresence>
                    {showDeepDive && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={cn(
                          "transition-all duration-500",
                          isDeepDiveExpanded ? "lg:col-span-12" : "lg:col-span-7"
                        )}
                      >
                        <div className={cn(
                          "transition-all duration-500 flex flex-col overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.6)] font-arial",
                          isDeepDiveExpanded 
                            ? "fixed inset-0 z-[99999] bg-white dark:bg-slate-950 w-screen h-screen" 
                            : cn("sticky top-24 h-[75vh] sm:rounded-[48px] rounded-3xl sm:border-8 border-4 border-black/10 dark:border-white/10", theme.bg)
                        )}>
                          {/* Header - Rigidly Anchored */}
                          <div className={cn(
                            "p-6 border-b-4 border-black/5 dark:border-white/5 z-[100000] flex-shrink-0", 
                            isDeepDiveExpanded ? "bg-white dark:bg-slate-900" : theme.deepDiveBg
                          )}>
                            <div className={cn("flex items-center justify-between", isDeepDiveExpanded && "max-w-6xl mx-auto w-full")}>
                              <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-3", theme.deepDiveIcon)}>
                                  <BookOpen className="text-white" size={24} />
                                </div>
                                <div>
                                  <h3 className="font-normal text-xl tracking-tighter text-black dark:text-white leading-none uppercase">Aprofundamento</h3>
                                  <p className="mt-1 text-[9px] uppercase tracking-[0.4em] text-black/50 dark:text-white/50 font-normal">
                                    {isDeepDiveExpanded ? "MODO IMERSIVO TOTAL" : "DETALHES DO TEMA"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 {currentQuestion.deepDive && (
                                   <button
                                     onClick={() => setIsDeepDiveExpanded(!isDeepDiveExpanded)}
                                     className={cn(
                                       "flex items-center gap-2 px-3 py-1.5 rounded-lg font-normal text-[9px] uppercase tracking-widest transition-all shadow-md hover:scale-105 active:scale-95 border-2",
                                       isDeepDiveExpanded 
                                         ? "bg-black text-white border-black" 
                                         : "bg-white dark:bg-slate-800 text-black dark:text-white border-black/20 dark:border-white/20"
                                     )}
                                   >
                                     {isDeepDiveExpanded ? <><Minimize2 size={12} /> Recuar</> : <><Maximize2 size={12} /> Expandir</>}
                                   </button>
                                 )}
                                <button 
                                  onClick={() => {
                                    setShowDeepDive(false);
                                    setIsDeepDiveExpanded(false);
                                  }}
                                  className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all shadow-md hover:rotate-90 active:scale-90"
                                  title="Fechar"
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Main Content Area - Scrollable and Flexible */}
                          <div className={cn(
                            "flex-1 overflow-y-auto custom-scrollbar bg-transparent",
                            isDeepDiveExpanded ? "p-12 md:p-24" : "p-10"
                          )}>
                            <div className={cn(
                              "space-y-20 pb-40",
                              isDeepDiveExpanded && "max-w-5xl mx-auto w-full"
                            )}>
                            {isDeepDiveLoading ? (
                              <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-20 px-4">
                                <div className="w-full max-w-md space-y-6">
                                  <div className="flex items-center justify-between text-xs font-normal uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                      <BrainCircuit className={cn("animate-pulse", theme.text, theme.textDark)} size={16} />
                                      <span className="dark:text-slate-300">Aprofundando Conhecimento...</span>
                                    </div>
                                    <span className={cn("font-mono", theme.text, theme.textDark)}>{Math.round(deepDiveProgress)}%</span>
                                  </div>
                                  
                                  <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${deepDiveProgress}%` }}
                                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                                      className={cn("h-full rounded-full shadow-lg", theme.primary)}
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-[10px] font-normal uppercase tracking-wider text-black/40 dark:text-slate-500">Status do Professor</p>
                                    <p className="text-xs dark:text-slate-300 italic">
                                      {deepDiveStatus || (
                                        deepDiveProgress < 30 ? "Revisando o contexto da questão..." :
                                        deepDiveProgress < 60 ? "Consultando referências técnicas..." :
                                        deepDiveProgress < 85 ? "Sintetizando explicação pedagógica..." :
                                        "Finalizando detalhes do aprofundamento..."
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-center space-y-2">
                                  <p className="text-black/60 dark:text-white/60 text-base font-normal">Preparando aula personalizada</p>
                                  <p className="text-black/30 dark:text-white/30 text-[10px] uppercase tracking-widest">Aguarde um instante</p>
                                </div>
                              </div>
                            ) : currentQuestion.deepDive ? (
                              <>
                                  <div className={cn("prose prose-slate dark:prose-invert max-w-none prose-p:text-black dark:prose-p:text-white prose-headings:text-black dark:prose-headings:text-white prose-li:text-black dark:prose-li:text-white prose-headings:font-normal prose-strong:font-normal", theme.prose)}>
                                    <div className="text-black/90 dark:text-white/90 leading-relaxed text-lg font-normal">
                                      <Markdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                          strong: ({node, ...props}) => (
                                            <strong className={cn("font-normal", theme.text, theme.textDark)} {...props} />
                                          )
                                        }}
                                      >
                                        {currentQuestion.deepDive}
                                      </Markdown>
                                    </div>
                                  </div>

                                  {currentQuestion.studyLinks && currentQuestion.studyLinks.length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
                                      <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40 font-normal mb-4 flex items-center gap-2">
                                        <ExternalLink size={14} />
                                        Materiais de Estudo Relacionados
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {currentQuestion.studyLinks.map((link, idx) => (
                                          <a 
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
                                          >
                                            <span className="text-sm font-normal dark:text-slate-300 truncate pr-2">{link.title}</span>
                                            <ArrowUpRight size={16} className="text-black/20 dark:text-white/20 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                {chatHistory.length > 0 && (
                                  <div className="space-y-8 pt-12 border-t-4 border-black/5 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-8">
                                      <p className="text-xs uppercase tracking-[0.3em] text-black/40 dark:text-white/40 font-normal">Interação com o Professor</p>
                                      {isChatLoading && (
                                        <div className="flex items-center gap-3 text-blue-500 animate-pulse">
                                          <Loader2 size={18} className="animate-spin" />
                                          <span className="text-[10px] font-normal uppercase tracking-widest">Professor está digitando...</span>
                                        </div>
                                      )}
                                    </div>
                                    {chatHistory.map((msg, idx) => (
                                      <div key={idx} className={cn(
                                        "flex gap-6",
                                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                      )}>
                                        <div className={cn(
                                          "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl",
                                          msg.role === 'user' ? theme.chatUser : "bg-black/10 dark:bg-white/10"
                                        )}>
                                          {msg.role === 'user' ? <UserIcon size={24} /> : <BrainCircuit size={24} />}
                                        </div>
                                        <div className={cn(
                                          "max-w-[80%] p-6 rounded-[32px] text-lg leading-relaxed shadow-sm",
                                          msg.role === 'user' ? cn(theme.chatUserBubble, "rounded-tr-none") : "bg-black/5 dark:bg-white/5 text-black/90 dark:text-white/90 rounded-tl-none border border-black/5 dark:border-white/5"
                                        )}>
                                          <Markdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                              strong: ({node, ...props}) => (
                                                <strong className={cn("font-normal", theme.text, theme.textDark)} {...props} />
                                              )
                                            }}
                                          >
                                            {msg.text}
                                          </Markdown>
                                        </div>
                                      </div>
                                    ))}
                                    {isChatLoading && (
                                      <div className="flex gap-6 animate-pulse">
                                        <div className="w-12 h-12 rounded-2xl bg-black/10 dark:bg-white/10 flex items-center justify-center">
                                          <BrainCircuit size={24} className="text-black/20 dark:text-white/20" />
                                        </div>
                                        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[32px] rounded-tl-none w-32 h-16 flex items-center justify-center gap-1">
                                          <div className="w-2 h-2 bg-black/20 dark:bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                          <div className="w-2 h-2 bg-black/20 dark:bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                          <div className="w-2 h-2 bg-black/20 dark:bg-white/20 rounded-full animate-bounce"></div>
                                        </div>
                                      </div>
                                    )}
                                    <div ref={chatEndRef} />
                                  </div>
                                )}

                                <div className="pt-8 border-t border-black/5 dark:border-white/5">
                                  <div className="flex items-center gap-2 mb-4">
                                    <BrainCircuit size={16} className={theme.deepDiveTipIcon} />
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 dark:text-white/40 font-normal">Dica de Estudo</p>
                                  </div>
                                  <div className={cn("border rounded-2xl p-6 text-sm italic leading-relaxed", theme.deepDiveTip)}>
                                    "O erro é a melhor oportunidade para o cérebro consolidar novas conexões. Revise este trecho com atenção para fixar o conceito."
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12">
                                <AlertCircle className="text-black/20 dark:text-white/20" size={48} />
                                <p className="text-black/40 dark:text-white/40 text-sm">Clique em "Ver Explicação" para carregar os detalhes.</p>
                              </div>
                            )}
                            </div>
                          </div>

                          {/* Footer - Rigidly Anchored Input Area */}
                          {currentQuestion.deepDive && (
                            <div className={cn(
                              "p-3 border-t-2 border-black/5 dark:border-white/5 z-[100000] shadow-[0_-10px_20px_rgba(0,0,0,0.05)]",
                              isDeepDiveExpanded ? "bg-white dark:bg-slate-900" : "bg-black/5 dark:bg-white/5"
                            )}>
                              <div className={cn(isDeepDiveExpanded && "max-w-4xl mx-auto w-full")}>
                                <form onSubmit={handleSendMessage} className="relative group">
                                  <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ficou com dúvida? Pergunte ao Professor..."
                                    disabled={isChatLoading}
                                    className={cn(
                                      "w-full bg-white dark:bg-black/80 border-2 rounded-xl py-3 pl-6 pr-16 text-base text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 focus:outline-none transition-all shadow-lg font-normal tracking-tight",
                                      theme.border, theme.borderDark,
                                      `focus:ring-4 ${theme.ring}`
                                    )}
                                  />
                                  <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isChatLoading}
                                    className={cn(
                                      "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-[12px] flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:scale-110 active:scale-90",
                                      theme.primary, 
                                      theme.primaryHover
                                    )}
                                  >
                                    {isChatLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                  </button>
                                </form>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : state === 'finished' ? (
                <motion.div
                  key="finished"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-full mx-auto"
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
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#F5F5F0] dark:bg-slate-800 rounded-3xl p-8"
                      >
                        <p className="text-sm font-bold uppercase tracking-widest text-black/30 dark:text-slate-500 mb-2">Acertos</p>
                        <p className={cn("text-5xl font-medium", theme.text, theme.textDark)}>{correctCount}</p>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#F5F5F0] dark:bg-slate-800 rounded-3xl p-8"
                      >
                        <p className="text-sm font-bold uppercase tracking-widest text-black/30 dark:text-slate-500 mb-2">Erros</p>
                        <p className="text-5xl font-medium text-rose-600 dark:text-rose-400">{questions.length - correctCount}</p>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#F5F5F0] dark:bg-slate-800 rounded-3xl p-8"
                      >
                        <p className="text-sm font-bold uppercase tracking-widest text-black/30 dark:text-slate-500 mb-2">Precisão</p>
                        <p className="text-5xl font-medium text-black dark:text-slate-100">
                          {Math.round((correctCount / questions.length) * 100)}%
                        </p>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[#F5F5F0] dark:bg-slate-800 rounded-3xl p-8"
                      >
                        <p className="text-sm font-bold uppercase tracking-widest text-black/30 dark:text-slate-500 mb-2">Tempo Total</p>
                        <p className="text-5xl font-medium text-black dark:text-slate-100">{formatTime(totalTime)}</p>
                      </motion.div>
                    </div>

                    <QuizSummary questions={questions} answers={answers} theme={theme} />

                    <div className="flex flex-wrap items-center justify-center gap-4">
                      {error && (
                        <div className="w-full mb-4 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3 text-left">
                          <AlertCircle size={18} className="shrink-0" />
                          <p className="font-medium">{error}</p>
                        </div>
                      )}
                      <button
                        onClick={resetQuiz}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-black/5 dark:bg-white/5 text-black/60 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95"
                      >
                        <ChevronLeft size={20} />
                        Voltar
                      </button>
                      <button
                        onClick={redoQuiz}
                        className={cn("flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg", theme.primary, theme.contrastText, theme.primaryHover, theme.shadow)}
                      >
                        <RotateCcw size={20} />
                        Refazer
                      </button>
                      {questions.length - correctCount > 0 && (
                        <button
                          onClick={retryIncorrectOnly}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 dark:shadow-rose-900/20"
                        >
                          <RotateCcw size={20} />
                          Refazer Apenas Erros
                        </button>
                      )}
                      <button
                        onClick={() => reviewQuiz('all')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-black dark:bg-slate-800 text-white hover:bg-black/80 dark:hover:bg-slate-700 transition-all"
                      >
                        <BookOpen size={20} />
                        Rever Tudo
                      </button>
                      <button
                        onClick={() => reviewQuiz('incorrect')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 dark:shadow-rose-900/20"
                      >
                        <AlertCircle size={20} />
                        Rever Erros
                      </button>
                      <button
                        onClick={generateAnother}
                        className={cn("flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold border-2 transition-all", theme.border, theme.text, theme.textDark, `hover:${theme.bg}`, `dark:hover:${theme.bgDark}`)}
                      >
                        <BrainCircuit size={20} />
                        Novo do Mesmo Material
                      </button>
                      <button
                        onClick={downloadResults}
                        disabled={isGeneratingPDF}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold border-2 border-black/5 dark:border-slate-800 text-black dark:text-slate-100 hover:bg-black/5 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        {isGeneratingPDF ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                        {isGeneratingPDF ? 'Gerando PDF...' : 'Salvar Resultados'}
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
              ) : null}
            </AnimatePresence>

            <ConfirmationModal 
              isOpen={showExitQuizConfirmation}
              onClose={() => setShowExitQuizConfirmation(false)}
              onConfirm={() => {
                setState('idle');
                setShowExitQuizConfirmation(false);
              }}
              title="Sair do Quiz"
              message="Deseja realmente sair do quiz? Seu progresso atual não será salvo."
              theme={theme}
            />

            <ConfirmationModal 
              isOpen={!!subjectToDelete}
              onClose={() => setSubjectToDelete(null)}
              onConfirm={() => subjectToDelete && handleDeleteSubjectHistory(subjectToDelete)}
              title="Excluir Histórico"
              message={`Deseja mover TODO o histórico da matéria "${subjectToDelete}" para a lixeira? Você poderá restaurá-lo mais tarde.`}
              theme={theme}
            />

            <ConfirmationModal 
              isOpen={!!quizToDelete}
              onClose={() => setQuizToDelete(null)}
              onConfirm={() => quizToDelete && handleDeleteQuiz(quizToDelete)}
              title="Mover para Lixeira"
              message="Deseja mover este quiz para a lixeira? Você poderá restaurá-lo a qualquer momento."
              theme={theme}
            />
          </div>
        </main>
        {/* Hidden PDF Content */}
        <div 
          id="pdf-content-container"
          className="absolute opacity-0 pointer-events-none z-[-100] top-0 w-[800px] bg-white p-12 space-y-12 text-slate-900 font-sans" 
          ref={pdfContentRef}
        >
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-8">
            <div className="flex items-center gap-5">
              <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg", theme.primary, theme.contrastText)}>
                <BrainCircuit size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Quiz AI Expert</h1>
                <p className={cn("text-slate-500 font-medium", getDynamicFontSize(lastFileName || 'Documento Analisado', "text-lg"))}>
                  {lastFileName || 'Documento Analisado'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Relatório Gerado em</p>
              <p className="text-xl font-bold text-slate-700">{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-8">
            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Acertos</p>
              <p className={cn("text-4xl font-bold", theme.text)}>{correctCount}</p>
            </div>
            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Erros</p>
              <p className="text-4xl font-bold text-rose-600">{questions.length - correctCount}</p>
            </div>
            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Precisão</p>
              <p className="text-4xl font-bold text-slate-900">{Math.round((correctCount / questions.length) * 100)}%</p>
            </div>
            <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Tempo Total</p>
              <p className="text-4xl font-bold text-slate-900">{formatTime(totalTime)}</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-4">
              <FileText className="text-slate-400" size={24} />
              <h2 className="text-2xl font-bold text-slate-800">Revisão Detalhada</h2>
            </div>
            
            {questions.map((q, i) => (
              <div key={i} className="space-y-6 p-10 rounded-[40px] border border-slate-100 bg-white shadow-sm relative overflow-hidden">
                <div className={cn("absolute top-0 left-0 w-2 h-full", answers[i] === q.correctAnswer ? "bg-emerald-500" : "bg-rose-500")} />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      {i + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Questão</span>
                  </div>
                  <div className={cn(
                    "px-5 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-sm",
                    answers[i] === q.correctAnswer ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                  )}>
                    {answers[i] === q.correctAnswer ? 'Correto' : 'Incorreto'}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-serif italic text-slate-400">
                    {q.type === 'cebraspe' ? 'Julgue o item abaixo:' : 'Alternativa selecionada:'}
                  </p>
                  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-xl font-medium leading-relaxed text-slate-800">{q.question}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">Sua Resposta</p>
                    <div className={cn(
                      "p-4 rounded-2xl font-bold text-lg border",
                      answers[i] === q.correctAnswer ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                    )}>
                      {answers[i] || 'Não respondida'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">Resposta Correta</p>
                    <div className="p-4 rounded-2xl font-bold text-lg border bg-emerald-50 border-emerald-100 text-emerald-700">
                      {q.correctAnswer}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <BrainCircuit size={16} className="text-slate-400" />
                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">Explicação do Especialista</p>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-base italic bg-slate-50/50 p-6 rounded-2xl border border-slate-50">
                    {q.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-12 border-t-2 border-slate-100 text-center text-slate-400 text-xs">
            <p className="font-medium">Relatório gerado automaticamente pelo Quiz AI Expert</p>
            <p className="mt-1">© 2026 Todos os direitos reservados</p>
          </div>
        </div>
        {/* Hidden Deep Dive PDF Content */}
        {currentQuestion && (
          <div 
            id="deep-dive-pdf-container"
            className="absolute opacity-0 pointer-events-none z-[-100] top-0 w-[800px] bg-white p-12 space-y-12 text-slate-900 font-arial" 
            ref={deepDivePdfRef}
          >
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-8">
              <div className="flex items-center gap-5">
                <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg", theme.primary, theme.contrastText)}>
                  <BookOpen size={40} />
                </div>
                <div>
                  <h1 className="text-4xl font-normal tracking-tight text-slate-900">Aprofundamento Técnico</h1>
                  <p className="text-slate-500 font-normal text-lg">Questão {currentIndex + 1} - {lastFileName || 'Documento'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-normal text-slate-400 uppercase tracking-[0.2em] mb-1">Relatório Gerado em</p>
                <p className="text-xl font-normal text-slate-700">{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="p-10 rounded-[40px] border border-slate-100 bg-slate-50 shadow-sm relative overflow-hidden">
                <div className={cn("absolute top-0 left-0 w-2 h-full", theme.primary)} />
                <p className="text-sm font-serif italic text-slate-400 mb-4">A questão analisada:</p>
                <p className="text-2xl font-normal leading-relaxed text-slate-800">{currentQuestion.question}</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-4">
                  <BrainCircuit className="text-slate-400" size={24} />
                  <h2 className="text-2xl font-normal text-slate-800">Explicação Detalhada</h2>
                </div>
                <div className="prose prose-slate max-w-none prose-p:text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-headings:font-normal prose-strong:font-normal leading-relaxed text-lg">
                  <Markdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      strong: ({node, ...props}) => (
                        <strong className="font-normal" {...props} />
                      )
                    }}
                  >
                    {currentQuestion.deepDive || ''}
                  </Markdown>
                </div>
              </div>

              {chatHistory.length > 0 && (
                <div className="space-y-8 pt-10 border-t-2 border-slate-100">
                  <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-4">
                    <History className="text-slate-400" size={24} />
                    <h2 className="text-2xl font-normal text-slate-800">Histórico de Dúvidas</h2>
                  </div>
                  <div className="space-y-6">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={cn(
                        "p-8 rounded-[32px] border",
                        msg.role === 'user' ? "bg-slate-50 border-slate-100 ml-12" : "bg-white border-slate-100 mr-12 shadow-sm"
                      )}>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-normal mb-3">
                          {msg.role === 'user' ? 'Sua Pergunta' : 'Resposta do Professor'}
                        </p>
                        <div className="prose prose-slate prose-sm max-w-none prose-headings:font-normal prose-strong:font-normal">
                          <Markdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              strong: ({node, ...props}) => (
                                <strong className="font-normal" {...props} />
                              )
                            }}
                          >
                            {msg.text}
                          </Markdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-12 border-t-2 border-slate-100 text-center text-slate-400 text-xs">
              <p className="font-normal">Conteúdo gerado por Quiz AI Expert</p>
              <p className="mt-1">© 2026 Todos os direitos reservados</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
