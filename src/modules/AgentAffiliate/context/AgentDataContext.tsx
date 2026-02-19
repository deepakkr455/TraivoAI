
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, Product, MediaUpload, Booking, CustomerInquiry, AffiliateListing } from '../types';
import { getAgentResponse } from '../services/openRouterAgentService';
import { getAffiliateResponse, createAffiliateLinkFunctionDeclaration } from '../services/openRouterAffiliateService';
import { createTripListingFunctionDeclaration } from '../services/openRouterAgentService';
import {
    addConversationMessage,
    addProductListing,
    getListedProducts,
    getConversationMessages,
    addAffiliateListing,
    getAffiliateListings,
    updateAffiliateListing,
    deleteAffiliateListing,
    createChatSession,
    getChatSessions,
    deleteChatSession,
    updateChatSessionTitle,
    getAgentProductMetrics,
    getAgentDetailedProductMetrics,
    deleteProductListing,
    supabase
} from '../services/supabaseService';
import { messageService } from '../../Customer/services/messageService';
import { affiliateSubscriptionService } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

interface AgentDataContextType {
    messages: ChatMessage[];
    workspaceProducts: Product[];
    affiliateListings: AffiliateListing[];
    isLoading: boolean;
    chatSessions: any[];
    currentSessionId: string | null;
    bookings: Booking[];
    inquiries: CustomerInquiry[];
    setCurrentSessionId: (id: string | null) => void;
    sendMessage: (content: string, uploads?: MediaUpload[]) => Promise<void>;
    confirmProduct: (productId: string) => Promise<void>;
    deleteProduct: (productId: string) => void;
    toggleProductStatus: (productId: string) => void;
    createNewChat: () => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;
    renameSession: (sessionId: string, newTitle: string) => Promise<void>;
    updateAffiliateStatus: (id: string, status: boolean) => Promise<void>;
    removeAffiliateListing: (id: string) => Promise<void>;
    refreshInquiries: () => Promise<void>;
}

const AgentDataContext = createContext<AgentDataContextType | undefined>(undefined);

