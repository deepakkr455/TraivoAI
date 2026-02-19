import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseService';
import { affiliateSubscriptionService } from '../services/subscriptionService';


interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: any | null;
    personalization: any | null;
    loading: boolean;
    subscription: any | null;
    subscriptionLoading: boolean;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [personalization, setPersonalization] = useState<any | null>(null);
    const [subscription, setSubscription] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchSubscription(session.user.id);
            } else {
                setLoading(false);
                setSubscriptionLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                fetchSubscription(session.user.id);
            } else {
                setProfile(null);
                setPersonalization(null);
                setSubscription(null);
                setLoading(false);
                setSubscriptionLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            // Fetch profile and personalization in parallel
            const [profileRes, personalizationRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
                supabase.from('user_personalizations').select('*').eq('user_id', userId).maybeSingle()
            ]);

            if (profileRes.error) console.error('Error fetching profile:', profileRes.error);
            else setProfile(profileRes.data);

            if (personalizationRes.error) console.error('Error fetching personalization:', personalizationRes.error);
            else setPersonalization(personalizationRes.data);

        } catch (error) {
            console.error('Unexpected error fetching profile/personalization:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscription = async (userId: string) => {
        setSubscriptionLoading(true);
        try {
            const sub = await affiliateSubscriptionService.getUserSubscription(userId);
            setSubscription(sub);
        } catch (error) {
            console.error('Error fetching affiliate subscription:', error);
        } finally {
            setSubscriptionLoading(false);
        }
    };

    const refreshSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await Promise.all([
                fetchProfile(session.user.id),
                fetchSubscription(session.user.id)
            ]);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setSubscription(null);
    };

    return (
        <AuthContext.Provider value={{
            session,
            user,
            profile,
            personalization,
            loading,
            subscription,
            subscriptionLoading,
            signOut,
            refreshSession
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
