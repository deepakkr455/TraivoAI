import React, { useState, useRef, useEffect } from 'react';
import { ChatInputProps } from '../../../types';
import { Paperclip, Mic, SendHorizonal } from '../../../components/Icons';




import { Plus, Map, CloudSun, Calendar, FileText, Sparkles } from 'lucide-react';

const PLACEHOLDER_MESSAGES = [
  'Create a new trip',
  'Inspire me where to go',
  'Plan a road trip',
  'Plan a last-minute escape',
  'Find hidden gems nearby',
  'Suggest weekend getaways',
  'Plan a beach vacation',
  'Discover local experiences',
  'Create an adventure itinerary',
  'Find romantic destinations'
];

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, onAction, forcedTool, onSetForcedTool, value, onChange, limitMessage }) => {
  const [localPrompt, setLocalPrompt] = useState('');
  const prompt = value !== undefined ? value : localPrompt;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    if (onChange) onChange(newVal);
    if (value === undefined) setLocalPrompt(newVal);
  };
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Animated placeholder effect with smooth fade
  useEffect(() => {
    if (prompt || isFocused) return;

    const interval = setInterval(() => {
      // Fade out
      setPlaceholderOpacity(0);

      // Change text after fade out
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_MESSAGES.length);
        // Fade in
        setPlaceholderOpacity(1);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, [prompt, isFocused]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [prompt]);

  const handleSend = () => {
    if (prompt.trim() && !isLoading) {
      onSend(prompt);
      if (onChange) onChange('');
      if (value === undefined) setLocalPrompt('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (action: 'plan' | 'weather' | 'map' | 'flyer') => {
    if (onAction) {
      onAction(action);
      setShowMenu(false);
    }
  };

  const quickActions = [
    'Create a new trip',
    'Inspire me where to go',
    'Plan a road trip',
    'Plan a last-minute escape'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <style>{`
        .animated-placeholder::placeholder {
          opacity: ${placeholderOpacity};
          transition: opacity 0.4s ease-in-out;
        }
      `}</style>

      {/* Plus Menu Popup */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-3 ml-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-2 min-w-[200px] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { onSetForcedTool?.('create_trip_plan'); setShowMenu(false); }}
              className="flex items-center gap-3 w-full p-2.5 hover:bg-teal-50 text-gray-700 hover:text-teal-700 rounded-xl transition-all text-sm font-medium text-left"
            >
              <div className="p-1.5 bg-teal-100/50 rounded-lg text-teal-600">
                <Calendar className="w-4 h-4" />
              </div>
              Trip Plan
            </button>
            <button
              onClick={() => { onSetForcedTool?.('search_internet'); setShowMenu(false); }}
              className="flex items-center gap-3 w-full p-2.5 hover:bg-sky-50 text-gray-700 hover:text-sky-700 rounded-xl transition-all text-sm font-medium text-left"
            >
              <div className="p-1.5 bg-sky-100/50 rounded-lg text-sky-600">
                <CloudSun className="w-4 h-4" />
              </div>
              Search Internet
            </button>
            <button
              onClick={() => { onSetForcedTool?.('get_weather_forecast'); setShowMenu(false); }}
              className="flex items-center gap-3 w-full p-2.5 hover:bg-amber-50 text-gray-700 hover:text-amber-700 rounded-xl transition-all text-sm font-medium text-left"
            >
              <div className="p-1.5 bg-amber-100/50 rounded-lg text-amber-600">
                <CloudSun className="w-4 h-4" />
              </div>
              Weather Forecast
            </button>
            <button
              onClick={() => { onSetForcedTool?.('generate_day_plan'); setShowMenu(false); }}
              className="flex items-center gap-3 w-full p-2.5 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl transition-all text-sm font-medium text-left"
            >
              <div className="p-1.5 bg-blue-100/50 rounded-lg text-blue-600">
                <Map className="w-4 h-4" />
              </div>
              Day Plan
            </button>
            <button
              onClick={() => handleActionClick('flyer')}
              className="flex items-center gap-3 w-full p-2.5 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl transition-all text-sm font-medium text-left"
            >
              <div className="p-1.5 bg-indigo-100/50 rounded-lg text-indigo-600">
                <FileText className="w-4 h-4" />
              </div>
              Travel Flyer
            </button>
          </div>
        </div>
      )}

      {/* Forced Tool Bubble */}
      {forcedTool && (
        <div className="mb-2 mx-4 flex items-center gap-2 bg-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200 w-fit">
          <span>Using: {forcedTool.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          <button
            onClick={() => onSetForcedTool?.(null)}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Limit Message Bubble */}
      {limitMessage && (
        <div className="mb-2 mx-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-2xl text-xs font-medium shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200 z-40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{limitMessage}</span>
          </div>
          <a
            href="#/user/subscription"
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg font-bold transition-colors whitespace-nowrap"
          >
            Upgrade
          </a>
        </div>
      )}

      {/* Main Input Container */}
      <div
        className={`bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl transition-all duration-300 ease-in-out ${isFocused ? 'ring-2 ring-teal-400' : ''
          }`}
      >
        <div className="relative flex items-end px-2 py-2 border border-gray-300 rounded-3xl focus:ring-teal-500">

          {/* Plus Button */}
          <div className="pb-1 pl-1">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${showMenu
                ? 'bg-gray-100 text-gray-600 rotate-45'
                : 'bg-gradient-to-br from-violet-600 to-red-500 text-white'
                }`}
              title="More options"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Textarea Container */}
          <div className="flex-1 relative mx-2 mb-1">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handlePromptChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isFocused ? PLACEHOLDER_MESSAGES[placeholderIndex] : PLACEHOLDER_MESSAGES[placeholderIndex]}
              className="animated-placeholder w-full bg-transparent text-gray-800 placeholder-gray-400 border-none focus:ring-0 resize-none py-2 md:py-2.5 max-h-48 outline-none text-sm md:text-base"
              rows={1}
              disabled={isLoading}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-1 pb-1 pr-1">


            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || !prompt.trim()}
              className="flex items-center justify-center space-x-2 w-10 h-10 rounded-full bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              aria-label="Send message"
            >
              <SendHorizonal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};