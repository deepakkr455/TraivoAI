import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { TravelPersonalization, PersonalizationData } from '../components/TravelPersonalization';
import { saveUserPersonalization } from '../../AgentAffiliate/services/supabaseService';
import Header from '../components/Header';

const TravelPersonalizationPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, refreshSession, personalization } = useAuth() as any;

    // If it's a new user, we want them to stay here. If they are editing, we stay here.
    // Logic: If accessing directly and personalization exists, we might want to allow editing or redirect. 
    // For now, let's assume if they land here, they want to edit/create.
    // Removing the auto-redirect to allow editing context.

    /* 
    useEffect(() => {
        if (personalization) {
            navigate('/user/wanderchat', { replace: true });
        }
    }, [personalization, navigate]);
    */

    const handleComplete = async (data: PersonalizationData) => {
        if (user) {
            const success = await saveUserPersonalization(user.id, data);
            if (success) {
                await refreshSession();
                navigate('/user/wanderchat', { replace: true });
            }
        }
    };

    const handleCancel = () => {
        navigate('/user/wanderchat');
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col overflow-hidden relative">
            {/* Immersive background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
                <Header showBackground={false} />

                <div className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-4xl animate-in fade-in zoom-in duration-1000">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
                                Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Travel DNA</span>
                            </h1>
                            <p className="text-slate-400 text-lg">Personalizing your experience for smarter recommendations</p>
                        </div>

                        <TravelPersonalization
                            initialData={personalization}
                            onComplete={handleComplete}
                            onCancel={handleCancel}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TravelPersonalizationPage;
