
import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import { ChatHistorySidebar } from '../components/ChatHistorySidebar';
import ListingWorkspace from '../components/ListingWorkspace';
import { AffiliateWorkspace } from '../components/AffiliateWorkspace';
import ProductModal from '../components/ProductModal';
import { useAgentData } from '../context/AgentDataContext';
import { useAuth } from '../context/AuthContext';
import { useAffiliateSubscription } from '../hooks/useAffiliateSubscription';
import { ChevronLeft, ChevronRight, X, Sparkles, Download, Share2 } from 'lucide-react';
import { Product } from '../types';

const CreatorPage: React.FC = () => {
    const { profile } = useAuth();
    const { canMakeQuery, dailyQueryCount, userSubscription } = useAffiliateSubscription();
    const {
        messages, isLoading, sendMessage, workspaceProducts, affiliateListings,
        confirmProduct, deleteProduct, chatSessions, currentSessionId,
        setCurrentSessionId, createNewChat, deleteSession, renameSession,
        updateAffiliateStatus, removeAffiliateListing, lastGeneratedImageUrl,
        isMobileHistoryOpen, setIsMobileHistoryOpen
    } = useAgentData();

    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
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
        <div className="flex w-full h-full relative overflow-hidden">

            {/* Mobile History Drawer */}
            <div className={`fixed top-16 left-0 right-0 bottom-0 z-[60] lg:hidden transition-opacity duration-300 ${isMobileHistoryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileHistoryOpen(false)} />
                <div className={`absolute left-0 top-0 bottom-0 w-64 md:w-80 bg-gray-100 dark:bg-gray-950 shadow-2xl transform transition-transform duration-300 ${isMobileHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <ChatHistorySidebar
                        sessions={chatSessions}
                        currentSessionId={currentSessionId}
                        onSelectSession={(id) => { setCurrentSessionId(id); setIsMobileHistoryOpen(false); }}
                        onNewChat={() => { createNewChat(); setIsMobileHistoryOpen(false); }}
                        onDeleteSession={deleteSession}
                        onRenameSession={renameSession}
                        onClose={() => setIsMobileHistoryOpen(false)}
                    />
                </div>
            </div>

            {/* Chat History Sidebar (Desktop) */}
            <div className={`hidden lg:block flex-shrink-0 bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out ${isHistoryOpen ? 'w-64 md:w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="w-64 md:w-80 h-full">
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
            <div className={`hidden lg:flex flex-col justify-center absolute top-1/2 -translate-y-1/2 z-[60] transition-all duration-300 ${isHistoryOpen ? 'left-64 md:left-80 -ml-4' : 'left-0 -translate-x-1/2'}`}>
                <button
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-400 hover:text-teal-500 transition-all hover:scale-110 flex items-center h-8 rounded-full ${!isHistoryOpen ? 'min-w-[40px] pl-5' : 'w-8 p-1.5 justify-center'}`}
                >
                    {isHistoryOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 ml-auto mr-1" />}
                </button>
            </div>

            {/* Chat Interface */}
            <div className={`flex-1 flex flex-col h-full min-w-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm relative transition-all duration-300 ${isHistoryOpen ? 'lg:border-l' : 'lg:border-l-0'} ${isWorkspaceOpen ? 'lg:border-r' : 'lg:border-r-0'} border-gray-200 dark:border-gray-800`}>
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
            <div className={`hidden lg:flex flex-col justify-center absolute top-1/2 -translate-y-1/2 z-[60] transition-all duration-300 ${isWorkspaceOpen ? '-mr-4' : 'translate-x-1/2'}`} style={{ right: isWorkspaceOpen ? 'min(400px, 25%)' : '0' }}>
                <button
                    onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-400 hover:text-teal-500 transition-all hover:scale-110 flex items-center h-8 rounded-full ${!isWorkspaceOpen ? 'min-w-[40px] pr-5' : 'w-8 p-1.5 justify-center'}`}
                >
                    {isWorkspaceOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4 mr-auto ml-1" />}
                </button>
            </div>

            <div className={`hidden lg:block flex-shrink-0 bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out ${isWorkspaceOpen ? 'w-[min(400px,25%)] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
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
