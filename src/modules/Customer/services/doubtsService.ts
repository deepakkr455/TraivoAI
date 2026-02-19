// services/doubtsService.ts (New service for handling chat messages/doubts)
import { supabase } from '../../../services/supabaseClient';


export interface DoubtMessage {
  id: string;
  plan_id: string;
  user_id: string;
  user_name: string | null;
  text: string;
  created_at: string;
}

export const doubtsService = {
  /**
   * Get all messages for a specific plan
   */
  async getPlanMessages(planId: string): Promise<{ success: boolean; data?: DoubtMessage[]; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('doubts')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching plan messages:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Exception fetching plan messages:', error);
      return { success: false, error: 'Failed to fetch plan messages' };
    }
  },

  /**
   * Send a new message to a plan
   */
  async sendMessage(
    planId: string,
    userId: string,
    userName: string,
    text: string
  ): Promise<{ success: boolean; data?: DoubtMessage; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('doubts')
        .insert({
          plan_id: planId,
          user_id: userId,
          user_name: userName,
          text: text,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error('Exception sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  },

  /**
   * Subscribe to real-time messages for a plan
   */
  subscribeToMessages(
    planId: string,
    callback: (payload: any) => void
  ): () => void {
    if (!supabase) {
      console.error('Supabase not configured');
      return () => { };
    }

    const channel = supabase.channel(`plan_messages:${planId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'doubts',
          filter: `plan_id=eq.${planId}`,
        },
        callback
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Update an existing message
   */
  async updateMessage(messageId: string, text: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const { error } = await supabase
        .from('doubts')
        .update({ text })
        .eq('id', messageId);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating message:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const { error } = await supabase
        .from('doubts')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  }
};