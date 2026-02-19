
import React from 'react';
import { Link } from 'react-router-dom';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, to }) => {
  return (
    <Link to={to} className="block group">
        <div className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="text-teal-500 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    </Link>
  );
};

export default FeatureCard;
