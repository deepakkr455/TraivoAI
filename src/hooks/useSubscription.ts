import { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '../modules/Customer/services/subscriptionService';
import { Subscription, FeatureUsageControl, UserSubscription } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './useAuth';

export function useSubscription() {
    const { user } = useAuth();
    const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
    const [availablePlans, setAvailablePlans] = useState<Subscription[]>([]);
    const [featureControls, setFeatureControls] = useState<FeatureUsageControl[]>([]);
    const [loading, setLoading] = useState(true);
    const [dailyQueryCount, setDailyQueryCount] = useState(0);
    const [subscriptionHistory, setSubscriptionHistory] = useState<UserSubscription[]>([]);

    const loadSubscriptionData = useCallback(async () => {
        try {
            setLoading(true);

            const promises: any[] = [
                subscriptionService.fetchSubscriptions(),
                subscriptionService.fetchFeatureControls(),
            ];

            if (user) {
                promises.push(subscriptionService.getUserSubscription(user.id));
                promises.push(subscriptionService.getDailyQueryCount(user.id));
                promises.push(subscriptionService.getUserSubscriptionHistory(user.id));
            }

            const results = await Promise.all(promises);

            const fetchedPlans = results[0] as Subscription[];
            const fetchedControls = results[1] as FeatureUsageControl[];

            setAvailablePlans(fetchedPlans);
            setFeatureControls(fetchedControls);

            let fetchedSub = null;
            let fetchedCount = 0;
            let fetchedHistory = [];

            if (user) {
                fetchedSub = results[2] as UserSubscription;
                fetchedCount = results[3] as number;
                fetchedHistory = results[4] as UserSubscription[];

                setUserSubscription(fetchedSub);
                setDailyQueryCount(fetchedCount);
                setSubscriptionHistory(fetchedHistory);
            } else {
                setUserSubscription(null);
                setDailyQueryCount(0);
                setSubscriptionHistory([]);
            }

            return {
                plans: fetchedPlans,
                subscription: fetchedSub,
                count: fetchedCount
            };
        } catch (error) {
            console.error('Error loading subscription data:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadSubscriptionData();
    }, [loadSubscriptionData]);

    const isFeatureEnabled = useCallback((feature_key: string): boolean => {
        if (!userSubscription) return false;

        // Default to 'free' if no record, but the service handles this by returning a default object usually
        const currentPlan = userSubscription.plan_name;

        const control = featureControls.find(
            c => c.plan_name === currentPlan && c.feature_key === feature_key
        );

        if (!control) return false;

        const val = control.control_value.toLowerCase();
        return val === 'yes' ||
            val === 'unlimited' ||
            val === 'personalized' ||
            /^\d+/.test(val); // Numeric limits like "30/day"
    }, [userSubscription, featureControls]);

    const getFeatureValue = useCallback((feature_key: string): string | null => {
        if (!userSubscription) return null;
        const control = featureControls.find(
            c => c.plan_name === userSubscription.plan_name && c.feature_key === feature_key
        );
        return control ? control.control_value : null;
    }, [userSubscription, featureControls]);

    const canMakeQuery = useCallback((): boolean => {
        // If loading, we cannot be certain, so handle the wait in the UI level
        if (loading) return false;
        if (!userSubscription) return false;

        const planName = userSubscription.plan_name.toLowerCase();
        const plan = availablePlans.find(p => p.name.toLowerCase() === planName);

        if (!plan) return false;

        if (plan.daily_quota === null) return true; // Unlimited
        return dailyQueryCount < plan.daily_quota;
    }, [userSubscription, availablePlans, dailyQueryCount, loading]);

    const checkQuota = useCallback((plans: Subscription[], sub: UserSubscription | null, count: number): boolean => {
        // If we haven't loaded plans yet, don't block the user (avoid false positive)
        if (plans.length === 0) return true;

        // If no subscription record found, default to true (usually service handles this, but let's be safe)
        if (!sub) return true;

        const plan = plans.find(p => p.name.toLowerCase() === sub.plan_name.toLowerCase());

        // If we can't find the plan rules, don't block the user
        if (!plan) return true;

        // Unlimited quota
        if (plan.daily_quota === null) return true;

        // Final strict check: only block if we have data AND count >= quota
        return count < plan.daily_quota;
    }, []);

    const updatePlan = async (planName: string) => {
        if (!user) return;
        const updated = await subscriptionService.updateUserSubscription(user.id, planName);
        if (updated) {
            await loadSubscriptionData();
        }
    };

    return {
        userSubscription,
        availablePlans,
        featureControls,
        loading,
        dailyQueryCount,
        isFeatureEnabled,
        getFeatureValue,
        canMakeQuery,
        checkQuota,
        updatePlan,
        refresh: loadSubscriptionData,
        subscriptionHistory
    };
}
