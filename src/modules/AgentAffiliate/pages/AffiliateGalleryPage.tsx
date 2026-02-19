
import React, { useState } from 'react';
import { AffiliateGallery } from '../components/AffiliateGallery';
import { useAgentData } from '../context/AgentDataContext';
import { SubscriptionModal } from '../components/SubscriptionModal';

const AffiliateGalleryPage: React.FC = () => {
    const { affiliateListings, updateAffiliateStatus, removeAffiliateListing } = useAgentData();
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

    return (
        <div className="w-full h-full p-6 overflow-y-auto">
            <AffiliateGallery
                listings={affiliateListings}
                onToggleStatus={(id) => {
                    const listing = affiliateListings.find(l => l.id === id);
                    if (listing) updateAffiliateStatus(id, !listing.is_active);
                }}
                onDelete={removeAffiliateListing}
                onBoost={() => setIsSubscriptionModalOpen(true)}
            />
            {isSubscriptionModalOpen && (
                <SubscriptionModal onClose={() => setIsSubscriptionModalOpen(false)} />
            )}
        </div>
    );
};

export default AffiliateGalleryPage;