export const AgentDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, profile } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [workspaceProducts, setWorkspaceProducts] = useState<Product[]>([]);
    const [affiliateListings, setAffiliateListings] = useState<AffiliateListing[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatSessions, setChatSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([
        {
            id: 'b1', customer_name: 'Alice Johnson', customer_avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', product_title: 'Majestic Manali Escape',
            date: '2023-12-01', booking_date: '2023-10-25', amount: 30000, status: 'confirmed', pax: 2,
            commission_rate: 5, commission_amount: 1500, commission_status: 'paid'
        }
    ]);
    const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
    const conversationHistoryRef = useRef<ChatMessage[]>([]);

    const generateSessionTitle = () => {
        const adjectives = ['New', 'Draft', 'Pending', 'Active', 'Future'];
        const nouns = ['Campaign', 'Listing', 'Session', 'Project', 'Plan'];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomId = Math.floor(1000 + Math.random() * 9000);
        return `${randomAdjective} ${randomNoun} #${randomId}`;
    };

    const fetchData = useCallback(async () => {
        if (!session) return;

        const initialMessage: ChatMessage = {
            id: 'init',
            sender: 'ai',
            content: profile?.user_type === 'affiliate_partner'
                ? 'Hello! I am your Affiliate Assistant. Paste an embed code from GetYourGuide or TripAdvisor to get started.'
                : 'Hello! I am your AI assistant for listing travel packages. To start, tell me about the trip you want to list. What is the destination?',
        };

        try {
            const [products, affiliates, agentInquiries, productMetrics, detailedMetrics] = await Promise.all([
                getListedProducts(session.user.id),
                profile?.user_type === 'affiliate_partner' ? getAffiliateListings(session.user.id) : Promise.resolve([]),
                messageService.getAgentInquiries(session.user.id),
                getAgentProductMetrics(session.user.id),
                getAgentDetailedProductMetrics(session.user.id)
            ]);

            // Merge metrics into products
            const productsWithMetrics = products.map(p => {
                const metrics = (productMetrics as any[]).find(m => m.product_id === p.id);
                const detailed = (detailedMetrics as any)[p.id] || { clicks: 0, total_time_spent: 0 };
                return {
                    ...p,
                    views: metrics?.total_views || p.views || 0,
                    clicks: detailed.clicks || 0,
                    total_time_spent: detailed.total_time_spent || 0,
                    unique_visitors: metrics?.unique_visitors || 0,
                    avg_views: metrics?.avg_views || 0
                };
            });

            setWorkspaceProducts(productsWithMetrics);
            setAffiliateListings(affiliates as AffiliateListing[]);
            setInquiries(agentInquiries);

            const sessions = await getChatSessions(session.user.id);
            setChatSessions(sessions);

            let activeSessionId = currentSessionId;
            if (!activeSessionId && sessions.length > 0) {
                activeSessionId = sessions[0].id;
                setCurrentSessionId(activeSessionId);
            } else if (!activeSessionId && sessions.length === 0) {
                const title = generateSessionTitle();
                const newSession = await createChatSession(session.user.id, title, session.user.id);
                if (newSession) {
                    setChatSessions([newSession]);
                    activeSessionId = newSession.id;
                    setCurrentSessionId(activeSessionId);
                }
            }

            if (activeSessionId) {
                const history = await getConversationMessages(session.user.id, activeSessionId);
                const hydratedHistory = history.map(msg => {
                    if (msg.productCard?.id) {
                        const fullProduct = products.find(p => p.id === msg.productCard!.id);
                        if (fullProduct) return { ...msg, productCard: fullProduct };
                    }
                    return msg;
                });

                if (hydratedHistory.length > 0) {
                    setMessages(hydratedHistory);
                    conversationHistoryRef.current = [...hydratedHistory];
                } else {
                    setMessages([initialMessage]);
                    conversationHistoryRef.current = [initialMessage];
                }
            } else {
                setMessages([initialMessage]);
                conversationHistoryRef.current = [initialMessage];
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setMessages([initialMessage]);
            conversationHistoryRef.current = [initialMessage];
        }
    }, [session, profile, currentSessionId]);

    useEffect(() => {
        fetchData();

        // Realtime Subscription for Agent
        if (!session?.user.id) return;

        const channel = supabase
            .channel('agent_inquiries_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customer_inquiries', filter: `agent_id=eq.${session.user.id}` },
                async (payload) => {
                    console.log('🔔 Inquiry Update:', payload);
                    await refreshInquiries();
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'inquiry_messages' },
                async (payload) => {
                    console.log('💬 New Message:', payload);

                    // 1. Update Inquiries List (to show new last message/unread status)
                    setInquiries(prev => prev.map(inq => {
                        if (inq.id === payload.new.inquiry_id) {
                            return {
                                ...inq,
                                last_message: payload.new.message_text,
                                timestamp: new Date(payload.new.created_at).toLocaleDateString(),
                                unread: payload.new.sender_role === 'customer', // If customer sent it, it's unread for agent
                                messages: inq.messages ? [
                                    ...inq.messages,
                                    {
                                        id: payload.new.id,
                                        sender: payload.new.sender_role as 'customer' | 'agent',
                                        text: payload.new.message_text,
                                        time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                        media_url: payload.new.media_url,
                                        media_type: payload.new.media_type as 'image' | 'video' | 'pdf'
                                    }
                                ] : []
                            };
                        }
                        return inq;
                    }));

                    // 2. If this message belongs to the currently open chat session (if applicable)
                    // Note: This context handles B2B chats (messages state) AND Inquiries (inquiries state).
                    // The 'messages' state in this context is currently bound to 'b2b_conversations'.
                    // The Agent Dashboard likely uses 'inquiries' state to render the chat view for customers.
                    // So updating 'setInquiries' above might be sufficient if the UI derives from it.
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, session?.user.id]);

    const processFunctionCall = useCallback(async (functionCall: { name: string; args: any }) => {
        if (functionCall.name === createTripListingFunctionDeclaration.name) {
            const productData = functionCall.args;
            const newProduct: Product = {
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                business_id: session?.user.id || '',
                status: 'pending',
                views: 0,
                clicks: 0,
                title: productData.title || 'Untitled Trip',
                description: productData.description || '',
                start_date: productData.start_date || new Date().toISOString(),
                duration: productData.duration || 'TBD',
                location: productData.location || '',
                package_type: productData.package_type || 'General',
                theme_tags: productData.theme_tags || '',
                media_urls: productData.media_urls || [],
                itinerary: productData.itinerary || [],
                pricing: productData.pricing || [],
                group_size: productData.group_size || 'TBD',
                languages: productData.languages || ['English'],
                reviews: productData.reviews || { count: 0, source: 'New' },
                inclusions: productData.inclusions || [],
                exclusions: productData.exclusions || [],
                cancellation_policy: productData.cancellation_policy || [],
                terms_conditions: productData.terms_conditions || [],
                things_to_pack: productData.things_to_pack || [],
                things_to_do: productData.things_to_do || [],
                tax_rate: productData.tax_rate || 5,
                advance_payment_percentage: productData.advance_payment_percentage || 30,
                is_active: false, is_boosted: false, recommended_count: 0, bounce_count: 0
            };

            setWorkspaceProducts(prev => [newProduct, ...prev]);
            if (session?.user.id) {
                await addProductListing(newProduct);
            }

            const aiCardMessage: ChatMessage = {
                id: crypto.randomUUID(),
                sender: 'ai',
                content: 'Great! I\'ve created a new trip listing with all the details. You can review the Inclusions, Exclusions, and Policies in the Trip Workspace.',
                productCard: newProduct,
            };
            setMessages(prev => [...prev, aiCardMessage]);
            conversationHistoryRef.current.push(aiCardMessage);

            if (session?.user.id && currentSessionId) {
                await addConversationMessage(aiCardMessage, session.user.id, session.user.id, currentSessionId);
            }
        } else if (functionCall.name === createAffiliateLinkFunctionDeclaration.name) {
            const args = functionCall.args;
            const newListing: Omit<AffiliateListing, 'id' | 'created_at'> = {
                user_id: session?.user.id || '',
                embed_code: args.embed_code,
                source_url: args.source_url,
                affiliate_source: args.affiliate_source,
                title: args.title,
                description: args.description,
                tags: args.tags,
                country: args.country,
                state: args.state,
                city: args.city,
                is_active: true
            };

            if (session?.user.id) {
                const savedListing = await addAffiliateListing(newListing);
                if (savedListing) {
                    setAffiliateListings(prev => [savedListing, ...prev]);
                }
            }

            const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                sender: 'ai',
                content: `Perfect! I've added your affiliate listing for "${args.title}". You can view it in your Affiliate Gallery.`
            };
            setMessages(prev => [...prev, aiMessage]);
            conversationHistoryRef.current.push(aiMessage);

            if (session?.user.id && currentSessionId) {
                await addConversationMessage(aiMessage, session.user.id, session.user.id, currentSessionId);
            }
        }
    }, [session, currentSessionId]);

    const sendMessage = useCallback(async (content: string, uploads: MediaUpload[] = []) => {
        // Validation for Agent Affiliate
        if (session?.user.id && profile?.user_type === 'affiliate_partner') {
            try {
                const sub = await affiliateSubscriptionService.getUserSubscription(session.user.id);
                if (sub && sub.tier) {
                    const quota = sub.tier.query_daily_quota || 20; // Safe fallback
                    const usage = await affiliateSubscriptionService.getDailyMessageCount(session.user.id);
                    if (usage >= quota && quota !== -1) {
                        const limitMessage: ChatMessage = {
                            id: crypto.randomUUID(),
                            sender: 'system',
                            content: `Daily query limit reached (${usage}/${quota}). Upgrade to Pro for unlimited queries.`,
                        };
                        setMessages(prev => [...prev, limitMessage]);
                        conversationHistoryRef.current.push(limitMessage);
                        return;
                    }
                }
            } catch (e) {
                console.error("Quota check failed", e);
            }
        }

        setIsLoading(true);
        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            sender: 'user',
            content,
            media: uploads,
        };

        setMessages(prev => [...prev, userMessage]);
        conversationHistoryRef.current.push(userMessage);

        try {
            if (session?.user.id && currentSessionId) {
                await addConversationMessage(userMessage, session.user.id, session.user.id, currentSessionId);
            }
        } catch (e) {
            console.error('Failed to save user message:', e);
        }

        try {
            const aiResponse = profile?.user_type === 'affiliate_partner'
                ? await getAffiliateResponse(conversationHistoryRef.current)
                : await getAgentResponse(conversationHistoryRef.current);

            if (aiResponse.functionCalls) {
                for (const fc of aiResponse.functionCalls) {
                    await processFunctionCall(fc);
                }
            } else {
                const aiMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    sender: 'ai',
                    content: aiResponse.text || '',
                };
                setMessages(prev => [...prev, aiMessage]);
                conversationHistoryRef.current.push(aiMessage);

                if (session?.user.id && currentSessionId) {
                    await addConversationMessage(aiMessage, session.user.id, session.user.id, currentSessionId);
                }
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(), sender: 'ai', content: 'Sorry, I encountered an error. Please try again.',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [session, profile, currentSessionId, processFunctionCall]);

    const confirmProduct = async (productId: string) => {
        const productToConfirm = workspaceProducts.find(p => p.id === productId);
        if (productToConfirm && session?.user.id) {
            setWorkspaceProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'confirmed', is_active: true } : p));
            try {
                const updatedProduct = { ...productToConfirm, status: 'confirmed' as const, is_active: true, business_id: session.user.id };
                await addProductListing(updatedProduct);
            } catch (e) {
                console.error('Failed to save product listing:', e);
            }
        }
    };

    const deleteProduct = async (productId: string) => {
        // Optimistic update
        setWorkspaceProducts(prev => prev.filter(p => p.id !== productId));
        try {
            await deleteProductListing(productId);
        } catch (e) {
            console.error('Failed to delete product listing:', e);
            // Optionally revert state if needed, but for delete it's usually acceptable to assume success
        }
    };

    const toggleProductStatus = (productId: string) => {
        setWorkspaceProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !p.is_active } : p));
    };

    const createNewChat = async () => {
        if (!session) return;
        const title = generateSessionTitle();
        const newSession = await createChatSession(session.user.id, title, session.user.id);
        if (newSession) {
            setChatSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);
            // Reset messages is handled by useEffect on currentSessionId
        }
    };

    const deleteSession = async (sessionId: string) => {
        await deleteChatSession(sessionId);
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) setCurrentSessionId(null);
    };

    const renameSession = async (sessionId: string, newTitle: string) => {
        setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
        await updateChatSessionTitle(sessionId, newTitle);
    };

    const updateAffiliateStatus = async (id: string, status: boolean) => {
        setAffiliateListings(prev => prev.map(l => l.id === id ? { ...l, is_active: status } : l));
        await updateAffiliateListing(id, { is_active: status });
    };

    const removeAffiliateListing = async (id: string) => {
        setAffiliateListings(prev => prev.filter(l => l.id !== id));
        await deleteAffiliateListing(id);
    };

    const refreshInquiries = async () => {
        if (!session) return;
        const agentInquiries = await messageService.getAgentInquiries(session.user.id);
        setInquiries(agentInquiries);
    };

    return (
        <AgentDataContext.Provider value={{
            messages,
            workspaceProducts,
            affiliateListings,
            isLoading,
            chatSessions,
            currentSessionId,
            bookings,
            inquiries,
            setCurrentSessionId,
            sendMessage,
            confirmProduct,
            deleteProduct,
            toggleProductStatus,
            createNewChat,
            deleteSession,
            renameSession,
            updateAffiliateStatus,
            removeAffiliateListing,
            refreshInquiries
        }}>
            {children}
        </AgentDataContext.Provider>
    );
};

export const useAgentData = () => {
    const context = useContext(AgentDataContext);
    if (context === undefined) throw new Error('useAgentData must be used within an AgentDataProvider');
    return context;
};
