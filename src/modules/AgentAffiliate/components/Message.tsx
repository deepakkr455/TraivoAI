
import React from 'react';
import { ChatMessage, Product } from '../types';
import { ProductCard } from './ProductCard';

interface MessageProps {
    message: ChatMessage;
    onCardClick: (product: Product) => void;
}

// Simple Custom Markdown Renderer
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;

    // Check for HTML/Embed code (basic check for div/iframe/script)
    const hasHtml = /<div|<iframe|<script/i.test(text);

    if (hasHtml) {
        return (
            <div
                className="prose dark:prose-invert max-w-none [&>iframe]:w-full [&>iframe]:rounded-lg [&>div]:w-full"
                dangerouslySetInnerHTML={{ __html: text }}
            />
        );
    }

    // Split by newlines to handle paragraphs and lists
    const lines = text.split('\n');

    return (
        <div className="space-y-2 leading-relaxed">
            {lines.map((line, index) => {
                const trimmed = line.trim();

                // Handle Bullet Points
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    return (
                        <div key={index} className="flex gap-2 ml-2">
                            <span className="text-teal-500 font-bold">•</span>
                            <span>{parseBold(trimmed.substring(2))}</span>
                        </div>
                    );
                }

                // Handle Numbered Lists
                const numberedMatch = trimmed.match(/^(\d+)\.\s(.+)/);
                if (numberedMatch) {
                    return (
                        <div key={index} className="flex gap-2 ml-2">
                            <span className="font-semibold text-teal-600">{numberedMatch[1]}.</span>
                            <span>{parseBold(numberedMatch[2])}</span>
                        </div>
                    );
                }

                // Empty lines
                if (!trimmed) return <div key={index} className="h-2" />;

                // Standard Paragraph
                return <p key={index}>{parseBold(line)}</p>;
            })}
        </div>
    );
};

// Helper to parse **bold** text
const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

export const Message: React.FC<MessageProps> = ({ message, onCardClick }) => {
    const isUser = message.sender === 'user';

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-6 animate-fade-in-up px-2 md:px-0`}>
            <div className={`flex items-end gap-2 md:gap-3 ${isUser ? 'justify-end' : 'justify-start'} max-w-[95%] lg:max-w-[80%]`}>
                {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                        AI
                    </div>
                )}
                <div
                    className={`px-4 py-3 md:px-5 md:py-3.5 shadow-sm border ${isUser
                        ? 'bg-teal-600 border-teal-600 text-white rounded-2xl rounded-br-none'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-none'
                        }`}
                >
                    <div className="text-sm md:text-base leading-relaxed">
                        <FormattedText text={message.content} />
                    </div>

                    {message.media && message.media.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {message.media.map((media, index) => (
                                <div key={index} className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                                    {media.type === 'image' ? (
                                        <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-500 text-xs p-2 text-center">
                                            <span>Video</span>
                                            {media.name}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {isUser && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-200 font-bold text-xs flex-shrink-0">
                        ME
                    </div>
                )}
            </div>
            {/* Render product card outside the bubble for better layout */}
            {message.productCard && !isUser && (
                <div className="mt-3 pl-11 w-full max-w-sm">
                    <ProductCard product={message.productCard} onClick={() => onCardClick(message.productCard!)} />
                </div>
            )}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
