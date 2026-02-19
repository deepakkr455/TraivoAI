import { supabase } from '../../../services/supabaseClient';


export interface Invitation {
  id: string;
  plan_id: string;
  invited_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export const invitationsService = {
  /**
   * Send an invitation to an email for a specific plan
   */
  async sendInvitation(
    planId: string,
    invitedEmail: string
  ): Promise<{ success: boolean; error?: string; data?: Invitation }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    const email = invitedEmail.toLowerCase().trim();

    try {
      // 1. Check if user is inviting themselves
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email?.toLowerCase() === email) {
        return { success: false, error: 'You are already the owner of this plan.' };
      }

      // 2. Check if invitation already exists
      const { data: existingInvite, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('plan_id', planId)
        .eq('invited_email', email)
        .eq('invited_email', email)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing invitation:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (existingInvite) {
        if (existingInvite.status === 'pending') {
          return { success: false, error: 'This user has already been invited.' };
        }

        // Delete existent invitation (accepted/declined) to allow a fresh INSERT
        // This is crucial because email sending is likely triggered by INSERT events
        const { error: deleteError } = await supabase
          .from('invitations')
          .delete()
          .eq('id', existingInvite.id);

        if (deleteError) {
          console.error('Error deleting old invitation:', deleteError);
          return { success: false, error: 'Failed to reset invitation.' };
        }

        // Fall through to create new invitation below to trigger INSERT events
      }

      // Create new invitation
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          plan_id: planId,
          invited_email: email,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending invitation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception sending invitation:', error);
      return { success: false, error: 'Failed to send invitation' };
    }
  },

  /**
   * Get all invitations for a specific plan
   */
  async getInvitationsForPlan(
    planId: string
  ): Promise<{ success: boolean; data?: Invitation[]; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Exception fetching invitations:', error);
      return { success: false, error: 'Failed to fetch invitations' };
    }
  },

  /**
   * Cancel/delete an invitation
   */
  async cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error canceling invitation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception canceling invitation:', error);
      return { success: false, error: 'Failed to cancel invitation' };
    }
  },

  /**
   * Update invitation status (accept/decline)
   */
  async updateInvitationStatus(
    invitationId: string,
    status: 'accepted' | 'declined'
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user && status === 'accepted') {
        return { success: false, error: 'You must be logged in to accept an invitation.' };
      }

      if (status === 'accepted' && user) {
        // First get the plan_id from the invitation
        const { data: invitation, error: inviteError } = await supabase
          .from('invitations')
          .select('plan_id')
          .eq('id', invitationId)
          .single();

        if (inviteError || !invitation) {
          return { success: false, error: 'Invitation not found' };
        }

        // Extract user name from metadata or use email as fallback
        const userName = (user as any).user_metadata?.full_name || user.email || 'Unknown User';

        // Add to plan_members
        const { error: memberError } = await supabase
          .from('plan_members')
          .insert({
            plan_id: invitation.plan_id,
            user_id: user.id,
            user_name: userName
          });

        if (memberError) {
          // If already a member, we can proceed to update status, or ignore
          if (memberError.code !== '23505') { // 23505 is unique violation
            console.error('Error adding plan member:', memberError);
            return { success: false, error: 'Failed to join trip' };
          }
        }
      }

      const { data, error } = await supabase
        .from('invitations')
        .update({ status })
        .eq('id', invitationId)
        .select();

      if (error) {
        console.error('Error updating invitation status:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        console.error('No invitation was updated. This might be due to RLS or an invalid ID.');
        return { success: false, error: 'Permission denied: You cannot update this invitation.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception updating invitation status:', error);
      return { success: false, error: 'Failed to update invitation status' };
    }
  },

  /**
   * Get pending invitations count for a plan
   */
  async getPendingInvitationsCount(
    planId: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { count, error } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', planId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error counting invitations:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Exception counting invitations:', error);
      return { success: false, error: 'Failed to count invitations' };
    }
  },
};
