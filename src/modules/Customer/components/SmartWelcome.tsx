import React from 'react';
import { X } from 'lucide-react';
import { TravelPersonalization, PersonalizationData } from './TravelPersonalization';

interface SmartWelcomeProps {
    userName: string;
    onComplete: (data: PersonalizationData) => void;
    onSkip: () => void;
    isEditing?: boolean;
}

export const SmartWelcome: React.FC<SmartWelcomeProps> = ({ userName, onComplete, onSkip, isEditing }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-1000">
            {/* Backdrop with extreme glassmorphism and theme tint */}
            <div
                className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-3xl"
                onClick={isEditing ? onSkip : undefined}
            />

            <div className="w-full max-w-lg h-full md:h-auto relative z-10 animate-in slide-in-from-bottom-20 duration-1000 ease-out">
                {isEditing && (
                    <button
                        onClick={onSkip}
                        className="absolute -top-12 right-0 md:-right-12 p-3 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                <div className="relative h-full flex flex-col justify-center">
                    <TravelPersonalization
                        onComplete={onComplete}
                        onCancel={onSkip}
                    />
                </div>
            </div>
        </div>
    );
};
