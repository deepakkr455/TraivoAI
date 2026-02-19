// pages/TripConclusionPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { TripConclusion } from './TripConclusion';
import { plansService } from '../services/plansService';
import { planMembersService } from '../services/planMembersService';
import { conclusionService, TripSummaryData } from '../services/conclusionService';
import { useAuth } from '../../../hooks/useAuth';

import { emailService } from '../services/emailService';

const TripConclusionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const tripId = location.state?.tripId || id;
  const passedTripTitle = location.state?.tripTitle;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tripData, setTripData] = useState<{
    tripTitle: string;
    tripId: string;
    currentUser: { id: string; name: string };
    isAdmin: boolean;
    summaryData: TripSummaryData;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!tripId) {
        setError("Trip ID not found");
        setIsLoading(false);
        return;
      }

      if (!user) {
        // Should be protected route, but safety check
        return;
      }

      try {
        // 1. Fetch Plan Details
        const planResult = await plansService.getPlan(tripId);
        if (!planResult.success || !planResult.data) {
          throw new Error("Failed to load plan");
        }
        const plan = planResult.data;
        const planData = plan.updatedPlanData || plan.planData;

        // 2. Fetch Members (for expense calculation simulation/real data)
        const membersResult = await planMembersService.getPlanMembers(tripId);
        const members = membersResult.data || [];

        // 3. Fetch/Calculate Summary Data
        const conclusionResult = await conclusionService.getConclusion(tripId);

        // 4. Fetch Actual Expenses from Expenses Table
        const { data: expenseData, error: expenseError } = await (await import('../../../services/supabaseClient')).default

          .from('expenses')
          .select('amount, user_id')
          .eq('plan_id', tripId);

        let realTotalExpense = 0;
        if (expenseData) {
          realTotalExpense = expenseData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        }

        let totalExpense = 0;
        let expectedBudget = 0;
        let activitiesCount = 0;
        let visitedPlaces: string[] = [];

        // Calculate from plan data
        if (planData.dailyItinerary) {
          planData.dailyItinerary.forEach((day: any) => {
            day.items.forEach((item: any) => {
              activitiesCount++;
              if (item.details?.cost) {
                expectedBudget += item.details.cost;
              }
            });
          });
          visitedPlaces = planData.stats?.stay ? [planData.stats.stay] : ['Multiple Locations'];
        }

        // Use stored conclusion data if available
        if (conclusionResult.success && conclusionResult.data) {
          totalExpense = conclusionResult.data.totalExpense;
          if (conclusionResult.data.activities > 0) activitiesCount = conclusionResult.data.activities;
        } else {
          // If no conclusion yet, use real calculated expenses
          totalExpense = realTotalExpense;
        }

        // Map members
        const summaryMembers = members.map(m => ({
          id: m.user_id,
          name: m.user_name || 'Traveler',
          totalExpense: 0
        }));

        const totalDays = planData.dailyItinerary?.length || 1;

        const summaryData: TripSummaryData = {
          id: conclusionResult.data?.id,
          totalDays: totalDays,
          totalExpense: totalExpense,
          expectedBudget: expectedBudget || 2000,
          visitedPlaces: visitedPlaces,
          activities: activitiesCount,
          members: summaryMembers,
          aiSummary: conclusionResult.data?.aiSummary
        };

        // Find current user in members list to get the correct display name
        const currentMember = members.find(m => m.user_id === user.id);
        const displayName = currentMember?.user_name || (user as any).user_metadata?.full_name || user.email?.split('@')[0] || 'Me';

        const userAny = user as any;
        setTripData({
          tripTitle: plan.title || passedTripTitle || 'Trip',
          tripId: tripId,
          currentUser: { id: user.id, name: displayName },
          isAdmin: plan.isOwner,
          summaryData: summaryData
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [tripId, user]);


  const handleFinish = () => {
    navigate('/dashboard');
  };

  const handleEmailReport = async () => {
    console.log("handleEmailReport clicked");
    if (!tripData) {
      console.error("No tripData, cannot send email");
      return;
    }

    try {
      // 1. Get Emails
      console.log("Fetching emails for trip:", tripData.tripId);
      const memberEmails = await emailService.getMemberEmails(tripData.tripId);
      console.log("Emails from service:", memberEmails);

      // Add current user's email if available and not duplicates
      if (user && user.email && !memberEmails.includes(user.email)) {
        memberEmails.push(user.email);
      }
      console.log("Final recipient list:", memberEmails);

      if (memberEmails.length === 0) {
        alert("No member emails found to send report to. Invitations needed or login required.");
        return;
      }

      // 2. Generate Report
      const reportBody = emailService.generateTripReport(
        tripData.tripTitle,
        tripData.summaryData
      );

      // 3. Create Mailto Link
      const subject = encodeURIComponent(`Trip Summary: ${tripData.tripTitle}`);
      const body = encodeURIComponent(reportBody);
      const bcc = memberEmails.join(',');

      const mailtoLink = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
      console.log("Generated mailto link length:", mailtoLink.length);

      if (mailtoLink.length > 2000) {
        console.warn("Mailto link exceeds 2000 characters, may be truncated by some clients.");
      }

      window.location.href = mailtoLink;
      console.log("Window location updated to mailto link");

    } catch (err) {
      console.error("Error in handleEmailReport:", err);
      alert("An error occurred while preparing the email. Check console for details.");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  }

  if (error || !tripData) {
    return <div className="p-8 text-center text-red-600">{error || "Trip not found"}</div>;
  }

  return (
    <TripConclusion
      tripTitle={tripData.tripTitle}
      tripId={tripData.tripId}
      currentUserId={tripData.currentUser.id}
      currentUserName={tripData.currentUser.name}
      isAdmin={tripData.isAdmin}
      summaryData={tripData.summaryData}
      onFinish={handleFinish}
      onEmailReport={handleEmailReport}
    />
  );
};

export default TripConclusionPage;