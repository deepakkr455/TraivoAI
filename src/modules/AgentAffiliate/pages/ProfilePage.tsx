
import React from 'react';
import { ProfileModal } from '../components/ProfileModal';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="w-full h-full flex items-center justify-center p-6">
            {/* We reuse the modal content but as a page */}
            <ProfileModal onClose={() => navigate('/agent-portal/creator')} />
        </div>
    );
};

export default ProfilePage;
