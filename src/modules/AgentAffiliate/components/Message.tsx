import React from 'react';
import { ChatMessage, Product } from '../types';
import { ProductCard } from './ProductCard';
import { SocialImagePreviewCard } from '../../../components/SocialImagePreviewCard';
import { DefaultAvatarIcon } from './Icons';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
    message: ChatMessage;
    onCardClick: (product: Product) => void;
    onImageClick?: (imageUrl: string, prompt?: string) => void;
}

export const Message: React.FC<MessageProps> = ({ message, onCardClick, onImageClick }) => {
    const isUser = message.sender === 'user';

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-6 animate-fade-in-up px-2 md:px-0`}>
            <div className={`flex items-end gap-2 md:gap-3 ${isUser ? 'justify-end' : 'justify-start'} max-w-[95%] lg:max-w-[80%]`}>
                {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm border border-white/20">
                        TA
                    </div>
                )}
                <div
                    className={`px-4 py-3 md:px-5 md:py-3.5 shadow-sm border ${isUser
                        ? 'bg-teal-600 border-teal-600 text-white rounded-2xl rounded-br-none'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-none'
                        }`}
                >
                    <div className="text-sm md:text-base leading-relaxed">
                        <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100 ${isUser ? 'prose-invert !text-white prose-p:text-white prose-headings:text-white prose-li:text-white prose-strong:text-white prose-code:text-white' : 'dark:prose-invert'} `}>
                            <Markdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ node, ...props }) => <p className={`mb-4 last:mb-0 ${isUser ? 'text-white' : ''}`} {...props} />,
                                    h1: ({ node, ...props }) => <h1 className={`text-xl font-bold mb-4 ${isUser ? 'text-white' : ''}`} {...props} />,
                                    h2: ({ node, ...props }) => <h2 className={`text-lg font-bold mb-3 ${isUser ? 'text-white' : ''}`} {...props} />,
                                    h3: ({ node, ...props }) => <h3 className={`text-md font-bold mb-2 ${isUser ? 'text-white' : ''}`} {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
                                    li: ({ node, ...props }) => <li className={`mb-1 ${isUser ? 'text-white' : ''}`} {...props} />,
                                    table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto mb-4">
                                            <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden" {...props} />
                                        </div>
                                    ),
                                    thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-700" {...props} />,
                                    th: ({ node, ...props }) => <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                                    td: ({ node, ...props }) => <td className={`border border-gray-300 dark:border-gray-600 px-4 py-2 ${isUser ? 'text-white' : ''}`} {...props} />,
                                    code: ({ node, ...props }) => <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-pink-600 dark:text-pink-400 font-mono text-sm" {...props} />,
                                }}
                            >
                                {message.content}
                            </Markdown>
                        </div>
                    </div>

                    {message.media && message.media.length > 0 && !message.imageUrl && (
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
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                        <DefaultAvatarIcon className="w-full h-full" />
                    </div>
                )}
            </div>
            {message.productCard && !isUser && (
                <div className="mt-3 pl-11 w-full max-w-sm">
                    <ProductCard product={message.productCard} onClick={() => onCardClick(message.productCard!)} />
                </div>
            )}
            {message.imageUrl && !isUser && (
                <div className="mt-3 pl-11 w-full max-w-sm">
                    <SocialImagePreviewCard
                        imageUrl={message.imageUrl}
                        prompt={typeof message.content === 'string' ? message.content : undefined}
                        title="Your marketing flyer is ready"
                        onClick={() => onImageClick?.(message.imageUrl!, typeof message.content === 'string' ? message.content : undefined)}
                    />
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
