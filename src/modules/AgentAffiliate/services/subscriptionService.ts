import { supabase } from './supabaseService';
import { AgentTier, AgentFeature, AgentUserSubscription } from '../types';

export const affiliateSubscriptionService = {
    /**
     * Fetch all available affiliate subscription tiers
     */
    async fetchTiers(): Promise<AgentTier[]> {
        const { data, error } = await supabase
            .from('agent_subscription_tiers')
            .select('*')
            .order('monthly_price', { ascending: true });

        if (error) {
            console.error('Error fetching affiliate tiers:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Fetch feature mapping for all affiliate tiers
     */
    async fetchFeatures(): Promise<AgentFeature[]> {
        const { data, error } = await supabase
            .from('agent_subscription_features')
            .select('*');

        if (error) {
            console.error('Error fetching affiliate features:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get current affiliate's active subscription
     */
    async getUserSubscription(userId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('agent_user_subscriptions')
            .select(`
                *,
                tier:agent_subscription_tiers(*)
            `)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user affiliate subscription:', error);
            return null;
        }

        // Default to free if no subscription record exists
        if (!data) {
            // Fetch free tier details to include quotas
            const { data: freeTier } = await supabase
                .from('agent_subscription_tiers')
                .select('*')
                .eq('name', 'base')
                .maybeSingle();

            return {
                id: 'temp-free',
                user_id: userId,
                tier_name: 'base',
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: null,
                created_at: new Date().toISOString(),
                tier: freeTier
            };
        }

        return data;
    },

    /**
     * Update affiliate's subscription
     */
    async updateUserSubscription(userId: string, tierName: string): Promise<AgentUserSubscription | null> {
        const { data, error } = await supabase
            .from('agent_user_subscriptions')
            .upsert({
                user_id: userId,
                tier_name: tierName,
                status: 'active',
                current_period_start: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating user affiliate subscription:', error);
            return null;
        }
        return data;
    },

    /**
     * Check current daily query count for an affiliate
     */
    async getDailyMessageCount(businessId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('b2b_conversations')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('sender', 'user')
            .gte('created_at', today.toISOString());

        if (error) {
            console.error('Error fetching affiliate query count:', error);
            return 0;
        }
        return count || 0;
    }
};
