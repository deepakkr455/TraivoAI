
import React, { useState } from 'react';
import { Dashboard } from '../components/Dashboard';
import { useAgentData } from '../context/AgentDataContext';
import { SubscriptionModal } from '../components/SubscriptionModal';

const MessagesPage: React.FC = () => {
    const { workspaceProducts, bookings, inquiries, toggleProductStatus, refreshInquiries } = useAgentData();
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

    return (
        <div className="w-full h-full overflow-hidden">
            <Dashboard
                currentView="messages"
                products={workspaceProducts}
                bookings={bookings}
                inquiries={inquiries}
                setInquiries={(updated) => {
                    // We don't really need to set inquiries here if we have refreshInquiries
                    // But to satisfy the prop:
                    refreshInquiries();
                }}
                onBoostClick={() => setIsSubscriptionModalOpen(true)}
                onToggleStatus={toggleProductStatus}
            />
            {isSubscriptionModalOpen && (
                <SubscriptionModal onClose={() => setIsSubscriptionModalOpen(false)} />
            )}
        </div>
    );
};

export default MessagesPage;
