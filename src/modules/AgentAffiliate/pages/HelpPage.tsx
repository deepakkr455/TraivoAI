
import React from 'react';
import { HelpModal } from '../components/HelpModal';
import { useNavigate } from 'react-router-dom';

const HelpPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="w-full h-full flex items-center justify-center p-6">
            <HelpModal onClose={() => navigate('/agent-portal/creator')} />
        </div>
    );
};

export default HelpPage;
