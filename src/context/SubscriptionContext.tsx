import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { subscriptionService } from '../modules/Customer/services/subscriptionService';
import { Subscription, FeatureUsageControl, UserSubscription } from '../types';
import { useAuth } from '../hooks/useAuth';

interface SubscriptionContextType {
    userSubscription: UserSubscription | null;
    availablePlans: Subscription[];
    featureControls: FeatureUsageControl[];
    loading: boolean;
    dailyQueryCount: number;
    subscriptionHistory: UserSubscription[];
    refresh: () => Promise<any>;
    updatePlan: (planName: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
    const [availablePlans, setAvailablePlans] = useState<Subscription[]>([]);
    const [featureControls, setFeatureControls] = useState<FeatureUsageControl[]>([]);
    const [loading, setLoading] = useState(true);
    const [dailyQueryCount, setDailyQueryCount] = useState(0);
    const [subscriptionHistory, setSubscriptionHistory] = useState<UserSubscription[]>([]);

    const loadSubscriptionData = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);

            const promises: any[] = [
                subscriptionService.fetchSubscriptions(),
                subscriptionService.fetchFeatureControls(),
            ];

            if (user) {
                promises.push(subscriptionService.getUserSubscription(user.id));
                promises.push(subscriptionService.getDailyMessageCount(user.id));
                promises.push(subscriptionService.getUserSubscriptionHistory(user.id));
            }

            const results = await Promise.all(promises);

            const fetchedPlans = results[0] as Subscription[];
            const fetchedControls = results[1] as FeatureUsageControl[];

            setAvailablePlans(fetchedPlans);
            setFeatureControls(fetchedControls);

            if (user && results.length >= 5) {
                setUserSubscription(results[2] as UserSubscription);
                setDailyQueryCount(results[3] as number);
                setSubscriptionHistory(results[4] as UserSubscription[]);
            } else {
                setUserSubscription(null);
                setDailyQueryCount(0);
                setSubscriptionHistory([]);
            }

            return {
                plans: fetchedPlans,
                subscription: user && results.length >= 5 ? results[2] : null,
                count: user && results.length >= 5 ? results[3] : 0
            };
        } catch (error) {
            console.error('Error loading subscription data:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // Initial load is non-silent
        loadSubscriptionData(false);
    }, [loadSubscriptionData]);

    const updatePlan = async (planName: string) => {
        if (!user) return;
        const updated = await subscriptionService.updateUserSubscription(user.id, planName);
        if (updated) {
            await loadSubscriptionData();
        }
    };

    const value = {
        userSubscription,
        availablePlans,
        featureControls,
        loading,
        dailyQueryCount,
        subscriptionHistory,
        refresh: () => loadSubscriptionData(true),
        updatePlan
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscriptionContext = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
    }
    return context;
};
