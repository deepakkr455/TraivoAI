// pages/ExpenseTrackingPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ExpenseTracking } from './ExpenseTracking';
import { plansService } from '../services/plansService';
import { planMembersService } from '../services/planMembersService';
import { useAuth } from '../../../hooks/useAuth';
import { useSubscription } from '../../../hooks/useSubscription';


const ExpenseTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isFeatureEnabled, loading: subLoading, userSubscription } = useSubscription();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripData, setTripData] = useState<{
    tripId: string;
    tripTitle: string;
    isAdmin: boolean;
    members: any[];
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id || !user) return;

      try {
        // 1. Fetch Plan to get Title
        const planResult = await plansService.getPlan(id);
        if (!planResult.success || !planResult.data) {
          throw new Error("Failed to load trip details");
        }

        // 2. Fetch Members
        const membersResult = await planMembersService.getPlanMembers(id);
        const fetchedMembers = membersResult.data || [];

        // Calculate total expected budget
        const planData: any = planResult.data.planData || planResult.data.updatedPlanData || {};
        let totalTripBudget = 0;

        // 1. Try to get explicit budget from planData
        if (planData.budget?.total) {
          // Remove non-numeric characters like ₹, $, commas
          const numericBudget = String(planData.budget.total).replace(/[^0-9.]/g, '');
          totalTripBudget = Number(numericBudget) || 0;
        }

        // 2. Fallback to itinerary items if budget.total is missing or 0
        if (totalTripBudget === 0 && planData.dailyItinerary) {
          planData.dailyItinerary.forEach((day: any) => {
            if (day.items) {
              day.items.forEach((item: any) => {
                if (item.details?.cost) {
                  totalTripBudget += Number(item.details.cost) || 0;
                }
              });
            }
          });
        }

        const costPerPerson = totalTripBudget / (fetchedMembers.length || 1);

        // Transform members to ExpenseTracking format
        const membersForProps = fetchedMembers.map(m => ({
          id: m.user_id,
          name: m.user_name || 'Traveler',
          expectedAmount: costPerPerson,
          actualAmount: 0,
          expenses: []
        }));

        setTripData({
          tripId: id,
          tripTitle: planResult.data.title,
          isAdmin: planResult.data.isOwner,
          members: membersForProps
        });
      } catch (err) {
        console.error("Error loading expense page:", err);
        setError("Failed to load trip info");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, user]);

  if (isLoading || subLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  }

  if (error || !tripData || !user) {
    return <div className="p-8 text-center text-red-600">{error || "Access Denied"}</div>;
  }

  if (!isFeatureEnabled('expense_tracking')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Required</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Expense Tracking is a premium feature not available on the {userSubscription?.plan_name || 'free'} plan.
        </p>
        <button
          onClick={() => navigate('/user/subscription')}
          className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all"
        >
          View Plans
        </button>
      </div>
    );
  }

  return (
    <ExpenseTracking
      tripTitle={tripData.tripTitle}
      tripId={tripData.tripId}
      members={tripData.members}
      currentUserId={user.id}
      isAdmin={tripData.isAdmin}
      onBack={() => navigate(-1)}
    />
  );
};

export default ExpenseTrackingPage;