import { supabase } from '../../../services/supabaseClient';


export interface PlanMember {
  id: string;
  plan_id: string;
  user_id: string;
  user_name: string | null;
  created_at: string;
}

export const planMembersService = {
  /**
   * Get all members for a specific plan
   */
  async getPlanMembers(planId: string): Promise<{ success: boolean; data?: PlanMember[]; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('plan_members')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching plan members:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Exception fetching plan members:', error);
      return { success: false, error: 'Failed to fetch plan members' };
    }
  },

  /**
   * Add a member to a plan manually
   */
  async addMember(
    planId: string,
    userId: string,
    userName?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('plan_members')
        .insert({
          plan_id: planId,
          user_id: userId,
          user_name: userName,
        });

      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          return { success: false, error: 'User is already a member of this plan' };
        }
        console.error('Error adding member:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception adding member:', error);
      return { success: false, error: 'Failed to add member' };
    }
  },

  /**
   * Remove a member from a plan
   */
  async removeMember(memberId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('plan_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Error removing member:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception removing member:', error);
      return { success: false, error: 'Failed to remove member' };
    }
  },

  /**
   * Get member count for a plan
   */
  async getMemberCount(planId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { count, error } = await supabase
        .from('plan_members')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', planId);

      if (error) {
        console.error('Error counting members:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Exception counting members:', error);
      return { success: false, error: 'Failed to count members' };
    }
  },
};