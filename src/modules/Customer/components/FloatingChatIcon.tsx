
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export const FloatingChatIcon: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="fixed bottom-8 right-8 z-40">
            <button
                onClick={() => navigate('/user/messages')}
                className="group relative flex items-center justify-center w-16 h-16 bg-teal-600 hover:bg-teal-500 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 active:scale-95"
            >
                {/* Ping Animation */}
                <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-20"></span>

                <MessageSquare className="w-7 h-7" />

                {/* Tooltip */}
                <span className="absolute right-full mr-4 px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    My Inquiries
                </span>
            </button>
        </div>
    );
};
