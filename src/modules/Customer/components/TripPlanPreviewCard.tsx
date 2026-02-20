import React from 'react';
import { ArrowRight } from '../../../components/Icons';


interface TripPlanPreviewCardProps {
  url: string;
  title: string;
  heroImageText: string;
  imageUrl?: string;
  planId: string;
  onViewClick?: (planId: string) => void;
  enableBlogAction?: boolean;
}

export const TripPlanPreviewCard: React.FC<TripPlanPreviewCardProps> = ({ url, title, heroImageText, imageUrl: customImageUrl, planId, onViewClick, enableBlogAction = false }) => {
  const imageUrl = customImageUrl || `https://placehold.co/800x400/0d9488/ffffff?text=${encodeURIComponent(heroImageText)}`;

  const handleClick = (e: React.MouseEvent) => {
    if (onViewClick) {
      e.preventDefault();
      onViewClick(planId);
    }
  };

  const hasBlog = false; // TODO: Check if blog exists for this plan (could be passed as prop or fetched)

  return (
    <div className="bg-gray-800/60 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-600/50 w-full max-w-[320px] mx-auto flex-shrink-0 flex flex-col">
      <div
        onClick={handleClick}
        className="block hover:opacity-90 transition-opacity cursor-pointer flex-grow"
      >
        <img src={imageUrl} alt={title} className="w-full h-40 object-cover" />
        <div className="p-4">
          <p className="text-xs text-teal-300 font-semibold mb-1">YOUR TRIP PLAN IS READY</p>
          <h3 className="text-lg font-bold text-white leading-tight mb-3 line-clamp-2" title={title}>{title}</h3>

          <div className="flex items-center justify-between text-sm font-medium text-teal-200 group">
            <span className="group-hover:text-teal-100 transition-colors">View Itinerary</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Action Footer - Only show if specifically enabled, as this component is often used for unsaved previews */}
      {enableBlogAction && (
        <div className="px-4 pb-4 pt-0 mt-auto">
          <a
            href={`#/user/blog/${planId}`}
            className="flex items-center justify-center w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium text-white transition-all backdrop-blur-sm"
            onClick={(e) => {
              // Prevent default link behavior if needed
            }}
          >
            <span className="mr-2">✨</span>
            AI Travel Blog
          </a>
        </div>
      )}
    </div>
  );
};