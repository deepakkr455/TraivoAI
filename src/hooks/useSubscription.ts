import { useCallback } from 'react';
import { useSubscriptionContext } from '../context/SubscriptionContext';
import { Subscription, UserSubscription } from '../types';

export function useSubscription() {
    const {
        userSubscription,
        availablePlans,
        featureControls,
        loading,
        dailyQueryCount,
        subscriptionHistory,
        refresh,
        updatePlan
    } = useSubscriptionContext();

    const isFeatureEnabled = useCallback((feature_key: string): boolean => {
        if (!userSubscription) return false;

        const currentPlan = userSubscription.plan_name;
        const control = featureControls.find(
            c => c.plan_name === currentPlan && c.feature_key === feature_key
        );

        if (!control) return false;

        const val = control.control_value.toLowerCase();
        return val === 'yes' ||
            val === 'unlimited' ||
            val === 'personalized' ||
            /^\d+/.test(val);
    }, [userSubscription, featureControls]);

    const getFeatureValue = useCallback((feature_key: string): string | null => {
        if (!userSubscription) return null;
        const control = featureControls.find(
            c => c.plan_name === userSubscription.plan_name && c.feature_key === feature_key
        );
        return control ? control.control_value : null;
    }, [userSubscription, featureControls]);

    const canMakeQuery = useCallback((): boolean => {
        if (loading) return false;
        if (!userSubscription) return false;

        const planName = userSubscription.plan_name.toLowerCase();
        const plan = availablePlans.find(p => p.name.toLowerCase() === planName);

        if (!plan) return false;

        if (plan.daily_quota === null) return true;
        return dailyQueryCount < plan.daily_quota;
    }, [userSubscription, availablePlans, dailyQueryCount, loading]);

    const checkQuota = useCallback((plans: Subscription[], sub: UserSubscription | null, count: number): boolean => {
        if (plans.length === 0) return true;
        if (!sub) return true;

        const plan = plans.find(p => p.name.toLowerCase() === sub.plan_name.toLowerCase());
        if (!plan) return true;

        if (plan.daily_quota === null) return true;
        return count < plan.daily_quota;
    }, []);

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
        refresh,
        subscriptionHistory
    };
}
