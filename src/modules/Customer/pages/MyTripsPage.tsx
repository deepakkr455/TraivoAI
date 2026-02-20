import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { plansService, TripWithAccess } from '../services/plansService';
import {
  ArrowLeft,
  Trash2,
  Calendar,
  RefreshCw,
  AlertCircle,
  Search,
  Globe,
  Compass,
  MapPin,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Plane,
  X,
  Plus,
  ShieldCheck,
  User,
  History,
  Users
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../../../hooks/useAuth';

interface MyTripsProps {
  onBack?: () => void;
}

export const MyTripsPage: React.FC<MyTripsProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripWithAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isNavigatingRef = React.useRef(false);

  useEffect(() => {
    loadTrips();
    return () => {
      isNavigatingRef.current = false;
    };
  }, []);

  const loadTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await plansService.getAllPlans();
      if (result.success && result.data) {
        setTrips(result.data);
      } else {
        setError('Could not load trips from server.');
      }
    } catch (err) {
      console.error('Error loading trips:', err);
      setError('Could not load trips from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTripClick = (tripId: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    navigate(`/user/trip/${tripId}`);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  };

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      const result = await plansService.deletePlan(tripId);
      if (result.success) {
        await loadTrips();
      } else {
        alert(`Failed to delete trip: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting trip:', err);
      alert('Failed to delete trip. Please try again.');
    }
  };

  const filteredTrips = trips.filter(trip =>
    trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.heroImageText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const upcomingTrips = filteredTrips.filter(t => t.status !== 'completed' && t.status !== 'concluded');
  const completedTrips = filteredTrips.filter(t => t.status === 'completed' || t.status === 'concluded');

  // Hero Trip: The most recent upcoming one
  const heroTrip = upcomingTrips[0];
  const gridUpcoming = upcomingTrips.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      <Header showBackground={true} />

      <main className="flex-1 overflow-y-auto w-full pb-24">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Centered Editorial Title */}
          <div className="flex flex-col items-center justify-center mb-10 md:mb-16 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
              My Travel <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Collection</span>
            </h1>
            <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Your personal library of adventures, planned getaways, and past voyages.
            </p>
          </div>

          {/* Split Control Row: Search Left, KPIs Right */}
          <div className="max-w-7xl mx-auto mb-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 md:gap-6 bg-white p-4 lg:p-2 rounded-[2rem] border border-gray-100 shadow-sm transition-all duration-300">
            {/* Search Box (Left) */}
            <div className="w-full lg:max-w-xl relative group order-1">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 md:pl-14 pr-12 py-3 md:py-3.5 bg-gray-50/50 border-none rounded-[1.5rem] leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:bg-white text-sm md:text-base transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              )}
            </div>

            {/* KPIs & Actions (Right) */}
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 lg:gap-8 order-2 lg:order-2 px-2 md:px-4 w-full lg:w-auto">
              {trips.length > 0 && (
                <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-10 py-1 sm:py-0 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <SmallStat label="Total" value={trips.length} />
                  <div className="h-6 w-px bg-gray-100 shrink-0" />
                  <SmallStat label="Upcoming" value={upcomingTrips.length} />
                  <div className="h-6 w-px bg-gray-100 shrink-0" />
                  <SmallStat label="Done" value={completedTrips.length} />
                </div>
              )}

              <div className="flex items-center gap-3 w-full sm:w-auto justify-center lg:justify-end shrink-0">
                <button
                  onClick={() => navigate('/user/wanderchat')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/10 active:scale-95 whitespace-nowrap text-xs md:text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Trip
                </button>
                <button
                  onClick={loadTrips}
                  className="p-3 bg-gray-50 text-gray-400 hover:text-teal-600 rounded-full border border-gray-100 transition-all active:rotate-180 flex items-center justify-center shrink-0"
                  title="Refresh Collection"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="max-w-[1440px] mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Syncing stories...</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm max-w-3xl mx-auto">
                <div className="bg-teal-50 rounded-full p-8 mb-6">
                  <MapPin className="w-16 h-16 text-teal-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black mb-3 text-gray-900">No adventures yet</h2>
                <p className="text-gray-500 max-w-md mb-8 text-base md:text-lg">
                  Your future stories are waiting to be written. Start planning your first getaway today!
                </p>
                <button
                  onClick={() => navigate('/user/wanderchat')}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-full font-black text-lg transition-all shadow-xl hover:shadow-teal-500/20 transform hover:-translate-y-1"
                >
                  Plan Your First Trip
                </button>
              </div>
            ) : (
              <div className="space-y-12 md:space-y-20">
                {/* Active Adventure Hero */}
                {heroTrip && !searchTerm && (
                  <div className="space-y-5 md:space-y-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-teal-600">Active Adventure</h2>
                      <div className="h-px flex-1 bg-teal-100" />
                    </div>
                    <div
                      onClick={() => handleTripClick(heroTrip.id)}
                      className="group relative w-full aspect-[4/5] sm:aspect-[21/9] lg:aspect-[3/1] rounded-[2rem] md:rounded-[3rem] overflow-hidden cursor-pointer shadow-xl transition-all duration-700 border border-gray-100"
                    >
                      <img
                        src={heroTrip.planData?.heroImageUrl || `https://placehold.co/1200x500/0d9488/ffffff?text=${encodeURIComponent(heroTrip.heroImageText)}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                        alt={heroTrip.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/10 to-transparent" />

                      <div className="absolute top-4 md:top-8 left-4 md:left-8">
                        <div className="bg-white/20 backdrop-blur-md text-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/20">
                          Upcoming Voyage
                        </div>
                      </div>

                      <div className="absolute bottom-6 md:bottom-12 left-6 md:left-12 right-6 md:right-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-3xl">
                          <div className="flex items-center gap-2 text-teal-400 mb-2 md:mb-4">
                            <Calendar className="w-3.5 h-3.5 md:w-5 md:h-5" />
                            <span className="font-bold uppercase tracking-widest text-[10px] md:text-xs">{new Date(heroTrip.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                          </div>
                          <h3 className="text-3xl md:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">{heroTrip.title}</h3>
                        </div>
                        <button className="w-full sm:w-auto bg-white text-teal-600 px-8 py-4 rounded-2xl font-black text-sm md:text-base flex items-center justify-center gap-3 hover:bg-teal-50 transition-all shadow-xl active:scale-95 group/btn">
                          Explore Itinerary
                          <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Voyages Grid */}
                {(gridUpcoming.length > 0 || (searchTerm && upcomingTrips.length > 0)) && (
                  <div className="space-y-8 md:space-y-12">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-gray-400">Upcoming Voyages</h2>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
                      {(searchTerm ? upcomingTrips : gridUpcoming).map(trip => (
                        <TripExplorerCard key={trip.id} trip={trip} onClick={() => handleTripClick(trip.id)} onDelete={(e) => handleDeleteTrip(e, trip.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Voyages Section */}
                {completedTrips.length > 0 && (
                  <div className="space-y-8 md:space-y-12 opacity-80 hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-gray-300">Past Voyages</h2>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
                      {completedTrips.map(trip => (
                        <TripExplorerCard key={trip.id} trip={trip} isCompleted onClick={() => handleTripClick(trip.id)} onDelete={(e) => handleDeleteTrip(e, trip.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const SmallStat = ({ label, value }: { label: string, value: number }) => (
  <div className="flex flex-col items-center">
    <span className="text-xl md:text-2xl font-black text-teal-900 leading-none">{value}</span>
    <span className="text-[9px] md:text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">{label}</span>
  </div>
);

const TripExplorerCard = ({ trip, isCompleted, onClick, onDelete }: { trip: TripWithAccess, isCompleted?: boolean, onClick: () => void, onDelete: (e: React.MouseEvent) => void }) => (
  <div
    onClick={onClick}
    className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 hover:border-teal-500/20 hover:shadow-[0_20px_40px_-15px_rgba(13,148,136,0.1)] transition-all duration-500 cursor-pointer flex flex-col h-full hover:scale-[1.02] shadow-sm relative"
  >
    {/* Compact Image Section */}
    <div className="relative aspect-[16/10] overflow-hidden">
      <img
        src={trip.planData?.heroImageUrl || `https://placehold.co/600x400/0d9488/ffffff?text=${encodeURIComponent(trip.heroImageText)}`}
        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${isCompleted ? 'grayscale-[0.5] contrast-[0.9]' : ''}`}
        alt={trip.title}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Ownership Badge - Icon Only */}
      <div className="absolute top-4 left-4">
        {trip.isOwner ? (
          <div
            className="w-8 h-8 flex items-center justify-center bg-teal-600/90 text-white backdrop-blur-md rounded-full shadow-lg border border-white/20 transition-all hover:bg-teal-500"
            title="Architect (Owner)"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        ) : (
          <div
            className="w-8 h-8 flex items-center justify-center bg-blue-600/90 text-white backdrop-blur-md rounded-full shadow-lg border border-white/20"
            title="Guest (Member)"
          >
            <Users className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Subtle Action: Delete (Owner Only) */}
      {trip.isOwner && (
        <button
          onClick={onDelete}
          className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-red-500 text-white backdrop-blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {isCompleted && (
        <div className="absolute top-4 right-4 flex items-center justify-center">
          <History className="w-5 h-5 text-white drop-shadow-lg opacity-80" />
        </div>
      )}
    </div>

    {/* Compact Content Section */}
    <div className="p-6 md:p-8 flex flex-col flex-1">
      <div className="flex items-center gap-1.5 mb-3">
        <Calendar className="w-3.5 h-3.5 text-teal-600" />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {new Date(trip.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
        </span>
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 group-hover:text-teal-600 transition-colors line-clamp-2 leading-tight">
        {trip.title}
      </h3>

      {/* Minimal Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-6">
        <div className="flex items-center gap-2 text-teal-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
          Explore
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </div>

        <a
          href={`#/user/blog/${trip.id}`}
          onClick={(e) => e.stopPropagation()}
          className="p-2.5 bg-gray-50 text-gray-400 hover:bg-teal-600 hover:text-white rounded-xl transition-all border border-gray-100 hover:border-teal-500 shadow-sm"
          title="View Story"
        >
          <Sparkles className="w-4 h-4" />
        </a>
      </div>
    </div>
  </div>
);

export default MyTripsPage;
