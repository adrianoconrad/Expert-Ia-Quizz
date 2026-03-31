/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, loginWithGoogle, logout, onAuthStateChanged, collection, query, where, orderBy, onSnapshot, setDoc, doc, Timestamp, handleFirestoreError, OperationType, getDoc, deleteDoc, writeBatch } from './firebase';
import { User } from 'firebase/auth';
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  X,
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
import { generateQuiz, QuizQuestion, QuizFormat, generateDeepDive, generateSpeech, ContentItem, chatWithProfessor } from './services/geminiService';
import { cn } from './lib/utils';

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
    textDark: 'dark:text-blue-400',
    textLight: 'text-blue-950',
    textLightDark: 'dark:text-blue-300',
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
    textDark: 'dark:text-amber-400',
    textLight: 'text-amber-950',
    textLightDark: 'dark:text-amber-300',
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
    textDark: 'dark:text-slate-500',
    textLight: 'text-slate-700',
    textLightDark: 'dark:text-slate-400',
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
    textDark: 'dark:text-yellow-500',
    textLight: 'text-yellow-700',
    textLightDark: 'dark:text-yellow-400',
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
}

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
  setNewSubjectInput
}: { 
  history: QuizResult[], 
  theme: any, 
  onClose: () => void, 
  themeColor: ThemeColor,
  onPracticeTopic: (topic: string) => void,
  dateFilter: string,
  setDateFilter: (val: string) => void,
  subjectFilter: string,
  setSubjectFilter: (val: string) => void,
  subjects: string[],
  handleAddSubject: (e: React.FormEvent) => void,
  handleRemoveSubject: (subject: string) => void,
  newSubjectInput: string,
  setNewSubjectInput: (val: string) => void
}) => {
  const filteredHistory = React.useMemo(() => {
    return history.filter(res => {
      const date = res.date instanceof Date ? res.date : (res.date as any).toDate();
      
      // Date filter
      let dateMatch = true;
      if (dateFilter === 'today') {
        const today = new Date();
        dateMatch = date.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateMatch = date >= lastWeek;
      } else if (dateFilter === 'month') {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateMatch = date >= lastMonth;
      } else if (dateFilter !== 'all') {
        const filterDate = new Date(dateFilter);
        if (!isNaN(filterDate.getTime())) {
          dateMatch = date.toDateString() === filterDate.toDateString();
        }
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
    if (filteredHistory.length === 0) return null;

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
    })).sort((a, b) => a.accuracy - b.accuracy);

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
      focusTopics
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-black/5 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className={cn("p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl transform -rotate-3", theme.primary, theme.contrastText)}>
            <LayoutDashboard size={24} className="sm:hidden" />
            <LayoutDashboard size={32} className="hidden sm:block" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">Análise Estratégica</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs sm:text-sm text-black/40 dark:text-slate-400 font-medium">Status Geral:</span>
              <span className={cn(
                "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider",
                stats ? (stats.avgAccuracy >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                stats.avgAccuracy >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400") : "bg-slate-100 text-slate-400"
              )}>
                {stats ? (stats.avgAccuracy >= 70 ? 'Consistente' : stats.avgAccuracy >= 50 ? 'Em Evolução' : 'Atenção Crítica') : 'Sem Dados'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/5 flex-1 sm:flex-none">
            <Calendar size={14} className="text-black/40 dark:text-slate-500 ml-1 sm:ml-2" />
            <select 
              value={['all', 'today', 'week', 'month'].includes(dateFilter) ? dateFilter : 'specific'}
              onChange={(e) => {
                if (e.target.value === 'specific') {
                  const today = new Date().toISOString().split('T')[0];
                  setDateFilter(today);
                } else {
                  setDateFilter(e.target.value);
                }
              }}
              className="bg-transparent text-[11px] sm:text-sm font-bold dark:text-white outline-none cursor-pointer pr-1 sm:pr-2 w-full"
            >
              <option value="all">Todo Período</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Último mês</option>
              <option value="specific">Data Específica...</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/5 flex-1 sm:flex-none">
            <BookOpen size={14} className="text-black/40 dark:text-slate-500 ml-1 sm:ml-2" />
            <select 
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-transparent text-[11px] sm:text-sm font-bold dark:text-white outline-none cursor-pointer pr-1 sm:pr-2 w-full max-w-[120px] sm:max-w-[150px]"
            >
              <option value="all">Todas Matérias</option>
              {allSubjectsFromHistory.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={onClose} 
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all font-bold text-xs sm:text-sm dark:text-white active:scale-95 flex-1 sm:flex-none"
          >
            <ChevronLeft size={18} />
            Voltar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl sm:rounded-2xl">
              <CheckCircle2 size={18} className="text-emerald-500 sm:hidden" />
              <CheckCircle2 size={24} className="text-emerald-500 hidden sm:block" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-black/40 dark:text-slate-500 uppercase tracking-widest">Acertos</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl sm:text-4xl font-black dark:text-white">{stats.totalCorrect}</p>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">+{Math.round(stats.avgAccuracy)}%</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-rose-500/10 rounded-xl sm:rounded-2xl">
              <XCircle size={18} className="text-rose-500 sm:hidden" />
              <XCircle size={24} className="text-rose-500 hidden sm:block" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-black/40 dark:text-slate-500 uppercase tracking-widest">Erros</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl sm:text-4xl font-black dark:text-white">{stats.totalIncorrect}</p>
            <span className="text-[10px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">-{Math.round(100 - stats.avgAccuracy)}%</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl">
              <Clock size={18} className="text-amber-500 sm:hidden" />
              <Clock size={24} className="text-amber-500 hidden sm:block" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-black/40 dark:text-slate-500 uppercase tracking-widest">Tempo</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl sm:text-3xl font-black dark:text-white truncate">{formatTime(stats.totalTime)}</p>
            <span className="text-[10px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">Total</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm space-y-3 sm:space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl sm:rounded-2xl">
              <Target size={18} className="text-blue-500 sm:hidden" />
              <Target size={24} className="text-blue-500 hidden sm:block" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-black/40 dark:text-slate-500 uppercase tracking-widest">Quizzes</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl sm:text-4xl font-black dark:text-white">{stats.totalQuizzes}</p>
            <span className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Sessões</span>
          </div>
        </motion.div>
      </div>

      {/* Main Grid */}
      {stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Core Metrics & Subject Heatmap */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Quizzes', value: stats.totalQuizzes, icon: History, color: 'text-blue-500' },
                { label: 'Questões', value: stats.totalQuestions, icon: FileQuestion, color: 'text-indigo-500' },
                { label: 'Tempo Médio/Q', value: `${stats.avgTimePerQuestion.toFixed(0)}s`, icon: Clock, color: 'text-amber-500' },
                { label: 'Total Acertos', value: stats.totalCorrect, icon: CheckCircle2, color: 'text-emerald-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-slate-700 shadow-sm">
                  <stat.icon size={18} className={cn("mb-2 sm:mb-3", stat.color)} />
                  <p className="text-[9px] sm:text-[10px] font-bold text-black/30 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Subject Folders / Detailed List */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-black/5 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
                  <FolderOpen size={24} className={theme.text} />
                  Organização por Matéria
                </h3>
                <span className="text-[10px] font-bold text-black/30 dark:text-slate-500 uppercase tracking-widest">
                  {stats.subjectData.length} Matérias Analisadas
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.subjectData.map((s, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="group relative bg-black/5 dark:bg-white/5 p-5 rounded-3xl border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-all overflow-hidden"
                  >
                    {/* Folder Tab Effect */}
                    <div className={cn("absolute top-0 left-6 w-16 h-1.5 rounded-b-lg", 
                      s.status === 'Mastered' ? "bg-emerald-500" :
                      s.status === 'Improving' ? "bg-amber-500" : "bg-rose-500"
                    )} />

                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm", 
                        s.status === 'Mastered' ? "text-emerald-500" :
                        s.status === 'Improving' ? "text-amber-500" : "text-rose-500"
                      )}>
                        <Folder size={20} />
                      </div>
                      <div className="text-right">
                        <p className={cn("text-xl font-black", 
                          s.status === 'Mastered' ? "text-emerald-500" :
                          s.status === 'Improving' ? "text-amber-500" : "text-rose-500"
                        )}>
                          {s.accuracy}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-bold dark:text-white leading-tight truncate" title={s.name}>{s.name}</h4>
                        <p className="text-[10px] text-black/40 dark:text-slate-500 font-medium">
                          {s.attempts} tent. • {format(s.lastDate, "dd/MM/yy")}
                        </p>
                      </div>

                      <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${s.accuracy}%` }}
                          className={cn(
                            "h-full rounded-full",
                            s.status === 'Mastered' ? "bg-emerald-500" :
                            s.status === 'Improving' ? "bg-amber-500" :
                            "bg-rose-500"
                          )}
                        />
                      </div>

                      <button 
                        onClick={() => onPracticeTopic(s.name)}
                        className={cn(
                          "w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95",
                          "bg-white dark:bg-slate-800 hover:bg-black/5 dark:hover:bg-white/5 dark:text-white border border-black/5 dark:border-white/10"
                        )}
                      >
                        <RotateCcw size={12} />
                        Praticar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Insights & Focus */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Priority Focus */}
            <div className="bg-rose-50 dark:bg-rose-900/10 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/20 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white dark:bg-rose-900/30 rounded-2xl shadow-sm text-rose-600">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-rose-900 dark:text-rose-100">Foco Prioritário</h3>
              </div>
              <p className="text-sm text-rose-800/60 dark:text-rose-300/60 mb-6 font-medium leading-relaxed">
                Baseado no volume de erros e frequência, estas matérias estão prejudicando sua média geral:
              </p>
              <div className="space-y-3">
                {stats.focusTopics.map((topic, i) => (
                  <div key={i} className="bg-white dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-100 dark:border-rose-800/50 flex items-center justify-between">
                    <span className="font-bold text-rose-900 dark:text-rose-100 truncate pr-2">{topic.name}</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/50 px-2 py-1 rounded-lg">
                      {topic.accuracy}%
                    </span>
                  </div>
                ))}
                {stats.focusTopics.length === 0 && (
                  <p className="text-center py-4 italic text-rose-400">Nenhum foco crítico identificado. Bom trabalho!</p>
                )}
              </div>
            </div>

            {/* Subject Management */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-black/5 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-3">
                  <PlusCircle size={24} className={theme.text} />
                  Minhas Matérias
                </h3>
              </div>
              
              <form onSubmit={handleAddSubject} className="flex gap-2 mb-6">
                <input 
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  placeholder="Nova matéria (ex: Direito Civil)"
                  className="flex-1 bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                />
                <button 
                  type="submit"
                  className={cn("px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95", theme.primary, theme.contrastText)}
                >
                  Adicionar
                </button>
              </form>

              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {subjects.map((subject, i) => (
                  <div key={i} className="group flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                    <span className="text-xs font-bold dark:text-slate-300">{subject}</span>
                    <button 
                      onClick={() => handleRemoveSubject(subject)}
                      className="text-black/20 dark:text-white/20 hover:text-rose-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/20 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white dark:bg-emerald-900/30 rounded-2xl shadow-sm text-emerald-600">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Domínio Atual</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {stats.strengths.map((s, i) => (
                  <span key={i} className="px-4 py-2 bg-white dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                    {s.name}
                  </span>
                ))}
                {stats.strengths.length === 0 && (
                  <p className="text-sm italic text-emerald-600/60">Continue praticando para consolidar matérias.</p>
                )}
              </div>
            </div>

            {/* Action Plan / AI Insights */}
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <BrainCircuit size={120} className="text-indigo-600" />
              </div>
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="p-3 bg-white dark:bg-indigo-900/30 rounded-2xl shadow-sm text-indigo-600">
                  <Lightbulb size={24} />
                </div>
                <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Plano de Ação</h3>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <p className="text-sm text-indigo-800 dark:text-indigo-200 font-medium leading-relaxed">
                    {stats.avgAccuracy < 65 
                      ? "Seu foco deve ser na base teórica. Reduza o volume de questões e aumente o tempo de revisão por erro."
                      : "Você tem boa base. O foco agora é aumentar a velocidade de resolução sem perder precisão."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  <p className="text-sm text-indigo-800 dark:text-indigo-200 font-medium leading-relaxed">
                    {stats.avgTimePerQuestion > 90 
                      ? "Atenção ao tempo! Você está levando mais de 1:30 por questão. Tente simular provas com cronômetro."
                      : "Excelente ritmo de resolução. Mantenha a calma para evitar erros por distração."}
                  </p>
                </div>
                {stats.focusTopics.length > 0 && (
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    <p className="text-sm text-indigo-800 dark:text-indigo-200 font-medium leading-relaxed">
                      Próxima sessão sugerida: <strong>{stats.focusTopics[0].name}</strong> para recuperar sua média.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-24 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-black/5 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
            <Search size={40} className="text-black/20 dark:text-white/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold dark:text-white">Nenhum resultado encontrado</h3>
            <p className="text-black/40 dark:text-slate-400 max-w-xs mx-auto">Não encontramos dados para os filtros selecionados. Tente ajustar o período ou a matéria.</p>
          </div>
          <button 
            onClick={() => { setDateFilter('all'); setSubjectFilter('all'); }}
            className={cn("px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg", theme.primary, theme.contrastText, theme.shadow)}
          >
            Limpar Filtros
          </button>
        </div>
      )}
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
  setNewSubjectInput
}: { 
  history: QuizResult[], 
  theme: any, 
  onClose: () => void,
  onPracticeIncorrect: (questions: QuizQuestion[], fileName: string) => void,
  dateFilter: string,
  setDateFilter: (val: string) => void,
  subjectFilter: string,
  setSubjectFilter: (val: string) => void,
  subjects: string[],
  handleAddSubject: (e: React.FormEvent) => void,
  handleRemoveSubject: (subject: string) => void,
  newSubjectInput: string,
  setNewSubjectInput: (val: string) => void
}) => {
  const filteredHistory = React.useMemo(() => {
    return history.filter(res => {
      const date = res.date instanceof Date ? res.date : (res.date as any).toDate();
      
      // Date filter
      let dateMatch = true;
      if (dateFilter === 'today') {
        const today = new Date();
        dateMatch = date.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateMatch = date >= lastWeek;
      } else if (dateFilter === 'month') {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateMatch = date >= lastMonth;
      } else if (dateFilter !== 'all') {
        const filterDate = new Date(dateFilter);
        if (!isNaN(filterDate.getTime())) {
          dateMatch = date.toDateString() === filterDate.toDateString();
        }
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
    const stats: { [key: string]: { correct: number, total: number, lastDate: Date, attempts: number, questions: QuizQuestion[], incorrectCount: number } } = {};
    
    filteredHistory.forEach(res => {
      const date = res.date instanceof Date ? res.date : (res.date as any).toDate();
      
      res.questions.forEach((q, idx) => {
        const topic = q.subject || res.fileName || 'Geral';
        if (!stats[topic]) stats[topic] = { correct: 0, total: 0, lastDate: date, attempts: 0, questions: [], incorrectCount: 0 };
        
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

      // Count attempts per subject per quiz
      const quizSubjects = new Set(res.questions.map(q => q.subject || res.fileName || 'Geral'));
      quizSubjects.forEach(s => {
        if (stats[s]) stats[s].attempts += 1;
      });
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
        lastDate: data.lastDate
      }))
      .sort((a, b) => b.incorrectCount - a.incorrectCount);
  }, [filteredHistory]);

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-black/5 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className={cn("p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl transform -rotate-3", theme.primary, theme.contrastText)}>
            <BookOpen size={24} className="sm:hidden" />
            <BookOpen size={32} className="hidden sm:block" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold dark:text-white tracking-tight">Modo de Estudo</h2>
            <p className="text-xs sm:text-sm text-black/40 dark:text-slate-400 font-medium">Revise seus erros e foque nos pontos de atenção</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/5 flex-1 sm:flex-none">
            <Calendar size={14} className="text-black/40 dark:text-slate-500 ml-1 sm:ml-2" />
            <select 
              value={['all', 'today', 'week', 'month'].includes(dateFilter) ? dateFilter : 'specific'}
              onChange={(e) => {
                if (e.target.value === 'specific') {
                  const today = new Date().toISOString().split('T')[0];
                  setDateFilter(today);
                } else {
                  setDateFilter(e.target.value);
                }
              }}
              className="bg-transparent text-[11px] sm:text-sm font-bold dark:text-white outline-none cursor-pointer pr-1 sm:pr-2 w-full"
            >
              <option value="all">Todo Período</option>
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Último mês</option>
              <option value="specific">Data Específica...</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/5 flex-1 sm:flex-none">
            <BookOpen size={14} className="text-black/40 dark:text-slate-500 ml-1 sm:ml-2" />
            <select 
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-transparent text-[11px] sm:text-sm font-bold dark:text-white outline-none cursor-pointer pr-1 sm:pr-2 w-full max-w-[120px] sm:max-w-[150px]"
            >
              <option value="all">Todas Matérias</option>
              {allSubjectsFromHistory.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={onClose} 
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all font-bold text-xs sm:text-sm dark:text-white active:scale-95 flex-1 sm:flex-none"
          >
            <ChevronLeft size={18} />
            Voltar
          </button>
        </div>
      </div>

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

          {/* Topics List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-3 px-2">
              <FolderOpen size={24} className={theme.text} />
              Pastas por Matéria
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectStats.map((s) => (
                <motion.div 
                  key={s.name}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="group relative bg-white dark:bg-slate-800 p-5 rounded-3xl border border-black/5 dark:border-slate-700 shadow-sm flex flex-col gap-4 overflow-hidden"
                >
                  {/* Folder Tab Effect */}
                  <div className={cn("absolute top-0 left-6 w-16 h-1.5 rounded-b-lg", theme.primary)} />
                  
                  <div className="flex items-center justify-between">
                    <div className={cn("p-3 rounded-xl bg-black/5 dark:bg-white/5", theme.text)}>
                      <Folder size={20} />
                    </div>
                    <div className="text-right">
                      <p className={cn("text-xl font-black", 
                        s.accuracy >= 80 ? "text-emerald-500" : 
                        s.accuracy >= 60 ? "text-amber-500" : "text-rose-500"
                      )}>
                        {s.accuracy}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold dark:text-white truncate" title={s.name}>{s.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-full flex items-center gap-1">
                        <XCircle size={10} />
                        {s.incorrectCount} erros
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        {s.correct} acertos
                      </span>
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.accuracy}%` }}
                      className={cn("h-full rounded-full", 
                        s.accuracy >= 80 ? "bg-emerald-500" : 
                        s.accuracy >= 60 ? "bg-amber-500" : "bg-rose-500"
                      )}
                    />
                  </div>

                  <button 
                    disabled={s.incorrectCount === 0}
                    onClick={() => onPracticeIncorrect(s.questions, `Revisão: ${s.name}`)}
                    className={cn(
                      "w-full py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95",
                      s.incorrectCount === 0 
                        ? "bg-black/5 text-black/20 cursor-not-allowed" 
                        : cn("bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 dark:text-white border border-black/5 dark:border-white/10")
                    )}
                  >
                    <RotateCcw size={12} />
                    Praticar Erros
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-24 text-center space-y-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-black/5 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
            <Search size={40} className="text-black/20 dark:text-white/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold dark:text-white">Nenhum erro encontrado</h3>
            <p className="text-black/40 dark:text-slate-400 max-w-xs mx-auto">Não encontramos erros para os filtros selecionados. Tente ajustar o período ou a matéria.</p>
          </div>
          <button 
            onClick={() => { setDateFilter('all'); setSubjectFilter('all'); }}
            className={cn("px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg", theme.primary, theme.contrastText, theme.shadow)}
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </motion.div>
  );
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

export default function App() {
  return (
    <ErrorBoundary>
      <QuizApp />
    </ErrorBoundary>
  );
}

function QuizApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [state, setState] = useState<QuizState>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [deepDiveProgress, setDeepDiveProgress] = useState(0);
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
  const [isQuestionStarted, setIsQuestionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [lastContent, setLastContent] = useState<ContentItem | ContentItem[] | null>(null);
  const [lastFileName, setLastFileName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(true);
  const [manualApiKey, setManualApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect'>('all');
  const [showDashboard, setShowDashboard] = useState(false);
  const [showStudyMode, setShowStudyMode] = useState(false);
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
    }
  }, [themeColor, customColor]);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Dashboard Filters
  const [dashboardDateFilter, setDashboardDateFilter] = useState<string>('all');
  const [dashboardSubjectFilter, setDashboardSubjectFilter] = useState<string>('all');

  // Study Mode Filters
  const [studyModeDateFilter, setStudyModeDateFilter] = useState<string>('all');
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'loading') {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 98) return prev;
          // Slower as it gets higher to simulate complex processing
          const increment = Math.max(0.05, (100 - prev) / 40);
          return Math.min(98, prev + increment);
        });
      }, 100);
    } else {
      setLoadingProgress(0);
    }
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDeepDiveLoading) {
      setDeepDiveProgress(0);
      interval = setInterval(() => {
        setDeepDiveProgress(prev => {
          if (prev >= 98) return prev;
          const increment = Math.max(0.1, (100 - prev) / 30);
          return Math.min(98, prev + increment);
        });
      }, 100);
    } else {
      setDeepDiveProgress(0);
    }
    return () => clearInterval(interval);
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
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
        } as QuizResult;
      });
      setHistory(results);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'results');
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

      startQuiz(contents, combinedFileName);
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
    console.log("Iniciando geração de quiz...", { count: questionCount, fileName });
    setState('loading');
    setError(null);
    setShowDashboard(false);
    setLastContent(content);
    const cleanName = fileName
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
      setLoadingProgress(90);
      console.log("Quiz gerado com sucesso!", { count: generatedQuestions?.length });
      
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("Não foi possível gerar o quiz com o conteúdo fornecido.");
      }

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
      setIsDeepDiveExpanded(false);
      setIsReviewMode(false);
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
    
    // Use functional update to ensure we have the latest history and trigger API call
    setChatHistory(prev => {
      const newHistory = [...prev, { role: 'user' as const, text: userMsg }];
      
      // Trigger the API call in the background with the updated history
      (async () => {
        setIsChatLoading(true);
        try {
          // Pass the history BEFORE the current message, as chatWithProfessor adds the current message
          const response = await chatWithProfessor(questions[currentIndex], prev, userMsg);
          setChatHistory(current => [...current, { role: 'model' as const, text: response }]);
        } catch (err) {
          console.error("Chat error:", err);
          setChatHistory(current => [...current, { role: 'model' as const, text: "Desculpe, tive um problema ao processar sua pergunta. Tente novamente." }]);
        } finally {
          setIsChatLoading(false);
        }
      })();
      
      return newHistory;
    });
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
        setQuestionTime(0);
        setIsQuestionStarted(true);
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
        } catch (e) {
          console.error("Failed to save history to Firestore in background", e);
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
    setQuestionTime(0);
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
    setQuestionTime(0);
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
    setQuestions(incorrectQuestions);
    setAnswers(new Array(incorrectQuestions.length).fill(null));
    setQuestionTimes(new Array(incorrectQuestions.length).fill(0));
    setCurrentIndex(0);
    setTotalTime(0);
    setQuestionTime(0);
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

  const onPracticeTopic = (topicName: string) => {
    const lastResult = history.find(res => res.fileName === topicName);
    if (lastResult && lastResult.content) {
      startQuiz(lastResult.content, lastResult.fileName);
      setShowDashboard(false);
      setShowStudyMode(false);
    }
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
        await deleteDoc(doc(db, 'results', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `results/${id}`);
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

  return (
    <div className={cn("min-h-screen bg-[#F5F5F0] dark:bg-slate-950 text-[#1A1A1A] dark:text-slate-100 font-sans flex overflow-hidden relative", theme.selection)}>
      
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
          "bg-white dark:bg-slate-900 border-r border-black/5 dark:border-slate-800 flex-shrink-0 relative overflow-hidden flex flex-col z-[70]",
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
            <div className="mb-6">
              <button 
                onClick={() => setShowDashboard(true)}
                className={cn(
                  "w-full flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all group",
                  showDashboard 
                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                    : "bg-white dark:bg-slate-900 border-black/5 dark:border-slate-800 hover:border-black/20 dark:hover:border-slate-700"
                )}
              >
                <LayoutDashboard size={20} className={cn("transition-transform group-hover:scale-110", showDashboard ? "" : theme.icon)} />
                <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
              </button>
            </div>

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
        <header className="border-b border-black/5 dark:border-slate-800 bg-white/80 dark:bg-transparent backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group"
              >
                {sidebarOpen ? <ChevronLeft size={20} className="dark:text-slate-400" /> : <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500 dark:text-slate-400" />}
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-black/60 dark:text-slate-500 hidden xs:inline">Ajuste</span>
              </button>
              <div className="flex items-center gap-2">
                <div className={cn("w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-lg", theme.gradientFrom, theme.gradientTo, theme.shadow)}>
                  <BrainCircuit size={18} className="text-white sm:hidden" />
                  <BrainCircuit size={20} className="text-white hidden sm:block" />
                </div>
                <span className="font-semibold text-base sm:text-lg tracking-tight dark:text-slate-100 truncate max-w-[120px] sm:max-w-none">Quiz AI Expert</span>
              </div>
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
                  onClick={loginWithGoogle}
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
                />
              ) : state === 'idle' ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-5xl mx-auto text-center space-y-8"
                >
                  <div className="flex justify-center">
                    <div className={cn("w-20 h-20 bg-gradient-to-br rounded-3xl flex items-center justify-center shadow-2xl rotate-3", theme.gradientFrom, theme.gradientTo, theme.shadowLg)}>
                      <BrainCircuit size={48} className="text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-5xl font-medium tracking-tight leading-tight dark:text-slate-100">
                      Transforme seus documentos em <span className={cn("italic font-serif", theme.textLight, theme.textLightDark)}>conhecimento</span>
                      <br />
                      <span className={cn("italic font-serif", theme.textLight, theme.textLightDark)}>vivo</span>.
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
                        <BrainCircuit className={theme.icon} size={32} />
                      </div>
                      <div>
                        <p className="font-medium text-lg dark:text-slate-100">
                          Gerar Quiz de Materiais
                        </p>
                        <p className="text-sm text-black/40 dark:text-slate-500">Clique ou arraste seus arquivos PDF, DOCX, Imagens, TXT ou MD</p>
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className={cn("flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg", theme.primary, theme.contrastText, theme.shadow)}
                        >
                          <Upload size={20} />
                          Selecionar Arquivos
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-4">
                    <div className="flex-1 h-px bg-black/5 dark:bg-slate-800"></div>
                    <span className="text-xs font-bold text-black/20 dark:text-slate-600 uppercase tracking-widest">ou use links</span>
                    <div className="flex-1 h-px bg-black/5 dark:bg-slate-800"></div>
                  </div>

                  <div className="space-y-4">
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
                    <div className="grid grid-cols-1 gap-4">
                      <button
                        type="button"
                        disabled={!urlInput.trim()}
                        onClick={handleUrlSubmit}
                        className={cn("py-4 rounded-2xl font-bold disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2", theme.primary, theme.contrastText, theme.shadow, theme.primaryHover)}
                      >
                        <BrainCircuit size={20} />
                        Gerar Quiz de Links
                      </button>
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
                          {loadingProgress < 20 && "Iniciando análise de conteúdo..."}
                          {loadingProgress >= 20 && loadingProgress < 40 && "Mapeando conceitos fundamentais..."}
                          {loadingProgress >= 40 && loadingProgress < 60 && "Estruturando questões estratégicas..."}
                          {loadingProgress >= 60 && loadingProgress < 80 && "Refinando alternativas e explicações..."}
                          {loadingProgress >= 80 && loadingProgress < 95 && "Finalizando detalhes técnicos..."}
                          {loadingProgress >= 95 && "Quase pronto! Organizando sua sessão..."}
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
                                    setQuestionTime(0);
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
                                <span className={cn(
                                  "px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-wider w-fit",
                                  currentQuestion.difficulty === 'easy' ? theme.difficultyEasy :
                                  currentQuestion.difficulty === 'medium' ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" :
                                  "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                                )}>
                                  {currentQuestion.difficulty === 'easy' ? 'Fácil' : 
                                   currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <span className="text-[8px] sm:text-[10px] font-bold text-black/30 dark:text-slate-600 uppercase tracking-[0.2em]">Tempo</span>
                                <div className={cn(
                                  "flex items-center gap-1 sm:gap-1.5 font-mono font-bold transition-all duration-300",
                                  questionTime >= timeAlertThreshold 
                                    ? "text-rose-600 text-lg sm:text-xl animate-pulse" 
                                    : cn(theme.text, theme.textDark, "text-base sm:text-lg")
                                )}>
                                  <Clock size={questionTime >= timeAlertThreshold ? 18 : 14} />
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
                              onClick={() => {
                                if (window.confirm("Deseja realmente sair do quiz? Seu progresso atual não será salvo.")) {
                                  setState('idle');
                                }
                              }}
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
                                      {deepDiveProgress < 30 && "Revisando o contexto da questão..."}
                                      {deepDiveProgress >= 30 && deepDiveProgress < 60 && "Consultando referências técnicas..."}
                                      {deepDiveProgress >= 60 && deepDiveProgress < 85 && "Sintetizando explicação pedagógica..."}
                                      {deepDiveProgress >= 85 && "Finalizando detalhes do aprofundamento..."}
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

                    <div className="flex flex-wrap items-center justify-center gap-4">
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
