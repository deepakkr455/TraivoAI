import React from 'react';
import { ArrowRight, Download, Share2, Sparkles } from 'lucide-react';

interface SocialImagePreviewCardProps {
    imageUrl: string;
    prompt?: string;
    title?: string;
    onClick?: () => void;
}

export const SocialImagePreviewCard: React.FC<SocialImagePreviewCardProps> = ({
    imageUrl,
    prompt,
    title = "Social Media Post Ready",
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className="bg-gray-800/60 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-600/50 w-full max-w-[320px] mx-auto flex-shrink-0 flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-500 mt-2 cursor-pointer hover:border-teal-500/50 transition-all"
        >
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={imageUrl}
                    alt={prompt || "AI Generated Social Media Post"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-teal-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    AI VISUAL
                </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
                <div>
                    <p className="text-xs text-teal-300 font-semibold uppercase tracking-wider">{title}</p>
                    <h3 className="text-sm font-medium text-white mt-1 line-clamp-2 italic opacity-90">
                        "{prompt || 'Your custom journey visual'}"
                    </h3>
                </div>

                <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-600/50 text-[11px] font-medium text-gray-400 group-hover:text-teal-200 transition-colors">
                    <span>View Social Preview</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </div>
    );
};
