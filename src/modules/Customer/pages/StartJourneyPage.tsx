// pages/StartJourneyPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { StartJourney } from './StartJourney';
import { Modal } from '../../../components/Modal';

import { plansService, JourneyData } from '../services/plansService';
import { planMembersService } from '../services/planMembersService';

const StartJourneyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Get trip data from navigation state or params
  const tripData = location.state as {
    tripTitle?: string;
    tripId?: string;
    plannedStartDate?: string;
    totalMembers?: number;
  } | null;

  const tripId = id || tripData?.tripId;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fetchedData, setFetchedData] = useState({
    title: tripData?.tripTitle || '',
    plannedStartDate: tripData?.plannedStartDate || '',
    totalMembers: tripData?.totalMembers || 0
  });

  const [showModal, setShowModal] = useState(false);
  const [journeyDataToSave, setJourneyDataToSave] = useState<JourneyData | null>(null);

  useEffect(() => {
    const loadTripDetails = async () => {
      if (!tripId) {
        // If we don't have a tripId, we can't fetch. 
        // If it's a direct visit without state, this might be valid if we updated routes, 
        // but for now we'll just stop loading.
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [planResult, membersResult, proposalsResult] = await Promise.all([
          plansService.getPlan(tripId),
          planMembersService.getPlanMembers(tripId),
          import('../services/proposalsService').then(m => m.proposalsService.getProposals(tripId, 'date'))
        ]);

        if (planResult.success && planResult.data) {
          const plan = planResult.data;

          let startDate = '';
          // Try to get the start date from date proposals first
          if (proposalsResult.success && proposalsResult.data && proposalsResult.data.length > 0) {
            // Filter only date proposals and sort by created_at (as a proxy for selection if votes aren't joined)
            // or just take the most recent one which might be the one user just added.
            // Ideally we'd join votes, but let's at least handle the range better.
            const dateProposals = proposalsResult.data.filter(p => p.category === 'date');

            if (dateProposals.length > 0) {
              // Sort by created_at descending to get the latest proposal
              const latestProposal = [...dateProposals].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0];

              if (latestProposal.details && latestProposal.details.startDate) {
                startDate = latestProposal.details.startDate;
                console.log('📅 Loaded start date from proposals:', startDate);
              }
            }
          }

          // Fallback: Try to extract from plan data dates string or departureDate field
          if (!startDate) {
            const finalPlanData = plan.updatedPlanData || plan.planData;

            if (finalPlanData.departureDate) {
              startDate = finalPlanData.departureDate;
            } else if (finalPlanData.dates) {
              // Use ' - ' to avoid splitting YYYY-MM-DD
              const parts = finalPlanData.dates.split(' - ');
              if (parts.length > 0) {
                startDate = parts[0].trim();
              }
            }
          }

          setFetchedData(prev => ({
            ...prev,
            title: plan.title,
            plannedStartDate: startDate || prev.plannedStartDate,
          }));
        }

        if (membersResult.success && membersResult.data) {
          // Count members (assuming all retrieved members are valid/joined)
          const acceptedMembers = membersResult.data.length;
          setFetchedData(prev => ({
            ...prev,
            totalMembers: acceptedMembers
          }));
        }

      } catch (err) {
        console.error("Failed to load dynamic journey data", err);
        setError("Could not load trip details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTripDetails();
  }, [tripId]);


  const handleSubmit = async (journeyData: JourneyData) => {
    setJourneyDataToSave(journeyData);
    setShowModal(true);
  };

  const handleTrackExpenses = async (trackExpenses: boolean) => {
    if (!journeyDataToSave || !tripId) return;

    try {
      // 1. Save Journey Data
      const saveResult = await plansService.saveJourneyData(tripId, journeyDataToSave);
      if (!saveResult.success) {
        alert(`Failed to save journey data: ${saveResult.error}`);
        return;
      }

      // 2. Save track_expenses choice
      const trackExpensesResult = await plansService.setTrackExpenses(tripId, trackExpenses);
      if (!trackExpensesResult.success) {
        alert(`Failed to save expense tracking preference: ${trackExpensesResult.error}`);
        return;
      }

      // 3. Update Plan Status
      const newStatus = trackExpenses ? 'expense' : 'concluded';
      const statusResult = await plansService.updatePlanStatus(tripId, newStatus);

      if (!statusResult.success) {
        alert(`Failed to update status: ${statusResult.error}`);
        return;
      }

      // 4. Redirect
      if (trackExpenses) {
        navigate(`/user/trip/${tripId}/expenses`, { state: { tripId, tripTitle: fetchedData.title } });
      } else {
        navigate(`/user/trip/${tripId}/summary`, { state: { tripId, tripTitle: fetchedData.title } });
      }

    } catch (error) {
      console.error('Error starting journey:', error);
      alert('Failed to start journey. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!tripId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-4">No trip ID was provided for this journey.</p>
          <button onClick={() => navigate('/my-trips')} className="bg-teal-600 text-white px-4 py-2 rounded-lg">
            Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <>
      <StartJourney
        tripTitle={fetchedData.title}
        plannedStartDate={fetchedData.plannedStartDate}
        totalMembers={fetchedData.totalMembers}
        onSubmit={handleSubmit}
        onBack={handleBack}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Track Expenses?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Do you want to enable expense tracking for this trip?
            Selecting "Yes" will take you to the expense dashboard.
            Selecting "No" will conclude the trip setup.
          </p>
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => handleTrackExpenses(true)}
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
            >
              Yes, Track Expenses
            </button>
            <button
              onClick={() => handleTrackExpenses(false)}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              No, Conclude Setup
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default StartJourneyPage;