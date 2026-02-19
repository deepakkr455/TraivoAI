import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import FeatureCard from '../components/FeatureCard';
import InviteModal from '../components/InviteModal';
import { UsersIcon } from '../../../components/icons/UsersIcon';
import { MapPinIcon } from '../../../components/icons/MapPinIcon';
import { MessageSquareIcon } from '../../../components/icons/MessageSquareIcon';
import { GalleryIcon } from '../../../components/icons/GalleryIcon';
import { TrendingUpIcon } from '../../../components/icons/TrendingUpIcon';
import { MailIcon } from '../../../components/icons/MailIcon';



const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Ready for your next adventure? Here are some tools to get you started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard to="/user/feed" icon={<UsersIcon size={32} />} title="Social Feed" description="Share your travel stories and connect with the community." />
          <FeatureCard to="/user/map" icon={<MapPinIcon size={32} />} title="Map & Places" description="Discover popular destinations and get crowd insights." />
          <FeatureCard to="/user/group-planner" icon={<MessageSquareIcon size={32} />} title="Group Travel Planner" description="Plan your next trip, manage budgets, and collaborate with your group." />

          <div onClick={() => setInviteModalOpen(true)} className="cursor-pointer">
            <FeatureCard to="#" icon={<MailIcon size={32} />} title="Invite Friends" description="Invite fellow travelers to join you on TraivoAI." />
          </div>

          <FeatureCard to="/user/dashboard" icon={<TrendingUpIcon size={32} />} title="Crowd Insights" description="Real-time weather and crowd data from travelers. (Coming Soon)" />
          <FeatureCard to="/user/wanderchat" icon={<GalleryIcon size={32} />} title="TraivoAI" description="Ask our AI for contextual travel answers." />
        </div>
      </div>
      {isInviteModalOpen && <InviteModal onClose={() => setInviteModalOpen(false)} />}
    </div>
  );
};

export default DashboardPage;
