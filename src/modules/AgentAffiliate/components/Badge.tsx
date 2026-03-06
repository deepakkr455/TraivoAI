import React from 'react';
import { Trophy, Award, CheckCircle } from 'lucide-react';

export type BadgeState = 'grey' | 'mustard' | 'blue';

interface BadgeProps {
    state: BadgeState;
    className?: string;
    showLabel?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ state, className = '', showLabel = false }) => {
    const config = {
        grey: {
            icon: <CheckCircle className="w-5 h-5 text-slate-400" strokeWidth={2.5} />,
            color: 'text-slate-500 bg-slate-50 border-slate-200',
            label: 'Basic Verification Pending'
        },
        mustard: {
            icon: <Trophy className="w-5 h-5 text-amber-600 fill-amber-500/30" strokeWidth={2.5} />,
            color: 'text-amber-700 bg-amber-50 border-amber-400 shadow-[0_4px_12px_rgba(245,158,11,0.4)] ring-1 ring-amber-500/30',
            label: 'Basic Verified (Trusted Agent)'
        },
        blue: {
            icon: <Award className="w-5 h-5 text-blue-600 fill-blue-500/30" strokeWidth={2.5} />,
            color: 'text-blue-700 bg-blue-50 border-blue-400 shadow-[0_4px_12px_rgba(37,99,235,0.4)] ring-1 ring-blue-500/30',
            label: 'Identity Verified (Premium Trusted)'
        }
    };

    const current = config[state];

    return (
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-widest shadow-sm transition-all duration-300 ${current.color} ${className}`} title={current.label}>
            <div className="flex-shrink-0">{current.icon}</div>
            {showLabel && <span className="whitespace-nowrap">{current.label}</span>}
        </div>
    );
};
