import { supabase } from '../../../services/supabaseClient';

export interface ContactMessage {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export const submitContactMessage = async (data: ContactMessage) => {
    try {
        const { error } = await supabase
            .from('contacts')
            .insert([
                {
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    message: data.message,
                    status: 'new'
                }
            ]);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error submitting contact form:', error);
        return { success: false, error };
    }
};
