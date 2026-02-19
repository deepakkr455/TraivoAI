import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Product, MediaUpload } from '../types';
import { Sparkles } from 'lucide-react';

import { Message } from './Message';
import { PaperclipIcon, SendIcon, LoadingIcon } from './Icons';
import { supabase } from '../services/supabaseService';


interface ChatInterfaceProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (content: string, uploads?: MediaUpload[]) => void;
    onCardClick: (product: Product) => void;
    isAffiliate?: boolean;
    canSendMessage?: boolean;
    quotaInfo?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages, isLoading, onSendMessage, onCardClick, isAffiliate = false,
    canSendMessage = true, quotaInfo
}) => {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(prev => [...prev, ...Array.from(event.target.files || [])]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        if (input.trim() === '' && files.length === 0) return;
        if (isUploading || isLoading || !canSendMessage) return;

        setIsUploading(true);
        let uploads: MediaUpload[] = [];

        try {
            if (files.length > 0) {
                // Upload files to Supabase Storage
                console.log('Uploading files to Supabase Storage...');
                const { uploadMedia } = await import('../services/supabaseService');


                uploads = (await Promise.all(files.map(async file => {
                    // Use a dummy business ID for now, or get it from context if available
                    const businessId = '98a3c425-01e7-4435-8576-926c04567d8d';
                    const publicUrl = await uploadMedia(file, businessId);

                    if (publicUrl) {
                        return {
                            name: file.name,
                            type: file.type.startsWith('image') ? 'image' : 'video',
                            url: publicUrl
                        };
                    }
                    return null;
                }))).filter(Boolean) as MediaUpload[];

                console.log('Uploads complete:', uploads);
            }

            onSendMessage(input, uploads);
            setInput('');
            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            if (textareaRef.current) {
                textareaRef.current.style.height = '48px';
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <Message key={msg.id} message={msg} onCardClick={onCardClick} />
                    ))}
                    {(isLoading || isUploading) && (
                        <div className="flex justify-center items-center gap-3 py-4">
                            <LoadingIcon />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {isUploading ? 'Uploading media...' : 'The AI is planning your trip details...'}
                            </p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            {isAffiliate && !canSendMessage && (
                <div className="mx-4 mb-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Daily Quota Reached</p>
                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80">{quotaInfo || "Upgrade your plan to continue creating listings today."}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.hash = '#/affiliate/subscription'}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg font-bold text-xs transition-colors whitespace-nowrap"
                    >
                        UPGRADE
                    </button>
                </div>
            )}
            <div className="p-4 bg-white/50 dark:bg-gray-900/60 border-t border-black/10 dark:border-white/10">
                {files.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2 px-2">
                        {files.map((file, index) => (
                            <div key={index} className="relative group">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{file.name}</span>
                                    <button
                                        onClick={() => handleRemoveFile(index)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-end space-x-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Hide Attachment Button for Affiliates */}
                    {/* Assuming we can pass userType as prop or use context if available inside ChatInterface, 
                        but for now let's rely on a prop or just check if we can access profile. 
                        Since ChatInterface doesn't have profile prop, we might need to update App.tsx to pass it or useAuth here.
                        Let's use useAuth hook if possible, or just pass a prop. 
                        Better to use useAuth hook inside ChatInterface if it's not passed.
                    */}
                    {/* We need to import useAuth first. Let's assume we'll add the import at the top. */}

                    {/* Actually, let's just conditionally render based on a new prop 'isAffiliate' to be safe and clean */}
                    {!isAffiliate && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || isLoading}
                            className="p-3 text-gray-600 dark:text-gray-300 hover:text-teal-500 dark:hover:text-teal-400 transition-colors rounded-full disabled:opacity-50 disabled:cursor-not-allowed mb-1"
                        >
                            <PaperclipIcon />
                        </button>
                    )}

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-resize
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!isLoading && !isUploading) handleSendMessage();
                            }
                        }}
                        placeholder={isAffiliate ? "Paste a GetYourGuide or TripAdvisor link..." : "Describe the trip you want to list..."}
                        className="flex-1 px-4 py-3 md:px-5 border-none rounded-2xl bg-gray-100 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow resize-none min-h-[48px] max-h-120px custom-scrollbar text-sm md:text-base"
                        style={{ height: '48px' }}
                        disabled={isLoading || isUploading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || isUploading || (input.trim() === '' && files.length === 0)}
                        className="p-3 bg-teal-500 text-white rounded-full hover:bg-teal-600 disabled:bg-teal-300 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110"
                    >
                        {isUploading ? <LoadingIcon className="w-5 h-5 text-white" /> : <SendIcon />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
