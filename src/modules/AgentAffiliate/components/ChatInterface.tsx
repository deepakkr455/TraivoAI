import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Product, MediaUpload } from '../types';
import { Sparkles, Camera, Plus } from 'lucide-react';

import { Message } from './Message';
import { PaperclipIcon, SendIcon, LoadingIcon } from './Icons';
import { supabase } from '../services/supabaseService';


interface ChatInterfaceProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (content: string, uploads?: MediaUpload[], forcedTool?: string) => void;
    onCardClick: (product: Product) => void;
    onImageClick?: (imageUrl: string, prompt?: string) => void;
    isAffiliate?: boolean;
    canSendMessage?: boolean;
    quotaInfo?: string;
    isHistoryLoading?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages, isLoading, onSendMessage, onCardClick, onImageClick, isAffiliate = false,
    canSendMessage = true, quotaInfo, isHistoryLoading = false
}) => {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }, [input]);

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

            onSendMessage(input, uploads, selectedTool || undefined);
            setInput('');
            setFiles([]);
            setSelectedTool(null);
            setShowMenu(false);
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
                <div className="space-y-6 relative h-full">
                    {isHistoryLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-50 animate-in fade-in duration-300">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-teal-100 dark:border-teal-900 rounded-full" />
                                <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-teal-500 animate-pulse" />
                                </div>
                            </div>
                            <h3 className="mt-6 text-lg font-bold text-gray-800 dark:text-gray-200">Retrieving History</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">Gathering your previous travel plans...</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <Message key={msg.id} message={msg} onCardClick={onCardClick} onImageClick={onImageClick} />
                            ))}
                            {(isLoading || isUploading) && (
                                <div className="flex justify-center items-center gap-3 py-4">
                                    <LoadingIcon />
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {isUploading ? 'Uploading media...' : 'The AI is planning your trip details...'}
                                    </p>
                                </div>
                            )}
                        </>
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
                <div className="max-w-4xl mx-auto relative">
                    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-700">
                        <div className="relative flex items-center px-3 sm:px-4 py-2 sm:py-3 min-h-[50px] sm:min-h-[60px]">
                            <input
                                type="file"
                                ref={fileInputRef}
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {/* Plus Button and Menu */}
                            <div className="relative flex-shrink-0">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${showMenu
                                        ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rotate-45 shadow-inner'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm hover:scale-110 active:scale-95'
                                        }`}
                                    title="More options"
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="transition-transform duration-300"
                                    >
                                        <defs>
                                            <linearGradient id="plus-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#9333ea" />
                                                <stop offset="100%" stopColor="#ef4444" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M12 5v14M5 12h14"
                                            stroke={showMenu ? "currentColor" : "url(#plus-icon-gradient)"}
                                        />
                                    </svg>
                                </button>

                                {showMenu && (
                                    <div className="absolute bottom-full mb-4 left-0 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-1.5 sm:p-2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
                                        <div className="p-2 mb-1">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2">AI Tools & Uploads</p>
                                        </div>
                                        <div className="flex flex-col gap-0.5 sm:gap-1">
                                            <button
                                                onClick={() => { fileInputRef.current?.click(); setShowMenu(false); }}
                                                className="flex items-center gap-2.5 sm:gap-3 w-full p-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-700 dark:text-gray-200 hover:text-teal-700 dark:hover:text-teal-300 rounded-xl transition-all text-sm font-medium text-left"
                                            >
                                                <div className="p-2 bg-teal-100 dark:bg-teal-900/40 rounded-lg text-teal-600 dark:text-teal-400">
                                                    <PaperclipIcon className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span>Upload Img</span>
                                                    <span className="text-[10px] opacity-60">Add reference photos</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedTool('generate_social_image'); setShowMenu(false); }}
                                                className="flex items-center gap-2.5 sm:gap-3 w-full p-2.5 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-gray-700 dark:text-gray-200 hover:text-pink-700 dark:hover:text-pink-300 rounded-xl transition-all text-sm font-medium text-left"
                                            >
                                                <div className="p-2 bg-pink-100 dark:bg-pink-900/40 rounded-lg text-pink-600 dark:text-pink-400">
                                                    <Camera className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span>Social Media Post</span>
                                                    <span className="text-[10px] opacity-60">Generate viral travel visuals</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Textarea Container */}
                            <div className="flex-1 relative mx-3">
                                {selectedTool === 'generate_social_image' && (
                                    <div className="absolute -top-10 left-0 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 px-3 py-1.5 rounded-t-xl text-[10px] font-bold flex items-center gap-2 border-t border-x border-pink-100 dark:border-pink-800 animate-in fade-in slide-in-from-bottom-2">
                                        <Camera className="w-3 h-3" />
                                        SOCIAL MEDIA MODE
                                        <button onClick={() => setSelectedTool(null)} className="ml-1 hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full p-0.5 font-bold transition-colors">×</button>
                                    </div>
                                )}
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (!isLoading && !isUploading) handleSendMessage();
                                        }
                                    }}
                                    placeholder={isAffiliate ? "Paste a GetYourGuide or TripAdvisor link..." : "Describe the trip you want to list..."}
                                    className="w-full bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none focus:ring-0 resize-none py-1.5 max-h-32 outline-none text-sm md:text-base leading-relaxed"
                                    rows={1}
                                    disabled={isLoading || isUploading}
                                />
                            </div>

                            {/* Send Button */}
                            <div className="flex-shrink-0">
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || isUploading || (input.trim() === '' && files.length === 0)}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform active:scale-95"
                                    aria-label="Send message"
                                >
                                    {isUploading ? <LoadingIcon className="w-5 h-5 text-white" /> : <SendIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
