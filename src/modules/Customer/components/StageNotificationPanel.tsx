// No changes needed for StageNotificationPanel as it was already predicting correct routes.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info, CheckCircle, Car, DollarSign } from 'lucide-react';

interface StageNotificationPanelProps {
    stage: string; // 'invite' | 'collaboration' | 'journey-started' | 'expense' | 'concluded'
    tripId: string;
    isAdmin?: boolean; // Is the current user the trip owner
    isMember?: boolean; // Is the current user a member
}

export const StageNotificationPanel: React.FC<StageNotificationPanelProps> = ({ stage, tripId, isAdmin = false, isMember = false }) => {
    const navigate = useNavigate();

    const isAuthorized = isAdmin || isMember;

    // If stage is 'planning' or other default states, we might not want to show anything special yet,
    // or maybe treat 'planning' as 'collaboration' depending on requirements.
    // The user prompt specifically listed: invite, collaboration, journey-started, expense, concluded.

    const getStageContent = () => {
        switch (stage) {
            case 'invite':
                return {
                    message: 'Waiting for Admin to start collaboration...',
                    buttonText: null,
                    targetPath: null,
                    icon: <Info className="w-5 h-5 text-amber-500" />,
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-200',
                    textColor: 'text-amber-800'
                };
            case 'collaboration':
                if (!isAuthorized) return null;
                return {
                    message: 'Your trip plan is currently at the Collaboration Stage.',
                    buttonText: 'Go to Collaboration Page',
                    targetPath: `/user/trip/${tripId}/collaborate`,
                    icon: <CheckCircle className="w-5 h-5 text-blue-500" />,
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    textColor: 'text-blue-800'
                };
            case 'journey-started':
                // Journey page is ADMIN ONLY
                return {
                    message: isAdmin
                        ? 'Continue setting up your journey details.'
                        : 'Your journey has been started by the plan owner.',
                    buttonText: isAdmin ? 'Go to Journey Page' : null,
                    targetPath: isAdmin ? `/user/trip/${tripId}/journey` : null,
                    icon: <Car className="w-5 h-5 text-green-500" />,
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    textColor: 'text-green-800'
                };
            case 'expense':
                if (!isAuthorized) return null;
                return {
                    message: 'You are now at the Expense Tracking Stage.',
                    buttonText: 'Go to Expense Page',
                    targetPath: `/user/trip/${tripId}/expenses`, // Verify route
                    icon: <DollarSign className="w-5 h-5 text-green-500" />,
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    textColor: 'text-green-800'
                };
            case 'concluded':
                if (!isAuthorized) return null;
                return {
                    message: 'This journey is concluded.',
                    buttonText: 'View Summary Page',
                    targetPath: `/user/trip/${tripId}/summary`,
                    icon: <CheckCircle className="w-5 h-5 text-gray-500" />,
                    bgColor: 'bg-gray-100',
                    borderColor: 'border-gray-200',
                    textColor: 'text-gray-800'
                };
            default:
                return null;
        }
    };

    const content = getStageContent();

    if (!content) return null;

    return (
        <div className={`p-4 rounded-lg border flex flex-col gap-3 ${content.bgColor} ${content.borderColor}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {content.icon}
                </div>
                <p className={`text-sm font-medium ${content.textColor}`}>
                    {content.message}
                </p>
            </div>

            {content.buttonText && content.targetPath && (
                <button
                    onClick={() => navigate(content.targetPath)}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/80 border border-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-md shadow-sm transition-all hover:shadow md:w-auto self-start"
                >
                    {content.buttonText}
                    <ArrowRight className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
