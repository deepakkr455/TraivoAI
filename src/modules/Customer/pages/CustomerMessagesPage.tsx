
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Paperclip, Search, Menu, X, ArrowLeft, Download } from 'lucide-react';
import { messageService } from '../services/messageService';
import { supabase } from '../../../services/supabaseClient';
import Header from '../components/Header';
import { CustomerInquiry } from '../../../types';
import { AffiliateBanner } from '../../AgentAffiliate/components/AffiliateBanner';

const CustomerMessagesPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('inquiry_id'));
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile Responsive

    const [searchQuery, setSearchQuery] = useState('');
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // Desktop Toggle

    const scrollRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null);

    // Initial Load
    useEffect(() => {
        const loadMessages = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/');
                return;
            }

            const data = await messageService.getCustomerInquiries(user.id);
            setInquiries(data);
            setLoading(false);
        };
        loadMessages();

        // Cleanup existing subscription if any
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        // Realtime Subscription
        const channel = supabase
            .channel('public:inquiry_messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'inquiry_messages' },
                (payload) => {
                    console.log('New message received:', payload);
                    setInquiries(prev => prev.map(inquiry => {
                        if (inquiry.id === payload.new.inquiry_id) {
                            // Deduplication & Reconciliation Strategy:
                            // 1. Check strict ID match (Realtime vs Realtime duplicate)
                            const isStrictDuplicate = inquiry.messages?.some(m => m.id === payload.new.id);
                            if (isStrictDuplicate) return inquiry;

                            // 2. Check for Optimistic Message to Replace
                            // Optimistic messages have Date.now() IDs (no hyphens), Real messages have UUIDs (hyphens).
                            // Look for a message with same content/sender that looks optimistic.
                            const optimisticMatchIndex = inquiry.messages?.findIndex(m =>
                                m.text === payload.new.message_text &&
                                m.sender === payload.new.sender_role &&
                                !m.id.includes('-') // Heuristic: UUIDs have dashes, Date.now() doesn't
                            );

                            let newMessages = [...(inquiry.messages || [])];

                            if (optimisticMatchIndex !== undefined && optimisticMatchIndex !== -1) {
                                // FOUND OPTIMISTIC MATCH -> REPLACE IT
                                console.log('🔄 Reconciling optimistic message:', newMessages[optimisticMatchIndex].id, '->', payload.new.id);
                                newMessages[optimisticMatchIndex] = {
                                    id: payload.new.id,
                                    sender: payload.new.sender_role,
                                    text: payload.new.message_text,
                                    time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    media_url: payload.new.media_url,
                                    media_type: payload.new.media_type
                                };
                            } else {
                                // NO MATCH -> APPEND NEW
                                console.log('✅ Adding new realtime message:', payload.new.id);
                                newMessages.push({
                                    id: payload.new.id,
                                    sender: payload.new.sender_role,
                                    text: payload.new.message_text,
                                    time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    media_url: payload.new.media_url,
                                    media_type: payload.new.media_type
                                });
                            }

                            return {
                                ...inquiry,
                                last_message: payload.new.message_text,
                                timestamp: new Date(payload.new.created_at).toLocaleDateString(),
                                unread: payload.new.sender_role === 'agent',
                                messages: newMessages
                            };
                        }
                        return inquiry;
                    }));
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [navigate]);

    // Handle Deep Link Selection
    useEffect(() => {
        const paramId = searchParams.get('inquiry_id');
        if (paramId) {
            setSelectedId(paramId);
            setIsSidebarOpen(false); // On mobile, close sidebar to show chat
        }
    }, [searchParams]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedId, inquiries]); // Trigger when selected chat changes or new messages arrive

    // Filter Inquiries
    const filteredInquiries = inquiries.filter(inquiry =>
        inquiry.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.last_message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedInquiry = inquiries.find(i => i.id === selectedId);

    const handleSendMessage = async () => {
        if (!selectedId || !replyText.trim()) return;

        // Optimistic Update - IMMEDIATE
        const tempId = Date.now().toString();
        const messageText = replyText; // Capture current text
        setReplyText(''); // Clear input immediately

        setInquiries(prev => prev.map(i => {
            if (i.id === selectedId) {
                return {
                    ...i,
                    last_message: messageText,
                    timestamp: new Date().toLocaleDateString(),
                    messages: [
                        ...(i.messages || []),
                        {
                            id: tempId,
                            sender: 'customer',
                            text: messageText,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                    ]
                };
            }
            return i;
        }));

        // Send to Server
        const success = await messageService.sendMessage(selectedId, messageText, 'customer', (await supabase.auth.getUser()).data.user?.id || '');

        if (!success) {
            // Rollback if failed (optional but recommended)
            console.error('Failed to send message, rolling back optimistic update');
            setInquiries(prev => prev.map(i => {
                if (i.id === selectedId) {
                    return {
                        ...i,
                        // Revert last message if it was the one we just added? 
                        // Simplified rollback: remove the message with tempId
                        messages: i.messages?.filter(m => m.id !== tempId) || []
                    };
                }
                return i;
            }));
            setReplyText(messageText); // Restore text
            alert("Failed to send message. Please try again.");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Header showBackground={true} />

            <div className="flex-1 flex overflow-hidden w-full relative bg-white">

                {/* Sidebar - List of Chats */}
                <div className={`
                    absolute inset-0 z-20 bg-white md:relative md:bg-gray-50/50 md:flex flex-row border-r border-gray-200
                    ${isSidebarOpen ? 'flex' : 'hidden md:flex'} 
                    ${isDesktopSidebarOpen ? 'md:max-w-xl' : 'md:w-auto'} 
                    transition-all duration-300
                `}>
                    {/* Vertical Banner Column */}
                    {isDesktopSidebarOpen && (
                        <div className="hidden md:flex flex-col w-[160px] border-r border-gray-200 bg-white overflow-hidden flex-shrink-0">
                            <AffiliateBanner bannerType="vertical-banner" className="h-full w-full" />
                        </div>
                    )}

                    <div className={`flex flex-col h-full overflow-hidden ${isDesktopSidebarOpen ? 'w-96' : 'w-20'} transition-all duration-300`}>
                        <div className="h-full flex flex-col overflow-hidden">
                            <div className={`p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm flex items-center ${isDesktopSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                                {/* Mobile Search - Replaces Header & Close Button */}
                                <div className="md:hidden w-full relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
                                    />
                                    <div className="absolute left-3 top-2.5 text-gray-400"><Search className="w-4 h-4" /></div>
                                </div>

                                {/* Desktop Header */}
                                <div className="hidden md:flex items-center justify-between w-full">
                                    {isDesktopSidebarOpen && <h2 className="font-bold text-xl text-gray-900 tracking-tight">Messages</h2>}
                                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}>
                                        <Menu className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Search Bar - Desktop Only - Hide on collapse */}
                            {isDesktopSidebarOpen && (
                                <div className="hidden md:block p-4 border-b border-gray-100 bg-white">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search conversations..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
                                        />
                                        <div className="absolute left-3.5 top-3 text-gray-400"><Search className="w-4 h-4" /></div>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center text-gray-400">Loading...</div>
                                ) : filteredInquiries.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                        <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                                        {isDesktopSidebarOpen && <p>No chats found.</p>}
                                    </div>
                                ) : (
                                    filteredInquiries.map(inquiry => (
                                        <div
                                            key={inquiry.id}
                                            onClick={() => {
                                                setSelectedId(inquiry.id);
                                                setIsSidebarOpen(false);
                                            }}
                                            className={`border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50
                                            ${selectedId === inquiry.id ? 'bg-white border-l-4 border-l-teal-500 shadow-sm' : 'border-l-4 border-l-transparent bg-transparent'}
                                            ${isDesktopSidebarOpen ? 'p-4' : 'p-2 flex justify-center'}
                                        `}
                                        >
                                            <div className={`flex ${isDesktopSidebarOpen ? 'gap-4' : 'justify-center'}`}>
                                                <div className="relative">
                                                    <img
                                                        src={inquiry.customer_avatar || "https://placehold.co/100x100/e2e8f0/1e293b?text=TRIP"}
                                                        alt="Trip"
                                                        className={`rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0 ${isDesktopSidebarOpen ? 'w-12 h-12' : 'w-10 h-10'}`}
                                                    />
                                                    {selectedId === inquiry.id && <span className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 border-2 border-white rounded-full"></span>}
                                                </div>

                                                {isDesktopSidebarOpen && (
                                                    <div className="flex-1 min-w-0 py-1 animate-in fade-in duration-200">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <h4 className={`font-bold text-sm truncate ${selectedId === inquiry.id ? 'text-gray-900' : 'text-gray-700'}`}>{inquiry.customer_name}</h4>
                                                            <span className="text-[10px] text-gray-400 text-nowrap ml-2 font-medium">{inquiry.timestamp}</span>
                                                        </div>
                                                        <p className={`text-xs truncate ${selectedId === inquiry.id ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>{inquiry.last_message}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {/* Mobile Banner - Horizontal at bottom of users list (Inside scroll) */}
                                <div className="md:hidden p-2 flex justify-center bg-gray-50/50 mt-2">
                                    <AffiliateBanner bannerType="horizontal-banner" className="w-full max-w-[320px]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`
                    flex-1 bg-white flex flex-col overflow-hidden relative
                    ${!isSidebarOpen ? 'flex' : 'hidden md:flex'}
                `}>
                    {selectedInquiry ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-4 py-3 md:px-5 md:py-3 border-b border-gray-100 flex items-center justify-between bg-white z-10 shadow-sm">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <button className="md:hidden p-2 -ml-2 text-gray-500 flex-shrink-0" onClick={() => setIsSidebarOpen(true)}>
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <img
                                        src={selectedInquiry.customer_avatar || "https://placehold.co/100x100/e2e8f0/1e293b?text=TRIP"}
                                        alt="Trip"
                                        className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover ring-2 ring-gray-50 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-base md:text-lg truncate leading-tight pr-2">{selectedInquiry.customer_name}</h3>
                                        <p className="text-[10px] md:text-xs text-teal-600 font-bold flex items-center gap-1.5 uppercase tracking-wider mt-0.5">
                                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse flex-shrink-0"></span> Active Now
                                        </p>
                                    </div>
                                </div>
                                {/* <div className="flex gap-2">
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                                        <Search className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                                        <Menu className="w-5 h-5" />
                                    </button>
                                </div> */}
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#F8FAFC]" ref={scrollRef}>
                                {selectedInquiry.messages?.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                                        <div className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'} max-w-[85%] lg:max-w-2xl`}>
                                            <div className={`
                                                px-6 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm relative
                                                ${msg.sender === 'customer'
                                                    ? 'bg-teal-600 text-white rounded-br-sm'
                                                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}
                                            `}>
                                                {msg.media_url && (
                                                    <div className="mb-3 -mx-2 -mt-2">
                                                        {msg.media_type === 'image' ? (
                                                            <img src={msg.media_url} alt="Shared Image" className="rounded-xl max-h-80 object-cover w-full" />
                                                        ) : msg.media_type === 'video' ? (
                                                            <video src={msg.media_url} controls className="rounded-xl max-h-80 w-full" />
                                                        ) : (
                                                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${msg.sender === 'customer' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'} `}>
                                                                <div className="p-2 bg-white/20 rounded-lg"><Download className="w-4 h-4" /></div>
                                                                <span className="font-medium">Attachment</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                            </div>
                                            <div className={`text-[11px] font-medium mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.sender === 'customer' ? 'text-gray-400 mr-1' : 'text-gray-400 ml-1'}`}>
                                                {msg.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input Area */}
                            <div className="p-2 bg-[#F8FAFC]">
                                <div className="max-w-4xl mx-auto flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-teal-500/10 focus-within:border-teal-500 transition-all shadow-sm">
                                    {/* <button className="p-3 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200/50 transition-colors">
                                        <Paperclip className="w-5 h-5" />
                                    </button> */}
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 p-3 min-h-[48px] max-h-32 resize-none placeholder:text-gray-400"
                                        rows={1}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!replyText.trim()}
                                        className="p-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                                {/* <div className="text-center mt-2">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Press Enter to send</p>
                                </div> */}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50/50 pattern-grid-lg">
                            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6 ring-4 ring-gray-50">
                                <MessageSquare className="w-10 h-10 text-teal-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Conversation</h3>
                            <p className="text-gray-500 max-w-xs text-center leading-relaxed">Choose a thread from the sidebar to continue your journey planning.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default CustomerMessagesPage;
