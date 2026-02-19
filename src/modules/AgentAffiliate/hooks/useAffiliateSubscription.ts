import { useState, useEffect, useCallback } from 'react';
import { affiliateSubscriptionService } from '../services/subscriptionService';
import { AgentTier, AgentFeature, AgentUserSubscription } from '../types';
import { useAuth } from '../context/AuthContext';

export function useAffiliateSubscription() {
    const { user } = useAuth();
    const [userSubscription, setUserSubscription] = useState<any | null>(null);
    const [availableTiers, setAvailableTiers] = useState<AgentTier[]>([]);
    const [featureControls, setFeatureControls] = useState<AgentFeature[]>([]);
    const [loading, setLoading] = useState(true);
    const [dailyQueryCount, setDailyQueryCount] = useState(0);

    const loadSubscriptionData = useCallback(async () => {
        try {
            setLoading(true);

            const promises: any[] = [
                affiliateSubscriptionService.fetchTiers(),
                affiliateSubscriptionService.fetchFeatures(),
            ];

            if (user) {
                promises.push(affiliateSubscriptionService.getUserSubscription(user.id));
                promises.push(affiliateSubscriptionService.getDailyMessageCount(user.id));
            }

            const results = await Promise.all(promises);

            const fetchedTiers = results[0] as AgentTier[];
            const fetchedControls = results[1] as AgentFeature[];

            setAvailableTiers(fetchedTiers);
            setFeatureControls(fetchedControls);

            if (user) {
                const fetchedSub = results[2];
                const fetchedCount = results[3] as number;

                setUserSubscription(fetchedSub);
                setDailyQueryCount(fetchedCount);
            } else {
                setUserSubscription(null);
                setDailyQueryCount(0);
            }
        } catch (error) {
            console.error('Error loading affiliate subscription data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadSubscriptionData();
    }, [loadSubscriptionData]);

    const isFeatureEnabled = useCallback((feature_key: string): boolean => {
        if (!userSubscription) return false;

        const currentTier = userSubscription.tier_name;

        const control = featureControls.find(
            c => c.tier_name === currentTier && c.feature_key === feature_key
        );

        if (!control) return false;

        const val = control.control_value.toLowerCase();
        return val !== 'no' && val !== '0';
    }, [userSubscription, featureControls]);

    const getFeatureValue = useCallback((feature_key: string): string | null => {
        if (!userSubscription) return null;
        const control = featureControls.find(
            c => c.tier_name === userSubscription.tier_name && c.feature_key === feature_key
        );
        return control ? control.control_value : null;
    }, [userSubscription, featureControls]);

    const canMakeQuery = useCallback((): boolean => {
        if (loading) return false;
        if (!userSubscription?.tier) return false;

        const tier = userSubscription.tier;
        const quota = tier?.query_daily_quota || 20; // Safe fallback
        if (quota === -1) return true; // Unlimited
        return dailyQueryCount < quota;
    }, [userSubscription, dailyQueryCount, loading]);

    const canAddListing = useCallback((currentListingCount: number): boolean => {
        if (loading) return false;
        if (!userSubscription?.tier) return false;

        const tier = userSubscription.tier;
        if (tier.listings_quota === -1) return true; // Unlimited
        return currentListingCount < (tier.listings_quota || 0);
    }, [userSubscription, loading]);

    const canAccessLead = useCallback((currentLeadCount: number): boolean => {
        if (loading) return false;
        if (!userSubscription?.tier) return false;

        const tier = userSubscription.tier;
        if (tier.leads_quota === -1) return true; // Unlimited
        return currentLeadCount < (tier.leads_quota || 0);
    }, [userSubscription, loading]);

    return {
        userSubscription,
        availableTiers,
        featureControls,
        loading,
        dailyQueryCount,
        isFeatureEnabled,
        getFeatureValue,
        canMakeQuery,
        canAddListing,
        canAccessLead,
        refresh: loadSubscriptionData
    };
}
