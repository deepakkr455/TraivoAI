import { supabase } from '../../../services/supabaseClient';
import { TripPlanData } from '../../../types';


export interface Proposal {
  id: string;
  plan_id: string;
  user_id: string;
  user_name: string;
  category: 'itinerary' | 'accommodation' | 'date';
  title: string;
  details?: any; // jsonb parsed
  created_at: string;
}

export interface Vote {
  proposal_id: string;
  user_id: string;
  type: 'up' | 'down';
}

export const proposalsService = {
  async getProposals(planId: string, category?: string): Promise<{ success: boolean; data?: Proposal[]; error?: string }> {
    try {
      let query = supabase
        .from('proposals')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching proposals:', error);
        return { success: false, error: error.message };
      }

      // Parse details jsonb
      const parsedData = (data || []).map((p: any) => ({
        ...p,
        details: p.details ? JSON.parse(p.details) : undefined,
      }));
      console.log("parsedData:", parsedData);

      return { success: true, data: parsedData };
    } catch (err) {
      console.error('Exception fetching proposals:', err);
      return { success: false, error: 'Failed to fetch proposals' };
    }
  },

  async addProposal(planId: string, userId: string, userName: string, category: string, title: string, details?: any, daytitle?: string): Promise<{ success: boolean; data?: Proposal; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          plan_id: planId,
          user_id: userId,
          user_name: userName,
          category,
          title,
          details: details ? JSON.stringify(details) : null,
          day_title: daytitle
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding proposal:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Exception adding proposal:', err);
      return { success: false, error: 'Failed to add proposal' };
    }
  },

  async seedProposals(planId: string, ownerId: string, planData: TripPlanData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🌱 Seeding initial proposals from plan data for plan:', planId);

      // 1. Seed Dates
      if (planData.dates) {
        console.log('📅 Processing dates:', planData.dates);
        const dateStr = planData.dates.trim();
        let startDate: string | null = null;
        let endDate: string | null = null;

        // Try to parse "start - end" format
        if (dateStr.includes(' - ')) {
          const [start, end] = dateStr.split(' - ');
          if (start && end) {
            startDate = start.trim();
            endDate = end.trim();

            // Fix for missing year (e.g. "Feb 10") causing 2001
            const checkAndFixYear = (dStr: string) => {
              const d = new Date(dStr);
              if (d.getFullYear() === 2001) {
                d.setFullYear(new Date().getFullYear());
                return d.toISOString().split('T')[0]; // Return YYYY-MM-DD
              }
              // If it's already YYYY-MM-DD or valid, return original or formatted
              return dStr;
            };

            // Check if they trigger the 2001 issue
            const startD = new Date(startDate);
            if (startD.getFullYear() === 2001) {
              startDate = checkAndFixYear(startDate);
              endDate = checkAndFixYear(endDate);
            }

            console.log('✅ Parsed dates from string:', { startDate, endDate });
          }
        }

        // If dates are not in the expected format (e.g., "Flexible 5-Day Plan"), create a default proposal
        if (!startDate || !endDate) {
          console.log('⚠️ Dates not in expected format, creating default dates');
          // Create a default date range starting 30 days from now
          const today = new Date();
          const defaultStart = new Date(today);
          defaultStart.setDate(today.getDate() + 30);
          const defaultEnd = new Date(defaultStart);
          defaultEnd.setDate(defaultStart.getDate() + 5); // Default 5-day trip

          startDate = defaultStart.toISOString().split('T')[0];
          endDate = defaultEnd.toISOString().split('T')[0];
          console.log('📆 Generated default dates:', { startDate, endDate });
        }

        console.log('💾 Inserting date proposal:', { startDate, endDate });
        const dateResult = await this.addProposal(
          planId,
          ownerId,
          'AI Assistant',
          'date',
          `${startDate} - ${endDate}`,
          { startDate, endDate }
        );
        console.log('Date proposal result:', dateResult);
      } else {
        console.log('⚠️ No dates found in planData');
      }

      // 2. Seed Accommodations
      if (planData.bookings) {
        const hotels = planData.bookings.filter(b => b.type === 'Hotel');
        for (const hotel of hotels) {
          // Better extraction for hotels: check priceNum first, then regex on price string or details
          const priceAttr = (hotel as any).priceNum || 0;
          const priceStr = hotel.price || "";
          const priceMatch = (priceStr + " " + hotel.details).match(/\$?\s*([\d,]+(?:[\.,]\d+)?)/);

          const nightsMatch = hotel.details.match(/(\d+)\s*nights?/) || hotel.details.match(/for (\d+)/);

          const pricePerNight = priceAttr || (priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0);
          const nights = nightsMatch ? parseInt(nightsMatch[1]) : 1;

          await this.addProposal(
            planId,
            ownerId,
            'AI Assistant',
            'accommodation',
            hotel.title,
            {
              location: hotel.details.split(' - ')[0] || 'Unknown',
              pricePerNight,
              nights
            }
          );
        }
      }

      // 3. Seed Itinerary
      if (planData.dailyItinerary) {
        for (const dayPlan of planData.dailyItinerary) {
          for (const activity of dayPlan.items) {
            // Support explicit cost field if AI provided it, else fallback to description regex
            let activityCost = (activity as any).cost || 0;
            if (activityCost === 0 && activity.description) {
              const costMatch = activity.description.match(/(?:Cost|Price|Est\.|Total)[:\s]*\$?\s*([\d,]+(?:[\.,]\d+)?)/i) ||
                activity.description.match(/\$([\d,]+(?:[\.,]\d+)?)/);
              if (costMatch) activityCost = parseFloat(costMatch[1].replace(/,/g, ''));
            }

            await this.addProposal(
              planId,
              ownerId,
              'AI Assistant',
              'itinerary',
              activity.activity || 'Activity',
              {
                day: dayPlan.day,
                time: activity.time || 'TBD',
                description: activity.description,
                location: 'TBD',
                cost: activityCost,
                day_title: dayPlan.title
              },
              dayPlan.title
            );
          }
        }
      }

      console.log('✅ Seeding complete for plan:', planId);
      return { success: true };
    } catch (err) {
      console.error('Exception seeding proposals:', err);
      return { success: false, error: 'Failed to seed proposals' };
    }
  },

  subscribeToProposals(planId: string, callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel(`proposals:${planId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals',
          filter: `plan_id=eq.${planId}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export const votesService = {
  async vote(proposalId: string, userId: string, voteType: 'up' | 'down'): Promise<{ success: boolean; error?: string }> {
    try {
      // Check existing vote
      const { data: existing } = await supabase
        .from('likes')
        .select('type')
        .eq('proposal_id', proposalId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        if (existing.type === voteType) {
          // Remove vote
          const { error: deleteError } = await supabase
            .from('likes')
            .delete()
            .eq('proposal_id', proposalId)
            .eq('user_id', userId);

          if (deleteError) {
            console.error('Error removing vote:', deleteError);
            return { success: false, error: deleteError.message };
          }
        } else {
          // Update type
          const { error: updateError } = await supabase
            .from('likes')
            .update({ type: voteType })
            .eq('proposal_id', proposalId)
            .eq('user_id', userId);

          if (updateError) {
            console.error('Error updating vote:', updateError);
            return { success: false, error: updateError.message };
          }
        }
      } else {
        // Add new vote
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ proposal_id: proposalId, user_id: userId, type: voteType });

        if (insertError) {
          console.error('Error adding vote:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Exception voting:', err);
      return { success: false, error: 'Failed to vote' };
    }
  },

  async getVotesForProposal(proposalId: string): Promise<{ success: boolean; data?: Vote[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('proposal_id', proposalId);

      if (error) {
        console.error('Error fetching votes:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Exception fetching votes:', err);
      return { success: false, error: 'Failed to fetch votes' };
    }
  },

  subscribeToVotes(callback: (payload: any) => void): () => void {
    const channel = supabase
      .channel('public:likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};