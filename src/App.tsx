import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';

import { AgentLayout } from './modules/AgentAffiliate/pages/AgentLayout';
import CreatorPage from './modules/AgentAffiliate/pages/CreatorPage';
import DashboardPageAgent from './modules/AgentAffiliate/pages/DashboardPage';
import BookingsPage from './modules/AgentAffiliate/pages/BookingsPage';
import MessagesPage from './modules/AgentAffiliate/pages/MessagesPage';
import GalleryPage from './modules/AgentAffiliate/pages/GalleryPage';
import AffiliateGalleryPage from './modules/AgentAffiliate/pages/AffiliateGalleryPage';
import ProfilePage from './modules/AgentAffiliate/pages/ProfilePage';
import HelpPage from './modules/AgentAffiliate/pages/HelpPage';
import AffiliateSubscriptionPage from './modules/AgentAffiliate/pages/SubscriptionPage';

import CustomerLayout from './modules/Customer/pages/CustomerLayout';
import CustomerPage from './modules/Customer/pages/CustomerPage';
import UserDashboardPage from './modules/Customer/pages/UserDashboardPage';
import FeedPage from './modules/Customer/pages/FeedPage';
import GroupPlannerPage from './modules/Customer/pages/GroupPlannerPage';
import TripCollaborationPage from './modules/Customer/pages/TripCollaborationPage';
import StartJourneyPage from './modules/Customer/pages/StartJourneyPage';
import ExpenseTrackingPage from './modules/Customer/pages/ExpenseTrackingPage';
import TripConclusionPage from './modules/Customer/pages/TripConclusionPage';
import MyTripsPage from './modules/Customer/pages/MyTripsPage';
import MyBlogsPage from './modules/Customer/pages/MyBlogsPage';
import CustomerMessagesPage from './modules/Customer/pages/CustomerMessagesPage';
import TripViewerPage from './modules/Customer/pages/TripViewerPage';
import BlogViewerPage from './modules/Customer/pages/BlogViewerPage';
import BestDealsPage from './modules/Customer/pages/BestDealsPage';
import SavedDealsPage from './modules/Customer/pages/SavedDealsPage';
import DealDetailsPage from './modules/Customer/pages/DealDetailsPage';
import PartnerPage from './modules/Customer/pages/PartnerPage';
import SubscriptionPage from './modules/Customer/pages/SubscriptionPage';
import PolicyPage from './modules/Customer/pages/PolicyPage';
import ContactPage from './modules/Customer/pages/ContactPage';
import AffiliatesPage from './modules/Customer/pages/AffiliatesPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import TravelPersonalizationPage from './modules/Customer/pages/TravelPersonalizationPage';
import AboutUsPage from './modules/Customer/pages/AboutUsPage';
import supabase from './services/supabaseClient';
import { useNavigate } from 'react-router-dom';

const AppContent: React.FC = () => {
    const { loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [processingAuth, setProcessingAuth] = React.useState(false);

    React.useEffect(() => {
        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("AppContent Auth event:", event);
            if (event === 'PASSWORD_RECOVERY') {
                setProcessingAuth(false);
                navigate('/reset-password');
            }
            if (event === 'SIGNED_IN' && session) {
                setProcessingAuth(false);
                const currentHash = window.location.hash;
                if (currentHash === '' || currentHash === '#/' || currentHash.includes('login') || currentHash.includes('signup') || currentHash.includes('access_token')) {
                    navigate('/user/wanderchat', { replace: true });
                }
            }
        });

        const hash = window.location.hash;
        const isAuthCallback = hash.includes('access_token=') && !hash.startsWith('#/');

        if (isAuthCallback) {
            console.log("Auth callback detected, pausing routing...");
            setProcessingAuth(true);
            const timeout = setTimeout(() => {
                setProcessingAuth(false);
            }, 5000);

            return () => {
                clearTimeout(timeout);
                subscription.unsubscribe();
            };
        }

        if (hash.includes('type=recovery') && hash.includes('access_token')) {
            navigate('/reset-password');
        }

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    if (processingAuth || authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
                    <p className="text-gray-500 font-medium">
                        {processingAuth ? "Authenticating..." : "Initializing..."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-gray-800">
            <main>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/personalize" element={<TravelPersonalizationPage />} />
                    <Route path="/" element={<Navigate to="/user/wanderchat" replace />} />
                    <Route path="/payment-status" element={<PaymentStatusPage />} />

                    {/* Customer Module */}
                    <Route path="/user" element={<CustomerLayout />}>
                        <Route index element={<Navigate to="wanderchat" replace />} />
                        <Route path="wanderchat" element={<CustomerPage />} />
                        <Route path="dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
                        <Route path="feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
                        <Route path="group-planner" element={<ProtectedRoute><GroupPlannerPage /></ProtectedRoute>} />
                        <Route path="my-trips" element={<ProtectedRoute><MyTripsPage /></ProtectedRoute>} />
                        <Route path="best-deals" element={<BestDealsPage />} />
                        <Route path="saved-deals" element={<ProtectedRoute><SavedDealsPage /></ProtectedRoute>} />
                        <Route path="deals" element={<DealDetailsPage />} />
                        {/* <Route path="partner" element={<PartnerPage />} /> */}
                        <Route path="subscription" element={<SubscriptionPage />} />
                        <Route path="policy" element={<PolicyPage />} />
                        <Route path="contact" element={<ContactPage />} />
                        <Route path="about" element={<AboutUsPage />} />
                        <Route path="trip/:id" element={<ProtectedRoute><TripViewerPage /></ProtectedRoute>} />
                        <Route path="blog/:id" element={<BlogViewerPage />} />
                        <Route path="my-blogs" element={<MyBlogsPage />} />
                        <Route path="trip/:id/collaborate" element={<TripCollaborationPage />} />
                        <Route path="trip/:id/journey" element={<StartJourneyPage />} />
                        <Route path="trip/:id/expenses" element={<ExpenseTrackingPage />} />
                        <Route path="trip/:id/summary" element={<TripConclusionPage />} />

                        <Route path="messages" element={<CustomerMessagesPage />} />
                        <Route path="affiliates" element={<AffiliatesPage />} />
                    </Route>

                    {/* Agent Module */}
                    <Route path="/agent-portal" element={<AgentLayout />}>
                        <Route index element={<Navigate to="creator" replace />} />
                        <Route path="creator" element={<CreatorPage />} />
                        <Route path="dashboard" element={<DashboardPageAgent />} />
                        <Route path="blog/:id" element={<BlogViewerPage />} />
                        <Route path="my-blogs" element={<MyBlogsPage />} />
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="gallery" element={<GalleryPage />} />
                        <Route path="affiliate-gallery" element={<AffiliateGalleryPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="subscription" element={<AffiliateSubscriptionPage />} />
                        <Route path="help" element={<HelpPage />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Route>

                    {/* Admin and Others */}
                    <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
};

import { SubscriptionProvider } from './context/SubscriptionContext';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <SubscriptionProvider>
                <HashRouter>
                    <AppContent />
                </HashRouter>
            </SubscriptionProvider>
        </AuthProvider>
    );
};

export default App;