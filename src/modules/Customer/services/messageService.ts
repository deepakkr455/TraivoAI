
import { supabase } from '../../../services/supabaseClient';
import { CustomerInquiry } from '../../../types';
import { trackProductInteraction } from '../../AgentAffiliate/services/supabaseService';

export const messageService = {

    async uploadMedia(file: File): Promise<{ url: string, type: 'image' | 'video' | 'pdf' } | null> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `chat-media/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-attachments') // Ensure this bucket exists
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(filePath);

            let type: 'image' | 'video' | 'pdf' = 'image';
            if (file.type.includes('video')) type = 'video';
            if (file.type.includes('pdf')) type = 'pdf';

            return { url: data.publicUrl, type };
        } catch (error) {
            console.error("Error uploading media:", error);
            return null;
        }
    },

    /**
     * Checks if an inquiry exists for this product and customer.
     * If yes, returns it.
     * If no, creates a new inquiry.
     */
    async checkOrCreateInquiry(productId: string, agentId: string, customerId: string, customerName: string, customerAvatar?: string, tripId?: string): Promise<string | null> {
        try {
            // 1. Check existing
            let query = supabase
                .from('customer_inquiries')
                .select('id')
                .eq('customer_id', customerId)
                .eq('product_id', productId);

            if (tripId) {
                query = query.eq('trip_id', tripId);
            }

            const { data: existing, error: fetchError } = await query.maybeSingle();

            if (fetchError) throw fetchError;

            if (existing) {
                return existing.id;
            }

            // 2. Create New
            const { data: newInquiry, error: createError } = await supabase
                .from('customer_inquiries')
                .insert({
                    customer_id: customerId,
                    product_id: productId,
                    trip_id: tripId || null,
                    agent_id: agentId,
                    customer_name: customerName,
                    customer_avatar: customerAvatar || null,
                    last_message: "Started a new inquiry",
                    unread_agent: true,
                    status: 'open'
                })
                .select('id')
                .single();

            if (createError) throw createError;

            // Track inquiry interaction
            trackProductInteraction(productId, 'inquiry');

            console.log("DEBUG: Created new inquiry:", newInquiry.id, "for Product:", productId, "Trip:", tripId);
            return newInquiry.id;

        } catch (error) {
            console.error("Error in checkOrCreateInquiry:", error);
            return null;
        }
    },

    /**
     * Fetches all inquiries for a logged-in customer.
     */
    async getCustomerInquiries(customerId: string): Promise<CustomerInquiry[]> {
        try {
            console.log("DEBUG: getCustomerInquiries for customerId:", customerId);
            const { data, error } = await supabase
                .from('customer_inquiries')
                .select(`
                    *,
                    tripData:plans(plan_json),
                    productData:listed_products(title, media_urls, location, duration, pricing, group_size),
                    messages:inquiry_messages(*)
                `)
                .eq('customer_id', customerId)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error("DEBUG: Supabase error in getCustomerInquiries:", JSON.stringify(error, null, 2));
                return [];
            }

            if (!data) return [];

            return data.map((d: any) => {
                let tripTitle = "Trip Plan";
                if (d.tripData?.plan_json) {
                    try {
                        const parsed = JSON.parse(d.tripData.plan_json);
                        tripTitle = parsed.title || tripTitle;
                    } catch (e) {
                        console.error("Error parsing plan_json:", e);
                    }
                }

                return {
                    id: d.id,
                    customer_id: d.customer_id,
                    customer_name: d.productData?.title || tripTitle || "Trip Inquiry",
                    customer_avatar: d.productData?.media_urls?.[0] || "",
                    product: d.productData?.title || tripTitle || "Trip Plan",
                    product_id: d.product_id,
                    trip_id: d.trip_id,
                    last_message: d.last_message,
                    timestamp: new Date(d.updated_at).toLocaleDateString(),
                    unread: d.unread_customer,
                    messages: (d.messages || [])
                        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((m: any) => ({
                            id: m.id,
                            sender: m.sender_role,
                            text: m.message_text,
                            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            media_url: m.media_url,
                            media_type: m.media_type
                        }))
                };
            });
        } catch (err) {
            console.error("DEBUG: Catch error in getCustomerInquiries:", err);
            return [];
        }
    },

    async sendMessage(inquiryId: string, text: string, senderRole: 'customer' | 'agent', senderId: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'pdf'): Promise<boolean> {
        try {
            // 1. Insert Message
            const { error: msgError } = await supabase
                .from('inquiry_messages')
                .insert({
                    inquiry_id: inquiryId,
                    sender_id: senderId,
                    sender_role: senderRole,
                    message_text: text,
                    media_url: mediaUrl,
                    media_type: mediaType
                });

            if (msgError) throw msgError;

            // 2. Update Inquiry
            const updateData: any = {
                last_message: text,
                updated_at: new Date().toISOString(),
            };

            if (senderRole === 'customer') {
                updateData.unread_agent = true;
                updateData.unread_customer = false;
            } else {
                updateData.unread_customer = true;
                updateData.unread_agent = false;
            }

            const { error: updateError } = await supabase
                .from('customer_inquiries')
                .update(updateData)
                .eq('id', inquiryId);

            if (updateError) throw updateError;

            return true;
        } catch (error) {
            console.error("Error sending message:", error);
            return false;
        }
    },

    /**
     * Fetches all inquiries assigned to a specific agent.
     */
    async getAgentInquiries(agentId: string): Promise<CustomerInquiry[]> {
        try {
            console.log("DEBUG: getAgentInquiries for agentId:", agentId);
            const { data, error } = await supabase
                .from('customer_inquiries')
                .select(`
                    *,
                    tripData:plans(plan_json),
                    productData:listed_products(title, media_urls, location, duration, pricing, group_size),
                    messages:inquiry_messages(*)
                `)
                .eq('agent_id', agentId)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error("DEBUG: Supabase error in getAgentInquiries:", JSON.stringify(error, null, 2));
                return [];
            }

            if (!data) return [];

            // DEBUG LOGGING
            console.log("DEBUG: getAgentInquiries Raw Data Sample:", data.length > 0 ? JSON.stringify(data[0], null, 2) : "No Data");

            return data.map((d: any) => {
                let tripTitle = "Trip Plan";
                if (d.tripData?.plan_json) {
                    try {
                        const parsed = JSON.parse(d.tripData.plan_json);
                        tripTitle = parsed.title || tripTitle;
                    } catch (e) {
                        console.error("Error parsing plan_json:", e);
                    }
                }

                return {
                    id: d.id,
                    customer_id: d.customer_id,
                    customer_name: d.customer_name || "Traveler",
                    customer_avatar: d.customer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.customer_name || 'T')}&background=random`,
                    product: d.productData?.title || tripTitle || "Trip Plans",
                    product_id: d.product_id,
                    trip_id: d.trip_id,
                    last_message: d.last_message,
                    timestamp: new Date(d.updated_at).toLocaleDateString(),
                    unread: d.unread_agent,
                    messages: (d.messages || [])
                        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((m: any) => ({
                            id: m.id,
                            sender: m.sender_role,
                            text: m.message_text,
                            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            media_url: m.media_url,
                            media_type: m.media_type
                        }))
                };
            });
        } catch (err) {
            console.error("DEBUG: Catch error in getAgentInquiries:", err);
            return [];
        }
    }
};
