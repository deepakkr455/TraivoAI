import React from 'react';
import { Sparkles } from 'lucide-react';

interface ProjectionCardProps {
  text: string;
}

export const ProjectionCard: React.FC<ProjectionCardProps> = ({ text }) => {
  return (
    <div className="mt-8 relative group">
       <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
       <div className="relative bg-slate-900 ring-1 ring-white/10 rounded-xl p-6 leading-none">
          <div className="flex items-center space-x-3 mb-4">
             <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
             </div>
             <h3 className="text-lg font-semibold text-white">AI Projection</h3>
          </div>
          <p className="text-slate-300 leading-relaxed italic text-lg font-light">
             "{text}"
          </p>
       </div>
    </div>
  );
};
