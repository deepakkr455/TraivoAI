import React, { useState } from 'react';
import { MessageSquareIcon, PlusIcon, TrashIcon, EditIcon } from './Icons';

interface ChatSession {
    id: string;
    title: string;
    created_at: string;
}

interface ChatHistorySidebarProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
    onRenameSession: (sessionId: string, newTitle: string) => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    onRenameSession
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(session.id);
        setEditTitle(session.title);
    };

    const handleSaveEdit = () => {
        if (editingId && editTitle.trim()) {
            onRenameSession(editingId, editTitle.trim());
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    // Group sessions by date
    const groupedSessions = sessions.reduce((groups, session) => {
        const date = new Date(session.created_at);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key = 'Older';
        if (date.toDateString() === today.toDateString()) {
            key = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            key = 'Yesterday';
        } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
            key = 'Previous 7 Days';
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(session);
        return groups;
    }, {} as Record<string, ChatSession[]>);

    const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

    return (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-950 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-xl font-semibold transition-all duration-200 border border-teal-100 dark:border-teal-800"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
                {sessions.length > 0 ? (
                    groupOrder.map(group => {
                        const groupSessions = groupedSessions[group];
                        if (!groupSessions || groupSessions.length === 0) return null;

                        return (
                            <div key={group}>
                                <h3 className="px-3 mb-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{group}</h3>
                                <div className="space-y-1">
                                    {groupSessions.map(session => (
                                        <div
                                            key={session.id}
                                            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${currentSessionId === session.id
                                                ? 'bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-300 font-medium'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                            onClick={() => onSelectSession(session.id)}
                                        >
                                            <MessageSquareIcon className={`w-4 h-4 flex-shrink-0 transition-colors ${currentSessionId === session.id ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'}`} />

                                            {editingId === session.id ? (
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onBlur={handleSaveEdit}
                                                    onKeyDown={handleKeyDown}
                                                    autoFocus
                                                    className="flex-1 bg-transparent border-b border-teal-500 focus:outline-none text-sm px-0 py-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className="text-sm md:text-[15px] truncate flex-1 leading-tight">{session.title}</span>
                                            )}

                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleStartEdit(session, e)}
                                                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                                                    title="Rename"
                                                >
                                                    <EditIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteSession(session.id);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="px-4 py-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageSquareIcon className="text-gray-400 w-6 h-6" />
                        </div>
                        <p className="text-xs text-gray-500 font-medium">No chat history yet</p>
                        <p className="text-[10px] text-gray-400 mt-1">Start a new chat to plan your trip</p>
                    </div>
                )}
            </div>
        </div>
    );
};
