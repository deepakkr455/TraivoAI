import { supabase } from '../../../services/supabaseClient';

import { TripSummaryData } from './conclusionService';

export const emailService = {
    /**
     * Generates a text report for the trip conclusion
     */
    generateTripReport(tripTitle: string, summaryData: TripSummaryData): string {
        const { totalDays, totalExpense, members, visitedPlaces, activities } = summaryData;

        let report = `Trip Summary: ${tripTitle}\n\n`;
        report += `Duration: ${totalDays} days\n`;
        report += `Places Visited: ${visitedPlaces.join(', ')}\n`;
        report += `Activities: ${activities}\n\n`;

        report += `--- Expense Summary ---\n`;
        report += `Total Spent: $${totalExpense.toFixed(2)}\n\n`;

        report += `Member Breakdown:\n`;
        members.forEach(m => {
            report += `- ${m.name}: $${m.totalExpense.toFixed(2)}\n`;
        });

        report += `\nCheck the full details on WanderHub!`;

        return report;
    },

    /**
     * Fetches emails for all confirmed members of a trip
     * Strategies:
     * 1. Check 'invitations' table for accepted invites (guests)
     * 2. (Optional) Check 'profiles' if available (future proofing)
     */
    async getMemberEmails(tripId: string): Promise<string[]> {
        console.log("emailService: getMemberEmails called for", tripId);
        if (!supabase) {
            console.error("Supabase client missing");
            return [];
        }

        try {
            // Fetch accepted invitations
            const { data: invites, error } = await supabase
                .from('invitations')
                .select('invited_email')
                .eq('plan_id', tripId)
                .eq('status', 'accepted');

            if (error) {
                console.error('Error fetching member emails:', error);
                return [];
            }

            console.log("emailService: fetched invites:", invites);

            const emails = invites?.map(i => i.invited_email) || [];
            return [...new Set(emails)]; // Deduplicate
        } catch (err) {
            console.error('Exception fetching emails:', err);
            return [];
        }
    }
};
