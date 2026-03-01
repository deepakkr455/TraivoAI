
import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import { ChatHistorySidebar } from '../components/ChatHistorySidebar';
import ListingWorkspace from '../components/ListingWorkspace';
import { AffiliateWorkspace } from '../components/AffiliateWorkspace';
import ProductModal from '../components/ProductModal';
import { useAgentData } from '../context/AgentDataContext';
import { useAuth } from '../context/AuthContext';
import { useAffiliateSubscription } from '../hooks/useAffiliateSubscription';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons';
import { X, Sparkles, Download, Share2 } from 'lucide-react';
import { Product } from '../types';

const CreatorPage: React.FC = () => {
    const { profile } = useAuth();
    const { canMakeQuery, dailyQueryCount, userSubscription } = useAffiliateSubscription();
    const {
        messages, isLoading, sendMessage, workspaceProducts, affiliateListings,
        confirmProduct, deleteProduct, chatSessions, currentSessionId,
        setCurrentSessionId, createNewChat, deleteSession, renameSession,
        updateAffiliateStatus, removeAffiliateListing, lastGeneratedImageUrl
    } = useAgentData();

    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
    const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeImage, setActiveImage] = useState<{ url: string; prompt?: string } | null>(null);

    const handleCardClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
        setActiveImage(null); // Clear image if product is clicked
    };

    const handleImageClick = (imageUrl: string, prompt?: string) => {
        setActiveImage({ url: imageUrl, prompt });
    };

    // Auto-open image when generated
    React.useEffect(() => {
        if (lastGeneratedImageUrl) {
            setActiveImage({ url: lastGeneratedImageUrl });
        }
    }, [lastGeneratedImageUrl]);

    return (
        <div className="flex w-full h-full relative">
            {/* Mobile History Drawer Toggle (Floating) */}
            <button
                onClick={() => setIsMobileHistoryOpen(true)}
                className="lg:hidden fixed bottom-24 right-4 z-40 bg-teal-600 text-white p-3 rounded-full shadow-lg"
            >
                History
            </button>

            {/* Mobile History Drawer */}
            <div className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${isMobileHistoryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileHistoryOpen(false)} />
                <div className={`absolute left-0 top-0 bottom-0 w-full max-w-[320px] bg-gray-100 dark:bg-gray-950 shadow-2xl transform transition-transform duration-300 ${isMobileHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <ChatHistorySidebar
                        sessions={chatSessions}
                        currentSessionId={currentSessionId}
                        onSelectSession={(id) => { setCurrentSessionId(id); setIsMobileHistoryOpen(false); }}
                        onNewChat={() => { createNewChat(); setIsMobileHistoryOpen(false); }}
                        onDeleteSession={deleteSession}
                        onRenameSession={renameSession}
                    />
                </div>
            </div>

            {/* Chat History Sidebar (Desktop) */}
            <div className={`hidden lg:block border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${isHistoryOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="w-80 h-full bg-gray-100 dark:bg-gray-950">
                    <ChatHistorySidebar
                        sessions={chatSessions}
                        currentSessionId={currentSessionId}
                        onSelectSession={setCurrentSessionId}
                        onNewChat={createNewChat}
                        onDeleteSession={deleteSession}
                        onRenameSession={renameSession}
                    />
                </div>
            </div>

            {/* Toggle History Button */}
            <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-r-md shadow-md text-gray-500 hover:text-teal-500 transition-transform hover:scale-110"
                style={{ left: isHistoryOpen ? '320px' : '0' }}
            >
                {isHistoryOpen ? <ChevronLeftIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm relative">
                <ChatInterface
                    messages={messages}
                    isLoading={isLoading}
                    onSendMessage={sendMessage}
                    onCardClick={handleCardClick}
                    onImageClick={handleImageClick}
                    isAffiliate={profile?.user_type === 'affiliate_partner'}
                    canSendMessage={canMakeQuery()}
                    quotaInfo={userSubscription?.tier?.query_daily_quota ? `${dailyQueryCount}/${userSubscription.tier.query_daily_quota} messages used today.` : undefined}
                />
            </div>

            {/* Toggle Workspace Button */}
            <button
                onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-l-md shadow-md text-gray-500 hover:text-teal-500 transition-transform hover:scale-110"
                style={{ right: isWorkspaceOpen ? 'min(400px, 25%)' : '0' }}
            >
                {isWorkspaceOpen ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
            </button>

            <div className={`hidden lg:block flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${isWorkspaceOpen ? 'w-[min(400px,25%)] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="w-full h-full">
                    {profile?.user_type === 'affiliate_partner' ? (
                        <AffiliateWorkspace
                            listings={affiliateListings}
                            onConfirm={async (id) => updateAffiliateStatus(id, true)}
                            onDelete={async (id) => removeAffiliateListing(id)}
                        />
                    ) : (
                        <ListingWorkspace
                            products={workspaceProducts}
                            onViewDetails={handleCardClick}
                            onConfirm={confirmProduct}
                            onDelete={deleteProduct}
                        />
                    )}
                </div>
            </div>

            {/* Product Modal */}
            {isModalOpen && selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }}
                    onConfirm={() => {
                        confirmProduct(selectedProduct.id);
                        setIsModalOpen(false);
                    }}
                    onDelete={() => {
                        deleteProduct(selectedProduct.id);
                        setIsModalOpen(false);
                    }}
                    onEdit={() => {
                        setIsModalOpen(false);
                        sendMessage(`I want to edit the "${selectedProduct.title}" listing.`);
                    }}
                />
            )}

            {/* Image Preview Modal */}
            {activeImage && (
                <div className="fixed inset-0 bg-white/40 dark:bg-slate-950/40 flex items-center justify-center p-4 md:p-8 z-[100] backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-fit max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800 relative ring-1 ring-black/5">
                        {/* Top Right Floating Actions */}
                        <div className="absolute top-6 right-6 z-20 flex gap-3">
                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = activeImage.url;
                                    link.download = `traivo-agent-${Date.now()}.png`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="p-3 bg-teal-500 hover:bg-teal-600 rounded-full transition-all border border-teal-400 text-white shadow-xl group"
                                title="Download Image"
                            >
                                <Download className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={() => setActiveImage(null)}
                                className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 shadow-xl group"
                                title="Close"
                            >
                                <X className="w-6 h-6 group-hover:rotate-90 transition-all duration-300" />
                            </button>
                        </div>

                        {/* Image Container */}
                        <div className="w-full overflow-hidden flex items-center justify-center p-2 bg-transparent">
                            <img
                                src={activeImage.url}
                                alt="AI Preview"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatorPage;
