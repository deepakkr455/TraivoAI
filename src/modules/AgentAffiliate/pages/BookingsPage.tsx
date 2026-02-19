
import React, { useState } from 'react';
import { Dashboard } from '../components/Dashboard';
import { useAgentData } from '../context/AgentDataContext';
import { SubscriptionModal } from '../components/SubscriptionModal';

const BookingsPage: React.FC = () => {
    const { workspaceProducts, bookings, inquiries, toggleProductStatus } = useAgentData();
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

    return (
        <div className="w-full h-full overflow-hidden">
            <Dashboard
                currentView="bookings"
                products={workspaceProducts}
                bookings={bookings}
                inquiries={inquiries}
                onBoostClick={() => setIsSubscriptionModalOpen(true)}
                onToggleStatus={toggleProductStatus}
            />
            {isSubscriptionModalOpen && (
                <SubscriptionModal onClose={() => setIsSubscriptionModalOpen(false)} />
            )}
        </div>
    );
};

export default BookingsPage;
