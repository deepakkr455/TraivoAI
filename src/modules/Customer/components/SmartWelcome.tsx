import React from 'react';
import { X } from 'lucide-react';
import { TravelPersonalization, PersonalizationData } from './TravelPersonalization';

interface SmartWelcomeProps {
    userName: string;
    onComplete: (data: PersonalizationData) => void;
    onSkip: () => void;
    isEditing?: boolean;
    initialData?: PersonalizationData;
}

export const SmartWelcome: React.FC<SmartWelcomeProps> = ({ userName, onComplete, onSkip, isEditing, initialData }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-1000">
            {/* Backdrop with extreme glassmorphism and theme tint */}
            <div
                className="absolute inset-0 bg-white/40 backdrop-blur-2xl"
                onClick={isEditing ? onSkip : undefined}
            />

            <div className="w-full max-w-lg h-full md:h-auto relative z-10 animate-in slide-in-from-bottom-20 duration-1000 ease-out">
                {isEditing && (
                    <button
                        onClick={onSkip}
                        className="absolute -top-12 right-0 md:-right-12 p-3 rounded-full bg-white text-slate-400 hover:text-slate-900 shadow-xl transition-all border border-slate-100"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                <div className="relative h-full flex flex-col justify-center">
                    <TravelPersonalization
                        initialData={initialData}
                        onComplete={onComplete}
                        onCancel={onSkip}
                    />
                </div>
            </div>
        </div>
    );
};
