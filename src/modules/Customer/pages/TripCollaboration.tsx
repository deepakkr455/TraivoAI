// pages/TripCollaboration.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Check,
  X,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowLeft,
  Eye,
  RefreshCw,
  Layout, // Add generic layout icon for card
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doubtsService, DoubtMessage } from '../services/doubtsService';
import { proposalsService, Proposal } from '../services/proposalsService';
import { votesService, Vote } from '../services/proposalsService';
import { plansService, TripWithAccess } from '../services/plansService';
import { generateTripPlanHtml } from '../services/htmlGenerator';
import { TripPlanData } from '../../../types';


interface TripMember {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  status: 'accepted' | 'pending' | 'declined';
}

interface ItineraryItem extends Proposal {
  details: {
    day: number;
    title: string;
    time: string;
    description: string;
    location: string;
    cost: number;
    day_title: string;
  };
  votes?: Vote[];
}

interface Accommodation extends Proposal {
  details: {
    location: string;
    pricePerNight: number;
    nights: number;
  };
  votes?: Vote[];
}

interface DateOption extends Proposal {
  details: {
    startDate: string;
    endDate: string;
  };
  votes?: Vote[];
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

interface TripCollaborationProps {
  tripTitle: string;
  tripId: string;
  trip: TripWithAccess;
  currentUserId: string;
  isAdmin: boolean;
  members: TripMember[];
  onConfirmAndProceed: (updatedData?: TripPlanData) => void;
  onBack: () => void;
  isProcessing?: boolean;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Simple Modal Component
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 bg-gray-50 text-gray-400 hover:text-teal-600 rounded-full transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Plan Preview Card Component
interface PlanPreviewCardProps {
  title: string;
  imageText: string;
  createdAt: string;
  onClick: () => void;
  mode: 'original' | 'latest';
  imageUrl?: string;
}

const PlanPreviewCard: React.FC<PlanPreviewCardProps> = ({ title, imageText, createdAt, onClick, mode, imageUrl }) => {
  const displayImageUrl = imageUrl || `https://placehold.co/800x400/0d9488/ffffff?text=${encodeURIComponent(imageText)}`;
  const displayDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 hover:border-teal-200 transition-all cursor-pointer group shadow-sm hover:shadow-xl duration-500"
    >
      <div className="relative">
        <img
          src={displayImageUrl}
          alt={title}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-teal-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
          {mode === 'latest' ? '✨ Latest Update' : '📜 Original Plan'}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
          <Calendar className="w-3.5 h-3.5 text-teal-500/50" />
          Plan Created {displayDate}
        </div>
        <h4 className="text-lg font-black text-gray-900 leading-tight group-hover:text-teal-600 transition-colors">
          {title}
        </h4>
        <div className="mt-4 flex items-center gap-2 text-teal-600 text-[10px] font-black uppercase tracking-widest bg-teal-50/50 w-fit px-3 py-1.5 rounded-full">
          <span>Click to View Full Details</span>
          <ArrowLeft className="w-3 h-3 rotate-180" />
        </div>
      </div>
    </div>
  );
};

export const TripCollaboration: React.FC<TripCollaborationProps> = ({
  tripTitle,
  tripId,
  trip,
  currentUserId,
  isAdmin,
  members,
  onConfirmAndProceed,
  onBack,
  isProcessing,
}) => {
  const navigate = useNavigate();

  const formatDateLabel = (dateStr: string, options: Intl.DateTimeFormatOptions) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    let date: Date;
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      date = new Date(dateStr);
      // Fix for missing year defaulting to 2001
      if (date.getFullYear() === 2001) {
        date.setFullYear(new Date().getFullYear());
      }
    }
    return date.toLocaleDateString('en-US', options);
  };

  // Redirect if trip is at expense or concluded stages
  useEffect(() => {
    if (trip.status === 'expense') {
      alert('Expenses stage active! Redirecting...');
      navigate(`/user/trip/${tripId}/expenses`);
    } else if (trip.status === 'concluded') {
      alert('Trip Concluded! Redirecting to Summary...');
      navigate(`/user/trip/${tripId}/summary`);
    }
  }, [trip.status, navigate, tripId]);



  // States for proposals (now fetched from DB)
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // UI states
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddAccommodation, setShowAddAccommodation] = useState(false);
  const [showAddDate, setShowAddDate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'original' | 'latest'>('latest'); // Preview mode state
  const [showChat, setShowChat] = useState(false); // Collapsible chat state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Handle body scroll locking when chat is open on mobile
  useEffect(() => {
    if (showChat && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showChat]);

  // Form states for adding proposals
  const [dateForm, setDateForm] = useState({ startDate: '', endDate: '' });
  const [accommodationForm, setAccommodationForm] = useState({ title: '', location: '', pricePerNight: '', nights: '' });
  const [itineraryForm, setItineraryForm] = useState({ title: '', day: '', time: '', description: '', location: '', cost: '', day_title: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<() => void>(() => { });

  // Use refs for items to avoid dependency loops in realtime effects
  const itemsRef = useRef({
    itineraryItems,
    accommodations,
    dateOptions
  });

  useEffect(() => {
    itemsRef.current = {
      itineraryItems,
      accommodations,
      dateOptions
    };
  }, [itineraryItems, accommodations, dateOptions]);

  // Load proposals with votes
  const loadProposalsWithVotes = async (planId: string, category: string): Promise<any[]> => {
    const result = await proposalsService.getProposals(planId, category);
    if (!result.success || !result.data) return [];

    const proposals = result.data;
    const proposalsWithVotes: any[] = await Promise.all(
      proposals.map(async (p) => {
        const votesResult = await votesService.getVotesForProposal(p.id);
        // Normalize day_title for itinerary proposals to ensure it's in details (handles legacy/AI data with top-level day_title)
        let normalizedP = { ...p };
        if (category === 'itinerary') {
          normalizedP = {
            ...p,
            details: {
              ...p.details,
              day_title: p.details.day_title || (p as any).day_title || `Day ${p.details.day || 1}`
            }
          };
        }
        return { ...normalizedP, votes: votesResult.data || [] };
      })
    );

    return proposalsWithVotes;
  };

  // Seed proposals from initial plan data
  const seedProposals = async () => {
    console.log('🌱 Seeding initial proposals from plan data...');
    if (!trip.planData || !tripId || !trip.ownerId) return;

    await proposalsService.seedProposals(tripId, trip.ownerId, trip.planData);

    console.log('✅ Seeding complete. Reloading...');
    // Reload after seeding
    await loadAllProposals(false); // Pass false to prevent infinite loop
  };

  // Load proposals on mount
  const loadAllProposals = async (allowSeed = true) => {
    const dateProposals = await loadProposalsWithVotes(tripId, 'date');
    const accProposals = await loadProposalsWithVotes(tripId, 'accommodation');
    const itProposals = await loadProposalsWithVotes(tripId, 'itinerary');

    // Check if we need to seed (only if ALL are empty and we are admin/owner)
    if (allowSeed && isAdmin && dateProposals.length === 0 && accProposals.length === 0 && itProposals.length === 0) {
      await seedProposals();
      return;
    }

    setDateOptions(dateProposals as DateOption[]);
    setAccommodations(accProposals as Accommodation[]);
    setItineraryItems(itProposals as ItineraryItem[]);
  };

  useEffect(() => {
    loadAllProposals();
  }, [tripId]);

  // Load initial messages
  const loadMessages = async () => {
    const result = await doubtsService.getPlanMessages(tripId);
    if (result.success && result.data) {
      const formattedMessages: Message[] = result.data.map((msg: DoubtMessage) => ({
        id: msg.id,
        userId: msg.user_id,
        userName: msg.user_name || 'Unknown',
        message: msg.text,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(formattedMessages);
    } else {
      console.error('Failed to load messages:', result.error);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [tripId]);

  // Set up real-time subscription for proposals and votes
  useEffect(() => {
    if (!tripId) return;

    const unsubscribeProposals = proposalsService.subscribeToProposals(tripId, (payload) => {
      console.log('Real-time proposal update:', payload);
      const { eventType, new: newProposal, old: oldProposal } = payload;

      const refreshSpecific = (p: any) => {
        // Parse details if it's a string (though proposalsService might handle it, real-time payload is raw)
        const parsed = { ...p, details: typeof p.details === 'string' ? JSON.parse(p.details) : p.details };
        if (p.category === 'itinerary') {
          parsed.details = {
            ...parsed.details,
            day_title: parsed.details.day_title || p.day_title || `Day ${parsed.details.day || 1}`
          };
        }
        return parsed;
      };

      if (eventType === 'INSERT') {
        const p = refreshSpecific(newProposal);
        const addFn = (prev: any[]) => {
          if (prev.some(item => item.id === p.id)) return prev;
          return [...prev, { ...p, votes: [] }];
        };
        if (p.category === 'date') setDateOptions(addFn);
        else if (p.category === 'accommodation') setAccommodations(addFn);
        else if (p.category === 'itinerary') setItineraryItems(addFn);
      } else if (eventType === 'UPDATE') {
        const p = refreshSpecific(newProposal);
        const updateFn = (prev: any[]) => prev.map(item => item.id === p.id ? { ...item, ...p } : item);
        if (p.category === 'date') setDateOptions(updateFn);
        else if (p.category === 'accommodation') setAccommodations(updateFn);
        else if (p.category === 'itinerary') setItineraryItems(updateFn);
      } else if (eventType === 'DELETE') {
        const id = oldProposal.id;
        setDateOptions(prev => prev.filter(item => item.id !== id));
        setAccommodations(prev => prev.filter(item => item.id !== id));
        setItineraryItems(prev => prev.filter(item => item.id !== id));
      }
    });

    const unsubscribeVotes = votesService.subscribeToVotes(async (payload) => {
      console.log('Real-time vote update:', payload);
      const { eventType, new: newVote, old: oldVote } = payload;
      const proposalId = eventType === 'DELETE' ? oldVote.proposal_id : newVote.proposal_id;

      // Check if this proposal belongs to our current trip using the ref to avoid dependency loop
      const allProposals = [
        ...itemsRef.current.itineraryItems,
        ...itemsRef.current.accommodations,
        ...itemsRef.current.dateOptions
      ];
      const belongsToTrip = allProposals.some(p => p.id === proposalId);

      if (belongsToTrip) {
        const votesResult = await votesService.getVotesForProposal(proposalId);
        if (votesResult.success) {
          const newVotes = votesResult.data || [];
          setDateOptions(prev => updateVotesLocal(prev, proposalId, newVotes));
          setAccommodations(prev => updateVotesLocal(prev, proposalId, newVotes));
          setItineraryItems(prev => updateVotesLocal(prev, proposalId, newVotes));
        }
      }
    });

    return () => {
      unsubscribeProposals();
      unsubscribeVotes();
    };
  }, [tripId]); // Only tripId as dependency

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = doubtsService.subscribeToMessages(tripId, (payload) => {
      const { eventType, new: newMessageData, old: oldMessageData } = payload;

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        setMessages((prev) => {
          const newMsg: Message = {
            id: newMessageData.id,
            userId: newMessageData.user_id,
            userName: newMessageData.user_name || 'Unknown',
            message: newMessageData.text,
            timestamp: new Date(newMessageData.created_at),
          };

          // If UPDATE, replace existing
          if (eventType === 'UPDATE') {
            return prev.map(m => m.id === newMsg.id ? newMsg : m);
          }

          // INSERT: Prevent duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;

          // Replace optimistic message if exists
          const now = new Date();
          const optimisticIndex = prev.findIndex(m =>
            m.id.startsWith('temp-') &&
            m.userId === newMsg.userId &&
            m.message === newMsg.message &&
            (now.getTime() - m.timestamp.getTime()) < 5000
          );

          if (optimisticIndex !== -1) {
            const next = [...prev];
            next[optimisticIndex] = newMsg;
            return next;
          }

          return [...prev, newMsg];
        });
      } else if (eventType === 'DELETE') {
        const id = oldMessageData.id;
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [tripId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVote = async (
    proposalId: string,
    voteType: 'up' | 'down',
    category: 'itinerary' | 'accommodation' | 'date',
    setItems: React.Dispatch<React.SetStateAction<any[]>>,
    updateLocal: (items: any[], id: string, votes: Vote[]) => any[]
  ) => {
    const result = await votesService.vote(proposalId, currentUserId, voteType);
    if (!result.success) {
      alert('Failed to vote. Please try again.');
      return;
    }

    const votesResult = await votesService.getVotesForProposal(proposalId);
    if (votesResult.success) {
      const newVotes = votesResult.data || [];
      setItems((prev) => updateLocal(prev, proposalId, newVotes));
    }
  };

  const updateVotesLocal = <T extends { id: string; votes?: Vote[] }>(items: T[], id: string, newVotes: Vote[]): T[] => {
    return items.map((item) => {
      if (item.id === id) {
        return { ...item, votes: newVotes };
      }
      return item;
    });
  };

  const handleItineraryVote = (id: string, type: 'up' | 'down') =>
    handleVote(id, type, 'itinerary', setItineraryItems, updateVotesLocal);
  const handleAccommodationVote = (id: string, type: 'up' | 'down') =>
    handleVote(id, type, 'accommodation', setAccommodations, updateVotesLocal);
  const handleDateVote = (id: string, type: 'up' | 'down') =>
    handleVote(id, type, 'date', setDateOptions, updateVotesLocal);

  const getVoteCount = (votes: Vote[]) => {
    const upvotes = votes.filter((v) => v.type === 'up').length;
    const downvotes = votes.filter((v) => v.type === 'down').length;
    return { upvotes, downvotes, total: upvotes - downvotes };
  };

  const getUserVote = (votes: Vote[]): 'up' | 'down' | null => {
    const vote = votes.find((v) => v.user_id === currentUserId);
    return vote ? vote.type : null;
  };

  // Handle adding proposals
  const handleAddDate = async () => {
    if (!dateForm.startDate || !dateForm.endDate) return alert('Please fill all fields');
    const data = {
      title: `${dateForm.startDate} - ${dateForm.endDate}`,
      details: { startDate: dateForm.startDate, endDate: dateForm.endDate }
    };
    await handleAddProposal('date', data);
    setDateForm({ startDate: '', endDate: '' });
    setShowAddDate(false);
  };

  const handleAddAccommodation = async () => {
    if (!accommodationForm.title || !accommodationForm.location || !accommodationForm.pricePerNight || !accommodationForm.nights)
      return alert('Please fill all fields');
    const data = {
      title: accommodationForm.title,
      details: {
        location: accommodationForm.location,
        pricePerNight: parseFloat(accommodationForm.pricePerNight),
        nights: parseInt(accommodationForm.nights)
      }
    };
    await handleAddProposal('accommodation', data);
    setAccommodationForm({ title: '', location: '', pricePerNight: '', nights: '' });
    setShowAddAccommodation(false);
  };

  const handleAddItinerary = async () => {
    if (!itineraryForm.title || !itineraryForm.day || !itineraryForm.time || !itineraryForm.description || !itineraryForm.location || !itineraryForm.cost)
      return alert('Please fill all fields');
    const data = {
      title: itineraryForm.title,
      details: {
        day: parseInt(itineraryForm.day),
        time: itineraryForm.time,
        description: itineraryForm.description,
        location: itineraryForm.location,
        cost: parseFloat(itineraryForm.cost),
        day_title: itineraryForm.day_title || `Day ${itineraryForm.day}`
      }
    };
    await handleAddProposal('itinerary', data);
    setItineraryForm({ title: '', day: '', time: '', description: '', location: '', cost: '', day_title: '' });
    setShowAddActivity(false);
  };

  const handleAddProposal = async (category: 'itinerary' | 'accommodation' | 'date', data: any) => {
    if (!isAdmin) return;
    const userName = members.find((m) => m.id === currentUserId)?.name || 'Admin';
    const result = await proposalsService.addProposal(tripId, currentUserId, userName, category, data.title, data.details || data);
    if (result.success) {
      const proposals = await loadProposalsWithVotes(tripId, category);
      if (category === 'date') setDateOptions(proposals as DateOption[]);
      else if (category === 'accommodation') setAccommodations(proposals as Accommodation[]);
      else if (category === 'itinerary') setItineraryItems(proposals as ItineraryItem[]);
    } else {
      alert('Failed to add proposal. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    const userName = members.find((m) => m.id === currentUserId)?.name || 'You';
    setIsSending(true);

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      userId: currentUserId,
      userName,
      message: newMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    try {
      const result = await doubtsService.sendMessage(tripId, currentUserId, userName, optimisticMsg.message);
      if (!result.success) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        console.error('Failed to send message:', result.error);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      console.error('Exception sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.message);
  };

  const handleUpdateMessage = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    const result = await doubtsService.updateMessage(editingMessageId, editingText);
    if (result.success) {
      setEditingMessageId(null);
      setEditingText('');
    } else {
      alert(`Failed to update message: ${result.error}`);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    const result = await doubtsService.deleteMessage(messageId);
    if (!result.success) {
      alert(`Failed to delete message: ${result.error}`);
    }
  };

  // Generate updated trip data from proposals
  const generateUpdatedTripData = (): TripPlanData => {
    // Get highest voted date
    const selectedDate = dateOptions.reduce((prev, current) =>
      getVoteCount(current.votes || []).total > getVoteCount(prev.votes || []).total ? current : prev
      , dateOptions[0]);

    // Get accommodations with positive votes
    const selectedAccommodations = accommodations.filter(acc =>
      getVoteCount(acc.votes || []).total > 0
    );

    // Get itinerary items with positive votes
    const selectedItinerary = itineraryItems.filter(item =>
      getVoteCount(item.votes || []).total > 0
    );

    // Group itinerary by day
    const groupedItinerary: { [key: number]: any[] } = {};
    selectedItinerary.forEach(item => {
      console.log("itemitemitem:", item)
      if (!groupedItinerary[item.details.day]) {
        groupedItinerary[item.details.day] = [];
      }
      groupedItinerary[item.details.day].push({
        time: item.details.time,
        day_title: item.details.day_title,
        activity: item.title,
        description: item.details.description,
        icon: 'MapPin'
      });
    });

    const dailyItinerary = Object.keys(groupedItinerary).map(day => ({
      day: parseInt(day),
      title: groupedItinerary[parseInt(day)][0].day_title || `Day ${day}`,
      items: groupedItinerary[parseInt(day)]
    }));

    // Reconstruct TripPlanData
    return {
      ...trip.planData,
      dates: selectedDate ? `${selectedDate.details.startDate} - ${selectedDate.details.endDate}` : trip.planData.dates,
      bookings: [
        ...selectedAccommodations.map(acc => ({
          id: acc.id,
          customer_name: 'System',
          product_title: acc.title,
          date: new Date().toISOString(),
          type: 'Hotel' as const,
          title: acc.title,
          details: `${acc.details.location} - $${acc.details.pricePerNight}/night for ${acc.details.nights} nights`,
          bookingSite: 'Various',
          bookingUrl: '#',
          alternatives: [],
          imageUrl: 'https://placehold.co/400x400/34d399/ffffff?text=Hotel'
        } as any)),
        ...trip.planData.bookings.filter(b => b.type === 'Transport')
      ],
      dailyItinerary: dailyItinerary.length > 0 ? dailyItinerary : trip.planData.dailyItinerary
    };
  };

  // Update plan with voted proposals
  const handleUpdatePlan = async () => {
    setIsUpdating(true);
    try {
      const updatedPlanData = generateUpdatedTripData();

      // Update plan in database
      const result = await plansService.updatePlanData(tripId, updatedPlanData);

      if (!result.success) {
        alert(`Failed to update plan: ${result.error}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan. Please try again.');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const groupByDay = (items: ItineraryItem[]) => {
    const grouped: { [key: number]: ItineraryItem[] } = {};
    items.forEach((item) => {
      if (!grouped[item.details.day]) {
        grouped[item.details.day] = [];
      }
      grouped[item.details.day].push(item);
    });
    return grouped;
  };

  const getDayTitle = (dayItems: ItineraryItem[]) => {
    // Take the day_title from the first item, or fallback
    return dayItems[0]?.details.day_title || `Day ${dayItems[0]?.details.day}`;
  };

  const groupedItinerary = groupByDay(itineraryItems);
  const days = Object.keys(groupedItinerary).map(Number).sort((a, b) => a - b);

  const calculateTotalBudget = () => {
    const itineraryCost = itineraryItems.reduce((sum, item) => sum + (parseFloat(item.details.cost?.toString() || '0') || 0), 0);
    const accommodationCost = accommodations.reduce(
      (sum, acc) => sum + ((parseFloat(acc.details.pricePerNight?.toString() || '0') || 0) * (parseInt(acc.details.nights?.toString() || '0') || 0)),
      0
    );
    const total = itineraryCost + accommodationCost;
    return isNaN(total) ? 0 : total;
  };

  const getDisplayTotalBudget = () => {
    // Always show the original budget from trip data
    if (trip.planData.budget?.total) return trip.planData.budget.total;
    const calculated = calculateTotalBudget();
    if (calculated > 0) return `$${calculated}`;
    return 'Estimating...';
  };

  const getDisplayPerPersonBudget = () => {
    // Always show the original per-person budget from trip data
    if (trip.planData.budget?.perPerson) return trip.planData.budget.perPerson;
    const calculated = calculateTotalBudget();
    const acceptedMembers = members.filter((m) => m.status === 'accepted').length || 1;
    if (calculated > 0) return `$${(calculated / acceptedMembers).toFixed(0)}`;
    return 'Pending';
  };

  const allRequiredVotesReceived = () => {
    const totalMembers = members.filter((m) => m.status === 'accepted').length;
    if (totalMembers === 0) return false;
    const requiredVotes = Math.ceil(totalMembers / 2);

    const itineraryApproved = itineraryItems.every(
      (item) => getVoteCount(item.votes || []).upvotes >= requiredVotes
    );
    const accommodationApproved = accommodations.every(
      (item) => getVoteCount(item.votes || []).upvotes >= requiredVotes
    );
    const dateApproved = dateOptions.some(
      (item) => getVoteCount(item.votes || []).upvotes >= requiredVotes
    );

    return itineraryApproved && accommodationApproved && dateApproved;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Fix for missing year defaulting to 2001
    if (date.getFullYear() === 2001) {
      date.setFullYear(new Date().getFullYear());
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Separate AI and admin proposals
  const getProposalsBySource = <T extends Proposal>(proposals: T[]) => {
    const ai = proposals.filter(p => p.user_name === 'AI Assistant');
    const admin = proposals.filter(p => p.user_name !== 'AI Assistant');
    return { ai, admin, all: proposals };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      {/* Header removed as per user request */}

      <main className="flex-1 overflow-y-auto w-full pb-24">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Centered Editorial Title with Back Button */}
          <div className="max-w-7xl mx-auto mb-10 md:mb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-center gap-6 relative">
              <button
                onClick={onBack}
                className="md:absolute left-0 p-3 bg-white text-gray-400 hover:text-teal-600 rounded-full border border-gray-100 transition-all active:scale-95 shadow-sm group flex items-center gap-2 px-4 md:px-3 mb-4 md:mb-0 w-fit self-start md:self-auto"
                title="Back to Collections"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Back</span>
              </button>

              <div className="text-center w-full px-2">
                <h1 className="text-2xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight leading-tight">
                  {tripTitle} <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Collaborative Hub</span>
                </h1>
                <p className="text-xs md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                  Sync, vote, and refine your itinerary with your travel crew in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Split Control Row: KPIs & Actions */}
          <div className="max-w-7xl mx-auto mb-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 md:gap-6 bg-white p-4 lg:p-2 rounded-[2rem] border border-gray-100 shadow-sm transition-all duration-300" >
            {/* Budget & Member Stats (Left) */}
            <div className="w-full lg:w-auto px-2 md:px-4 order-2 lg:order-1" >
              <div className="grid grid-cols-3 lg:flex items-center justify-items-center lg:justify-start gap-2 md:gap-10 py-1 sm:py-0 w-full">
                <div className="flex flex-col items-center sm:items-start group text-center sm:text-left">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider md:tracking-[0.2em] text-gray-400 group-hover:text-teal-500 transition-colors whitespace-nowrap">Total Budget</span>
                  <span className="text-sm md:text-xl font-black text-gray-900">
                    {getDisplayTotalBudget()}
                  </span>
                </div>
                <div className="hidden sm:block h-6 w-px bg-gray-100" />
                <div className="flex flex-col items-center sm:items-start group text-center sm:text-left">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider md:tracking-[0.2em] text-gray-400 group-hover:text-teal-500 transition-colors whitespace-nowrap">Per Person</span>
                  <span className="text-sm md:text-xl font-black text-gray-900">
                    {getDisplayPerPersonBudget()}
                  </span>
                </div>
                <div className="hidden sm:block h-6 w-px bg-gray-100" />
                <div className="flex flex-col items-center sm:items-start group text-center sm:text-left">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-wider md:tracking-[0.2em] text-gray-400 group-hover:text-teal-500 transition-colors">Crew</span>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-teal-500" />
                    <span className="text-sm md:text-xl font-black text-gray-900">{members.filter((m) => m.status === 'accepted').length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions (Right) */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center lg:justify-end order-1 lg:order-2" >
              {
                isAdmin && trip.status === 'collaboration' && (
                  <button
                    onClick={() => onConfirmAndProceed(generateUpdatedTripData())}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/10 active:scale-95 whitespace-nowrap text-sm"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {isProcessing ? 'Confirming...' : 'Confirm & Proceed'}
                  </button>
                )
              }
            </div>
          </div>





          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-8 space-y-8">
                {/* Voting Status Notice */}
                {!allRequiredVotesReceived() && (
                  <div className="bg-yellow-50/50 border border-yellow-200/50 text-yellow-800 px-6 py-4 rounded-[1.5rem] flex items-center gap-4 animate-in slide-in-from-left-4 duration-500">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest leading-none mb-1">Voting in Progress</p>
                      <p className="text-xs font-medium text-yellow-700/80">
                        Waiting for all members to vote on the proposed options.
                      </p>
                    </div>
                  </div>
                )}
                {/* Budget Summary */}
                {/* <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/90 font-medium">Estimated Total Budget</p>
                      <p className="text-3xl font-bold mt-1 text-white">${calculateTotalBudget()}</p>
                      <p className="text-sm text-white/80 mt-1">
                        ${(calculateTotalBudget() / members.filter((m) => m.status === 'accepted').length).toFixed(0)} per person
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-white/20" />
                  </div>
                </div> */}

                {/* Dates Section */}
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 px-8 py-6 border-b border-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                          Travel <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Dates</span>
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{dateOptions.length} Options Proposed</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setShowAddDate(true)}
                          className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 border border-purple-100"
                        >
                          <Plus className="w-4 h-4" />
                          Suggest Date
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-8 space-y-4">
                    {dateOptions.map((dateOption) => {
                      const votes = dateOption.votes || [];
                      const { upvotes, downvotes } = getVoteCount(votes);
                      const userVote = getUserVote(votes);
                      const isAI = dateOption.user_name === 'AI Assistant';

                      return (
                        <div
                          key={dateOption.id}
                          className={`relative rounded-[1.5rem] p-6 border transition-all duration-300 ${isAI
                            ? 'bg-blue-50/30 border-blue-100/50 hover:bg-blue-50/50'
                            : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-teal-100'
                            } group`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <p className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
                                  {formatDateLabel(dateOption.details.startDate, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}{' '}
                                  -{' '}
                                  {formatDateLabel(dateOption.details.endDate, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${isAI
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-200 text-gray-700'
                                  }`}>
                                  {isAI ? '🤖 TraivoAI' : '👤 ' + dateOption.user_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Duration: {Math.ceil((new Date(dateOption.details.endDate).getTime() - new Date(dateOption.details.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                <div className="flex items-center gap-2 text-sm font-black">
                                  <span className="text-teal-600">{upvotes}</span>
                                  <span className="text-gray-200">|</span>
                                  <span className="text-pink-600">{downvotes}</span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">Total Votes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* <button
                                  onClick={() => setShowChat(true)}
                                  className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-teal-600 border border-gray-100 hover:border-teal-200 active:scale-95 transition-all"
                                  title="Chat about this option"
                                >
                                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                                </button> */}
                                <button
                                  onClick={() => handleDateVote(dateOption.id, 'up')}
                                  className={`p-3 rounded-2xl transition-all duration-300 ${userVote === 'up'
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 active:scale-95'
                                    : 'bg-white text-gray-400 hover:text-teal-600 border border-gray-100 hover:border-teal-200 active:scale-95 hover:shadow-sm'
                                    }`}
                                >
                                  <ThumbsUp className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                                <button
                                  onClick={() => handleDateVote(dateOption.id, 'down')}
                                  className={`p-3 rounded-2xl transition-all duration-300 ${userVote === 'down'
                                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20 active:scale-95'
                                    : 'bg-white text-gray-400 hover:text-pink-600 border border-gray-100 hover:border-pink-200 active:scale-95 hover:shadow-sm'
                                    }`}
                                >
                                  <ThumbsDown className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Accommodation Section */}
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="bg-gradient-to-r from-blue-50/50 to-teal-50/50 px-8 py-6 border-b border-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                          <MapPin className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                          Accommodation <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">Options</span>
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{accommodations.length} Places Proposed</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setShowAddAccommodation(true)}
                          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 border border-blue-100"
                        >
                          <Plus className="w-4 h-4" />
                          Suggest Hotel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-8 space-y-4">
                    {accommodations.map((acc) => {
                      const votes = acc.votes || [];
                      const { upvotes, downvotes } = getVoteCount(votes);
                      const userVote = getUserVote(votes);
                      const isAI = acc.user_name === 'AI Assistant';

                      return (
                        <div
                          key={acc.id}
                          className={`relative rounded-[1.5rem] p-6 border transition-all duration-300 ${isAI
                            ? 'bg-blue-50/30 border-blue-100/50 hover:bg-blue-50/50'
                            : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-teal-100'
                            } group`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{acc.title}</h3>
                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${isAI
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-200 text-gray-700'
                                  }`}>
                                  {isAI ? '🤖 TraivoAI' : '👤 ' + acc.user_name}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 font-medium flex items-center gap-2 mb-4">
                                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                {acc.details.location}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-2 mt-4">
                                  <div className="bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 flex items-center gap-1.5">
                                    <span className="text-teal-600 font-bold">
                                      ${(() => {
                                        if (acc.details.pricePerNight > 0) return acc.details.pricePerNight;
                                        // Fallback to plan data
                                        const original = trip.planData.bookings?.find(b => b.title === acc.title);
                                        if (original) {
                                          const priceNum = (original as any).priceNum;
                                          if (priceNum > 0) return priceNum;
                                          const match = (original.price || original.details).match(/\$?\s*([\d,]+(?:[\.,]\d+)?)/);
                                          if (match) return parseFloat(match[1].replace(/,/g, ''));
                                        }
                                        return 0;
                                      })()}
                                    </span>
                                    <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">/ Night</span>
                                  </div>
                                  <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                                    <span className="text-gray-600 font-bold">{acc.details.nights}</span>
                                    <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Nights</span>
                                  </div>
                                  <div className="bg-teal-500/5 px-3 py-1.5 rounded-lg border border-teal-500/10 flex items-center gap-1.5 ml-auto">
                                    <span className="text-gray-400 text-xs uppercase tracking-wider font-bold italic">Total:</span>
                                    <span className="text-teal-700 font-extrabold">
                                      ${(() => {
                                        const price = (() => {
                                          if (acc.details.pricePerNight > 0) return acc.details.pricePerNight;
                                          const original = trip.planData.bookings?.find(b => b.title === acc.title);
                                          if (original) {
                                            const priceNum = (original as any).priceNum;
                                            if (priceNum > 0) return priceNum;
                                            const match = (original.price || original.details).match(/\$?\s*([\d,]+(?:[\.,]\d+)?)/);
                                            if (match) return parseFloat(match[1].replace(/,/g, ''));
                                          }
                                          return 0;
                                        })();
                                        return price * acc.details.nights;
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                <div className="flex items-center gap-2 text-sm font-black">
                                  <span className="text-teal-600">{upvotes}</span>
                                  <span className="text-gray-200">|</span>
                                  <span className="text-pink-600">{downvotes}</span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">Total Votes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* <button
                                  onClick={() => setShowChat(true)}
                                  className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-teal-600 border border-gray-100 hover:border-teal-200 active:scale-95 transition-all"
                                  title="Chat about this hotel"
                                >
                                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                                </button> */}
                                <button
                                  onClick={() => handleAccommodationVote(acc.id, 'up')}
                                  className={`p-3 rounded-2xl transition-all duration-300 ${userVote === 'up'
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 active:scale-95'
                                    : 'bg-white text-gray-400 hover:text-teal-600 border border-gray-100 hover:border-teal-200 active:scale-95 hover:shadow-sm'
                                    }`}
                                >
                                  <ThumbsUp className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                                <button
                                  onClick={() => handleAccommodationVote(acc.id, 'down')}
                                  className={`p-3 rounded-2xl transition-all duration-300 ${userVote === 'down'
                                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20 active:scale-95'
                                    : 'bg-white text-gray-400 hover:text-pink-600 border border-gray-100 hover:border-pink-200 active:scale-95 hover:shadow-sm'
                                    }`}
                                >
                                  <ThumbsDown className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Itinerary Section */}
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="bg-gradient-to-r from-teal-50/50 to-green-50/50 px-8 py-6 border-b border-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                          <Clock className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
                          Daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-green-600">Itinerary</span>
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{itineraryItems.length} Activities Planned</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setShowAddActivity(true)}
                          className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 border border-teal-100"
                        >
                          <Plus className="w-4 h-4" />
                          Add Activity
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-8 space-y-4">
                    {days.map((day) => {
                      const dayItems = groupedItinerary[day];
                      const dayTitle = getDayTitle(dayItems);
                      return (
                        <div key={day} className="border border-gray-100 rounded-[1.5rem] overflow-hidden group/day transition-all duration-300">
                          <button
                            onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                            className={`w-full px-6 py-4 flex items-center justify-between transition-all duration-300 ${expandedDay === day ? 'bg-teal-50/50' : 'bg-gray-50/50 hover:bg-white'}`}
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-black uppercase tracking-widest text-teal-600 mb-1">Day {day}</span>
                              <span className="text-lg font-black text-gray-900">{dayTitle}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {dayItems.length} Events
                              </span>
                              <div className={`p-2 rounded-xl transition-all duration-300 ${expandedDay === day ? 'bg-teal-100 text-teal-600 rotate-180' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </button>

                          {expandedDay === day && (
                            <div className="p-6 space-y-4 bg-white">
                              {dayItems.map((item) => {
                                const votes = item.votes || [];
                                const { upvotes, downvotes } = getVoteCount(votes);
                                const userVote = getUserVote(votes);
                                const isAI = item.user_name === 'AI Assistant';

                                return (
                                  <div
                                    key={item.id}
                                    className={`relative rounded-[1.25rem] p-5 border transition-all duration-300 ${isAI
                                      ? 'bg-blue-50/30 border-blue-100/50'
                                      : 'bg-gray-50/50 border-gray-100 hover:border-teal-100'
                                      } group/item`}
                                  >
                                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-gray-100 text-[10px] font-black uppercase tracking-widest text-teal-600 shadow-sm">
                                            <Clock className="w-3 h-3" />
                                            {item.details.time}
                                          </div>
                                          <h3 className="text-base font-black text-gray-900 tracking-tight">{item.title}</h3>
                                          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${isAI
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-200 text-gray-700'
                                            }`}>
                                            {isAI ? '🤖 TraivoAI' : '👤 ' + item.user_name}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium mb-4 leading-relaxed">
                                          {item.details.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                          <div className="flex items-center gap-2 text-gray-400">
                                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                            {item.details.location}
                                          </div>
                                          <div className="bg-teal-50 px-2 py-1 rounded-md border border-teal-100 flex items-center gap-1">
                                            <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">
                                              Est. Cost: ${(() => {
                                                if (item.details.cost > 0) return item.details.cost;
                                                // Fallback to plan data
                                                for (const day of trip.planData.dailyItinerary || []) {
                                                  const original = day.items?.find(i => i.activity === item.title);
                                                  if (original) {
                                                    if ((original as any).cost > 0) return (original as any).cost;
                                                    const match = original.description?.match(/(?:Cost|Price|Est\.|Total)[:\s]*\$?\s*([\d,]+(?:[\.,]\d+)?)/i) ||
                                                      original.description?.match(/\$([\d,]+(?:[\.,]\d+)?)/);
                                                    if (match) return parseFloat(match[1].replace(/,/g, ''));
                                                  }
                                                }
                                                return 0;
                                              })()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                        <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                          <div className="flex items-center gap-2 text-sm font-black">
                                            <span className="text-teal-600">{upvotes}</span>
                                            <span className="text-gray-200">|</span>
                                            <span className="text-pink-600">{downvotes}</span>
                                          </div>
                                          <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">Total Votes</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {/* <button
                                            onClick={() => setShowChat(true)}
                                            className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-teal-600 border border-gray-100 hover:border-teal-200 active:scale-95 transition-all"
                                            title="Chat about this activity"
                                          >
                                            <MessageCircle className="w-4 h-4" />
                                          </button> */}
                                          <button
                                            onClick={() => handleItineraryVote(item.id, 'up')}
                                            className={`p-2.5 rounded-xl transition-all duration-300 ${userVote === 'up'
                                              ? 'bg-teal-500 text-white shadow-lg active:scale-95'
                                              : 'bg-white text-gray-400 border border-gray-100 hover:text-teal-600 active:scale-95'
                                              }`}
                                          >
                                            <ThumbsUp className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleItineraryVote(item.id, 'down')}
                                            className={`p-2.5 rounded-xl transition-all duration-300 ${userVote === 'down'
                                              ? 'bg-pink-500 text-white shadow-lg active:scale-95'
                                              : 'bg-white text-gray-400 border border-gray-100 hover:text-pink-600 active:scale-95'
                                              }`}
                                          >
                                            <ThumbsDown className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:col-span-4 space-y-8">

                {/* Plan Preview Section */}
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Layout className="w-4 h-4 text-teal-600" />
                        Plan Preview
                      </h3>
                      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                        <button
                          onClick={() => setPreviewMode('original')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${previewMode === 'original'
                            ? 'bg-white text-teal-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          Original
                        </button>
                        <button
                          onClick={() => setPreviewMode('latest')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${previewMode === 'latest'
                            ? 'bg-white text-teal-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          Updated
                        </button>
                      </div>
                    </div>

                    <div className="transition-all duration-500 ease-in-out hover:scale-[1.02]">
                      <PlanPreviewCard
                        title={previewMode === 'original' ? trip.title : (trip.updatedPlanData?.title || generateUpdatedTripData().title || trip.title)}
                        imageText={
                          (previewMode === 'original' ? trip.title : (trip.updatedPlanData?.title || generateUpdatedTripData().title || trip.title)).substring(0, 30)
                        }
                        imageUrl={trip.planData.heroImageUrl}
                        createdAt={trip.createdAt}
                        mode={previewMode}
                        onClick={async () => {
                          if (previewMode === 'original') {
                            navigate(`/user/trip/${tripId}?version=original`);
                          } else {
                            const success = await handleUpdatePlan();
                            if (success) {
                              navigate(`/user/trip/${tripId}?version=updated`);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Chat Overlay */}
            {showChat && (
              <div className="fixed inset-0 md:inset-auto md:bottom-10 md:right-8 md:w-[400px] z-[200] animate-in slide-in-from-bottom-8 duration-500 ease-out">
                <div className="bg-white md:rounded-[2rem] border border-gray-200/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col h-full md:h-[650px] md:max-h-[calc(100vh-120px)] backdrop-blur-xl bg-white/95">
                  <div className="bg-gradient-to-r from-pink-50/50 to-purple-50/50 px-6 md:px-8 py-5 md:py-6 border-b border-gray-50/50 relative">
                    <div className="flex items-center gap-3">
                      <div className="bg-pink-100 p-2 rounded-xl">
                        <MessageCircle className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900 leading-tight">
                          Crew <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">Chat</span>
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live Crew Chat</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowChat(false)}
                      className="absolute top-1/2 -translate-y-1/2 right-6 p-2.5 bg-white md:bg-white/50 hover:bg-white text-gray-400 hover:text-pink-600 rounded-xl transition-all border border-gray-100 shadow-sm active:scale-95"
                      title="Close Chat"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/30">
                    {messages.map((msg, index) => {
                      const isCurrentUser = msg.userId === currentUserId;
                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const isSameUser = prevMsg && prevMsg.userId === msg.userId;
                      const isRecent = prevMsg && (msg.timestamp.getTime() - prevMsg.timestamp.getTime() < 300000);
                      const shouldGroup = isSameUser && isRecent;

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${shouldGroup ? 'mt-1' : 'mt-4'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                          {!isCurrentUser && !shouldGroup && (
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-black text-teal-700 mr-2 self-end mb-1">
                              {msg.userName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          {!isCurrentUser && shouldGroup && <div className="w-8 mr-2" />}

                          <div
                            className={`max-w-[85%] md:max-w-[75%] group relative ${isCurrentUser
                              ? 'bg-teal-600 text-white rounded-[1.25rem] rounded-tr-none'
                              : 'bg-white text-gray-900 border border-gray-100 rounded-[1.25rem] rounded-tl-none'
                              } p-3.5 shadow-sm hover:shadow-md transition-shadow`}
                          >
                            {!isCurrentUser && !shouldGroup && (
                              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-teal-600">
                                {msg.userName}
                              </p>
                            )}

                            {editingMessageId === msg.id ? (
                              <div className="space-y-2 min-w-[200px]">
                                <textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-2 text-sm focus:outline-none focus:border-white/40 placeholder-white/50"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleUpdateMessage}
                                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white text-teal-600 rounded shadow-sm hover:bg-teal-50 transition-colors"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                                <div className={`flex items-center justify-between gap-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isCurrentUser ? 'text-teal-100/70' : 'text-gray-400'}`}>
                                  <span className="text-[8px] font-bold">
                                    {msg.timestamp.toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {isCurrentUser && (
                                      <button
                                        onClick={() => handleEditMessage(msg)}
                                        className="hover:text-white transition-colors"
                                        title="Edit message"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    )}
                                    {(isCurrentUser || isAdmin) && (
                                      <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="hover:text-white transition-colors"
                                        title="Delete message"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 md:p-6 border-t border-gray-100 bg-white shadow-inner pb-6 md:pb-6 safe-area-bottom">
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100 focus-within:border-teal-500 focus-within:bg-white transition-all shadow-sm">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        disabled={isSending}
                        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 px-3 py-2 focus:outline-none disabled:opacity-50"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white p-3 rounded-xl transition-all shadow-lg shadow-teal-600/10 active:scale-95 disabled:cursor-not-allowed"
                      >
                        {isSending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div >

        {/* Modals for Adding Proposals */}
        {
          isAdmin && (
            <>
              {/* Date Modal */}
              <Modal isOpen={showAddDate} onClose={() => setShowAddDate(false)} title="Suggest Travel Dates">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      value={dateForm.startDate}
                      onChange={(e) => setDateForm({ ...dateForm, startDate: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      value={dateForm.endDate}
                      onChange={(e) => setDateForm({ ...dateForm, endDate: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleAddDate}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Suggest Dates
                  </button>
                </div>
              </Modal>

              {/* Accommodation Modal */}
              <Modal isOpen={showAddAccommodation} onClose={() => setShowAddAccommodation(false)} title="Suggest Accommodation">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="accTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Name
                    </label>
                    <input
                      id="accTitle"
                      type="text"
                      value={accommodationForm.title}
                      onChange={(e) => setAccommodationForm({ ...accommodationForm, title: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="accLocation" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      id="accLocation"
                      type="text"
                      value={accommodationForm.location}
                      onChange={(e) => setAccommodationForm({ ...accommodationForm, location: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="pricePerNight" className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Night ($)
                    </label>
                    <input
                      id="pricePerNight"
                      type="number"
                      value={accommodationForm.pricePerNight}
                      onChange={(e) => setAccommodationForm({ ...accommodationForm, pricePerNight: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="nights" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Nights
                    </label>
                    <input
                      id="nights"
                      type="number"
                      value={accommodationForm.nights}
                      onChange={(e) => setAccommodationForm({ ...accommodationForm, nights: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleAddAccommodation}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Suggest Hotel
                  </button>
                </div>
              </Modal>

              {/* Itinerary Modal */}
              <Modal isOpen={showAddActivity} onClose={() => setShowAddActivity(false)} title="Add Activity">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="itTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Title
                    </label>
                    <input
                      id="itTitle"
                      type="text"
                      value={itineraryForm.title}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, title: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">
                      Day
                    </label>
                    <input
                      id="day"
                      type="number"
                      value={itineraryForm.day}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, day: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                      Time (e.g., 09:00)
                    </label>
                    <input
                      id="time"
                      type="time"
                      value={itineraryForm.time}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, time: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={itineraryForm.description}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, description: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label htmlFor="itLocation" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      id="itLocation"
                      type="text"
                      value={itineraryForm.location}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, location: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                      Cost ($)
                    </label>
                    <input
                      id="cost"
                      type="number"
                      value={itineraryForm.cost}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, cost: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="day_title" className="block text-sm font-medium text-gray-700 mb-1">
                      Day Title (e.g., Arrival in Tokyo)
                    </label>
                    <input
                      type="text"
                      id="day_title"
                      value={itineraryForm.day_title}
                      onChange={(e) => setItineraryForm({ ...itineraryForm, day_title: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Optional day theme/title"
                    />
                  </div>
                  <button
                    onClick={handleAddItinerary}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Add Activity
                  </button>
                </div>
              </Modal>
            </>
          )
        }

        {/* Floating Chat Trigger */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`fixed bottom-8 right-8 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-teal-500 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 z-[150] hover:scale-110 active:scale-95 group ${showChat ? 'rotate-180 scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        >
          <div className="relative">
            <MessageCircle className="w-7 h-7 fill-white/10" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <span className="absolute right-[110%] bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
            Crew Chat
          </span>
        </button>

        {/* Loading Overlay for Updates */}
        {
          isUpdating && (
            <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center transition-all duration-300">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
              <p className="text-teal-900 font-bold uppercase tracking-[0.2em] text-[10px]">Updating Itinerary...</p>
            </div>
          )
        }
      </main >
    </div >
  );
};
