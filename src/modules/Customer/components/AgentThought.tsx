
import React from 'react';
import { Sparkles } from 'lucide-react';


interface AgentThoughtProps {
  text: string;
}

export const AgentThought: React.FC<AgentThoughtProps> = ({ text }) => {
  return (
    <div className="flex justify-start">
      <div className="max-w-2xl w-full flex items-center gap-2.5 text-gray-300 animate-pulse">
        <Sparkles className="w-5 h-5 flex-shrink-0 text-teal-500" />
        <div className="text-sm italic p-2 bg-gray-100 rounded-lg text-gray-800">
          {text}
        </div>
      </div>
    </div>
  );
};
