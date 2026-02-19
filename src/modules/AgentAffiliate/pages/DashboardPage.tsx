
import React, { useState } from 'react';
import { Dashboard } from '../components/Dashboard';
import { AffiliateDashboard } from '../components/AffiliateDashboard';
import { useAgentData } from '../context/AgentDataContext';
import { useAuth } from '../context/AuthContext';
import { SubscriptionModal } from '../components/SubscriptionModal';

import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const {
        workspaceProducts, bookings, inquiries, toggleProductStatus, affiliateListings
    } = useAgentData();
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

    if (profile?.user_type === 'affiliate_partner') {
        return (
            <div className="w-full h-full overflow-y-auto">
                <AffiliateDashboard
                    listings={affiliateListings}
                    inquiries={inquiries}
                    onUnlockPro={() => navigate('/agent-portal/subscription')}
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-hidden">
            <Dashboard
                currentView="dashboard"
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

export default DashboardPage;
