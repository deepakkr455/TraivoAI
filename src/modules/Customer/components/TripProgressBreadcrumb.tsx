// components/TripProgressBreadcrumb.tsx - ADAPTIVE DESIGN
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FileText, Mail, Users, Map, DollarSign, Flag } from 'lucide-react';

interface StageConfig {
    key: string;
    label: string;
    dbStatus: string;
    navigateTo?: string;
    icon: React.ReactNode;
}

const ALL_STAGES: StageConfig[] = [
    { key: 'draft', label: 'Draft', dbStatus: 'planning', icon: <FileText className="w-5 h-5" /> },
    { key: 'invited', label: 'Invited', dbStatus: 'invite', icon: <Mail className="w-5 h-5" /> },
    { key: 'collaboration', label: 'Collaboration', dbStatus: 'collaboration', navigateTo: '/user/trip/{id}/collaborate', icon: <Users className="w-5 h-5" /> },
    { key: 'journey', label: 'Journey', dbStatus: 'journey-started', navigateTo: '/user/trip/{id}/journey', icon: <Map className="w-5 h-5" /> },
    { key: 'expenses', label: 'Expenses', dbStatus: 'expense', navigateTo: '/user/trip/{id}/expenses', icon: <DollarSign className="w-5 h-5" /> },
    { key: 'concluded', label: 'Concluded', dbStatus: 'concluded', navigateTo: '/user/trip/{id}/summary', icon: <Flag className="w-5 h-5" /> }
];

interface TripProgressBreadcrumbProps {
    currentStatus: string;
    isAdmin: boolean;
    isMember: boolean;
    tripId: string;
    trackExpenses?: boolean | null;
    orientation?: 'horizontal' | 'vertical';
}

export const TripProgressBreadcrumb: React.FC<TripProgressBreadcrumbProps> = ({
    currentStatus,
    isAdmin,
    isMember,
    tripId,
    trackExpenses,
    orientation = 'horizontal'
}) => {
    const navigate = useNavigate();

    // Filter stages based on track_expenses
    const STAGE_CONFIG = trackExpenses === false
        ? ALL_STAGES.filter(s => s.key !== 'expenses')
        : ALL_STAGES;

    const currentStageIndex = STAGE_CONFIG.findIndex(s => s.dbStatus === currentStatus);

    // Safety check
    const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

    const getStageState = (index: number): 'completed' | 'current' | 'future' => {
        if (index < activeIndex) return 'completed';
        if (index === activeIndex) return 'current';
        return 'future';
    };

    const canNavigate = (stage: StageConfig, index: number): boolean => {
        const state = getStageState(index);

        if (state === 'future') return false;

        // Only owners and members can navigate to specific stages
        if (!isAdmin && !isMember) return false;

        if (stage.dbStatus === 'journey-started' && !isAdmin) return false;

        const navigableStages = ['collaboration', 'expense', 'concluded'];
        return isAdmin || navigableStages.includes(stage.dbStatus);
    };

    const handleClick = (stage: StageConfig, index: number) => {
        if (!canNavigate(stage, index) || !stage.navigateTo) return;
        const path = stage.navigateTo.replace('{id}', tripId);
        navigate(path);
    };

    const progressPercentage = Math.min(100, Math.max(0, (activeIndex / (STAGE_CONFIG.length - 1)) * 100));

    if (orientation === 'vertical') {
        return (
            <div className="h-full py-6 px-4">
                <div className="relative h-full flex flex-col justify-between items-start">
                    {/* Background Line - Thinner (w-0.5) */}
                    <div style={{ height: '97%' }} className="absolute top-0 left-[40px]  w-0.5 bg-gray-200 rounded-full" />

                    {/* Active Progress Line - Thinner (w-0.5) */}
                    <div
                        className="absolute top-0 left-[40px] w-0.5 bg-teal-600 rounded-full transition-all duration-500 ease-out origin-top"
                        style={{ height: `${progressPercentage}%` }}
                    />

                    {/* Steps Container */}
                    {STAGE_CONFIG.map((stage, index) => {
                        const state = getStageState(index);
                        const isClickable = canNavigate(stage, index);

                        return (
                            <div
                                key={stage.key}
                                className=" items-center gap-4 relative z-10 w-full group"
                                onClick={() => handleClick(stage, index)}
                            >
                                {/* Icon Node */}
                                <div style={{ position: 'relative', left: '20px' }} className={`
                                    w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
                                    transition-all duration-300 border-2
                                    ${state === 'completed'
                                        ? 'bg-teal-600 border-teal-600 text-white'
                                        : state === 'current'
                                            ? 'bg-white border-teal-600 text-teal-600 ring-4 ring-teal-50'
                                            : 'bg-white border-gray-200 text-gray-300'
                                    }
                                    ${isClickable ? 'cursor-pointer hover:scale-105' : ''}
                                `}>
                                    {state === 'completed' ? (
                                        <Check className="w-5 h-5" strokeWidth={3} />
                                    ) : (
                                        stage.icon
                                    )}
                                </div>

                                {/* Label */}
                                <div style={{ textAlign: 'center' }} className={`
                                    text-sm font-medium transition-colors duration-300
                                    ${state === 'current' ? 'text-teal-700 font-bold' : state === 'completed' ? 'text-gray-900' : 'text-gray-400'}
                                    ${isClickable ? 'group-hover:text-teal-600' : ''}
                                `}>
                                    {stage.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Horizontal Layout (Mobile)
    return (
        <div className="w-full py-2 px-2">
            <div className="relative">
                {/* Background Line - Thinner (h-0.5) */}
                <div className="absolute top-[18px] left-0 w-full h-0.5 bg-gray-200 rounded-full" />

                {/* Active Progress Line - Thinner (h-0.5) */}
                <div
                    className="absolute top-[18px] left-0 h-0.5 bg-teal-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />

                {/* Steps Container */}
                <div className="relative flex justify-between items-start w-full">
                    {STAGE_CONFIG.map((stage, index) => {
                        const state = getStageState(index);
                        const isClickable = canNavigate(stage, index);

                        return (
                            <div
                                key={stage.key}
                                className="flex flex-col items-center relative group"
                                onClick={() => handleClick(stage, index)}
                                style={{ width: `${100 / STAGE_CONFIG.length}%` }}
                            >
                                {/* Icon Node */}
                                <div className={`
                                    w-9 h-9 rounded-full flex items-center justify-center border-2 z-10 
                                    transition-all duration-300 mb-2
                                    ${state === 'completed'
                                        ? 'bg-teal-600 border-teal-600 text-white'
                                        : state === 'current'
                                            ? 'bg-white border-teal-600 text-teal-600 ring-4 ring-teal-50'
                                            : 'bg-white border-gray-200 text-gray-300'
                                    }
                                    ${isClickable ? 'cursor-pointer hover:scale-105' : ''}
                                `}>
                                    {state === 'completed' ? (
                                        <Check className="w-4 h-4" strokeWidth={3} />
                                    ) : (
                                        // Clone element to adjust size for mobile if needed, or rely on w-5 h-5 from config
                                        React.cloneElement(stage.icon as React.ReactElement, { className: 'w-4 h-4' })
                                    )}
                                </div>

                                {/* Label - Centered & Multiline if needed */}
                                <div className={`
                                    text-[10px] sm:text-xs font-medium text-center leading-tight transition-colors duration-300 px-1
                                    ${state === 'current' ? 'text-teal-700 font-bold' : state === 'completed' ? 'text-gray-900' : 'text-gray-400'}
                                `}>
                                    {stage.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
