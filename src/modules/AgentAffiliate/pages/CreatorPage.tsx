
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
import { Product } from '../types';

const CreatorPage: React.FC = () => {
    const { profile } = useAuth();
    const { canMakeQuery, dailyQueryCount, userSubscription } = useAffiliateSubscription();
    const {
        messages, isLoading, sendMessage, workspaceProducts, affiliateListings,
        confirmProduct, deleteProduct, chatSessions, currentSessionId,
        setCurrentSessionId, createNewChat, deleteSession, renameSession,
        updateAffiliateStatus, removeAffiliateListing
    } = useAgentData();

    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
    const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCardClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

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

            {/* Workspace */}
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
        </div>
    );
};

export default CreatorPage;
