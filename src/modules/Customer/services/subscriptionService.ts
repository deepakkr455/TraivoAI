import { supabase } from '../../../services/supabaseClient';
import { Subscription, FeatureUsageControl, UserSubscription } from '../../../types';

export const subscriptionService = {
    /**
     * Fetch all available subscription tiers
     */
    async fetchSubscriptions(): Promise<Subscription[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .order('monthly_price', { ascending: true });

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Fetch feature mapping for all tiers
     */
    async fetchFeatureControls(): Promise<FeatureUsageControl[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('feature_usage_controls')
            .select('*');

        if (error) {
            console.error('Error fetching feature controls:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get current user's active subscription
     */
    async getUserSubscription(userId: string): Promise<UserSubscription | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) // Get latest if duplicate
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user subscription:', error);
            return null;
        }

        // Default to free if no subscription record exists
        if (!data) {
            return {
                id: 'temp-free',
                user_id: userId,
                plan_name: 'free',
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: null,
                created_at: new Date().toISOString()
            };
        }

        return data;
    },

    /**
     * Update user's subscription (used for checkout or simulation)
     */
    async updateUserSubscription(userId: string, planName: string): Promise<UserSubscription | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: userId,
                plan_name: planName,
                status: 'active',
                current_period_start: new Date().toISOString(),
                // We could set current_period_end based on monthly vs quarterly here if needed
            })
            .select()
            .maybeSingle();

        if (error) {
            console.error('Error updating user subscription:', error);
            return null;
        }
        return data;
    },

    /**
     * Check current daily query count for a user
     */
    async getDailyMessageCount(userId: string): Promise<number> {
        if (!supabase) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('user_queries')
            .select('*', { count: 'exact', head: true })
            .eq('userid', userId)
            .gte('datetime', today.toISOString());

        if (error) {
            console.error('Error fetching query count:', error);
            return 0;
        }
        return count || 0;
    },

    /**
     * Fetch all subscription history for a user
     */
    async getUserSubscriptionHistory(userId: string): Promise<UserSubscription[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching subscription history:', error);
            return [];
        }
        return data || [];
    }
};
