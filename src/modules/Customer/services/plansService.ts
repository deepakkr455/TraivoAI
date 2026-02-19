// services/plansService.ts
import { supabase } from '../../../services/supabaseClient';
import { TripPlanData } from '../../../types';


export interface SavedPlan {
  id: string;
  title: string;
  planData: TripPlanData;
  heroImageText: string;
  createdAt: string;
  ownerId: string;
  status: string;
  isPublic: boolean;
  updatedPlanData?: TripPlanData;
  updated_plan_json?: string;
}

export interface TripWithAccess extends SavedPlan {
  isOwner: boolean;
  isMember: boolean;
  invitation?: {
    id: string;
    status: 'pending' | 'accepted' | 'declined';
    invited_email: string;
  };
}

interface SavePlanInput {
  title: string;
  planData: TripPlanData;
  heroImageText: string;
}

export interface JourneyData {
  departureLocation: string;
  departureCity: string;
  departureDate: string;
  departureTime: string;
  joinedMembersCount: number;
}

class PlansService {
  async savePlan(input: SavePlanInput): Promise<{ success: boolean; data?: SavedPlan; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const planJsonString = JSON.stringify(input.planData);

      const { data, error } = await supabase
        .from('plans')
        .insert({
          owner_id: user.id,
          plan_json: planJsonString,
          status: 'planning',
          is_public: false,
          updated_plan_json: planJsonString
        })
        .select()
        .single();

      if (error) throw error;

      const savedPlan: SavedPlan = {
        id: data.id,
        title: input.title,
        planData: input.planData,
        heroImageText: input.heroImageText,
        createdAt: data.created_at,
        ownerId: data.owner_id,
        status: data.status,
        isPublic: data.is_public,
        updated_plan_json: data.updated_plan_json,
      };

      return { success: true, data: savedPlan };
    } catch (error: any) {
      console.error('Error saving plan:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllPlans(): Promise<{ success: boolean; data?: TripWithAccess[]; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // 1. Fetch plans owned by the user
      const { data: ownedPlans, error: ownedError } = await supabase
        .from('plans')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // 2. Fetch plans where the user is a member (via plan_members)
      // We need to join with the plans table
      const { data: membershipData, error: memberError } = await supabase
        .from('plan_members')
        .select('plan_id, plan:plans(*)')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Extract the plans from the membership data
      // Filter out any potential nulls or plans where user is owner (just in case of duplicates)
      const joinedPlans = membershipData
        ? membershipData
          .map((m: any) => m.plan)
          .filter((p: any) => p !== null && p.owner_id !== user.id)
        : [];

      // Combine both lists
      const allRawPlans = [...(ownedPlans || []), ...joinedPlans];

      // Sort by created_at (newest first)
      // Use a Map to deduplicate by ID just to be absolutely safe
      const uniquePlansMap = new Map();
      allRawPlans.forEach(plan => uniquePlansMap.set(plan.id, plan));

      const sortedPlans = Array.from(uniquePlansMap.values()).sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const plans: TripWithAccess[] = sortedPlans.map((plan: any) => {
        let planData: TripPlanData;
        try {
          planData = JSON.parse(plan.plan_json);
        } catch (e) {
          console.error('Error parsing plan_json:', e);
          planData = {} as TripPlanData;
        }

        const isOwner = plan.owner_id === user.id;

        return {
          id: plan.id,
          title: planData.title || 'Untitled Trip',
          planData: planData,
          heroImageText: planData.title?.substring(0, 30) || 'Trip',
          createdAt: plan.created_at,
          ownerId: plan.owner_id,
          status: plan.status,
          isPublic: plan.is_public,
          updated_plan_json: plan.updated_plan_json,
          isOwner,
          isMember: !isOwner // If in this list and not owner, assume member
        };
      });

      return { success: true, data: plans };
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      return { success: false, error: error.message };
    }
  }

  async getPlan(id: string): Promise<{ success: boolean; data?: TripWithAccess; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // Validate UUID format before querying to prevent DB errors (22P02)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        // Not a UUID, so it can't be a plan ID. Return error silently so fallback can resolve it as a token.
        return { success: false, error: 'Invalid plan ID format' };
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      if (planError) throw planError;
      if (!plan) {
        return { success: false, error: 'Trip not found' };
      }

      const isOwner = plan.owner_id === user.id;

      const { data: membership, error: memberError } = await supabase
        .from('plan_members')
        .select('*')
        .eq('plan_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      const isMember = !!membership;

      if (!isOwner && !isMember && !plan.is_public) {
        return { success: false, error: 'You do not have access to this trip' };
      }

      let planData: TripPlanData;
      try {
        planData = JSON.parse(plan.plan_json);
      } catch (e) {
        console.error('Error parsing plan_json:', e);
        return { success: false, error: 'Invalid plan data' };
      }

      const tripWithAccess: TripWithAccess = {
        id: plan.id,
        title: planData.title || 'Untitled Trip',
        planData: planData,
        heroImageText: planData.title?.substring(0, 30) || 'Trip',
        createdAt: plan.created_at,
        ownerId: plan.owner_id,
        status: plan.status,
        isPublic: plan.is_public,
        updated_plan_json: plan.updated_plan_json,
        isOwner,
        isMember,
      };

      if (plan.updated_plan_json) {
        try {
          tripWithAccess.updatedPlanData = JSON.parse(plan.updated_plan_json);
        } catch (e) {
          console.error('Error parsing updated_plan_json:', e);
        }
      }

      return { success: true, data: tripWithAccess };

    } catch (error: any) {
      console.error('Error fetching plan:', error);
      return { success: false, error: error.message };
    }
  }


