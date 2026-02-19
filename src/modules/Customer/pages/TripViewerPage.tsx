// pages/TripViewerPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plansService, TripWithAccess } from '../services/plansService';
import { invitationsService } from '../services/invitationsService';
import { generateTripPlanHtml } from '../services/htmlGenerator';
import { TripViewer } from './TripViewer';

export const TripViewerPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [trip, setTrip] = useState<TripWithAccess | null>(null);
    const [blobUrl, setBlobUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isResponding, setIsResponding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('🔵 TripViewerPage mounted with ID:', id);
        loadTrip();
        return () => {
            console.log('🔴 TripViewerPage unmounted');
            // Clean up blob URL
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadTrip = async () => {
        if (!id) {
            setError('No trip ID provided');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch from Supabase - this automatically checks access
            console.log('🔍 Checking access for trip:', id);
            let result = await plansService.getPlan(id);
            console.log('plansService.getPlan result:', result);

            // Fallback: Try treating ID as an invitation token if plan lookup fails
            if (!result.success) {
                console.log('⚠️ Plan lookup failed, trying as invitation token:', id);
                const tokenResult = await plansService.getPlanByToken(id);
                if (tokenResult.success) {
                    console.log('✅ Token resolved to plan:', tokenResult.data?.id);
                    result = tokenResult;
                }
            }

            if (result.success && result.data) {
                console.log('✅ Access granted - Loading trip:', result.data.id);
                // alert("hurray")

                const hash = window.location.hash;
                const queryString = hash.split('?')[1];
                const params = new URLSearchParams(queryString);
                const version = params.get('version');
                // alert(params.get('version'));

                // Check for version query param
                // const searchParams = new URLSearchParams(window.location.search);
                // const version = searchParams.get('version');
                // alert(version)

                let tripDataToRender = result.data;
                let planDataToRender = result.data.planData;

                if (version === 'updated' && result.data.updatedPlanData) {
                    // alert(1)
                    console.log('Rendering updated plan data');
                    planDataToRender = result.data.updatedPlanData;

                    // Create a temporary trip object with updated data for the viewer header
                    tripDataToRender = {
                        ...result.data,
                        title: result.data.updatedPlanData.title || result.data.title,
                        planData: result.data.updatedPlanData,
                        // Update other relevant fields if they exist in updatedPlanData
                    };
                }

                setTrip(tripDataToRender);

                // Generate HTML from the JSON planData
                const htmlContent = generateTripPlanHtml(planDataToRender);
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);

            } else {
                // Check if it's an access denied error
                const errorLower = result.error?.toLowerCase() || '';
                if (errorLower.includes('do not have access')) {
                    console.warn('🚫 Access denied for trip:', id);
                    setError('access_denied');
                } else if (errorLower.includes('invalid or expired')) {
                    console.warn('🎫 Invalid token:', id);
                    setError('invalid_token');
                } else {
                    console.warn('⚠️ Trip not found:', result.error);
                    setError('not_found');
                }
            }
        } catch (err) {
            console.error('❌ Error loading trip:', err);
            setError('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        console.log('🔙 Back button clicked, using browser history');
        navigate(-1);
    };

    const handleDelete = async () => {
        if (!id || !trip) return;

        if (!window.confirm('Are you sure you want to delete this trip?')) {
            return;
        }

        try {
            const result = await plansService.deletePlan(id);

            if (result.success) {
                navigate('/my-trips');
            } else {
                alert(`Failed to delete trip: ${result.error}`);
            }
        } catch (err) {
            console.error('Error deleting trip:', err);
            alert('Failed to delete trip. Please try again.');
        }
    };

    const handleAcceptInvitation = async () => {
        if (!trip?.invitation) return;

        setIsResponding(true);
        try {
            console.log('Accepting invitation:', trip.invitation.id);
            const result = await invitationsService.updateInvitationStatus(trip.invitation.id, 'accepted');

            if (result.success) {
                // Dynamic redirection based on trip status
                console.log('Invitation accepted, redirecting based on status:', trip.status);

                switch (trip.status) {
                    case 'planning':
                    case 'invite':
                        // Stay on viewer page, just reload trip data to update UI (show buttons etc)
                        loadTrip();
                        break;
                    case 'collaboration':
                        navigate(`/user/trip/${trip.id}/collaborate`);
                        break;
                    case 'journey-started':
                        navigate(`/user/trip/${trip.id}/journey`);
                        break;
                    case 'expense':
                        navigate(`/user/trip/${trip.id}/expenses`);
                        break;
                    case 'concluded':
                        navigate(`/user/trip/${trip.id}/summary`);
                        break;
                    default:
                        loadTrip();
                }
            } else {
                alert(`Failed to accept invitation: ${result.error}`);
            }
        } catch (err) {
            console.error('Error accepting invitation:', err);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setIsResponding(false);
        }
    };

    const handleDeclineInvitation = async () => {
        if (!trip?.invitation) return;

        if (!window.confirm('Are you sure you want to decline this invitation? You will not be able to access this trip.')) {
            return;
        }

        setIsResponding(true);
        try {
            console.log('Declining invitation:', trip.invitation.id);
            const result = await invitationsService.updateInvitationStatus(trip.invitation.id, 'declined');

            if (result.success) {
                // Redirect to wanderchat or home
                navigate('/user/wanderchat');
            } else {
                alert(`Failed to decline invitation: ${result.error}`);
            }
        } catch (err) {
            console.error('Error declining invitation:', err);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setIsResponding(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4 mx-auto"></div>
                    <p className="text-gray-600">Loading trip...</p>
                </div>
            </div>
        );
    }

    if (error || !trip) {
        // Different error displays based on error type
        const isAccessDenied = error === 'access_denied';
        const isNotFound = error === 'not_found' || error === 'Trip not found';

        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    {isAccessDenied ? (
                        // Access Denied - Not invited
                        <>
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 mb-6">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-red-900 mb-3">Access Denied</h2>
                                <p className="text-red-700 mb-2">
                                    You don't have permission to view this trip.
                                </p>
                                <p className="text-red-600 text-sm">
                                    This trip is private. Ask the owner to invite you.
                                </p>
                            </div>
                            <button
                                onClick={handleBack}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                            >
                                Go Back
                            </button>
                        </>
                    ) : error === 'invalid_token' ? (
                        // Invalid Token
                        <>
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 mb-6">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-amber-900 mb-3">Invalid Link</h2>
                                <p className="text-amber-700 mb-2">
                                    This invitation link is invalid or has expired.
                                </p>
                                <p className="text-amber-600 text-sm">
                                    Please ask the trip owner to send you a new invitation.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/user/wanderchat')}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                            >
                                Go to Chat
                            </button>
                        </>
                    ) : (
                        // Trip Not Found
                        <>
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 mb-6">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-amber-900 mb-3">Trip Not Found</h2>
                                <p className="text-amber-700 mb-2">
                                    {error === 'No trip ID provided' ? error : 'The trip you\'re looking for doesn\'t exist.'}
                                </p>
                                <p className="text-amber-600 text-sm">
                                    It may have been deleted or the link is incorrect.
                                </p>
                            </div>
                            <button
                                onClick={handleBack}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                            >
                                Back to My Trips
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <TripViewer
            trip={trip}
            blobUrl={blobUrl}
            onBack={handleBack}
            onDelete={handleDelete}
            onAcceptInvitation={handleAcceptInvitation}
            onDeclineInvitation={handleDeclineInvitation}
            isResponding={isResponding}
        />
    );
};

export default TripViewerPage;
