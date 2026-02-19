import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full bg-white/90 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] shadow-xl overflow-hidden transition-all duration-500">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-8 md:px-10 md:py-8 bg-white/50 hover:bg-white/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-slate-400">{icon}</div>}
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{title}</h3>
        </div>
        <div className={`p-2 rounded-full bg-slate-100 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <ChevronDown className="w-4 h-4 text-slate-600" />
        </div>
      </button>

      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-8 md:p-10 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};