  async getPlanByToken(token: string): Promise<{ success: boolean; data?: TripWithAccess; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch token with related invitation and plan
      const { data: tokenData, error: tokenError } = await supabase
        .from('invitation_tokens')
        .select(`
          invitation_id,
          invitation:invitations (
            id,
            status,
            invited_email,
            plan_id,
            plan:plans (*)
          )
        `)
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        console.error('Token lookup failed:', tokenError || 'Token not found in database');
        return { success: false, error: tokenError?.message || 'Invalid or expired invitation token' };
      }

      // @ts-ignore - Supabase type inference for joins can be tricky
      const invitation = tokenData.invitation;
      // @ts-ignore
      const plan = invitation?.plan;

      if (!plan) {
        return { success: false, error: 'Associated trip not found' };
      }

      // Prepare plan data
      let planData: TripPlanData;
      try {
        planData = JSON.parse(plan.plan_json);
      } catch (e) {
        console.error('Error parsing plan_json:', e);
        planData = {} as TripPlanData;
      }

      const isOwner = user ? plan.owner_id === user.id : false;
      let isMember = false;

      if (user) {
        const { data: membership } = await supabase
          .from('plan_members')
          .select('id')
          .eq('plan_id', plan.id)
          .eq('user_id', user.id)
          .maybeSingle();

        isMember = !!membership;
      }

      const tripWithAccess: TripWithAccess = {
        id: plan.id,
        title: planData.title || 'Untitled Trip',
        planData: planData,
        heroImageText: planData.title?.substring(0, 30) || 'Trip',
        createdAt: plan.created_at,
        ownerId: plan.owner_id,
        status: plan.status,
        isPublic: plan.is_public,
        updated_plan_json: plan.updated_plan_json,
        isOwner,
        isMember,
      };

      // Add invitation details if it exists and is pending
      // @ts-ignore - Handle Supabase nested query result
      const invitationData: any = invitation;
      if (invitationData && invitationData.status === 'pending' && !isOwner && !isMember) {
        tripWithAccess.invitation = {
          id: invitationData.id,
          status: invitationData.status,
          invited_email: invitationData.invited_email,
        };
      }

      if (plan.updated_plan_json) {
        try {
          tripWithAccess.updatedPlanData = JSON.parse(plan.updated_plan_json);
        } catch (e) {
          console.error('Error parsing updated_plan_json:', e);
        }
      }

      return { success: true, data: tripWithAccess };

    } catch (error: any) {
      console.error('Error fetching plan by token:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePlanData(
    id: string,
    planData: TripPlanData
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify user is a member of the trip
      const { data: member, error: memberError } = await supabase
        .from('plan_members')
        .select('id')
        .eq('plan_id', id)
        .eq('user_id', user.id)
        .single();

      if (memberError) throw memberError;
      if (!member) {
        return { success: false, error: 'User not authorized to update plan' };
      }

      const planJsonString = JSON.stringify(planData);

      const { error } = await supabase
        .from('plans')
        .update({ updated_plan_json: planJsonString })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating plan:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePlan(id: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      return { success: false, error: error.message };
    }
  }

  async saveJourneyData(tripId: string, data: JourneyData): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { error } = await supabase
        .from('start_journey')
        .insert({
          trip_id: tripId,
          departure_location: data.departureLocation,
          departure_city: data.departureCity,
          departure_date: data.departureDate,
          departure_time: data.departureTime,
          joined_members_count: data.joinedMembersCount
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error saving journey data:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePlanStatus(
    id: string,
    status: 'planning' | 'ongoing' | 'completed' | 'invite' | 'collaboration' | 'journey-started' | 'expense' | 'concluded'
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('plans')
        .update({ status })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating plan status:', error);
      return { success: false, error: error.message };
    }
  }

  async setTrackExpenses(
    id: string,
    trackExpenses: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('plans')
        .update({ track_expenses: trackExpenses })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error setting track_expenses:', error);
      return { success: false, error: error.message };
    }
  }

  async togglePublic(id: string): Promise<{ success: boolean; isPublic?: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get current is_public value
      const { data: plan, error: fetchError } = await supabase
        .from('plans')
        .select('is_public')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      const newIsPublic = !plan.is_public;

      const { error } = await supabase
        .from('plans')
        .update({ is_public: newIsPublic })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      return { success: true, isPublic: newIsPublic };
    } catch (error: any) {
      console.error('Error toggling public status:', error);
      return { success: false, error: error.message };
    }
  }

  async makePlanPublic(id: string, isPublic: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { error } = await supabase
        .from('plans')
        .update({ is_public: isPublic })
        .eq('id', id);

      if (error) {
        console.error('Error updating plan visibility:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating plan visibility:', error);
      return { success: false, error: 'Failed' };
    }
  }
}

export const plansService = new PlansService();