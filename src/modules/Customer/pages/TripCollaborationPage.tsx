// pages/TripCollaborationPage.tsx (No changes needed, but ensure services are imported)
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';

import { TripCollaboration } from './TripCollaboration';
import { plansService, TripWithAccess } from '../services/plansService';
import { planMembersService, PlanMember } from '../services/planMembersService';
import { TripPlanData } from '../../../types';

interface TripMember {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  status: 'accepted' | 'pending' | 'declined';
}

interface TripData {
  tripTitle: string;
  tripId: string;
  trip: TripWithAccess;
  members: TripMember[];
}

const TripCollaborationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: tripId } = useParams<{ id: string }>();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        navigate('/login');
      }
    };
    getUser();
  }, [navigate]);

  useEffect(() => {
    if (!tripId || !currentUserId) return;

    const loadTripData = async () => {
      try {
        const planResult = await plansService.getPlan(tripId);
        if (!planResult.success || !planResult.data) {
          throw new Error('Trip not found');
        }

        const membersResult = await planMembersService.getPlanMembers(tripId);
        if (!membersResult.success || !membersResult.data) {
          throw new Error('Failed to load members');
        }

        const mappedMembers: TripMember[] = membersResult.data.map((member: PlanMember) => ({
          id: member.user_id,
          name: member.user_name || 'Unknown User',
          avatar: '',
          isAdmin: member.user_id === currentUserId,
          status: 'accepted' as const,
        }));

        setTripData({
          tripTitle: planResult.data.title || 'Trip Plan',
          tripId,
          trip: planResult.data,
          members: mappedMembers,
        });

        setIsAdmin(planResult.data.isOwner);

      } catch (err) {
        console.error('Error loading trip data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trip data');
        navigate('/my-trips');
      } finally {
        setLoading(false);
      }
    };

    loadTripData();
  }, [tripId, currentUserId, navigate]);

  // Real-time subscription for plan updates
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`plan_updates_${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'plans',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          const newStatus = payload.new.status;
          if (newStatus && tripData) {
            setTripData((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                trip: {
                  ...prev.trip,
                  status: newStatus,
                },
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, tripData]);

  const handleConfirmAndProceed = async (updatedData?: TripPlanData) => {
    if (!tripId) return;
    console.log('Trip confirmed! Proceeding to journey setup...');

    // Set status to journey-started before navigating
    setIsProcessing(true);
    try {
      // 1. If we have updated data from votes, save it first
      if (updatedData) {
        console.log('Saving finalized plan data before starting journey...');
        await plansService.updatePlanData(tripId, updatedData);
      }

      // 2. Update status
      const result = await plansService.updatePlanStatus(tripId, 'journey-started');

      if (!result.success) {
        alert(`Failed to start journey: ${result.error}`);
        return;
      }

      // 3. Determine the start date to pass in state
      let plannedStartDate = '';
      if (updatedData?.departureDate) {
        plannedStartDate = updatedData.departureDate;
      } else if (updatedData?.dates) {
        const parts = updatedData.dates.split(' - ');
        if (parts.length > 0) {
          plannedStartDate = parts[0].trim();
        }
      }

      // Final check for incomplete dates (e.g. "Feb 10" -> 2001)
      if (plannedStartDate) {
        const testDate = new Date(plannedStartDate);
        if (testDate.getFullYear() === 2001) {
          testDate.setFullYear(new Date().getFullYear());
          plannedStartDate = testDate.toDateString(); // Or keep format if needed, but this ensures year is present
        }
      }

      navigate(`/user/trip/${tripId}/journey`, {
        state: {
          tripId,
          tripTitle: tripData?.tripTitle,
          plannedStartDate: plannedStartDate || tripData?.trip?.planData?.dates?.split(' - ')[0]?.trim()
        }
      });
    } catch (err) {
      console.error('Error starting journey:', err);
      alert('Failed to start journey. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    navigate(`/user/trip/${tripId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Syncing trip details...</p>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900">
        <div className="text-white text-xl">{error || 'Trip not found'}</div>
      </div>
    );
  }

  return (
    <TripCollaboration
      tripTitle={tripData.tripTitle}
      tripId={tripData.tripId}
      trip={tripData.trip}
      currentUserId={currentUserId!}
      isAdmin={isAdmin}
      members={tripData.members}
      onConfirmAndProceed={handleConfirmAndProceed}
      onBack={handleBack}
      isProcessing={isProcessing}
    />
  );
};

export default TripCollaborationPage;