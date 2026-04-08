import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  theme: {
    gradientFrom: string;
    gradientTo: string;
    shadow: string;
  };
}

const Logo: React.FC<LogoProps> = ({ className, iconOnly, theme }) => {
  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      <div className={cn(
        "relative w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 overflow-hidden",
        theme.gradientFrom,
        theme.gradientTo,
        theme.shadow
      )}>
        <BrainCircuit size={22} className="text-white sm:hidden relative z-10 transition-transform duration-500 group-hover:rotate-12" />
        <BrainCircuit size={26} className="text-white hidden sm:block relative z-10 transition-transform duration-500 group-hover:rotate-12" />
        
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {!iconOnly && (
        <div className="flex flex-col">
          <span className="font-black text-lg sm:text-xl tracking-tighter leading-none dark:text-white flex items-center gap-1">
            EXPERTE
            <span style={{ color: '#2b842b' }}>IA</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 dark:text-slate-500 leading-none mt-1">
            Quizz Master
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
