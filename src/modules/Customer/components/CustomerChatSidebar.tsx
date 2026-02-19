import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Edit2 } from 'lucide-react';

interface ChatSession {
    id: string;
    title: string;
    created_at: string;
}

interface CustomerChatSidebarProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
    onRenameSession: (sessionId: string, newTitle: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const CustomerChatSidebar: React.FC<CustomerChatSidebarProps> = ({
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    onRenameSession,
    isOpen,
    onClose
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
        <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static transition-transform duration-300 ease-in-out z-40 w-64 md:w-80 bg-white border-r border-gray-200 flex flex-col`} style={{ height: '100vh' }}>
            <div className="p-3 flex items-center justify-between lg:hidden">
                <span className="font-bold text-base text-gray-800">History</span>
                <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="p-2">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-xl font-semibold transition-all duration-200 border border-teal-100"
                >
                    <Plus className="w-5 h-5" />
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
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
                                                ? 'bg-teal-50 text-teal-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            onClick={() => onSelectSession(session.id)}
                                        >
                                            <MessageSquare className={`w-4 h-4 flex-shrink-0 transition-colors ${currentSessionId === session.id ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'}`} />

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
                                                <span className="text-sm truncate flex-1 leading-tight">{session.title}</span>
                                            )}

                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleStartEdit(session, e)}
                                                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                                                    title="Rename"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteSession(session.id);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
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
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageSquare className="text-gray-400 w-6 h-6" />
                        </div>
                        <p className="text-xs text-gray-500 font-medium">No chat history yet</p>
                        <p className="text-[10px] text-gray-400 mt-1">Start a new chat to plan your trip</p>
                    </div>
                )}
            </div>
        </div>
    );
};
