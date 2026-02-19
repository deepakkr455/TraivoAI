
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { ChatInput } from '../components/ChatInput';
import { SuggestionChips } from '../components/SuggestionChips';
import { MessageBubble } from '../components/MessageBubble';
import { AgentThought } from '../components/AgentThought';
import { Message, TripPlanData, MessageContent, WeatherData, DayPlan } from '../../../types';
import { orchestrateResponse } from '../services/geminiService';
import TravelFlyerEditor from '../components/TravelFlyer/TravelFlyerEditor';
import { generateTripPlanHtml } from '../services/htmlGenerator';
import { tripStorageService } from '../services/tripStorage';
import { X, Map, Search, ArrowUp, ChevronDown, Heart, ChevronLeft, ChevronRight, MessageSquare, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { plansService } from '../services/plansService';
import { proposalsService } from '../services/proposalsService';
import { useAuth } from '../../../hooks/useAuth';
import { useSubscription } from '../../../hooks/useSubscription';
import { WeatherPanel } from '../components/WeatherComponents/WeatherPanel';
import { MapPanel } from '../components/MapPanel';
import { Product, AffiliateListing } from '../../AgentAffiliate/types';
import { getListedProducts } from '../../AgentAffiliate/services/supabaseService';
import { ProductCard } from '../../AgentAffiliate/components/ProductCard';
import { AffiliateCard } from '../../AgentAffiliate/components/AffiliateCard';
import { CustomerProductPreview } from '../components/CustomerProductPreview';
import { CustomerChatSidebar } from '../components/CustomerChatSidebar';
import {
  getCustomerChatSessions,
  createCustomerChatSession,
  deleteCustomerChatSession,
  updateCustomerChatSessionTitle,
  getCustomerConversationMessages,
  getAffiliateListings,
  saveUserPersonalization
} from '../../AgentAffiliate/services/supabaseService';
import { AffiliateBanner } from '../../AgentAffiliate/components/AffiliateBanner';
import { SmartWelcome } from '../components/SmartWelcome';
import { PersonalizationData } from '../components/TravelPersonalization';


// Define helper component to safely use hooks
const DynamicHeadline = () => {
  const headlines = ["your AI trip planner", "your weather forecaster", "your travel companion", "your personalized guide"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % headlines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return <>{headlines[index]}</>;
};

const WanderChatPage: React.FC = () => {
  const { user, loading: authLoading, refreshSession, personalization } = useAuth() as any;
  const {
    canMakeQuery,
    checkQuota,
    userSubscription,
    availablePlans,
    dailyQueryCount,
    isFeatureEnabled,
    loading: subscriptionLoading,
    refresh: refreshSubscription
  } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; title: string; created_at: string }[]>([]);
  // ... existing code ...

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  // ... rest of the component ... 



  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentThoughts, setAgentThoughts] = useState<string[]>([]);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Panel/Modal State
  const [activePlanView, setActivePlanView] = useState<{
    url: string;
    title: string;
    id: string;
    planData: TripPlanData;
  } | null>(null);
  const [activeRightPanel, setActiveRightPanel] = useState<'plan' | 'weather' | 'map' | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);
  const [dayPlanData, setDayPlanData] = useState<DayPlan | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [forcedTool, setForcedTool] = useState<string | null>(null);
  const [showFlyerEditor, setShowFlyerEditor] = useState(false);

  // View Mode for Transition
  const [viewMode, setViewMode] = useState<'chat' | 'recommendations'>('chat');

  // Recommendations State
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Affiliate State
  const [affiliateListings, setAffiliateListings] = useState<AffiliateListing[]>([]);

  // Filter State
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  // Counts
  const [savedCount, setSavedCount] = useState(0);
  const [myTripsCount, setMyTripsCount] = useState(0);

  // Filters and Counts
  const [showSmartWelcome, setShowSmartWelcome] = useState(false);
  const [sessionOnboardingGuarded, setSessionOnboardingGuarded] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  // Check if user needs onboarding
  useEffect(() => {
    // Auto-trigger only if missing AND we haven't guarded it this component lifecycle
    if (user && personalization === null && !subscriptionLoading && !sessionOnboardingGuarded) {
      console.log('🔄 Triggering mandatory onboarding modal');
      setShowSmartWelcome(true);
    }
  }, [user, personalization, subscriptionLoading, sessionOnboardingGuarded]);

  const loadCounts = async () => {
    // Saved Count (from LocalStorage)
    const count = Object.keys(localStorage).filter(k => k.startsWith('like_') && localStorage.getItem(k) === 'true').length;
    setSavedCount(count);

    // My Trips Count (from DB)
    try {
      const result = await plansService.getAllPlans();
      if (result.success && result.data) {
        setMyTripsCount(result.data.length);
      }
    } catch (error) {
      console.error("Failed to load trip count", error);
    }
  };

  useEffect(() => {
    loadCounts();
  }, [viewMode, showLikedOnly]); // Re-load when view changes or filter toggles

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load recommendations when switching to that mode
  useEffect(() => {
    if (viewMode === 'recommendations' && recommendedProducts.length === 0) {
      loadRecommendations();
    }
  }, [viewMode]);

  // Re-filter when showLikedOnly changes
  useEffect(() => {
    if (showLikedOnly) {
      const likedIds = Object.keys(localStorage).filter(k => k.startsWith('like_') && localStorage.getItem(k) === 'true').map(k => k.replace('like_', ''));
      setDisplayedProducts(recommendedProducts.filter(p => likedIds.includes(p.id)));
    } else {
      // Default sort: Randomize or by views for "Most Viewed" mock
      // For now let's just show them as is, or shuffle
      setDisplayedProducts([...recommendedProducts]);
    }
  }, [showLikedOnly, recommendedProducts]);

  const loadRecommendations = async () => {
    setIsRecommendationsLoading(true);
    try {
      const [productsData, affiliatesData] = await Promise.all([
        getListedProducts(),
        getAffiliateListings()
      ]);

      // Data is already filtered by is_active=true from service
      const sorted = productsData.sort((a, b) => (b.is_boosted ? 1 : 0) - (a.is_boosted ? 1 : 0));

      setRecommendedProducts(sorted);
      setDisplayedProducts(sorted);
      setAffiliateListings(affiliatesData);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsRecommendationsLoading(false);
    }
  };

  // Smooth background logic - New Unsplash Image
  // Using a high quality travel image
  const bgClass = isChatStarted
    ? 'bg-white'
    : 'bg-cover bg-center bg-[url("https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop")]';

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, agentThoughts, isLoading]);

  const addAgentThought = (thought: string) => {
    setAgentThoughts([thought]);
  };

  const handleResult = (result: MessageContent) => {
    setForcedTool(null);
    const newModelMessage: Message = {
      id: uuidv4(),
      role: 'model',
      content: result
    };
    setMessages(prev => [...prev, newModelMessage]);

    setIsSidebarOpen(false); // Auto-collapse on response (Mobile)
    setIsSidebarCollapsed(true); // Auto-collapse on response (Desktop)
    loadSessions(); // Refresh list to catch new session title

    if (result.plan) {
      const htmlContent = generateTripPlanHtml(result.plan);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setActivePlanView({
        url,
        title: result.plan.title,
        id: newModelMessage.id,
        planData: result.plan,
      });
      setActiveRightPanel('plan');
    }

    if (result.weather) {
      setWeatherData(result.weather);
      setActiveRightPanel('weather');
    }

    if (result.dayPlan) {
      setDayPlanData(result.dayPlan);
      setActiveRightPanel('map');
    }
  };

  const handleSend = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    if (!user) {
      localStorage.setItem('pending_chat_prompt', prompt);
      navigate('/login', { state: { from: location } });
      return;
    }

    // Always start chat/close sidebar on any query attempt
    if (!isChatStarted) setIsChatStarted(true);
    setIsSidebarOpen(false); // Auto-collapse on send (Mobile)
    setLimitMessage(null); // Clear any previous limit message

    const newUserMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: { text: prompt }
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Optimized Quota Check (Fast Path)
    let currentPlans = availablePlans;
    let currentSub = userSubscription;
    let currentCount = dailyQueryCount;

    // 1. Instant check if we HAVE data locally
    if (currentPlans.length > 0 && currentSub) {
      if (!checkQuota(currentPlans, currentSub, currentCount)) {
        setLimitMessage("You've reached your daily query limit for the " + (currentSub?.plan_name || 'free') + " plan.");
        return;
      }
    }

    // 2. Slow path/Verification if background loading or missing
    if (subscriptionLoading || currentPlans.length === 0 || !currentSub) {
      const refreshed = await refreshSubscription();
      if (refreshed) {
        currentPlans = refreshed.plans;
        currentSub = refreshed.subscription;
        currentCount = refreshed.count;

        // Final check after fresh data
        if (!checkQuota(currentPlans, currentSub, currentCount)) {
          setLimitMessage("You've reached your daily query limit for the " + (currentSub?.plan_name || 'free') + " plan.");
          return;
        }
      }
    }

    setIsLoading(true);
    setAgentThoughts([]);

    const activeSid = currentActiveSessionId || user.sessionId;

    try {
      await orchestrateResponse(prompt, user.id, activeSid, addAgentThought, handleResult, forcedTool, user.personalization);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: 'error-' + uuidv4(),
        role: 'model',
        content: { text: "Sorry, something went wrong. Please try again." }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setAgentThoughts([]);
      refreshSubscription();
    }
  }, [isLoading, user, isChatStarted, forcedTool, checkQuota, userSubscription, availablePlans, dailyQueryCount, refreshSubscription]);

  const handleSuggestionClick = (prompt: string) => {
    setChatInput(prompt);
    handleSend(prompt);
  };

  useEffect(() => {
    if (user && !isLoading && !subscriptionLoading) {
      const pendingPrompt = localStorage.getItem('pending_chat_prompt');
      if (pendingPrompt) {
        localStorage.removeItem('pending_chat_prompt');
        handleSend(pendingPrompt);
      }
    }
  }, [user, handleSend, isLoading, subscriptionLoading]);

  const closePlanView = () => {
    setActivePlanView(null);
    setActiveRightPanel(null);
  };

  const handleAction = (action: 'plan' | 'weather' | 'map' | 'flyer') => {
    if (action === 'flyer') {
      if (!user) {
        navigate('/login', { state: { from: location } });
        return;
      }
      setShowFlyerEditor(true);
      return;
    }
    if (action === 'weather') {
      if (!isFeatureEnabled('weather_report')) {
        const msg: Message = {
          id: 'limit-' + uuidv4(),
          role: 'model',
          content: {
            text: `The Weather Report feature is not available on your ${userSubscription?.plan_name || 'free'} plan. Please upgrade to access this feature.`,
            isLimit: true
          }
        };
        setMessages(prev => [...prev, msg]);
        return;
      }
      handleSend("What's the weather like?");
    }
    else if (action === 'map') {
      if (!isFeatureEnabled('day_trip_map')) {
        const msg: Message = {
          id: 'limit-' + uuidv4(),
          role: 'model',
          content: {
            text: `Personalized Day Trip Maps are not available on your ${userSubscription?.plan_name || 'free'} plan. Please upgrade to access this feature.`,
            isLimit: true
          }
        };
        setMessages(prev => [...prev, msg]);
        return;
      }
      handleSend("Plan a day trip for me.");
    }
    else setActiveRightPanel(action);
  };

  const handleSaveTrip = async () => {
    if (!activePlanView?.planData) return;
    const heroImageText = activePlanView.title.substring(0, 30);
    const result = await plansService.savePlan({
      title: activePlanView.title,
      planData: activePlanView.planData,
      heroImageText,
    });

    if (result.success && result.data) {
      // Assuming proposalsService usage logic exists (omitted for brevity as per original)
      const htmlContent = generateTripPlanHtml(activePlanView.planData);
      tripStorageService.saveTrip({ title: activePlanView.title, heroImageText, htmlContent: htmlContent });

      // Update activePlanView with the REAL database ID
      setActivePlanView({
        ...activePlanView,
        id: result.data.id
      });

      // SEED PROPOSALS IMMEDIATELY
      if (user) {
        console.log('🌱 Starting to seed proposals for plan:', result.data.id);
        const seedResult = await proposalsService.seedProposals(result.data.id, user.id, activePlanView.planData);
        if (seedResult.success) {
          console.log('✅ Proposals seeded successfully');
        } else {
          console.error('❌ Failed to seed proposals:', seedResult.error);
        }
      }

      navigate(`/user/trip/${result.data.id}`);
    } else {
      alert(`Failed to save trip: ${result.error}`);
    }
  };

  const loadSessions = useCallback(async () => {
    if (!user) return;
    const data = await getCustomerChatSessions(user.id);
    if (data) setSessions(data);
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSelectSession = async (sessionId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const messagesData = await getCustomerConversationMessages(user.id, sessionId);
      if (messagesData) {
        const mappedMessages: Message[] = messagesData.map(m => ({
          id: m.id,
          role: m.sender === 'user' ? 'user' : 'model',
          content: typeof m.content === 'string' ? { text: m.content } : (m.content as any)
        }));
        setMessages(mappedMessages);
        setIsChatStarted(true);
        setCurrentActiveSessionId(sessionId);
        localStorage.setItem('sessionId', sessionId); // Update for persistence across refresh
      }
    } finally {
      setIsLoading(false);
      setIsSidebarOpen(false); // Close on mobile selection
    }
  };

  const [currentActiveSessionId, setCurrentActiveSessionId] = useState<string | null>(null);

  // Sync current session ID with user's default on mount/login
  useEffect(() => {
    if (user?.sessionId) setCurrentActiveSessionId(user.sessionId);
  }, [user?.sessionId]);
  // Sync current session ID with user's default on mount/login
  useEffect(() => {
    if (user?.sessionId) setCurrentActiveSessionId(user.sessionId);

    // Auto-load messages if we have an active session ID stored in local state (navigation persistence)
    // But only if we are already in chat mode or if we specifically want to restore state?
    // For now, let's just allow the user to pick up where they left off if they click the history.
  }, [user?.sessionId]);

  // EFFECT: If we have a sessionId in localStorage but no messages, try to load them quietly?
  // Or just rely on user interaction.
  useEffect(() => {
    const restoreSession = async () => {
      const persistedSid = localStorage.getItem('sessionId');
      if (user && persistedSid && !currentActiveSessionId) {
        setCurrentActiveSessionId(persistedSid);
        // Optionally auto-open chat?
        // const msgs = await getConversationMessages(user.id, persistedSid);
        // if (msgs && msgs.length > 0) ...
      }
    };
    restoreSession();
  }, [user]);

  const handleNewChat = useCallback(async () => {
    if (!user) {
      console.warn("HandleNewChat: User not found");
      return;
    }

    console.log("HandleNewChat: Starting...");
    setIsLoading(true);
    try {
      const SESSION_TITLES = [
        "Adventure Awaits", "Dream Vacation", "City Explorer", "Beach Paradise",
        "Mountain Retreat", "Cultural Journey", "Foodie Tour", "Hidden Gems",
        "Road Trip", "Weekend Getaway", "Nature Escape", "Historic Wonders"
      ];
      const title = SESSION_TITLES[Math.floor(Math.random() * SESSION_TITLES.length)];
      const newId = uuidv4();
      console.log("HandleNewChat: Creating session", newId, title);
      const newSession = await createCustomerChatSession(user.id, title, newId);

      if (newSession) {
        console.log("HandleNewChat: Session created", newSession);
        setSessions(prev => [newSession, ...prev]);
        setCurrentActiveSessionId(newSession.id);
        setCurrentActiveSessionId(newSession.id);
        localStorage.setItem('sessionId', newSession.id);
        // Force refresh of the sidebar list
        loadSessions();
        setMessages([]);
        setAgentThoughts([]);
        setActiveRightPanel(null);
        setActivePlanView(null);
        setWeatherData(null);
        setDayPlanData(null);
        setChatInput('');
        // Ensure we are in chat mode
        setIsChatStarted(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);


  const handleDeleteSession = async (id: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete this chat?')) {
      await deleteCustomerChatSession(id);
      if (currentActiveSessionId === id) {
        handleNewChat();
      }
      loadSessions();
    }
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
    await updateCustomerChatSessionTitle(id, newTitle);
    loadSessions();
  };

  // Handle Smart Welcome completion
  const handleCompleteOnboarding = async (data: PersonalizationData) => {
    if (user) {
      console.log('💾 Saving personalization data...', data);
      const success = await saveUserPersonalization(user.id, data);
      if (success) {
        setSessionOnboardingGuarded(true); // Don't re-trigger modal automatically even if sync is slow
        await refreshSession();
        setShowSmartWelcome(false);
      } else {
        console.error('❌ Failed to save personalization');
        alert("We couldn't save your preferences. Please try again.");
      }
    }
  };




  const goToMyTrips = () => navigate('/user/my-trips');

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-teal-400 border-dashed rounded-full animate-spin"></div>
          <p className="mt-4 text-teal-400 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen ${bgClass} ${isChatStarted ? 'text-gray-800' : 'text-white'} transition-all duration-500 ease-in-out overflow-hidden`}>
      <div className={`flex flex-col h-full w-full transition-all duration-700 ${showSmartWelcome ? 'blur-xl scale-[0.98] brightness-50 pointer-events-none' : ''}`}>
        {/* Header */}
        <div
          className={`relative z-20 transition-all duration-700 ${isChatStarted || viewMode === 'recommendations' ? 'backdrop-blur-md shadow-sm border-b border-gray-100/50 text-gray-800' : 'text-white'}`}
          style={{ backgroundColor: (isChatStarted || viewMode === 'recommendations') ? 'rgb(255 255 255 / 0.9)' : 'transparent' }}
        >
          <Header
            onToggleSidebar={isChatStarted ? () => setIsSidebarOpen(!isSidebarOpen) : undefined}
            isChatActive={isChatStarted}
            onNavigateChat={() => setIsChatStarted(true)}
            onNavigateHome={() => setIsChatStarted(false)}
            showBackground={isChatStarted || viewMode === 'recommendations'}
            onEditPersonalization={() => setShowSmartWelcome(true)}
          />
        </div>

        {/* Sidebar Toggle for Mobile (Visible when logged in AND chat started) */}

        {/* Sidebar Toggle for Mobile (Visible when logged in) */}
        {/* Sidebar Toggle for Mobile (Removed, using Header toggle) */}

        {/* Dark overlay for chat bg */}
        <div className={`absolute inset-0 bg-black/40 pointer-events-none transition-opacity duration-500 ${isChatStarted ? 'opacity-0' : 'opacity-100'}`} />

        {/* Main Content Container with Transition */}
        <div className="flex-1 relative w-full h-full overflow-hidden">

          {/* 1. CHAT SECTION */}
          <div
            className={`
                        absolute inset-0 flex transition-transform duration-700 ease-in-out
                        ${viewMode === 'chat' ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
                    `}
          >
            {/* Sidebar (Desktop: visible when chat started, Mobile: toggled) */}

            {/* Sidebar (Desktop: visible when chat started, Mobile/Start: toggled) */}
            {user && (isChatStarted || isSidebarOpen) && (
              <div className={`transition-all duration-300 ease-in-out border-gray-200 overflow-hidden 
                ${isChatStarted
                  ? `absolute inset-y-0 left-0 z-40 lg:relative lg:border-r ${isSidebarCollapsed ? 'lg:w-0 lg:border-none' : 'lg:w-80'}`
                  : 'fixed inset-y-0 left-0 z-50 h-full shadow-2xl bg-white w-80'
                }
            `}>
                <CustomerChatSidebar
                  sessions={sessions}
                  currentSessionId={currentActiveSessionId}
                  onSelectSession={handleSelectSession}
                  onNewChat={handleNewChat}
                  onDeleteSession={handleDeleteSession}
                  onRenameSession={handleRenameSession}
                  isOpen={isSidebarOpen} // Controls mobile slide-in inside the component, but we are wrapping it.
                  onClose={() => setIsSidebarOpen(false)}
                />
              </div>
            )}

            {/* Desktop Toggle Button - Positioned relative to the flex container */}
            {user && isChatStarted && (
              <div className="hidden lg:flex flex-col justify-center relative z-30 -ml-3">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="bg-white border border-gray-200 p-1 rounded-full shadow-md text-gray-500 hover:text-teal-500 transition-transform hover:scale-110"
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>
            )}


            <div className="flex-1 flex overflow-hidden relative">
              <div className={`flex flex-col transition-all duration-500 ease-in-out ${activeRightPanel ? 'md:w-1/2' : 'w-full'} ${(isWeatherExpanded && activeRightPanel === 'weather') || (isMapExpanded && activeRightPanel === 'map') ? '!hidden' : ''}`}>
                <main ref={chatContainerRef} className={`flex-1 overflow-y-auto w-full px-4 scroll-smooth ${isChatStarted ? 'pt-20' : ''}`}>
                  {!isChatStarted ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg mb-2">Hey I'm TraivoAI,</h1>
                      <div className="h-20 flex items-center justify-center">
                        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-lg text-teal-300 animate-pulse">
                          <DynamicHeadline />
                        </h2>
                      </div>
                      <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8 font-medium drop-shadow-md">Tell me your style and budget, and I'll design a trip for you.</p>
                      <div className="w-full max-w-4xl mx-auto">
                        <ChatInput
                          onSend={handleSend}
                          isLoading={isLoading}
                          onAction={handleAction}
                          forcedTool={forcedTool}
                          onSetForcedTool={setForcedTool}
                          value={chatInput}
                          onChange={setChatInput}
                          limitMessage={limitMessage}
                        />



                        <SuggestionChips onChipClick={handleSuggestionClick} isDarkBackground={true} personalization={user?.personalization} />

                        <div className="mt-6 flex flex-wrap justify-center gap-4 mb-4">
                          <button
                            onClick={() => {
                              if (!user) {
                                navigate('/login', { state: { from: location } });
                                return;
                              }
                              setIsChatStarted(true);
                              setIsSidebarOpen(true);
                            }}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium transition-all border border-white/20 shadow-lg"
                          >
                            <MessageSquare className="w-5 h-5" /> Chat History
                          </button>
                          <button
                            onClick={() => {
                              if (!user) {
                                navigate('/login', { state: { from: location } });
                                return;
                              }
                              goToMyTrips();
                            }}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium transition-all border border-white/20 shadow-lg"
                          >
                            <Map className="w-5 h-5" /> View My Trips
                          </button>
                        </div>
                      </div>

                      {/* <div className="mt-8 flex flex-wrap justify-center gap-4">
                      {user && (
                        <button onClick={() => {
                          setIsChatStarted(true);
                          setIsSidebarOpen(true);
                        }} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium transition-all border border-white/20 shadow-lg">
                          <MessageSquare className="w-5 h-5" /> Chat History
                        </button>
                      )}
                      {user && (
                        <button onClick={goToMyTrips} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium transition-all border border-white/20 shadow-lg">
                          <Map className="w-5 h-5" /> View My Trips
                        </button>
                      )}
                    </div> */}

                      {/* SCROLL TRIGGER BUTTON */}
                      <button
                        onClick={() => setViewMode('recommendations')}
                        className="mt-8 flex flex-col items-center gap-2 text-white/80 hover:text-teal-300 transition-all animate-bounce"
                      >
                        <span className="text-sm font-bold uppercase tracking-widest shadow-black drop-shadow-md">Scroll for Recommendations</span>
                        <ChevronDown className="w-8 h-8 drop-shadow-md" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pb-4 max-w-4xl mx-auto">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare className="w-8 h-8 text-teal-600" />
                          </div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">Start a New Conversation</h2>
                          <p className="text-gray-500 mb-8 max-w-md">Ask me to plan a trip, find a hotel, or check the weather for your next destination.</p>
                          <SuggestionChips onChipClick={handleSuggestionClick} isDarkBackground={false} personalization={user?.personalization} />
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className="flex flex-col w-full">
                            <MessageBubble
                              message={msg}
                              onPlanClick={(plan) => {
                                if (activeRightPanel === 'plan' && activePlanView?.id === msg.id) {
                                  setActivePlanView(null);
                                  setActiveRightPanel(null);
                                } else {
                                  const htmlContent = generateTripPlanHtml(plan);
                                  const blob = new Blob([htmlContent], { type: 'text/html' });
                                  const url = URL.createObjectURL(blob);
                                  setActivePlanView({ url, title: plan.title, id: msg.id, planData: plan });
                                  setActiveRightPanel('plan');
                                }
                              }}
                              onWeatherClick={(data) => {
                                // Ensure data is valid before setting
                                if (!data) return;
                                setWeatherData(data);
                                setActiveRightPanel('weather');
                              }}
                              onMapClick={(dayPlan) => {
                                if (!dayPlan) return;
                                setDayPlanData(dayPlan);
                                setActiveRightPanel('map');
                              }}
                            />
                          </div>
                        ))
                      )}
                      {agentThoughts.map((thought, i) => <AgentThought key={i} text={thought} />)}
                      {isLoading && agentThoughts.length === 0 && (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                        </div>
                      )}
                    </div>
                  )}
                </main>
                {isChatStarted && (
                  <footer className="bg-transparent py-4 border-t border-white/10 flex-shrink-0">
                    <div className="max-w-4xl mx-auto px-4">
                      <ChatInput
                        onSend={handleSend}
                        isLoading={isLoading}
                        onAction={handleAction}
                        forcedTool={forcedTool}
                        onSetForcedTool={setForcedTool}
                        value={chatInput}
                        onChange={setChatInput}
                        limitMessage={limitMessage}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-white/60">TraivoAI can make mistakes.</p>
                        <div className="flex gap-4">
                          <button onClick={() => setViewMode('recommendations')} className="flex items-center gap-1 text-xs text-yellow-600 hover:text-yellow-700 transition-colors">
                            Scroll Down <ChevronDown className="w-3 h-3" />
                          </button>
                          {user && (
                            <button onClick={goToMyTrips} className="flex items-center gap-2 text-xs text-yellow-600 hover:text-yellow-700 transition-colors">
                              <Map className="w-4 h-4" /> My Trips
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </footer>
                )}
              </div>



              {/* Right Panels (Plan/Weather/Map) */}
              {activeRightPanel === 'plan' && activePlanView && (
                <div className="w-full md:w-1/2 bg-slate-50 relative border-l border-gray-200 animate-slideInRight h-full">
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button onClick={closePlanView} className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors"><X className="w-6 h-6 text-gray-700" /></button>
                    {user && (
                      <button onClick={goToMyTrips} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors" title="View All Trips">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                      </button>
                    )}
                    <button onClick={handleSaveTrip} className="bg-teal-500 hover:bg-teal-600 text-white rounded-full p-2 shadow-lg transition-colors" title="Save Trip">
                      <Heart className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="h-full w-full overflow-hidden bg-white">
                    <iframe src={activePlanView.url} className="w-full h-full border-none" title="Trip Plan" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" />
                  </div>
                </div>
              )}
              {activeRightPanel === 'weather' && weatherData && (
                <div className={`transition-all duration-500 bg-white border-l border-gray-200 shadow-2xl relative h-full ${isWeatherExpanded ? 'w-full fixed inset-0 z-50 animate-in zoom-in-95 duration-300' : 'w-full md:w-1/2 animate-slideInRight'}`}>
                  <WeatherPanel
                    data={weatherData}
                    onClose={() => setActiveRightPanel(null)}
                    isExpanded={isWeatherExpanded}
                    onToggleExpand={() => setIsWeatherExpanded(!isWeatherExpanded)}
                  />
                </div>
              )}
              {activeRightPanel === 'map' && dayPlanData && (
                <div className={`transition-all duration-500 bg-white border-l border-gray-200 shadow-2xl relative h-full ${isMapExpanded ? 'w-full fixed inset-0 z-50 animate-in zoom-in-95 duration-300' : 'w-full md:w-1/2 animate-slideInRight'}`}>
                  <MapPanel
                    dayPlan={dayPlanData}
                    onClose={() => setActiveRightPanel(null)}
                    isExpanded={isMapExpanded}
                    onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. RECOMMENDATIONS SECTION (Slides up from bottom) */}
          <div
            className={`
                        absolute inset-0 flex flex-col bg-gray-50 dark:bg-slate-900 transition-transform duration-700 ease-in-out z-30
                        ${viewMode === 'recommendations' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-100 pointer-events-none'}
                    `}
          >
            {/* Top Bar for Recommendations */}
            {/* <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-100 dark:border-gray-800 p-4 sticky top-0 z-40 flex items-center justify-between">
            <div className="flex items-center gap-4">

            </div>


            <div />

            <div className="flex gap-3">
              <button
                onClick={() => setShowLikedOnly(!showLikedOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${showLikedOnly ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
              >
                <Heart className={`w-5 h-5 ${showLikedOnly ? 'fill-pink-600' : ''}`} />
                <span className="text-sm font-medium">Saved ({savedCount})</span>
              </button>
              <button onClick={goToMyTrips} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 transition-colors text-gray-800 dark:text-white">
                <Map className="w-5 h-5" />
                <span className="text-sm font-medium">My Trips ({myTripsCount})</span>
              </button>
            </div>
          </div> */}

            <div
              className="flex-1 overflow-y-auto p-4 md:p-8"
              onWheel={(e) => {

                if (e.currentTarget.scrollTop === 0 && e.deltaY < 0) {
                  setViewMode('chat');
                }
              }}
            >
              <div className="max-w-7xl mx-auto">
                {/* Centered Page Header */}
                <div className="flex flex-col items-center justify-center mb-12 text-center">
                  {/* <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 hover:rotate-6 transition-transform">
                  <Search className="h-8 w-8 text-white" />
                </div> */}

                  <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight cursor-pointer hover:text-teal-600 transition-colors" onClick={() => setViewMode('chat')}>
                    {showLikedOnly ? (
                      <>Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Wishlist</span></>
                    ) : (
                      <span onClick={(e) => { e.stopPropagation(); navigate('/user/best-deals'); }}>
                        Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Trip Packages</span>
                      </span>
                    )}
                  </h1>
                  <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    {showLikedOnly ? "Packages you've saved for later." : "Explore hand-picked itineraries from our top travel agents."}
                  </p>
                </div>

                {isRecommendationsLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
                  </div>
                ) : displayedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedProducts.slice(0, 12).map(product => (
                      <div key={product.id} className="transform hover:-translate-y-1 transition-transform duration-300">
                        <ProductCard
                          product={product}
                          onClick={() => navigate(`/user/deals?id=${product.id}`)}
                          isLiked={!!localStorage.getItem(`like_${product.id}`)}
                          tripId={activePlanView?.id}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                    {showLikedOnly ? (
                      <>
                        <Heart className="w-12 h-12 mx-auto mb-4 opacity-50 text-pink-500" />
                        <p className="text-lg">You haven't saved any packages yet.</p>
                      </>
                    ) : (
                      <>
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No active packages found right now.</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Banner */}
              {!showLikedOnly && (
                <AffiliateBanner bannerType="horizontal-banner" className="max-w-7xl mx-auto px-4" />
              )}

              {/* AFFILIATE LISTINGS SECTION */}
              {!showLikedOnly && affiliateListings.length > 0 && (
                <div className="max-w-7xl mx-auto mt-24 mb-12">
                  <div className="flex flex-col items-center justify-center mb-12 text-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                      Partner <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Adventures</span>
                    </h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                      Explore top-rated activities and tours from our partners.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {affiliateListings.slice(0, 4).map(listing => (
                      <AffiliateCard
                        key={listing.id}
                        listing={listing}
                      />
                    ))}
                  </div>


                </div>
              )}

            </div>
          </div>
        </div >

        {/* Modal for Full Product Preview */}
        {
          selectedProduct && (
            <CustomerProductPreview
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              tripId={activePlanView?.id}
            />
          )
        }

        {/* Flyer Editor Overlay */}
        {showFlyerEditor && (
          <TravelFlyerEditor onBack={() => setShowFlyerEditor(false)} />
        )}

      </div>

      {/* Smart Welcome Modal */}
      {showSmartWelcome && user && (
        <SmartWelcome
          userName={(user as any).user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Traveler'}
          onComplete={handleCompleteOnboarding}
          onSkip={() => !personalization ? null : setShowSmartWelcome(false)}
          isEditing={!!personalization}
        />
      )}

      <style>{`
                .animate-slideInRight { animation: slideInRight 0.5s ease-out; }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @media (max-width: 768px) { .animate-slideInRight { animation: slideInUp 0.5s ease-out; } } 
                @keyframes slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
    </div >
  );
};

export default WanderChatPage;