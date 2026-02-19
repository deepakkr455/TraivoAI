import { supabase } from '../../../services/supabaseClient';


export interface TripMember {
    id: string;
    name: string;
    totalExpense: number;
}

export interface TripSummaryData {
    id?: string;
    totalDays: number;
    totalExpense: number;
    expectedBudget: number;
    visitedPlaces: string[];
    activities: number;
    members: TripMember[];
    aiSummary?: string;
}

export interface Feedback {
    id: string;
    user_id: string;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export const conclusionService = {
    /**
     * Get conclusion data for a trip
     */
    async getConclusion(tripId: string): Promise<{ success: boolean; data?: TripSummaryData; error?: string }> {
        try {
            if (!supabase) throw new Error("Supabase client not initialized");

            const { data, error } = await supabase
                .from('trip_conclusions')
                .select('*')
                .eq('trip_id', tripId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching conclusion:', error);
                return { success: false, error: error.message };
            }

            if (!data) return { success: true, data: undefined };

            return {
                success: true,
                data: {
                    id: data.id,
                    totalDays: data.total_days,
                    totalExpense: data.total_expense,
                    expectedBudget: data.expected_budget,
                    visitedPlaces: data.visited_places,
                    activities: data.activities_count,
                    aiSummary: data.ai_summary,
                    members: [] // Caller should populate this from expense service
                }
            };
        } catch (error) {
            console.error('Exception fetching conclusion:', error);
            return { success: false, error: 'Failed to fetch conclusion' };
        }
    },

    /**
     * Save or update trip conclusion
     */
    async saveConclusion(tripId: string, data: Partial<TripSummaryData>): Promise<{ success: boolean; error?: string }> {
        try {
            if (!supabase) throw new Error("Supabase client not initialized");

            const dbData = {
                trip_id: tripId,
                total_days: data.totalDays,
                total_expense: data.totalExpense,
                expected_budget: data.expectedBudget,
                visited_places: data.visitedPlaces,
                activities_count: data.activities,
                ai_summary: data.aiSummary,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('trip_conclusions')
                .upsert(dbData, { onConflict: 'trip_id' });

            if (error) {
                console.error('Error saving conclusion:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('Exception saving conclusion:', error);
            return { success: false, error: 'Failed to save conclusion' };
        }
    },

    /**
     * Submit feedback
     */
    async submitFeedback(tripId: string, userId: string, userName: string, rating: number, comment: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!supabase) throw new Error("Supabase client not initialized");

            const { error } = await supabase
                .from('trip_feedback')
                .upsert({
                    trip_id: tripId,
                    user_id: userId,
                    user_name: userName,
                    rating,
                    comment
                }, { onConflict: 'trip_id, user_id' }); // Update if exists

            if (error) {
                console.error('Error submitting feedback:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('Exception submitting feedback:', error);
            return { success: false, error: 'Failed to submit feedback' };
        }
    },

    async getFeedback(tripId: string): Promise<{ success: boolean; data?: Feedback[]; error?: string }> {
        try {
            if (!supabase) throw new Error("Supabase client not initialized");

            const { data, error } = await supabase
                .from('trip_feedback')
                .select('*')
                .eq('trip_id', tripId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching feedback:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Exception fetching feedback:', error);
            return { success: false, error: 'Failed to fetch feedback' };
        }
    },

    /**
     * Trigger expense summary email via Edge Function
     */
    async triggerExpenseEmail(tripId: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!supabase) throw new Error("Supabase client not initialized");

            console.log("Invoking send-expense-summary for trip:", tripId);
            const { data, error } = await supabase.functions.invoke('send-expense-summary', {
                body: { trip_id: tripId }
            });

            if (error) {
                console.error("Error invoking edge function:", error);
                // Don't fail the UI flow just because email failed, but log it.
                // Or return error to show user.
                return { success: false, error: error.message };
            }

            console.log("Email function response:", data);
            return { success: true };

        } catch (err) {
            console.error("Exception triggering email:", err);
            return { success: false, error: 'Failed to trigger email' };
        }
    }
};
