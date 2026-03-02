import React from 'react';

export type BadgeState = 'grey' | 'mustard' | 'blue';

interface BadgeProps {
    state: BadgeState;
    className?: string;
    showLabel?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ state, className = '', showLabel = false }) => {
    const config = {
        grey: {
            icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'text-gray-400 bg-gray-100 border-gray-200',
            label: 'Basic Verification Pending'
        },
        mustard: {
            icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.707-11l3.535 3.536 1.414-1.414L10.293 8.172 7.464 11l1.415 1.414L10.293 11z" />
                </svg>
            ),
            color: 'text-[#E1AD01] bg-[#FFF9E6] border-[#F4D03F]',
            label: 'Basic Verified'
        },
        blue: {
            icon: (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ),
            color: 'text-blue-600 bg-blue-50 border-blue-200',
            label: 'Identity Verified'
        }
    };

    const current = config[state];

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${current.color} ${className}`} title={current.label}>
            {current.icon}
            {showLabel && <span>{current.label}</span>}
        </div>
    );
};
