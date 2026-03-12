import React, { useState, useRef } from 'react';
import { LoadingIcon } from '../Icons';
import { uploadMedia, updateOnboardingStatus, notifyOnboardingStatusChange } from '../../services/supabaseService';
import { X, Upload, CheckCircle, ArrowRight, Shield, Building, Globe, Instagram, Phone, Mail, Award, Check } from 'lucide-react';
import { Badge } from '../Badge';

interface OnboardingModalProps {
    businessId: string;
    profile?: any;
    onComplete: (status: string, businessDetails: any, idDetails?: any) => void;
    onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ businessId, profile, onComplete, onClose }) => {
    // Determine initial tab and locking based on verification status
    const status = profile?.onboarding_status || 'not_started';
    const isBasicComplete = ['basic_verified', 'id_submitted', 'id_verified'].includes(status);
    const isStep2Unlocked = isBasicComplete;

    const [activeTab, setActiveTab] = useState<'basic' | 'identity'>(isBasicComplete ? 'identity' : 'basic');
    const [loading, setLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(profile?.avatar_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [basicData, setBasicData] = useState({
        logo_url: profile?.avatar_url || '',
        social_handle: profile?.instagram_page_id || '',
        phone: profile?.phone_number || '',
        email: profile?.email || '',
        website: profile?.company_website || ''
    });

    const [identityData, setIdentityData] = useState({
        google_business: profile?.id_verification_details?.google_business || '',
        facebook_page: profile?.facebook_id || '',
        instagram_page: profile?.instagram_page_id || '',
        linkedin_page: profile?.id_verification_details?.linkedin_page || '',
        travel_portal_link: profile?.id_verification_details?.travel_portal_link || '',
        directory_listing: profile?.id_verification_details?.directory_listing || ''
    });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const url = await uploadMedia(file, businessId);
            if (url) {
                setBasicData({ ...basicData, logo_url: url });
                setLogoPreview(url);
            }
        } catch (error) {
            console.error('Logo upload failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBasicSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Update profile with basic data + logo -> Status: basic_submitted
            await updateOnboardingStatus(
                businessId,
                'basic_submitted',
                {
                    ...basicData,
                    logo_url: basicData.logo_url
                }
            );

            // Trigger notification
            await notifyOnboardingStatusChange(
                businessId,
                'basic_submitted',
                profile?.full_name || 'A New Agent',
                profile?.email || basicData.email
            );
        } catch (error) {
            console.error('Basic onboarding error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIdentitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Update profile with identity details -> Status: id_submitted
            await updateOnboardingStatus(
                businessId,
                'id_submitted',
                undefined,
                identityData
            );

            // Trigger notification
            await notifyOnboardingStatusChange(
                businessId,
                'id_submitted',
                profile?.full_name || 'A New Agent',
                profile?.email || basicData.email
            );

            onComplete('id_submitted', basicData, identityData);
        } catch (error) {
            console.error('Identity verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    const isBasicPending = status === 'basic_submitted';
    const isIdPending = status === 'id_submitted';
    const isIdVerified = status === 'id_verified';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-300">

                {/* Header Section */}
                <header className="flex items-center justify-between border-b border-solid border-slate-100 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-9 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
                            <span className="material-symbols-outlined text-xl">verified_user</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Business Verification</h2>
                            <div className="flex items-center gap-3 mt-0.5">
                                <button
                                    onClick={() => setActiveTab('basic')}
                                    className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'basic' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-500'}`}
                                >
                                    Step 1 {isBasicComplete ? '✓' : ''}
                                </button>
                                <span className="text-[10px] text-slate-300">•</span>
                                <button
                                    disabled={!isStep2Unlocked}
                                    onClick={() => setActiveTab('identity')}
                                    className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'identity' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-500 disabled:opacity-30'}`}
                                >
                                    Step 2 {isIdVerified ? '✓' : ''}
                                    {!isStep2Unlocked && <span className="material-symbols-outlined text-[10px] ml-1 align-middle text-slate-400">lock</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center rounded-full h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all group"
                        >
                            <span className="material-symbols-outlined transition-transform group-hover:rotate-90">close</span>
                        </button>
                    )}
                </header>

                {/* Progress Bar Component */}
                <div className="flex flex-col gap-3 p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                    <div className="flex gap-6 justify-between items-center text-xs font-bold uppercase tracking-widest">
                        <p className={activeTab === 'basic' ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400'}>
                            {activeTab === 'basic' ? (isBasicPending ? 'Awaiting Approval' : 'Basic Verification') : (isIdPending ? 'Awaiting Final Review' : 'Identity Verification')}
                        </p>
                        <p className="text-slate-400 font-bold">{isIdVerified ? '100%' : (isIdPending ? '85%' : (isBasicComplete ? '60%' : (isBasicPending ? '30%' : '10%')))} Complete</p>
                    </div>
                    <div className="rounded-full bg-slate-200 dark:bg-slate-800 h-2.5 w-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${activeTab === 'basic' ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{
                                width: isIdVerified ? '100%' : (isIdPending ? '85%' : (isBasicComplete ? '60%' : (isBasicPending ? '30%' : '10%')))
                            }}
                        ></div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                    {activeTab === 'basic' ? (
                        <form onSubmit={handleBasicSubmit} className="flex-1 min-h-0 flex flex-col">
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {isBasicPending ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="size-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                                            <span className="material-symbols-outlined text-5xl text-amber-500 animate-pulse">pending_actions</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Verification in Progress</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                                            Your business details have been submitted. Our team is currently reviewing your information to award your <strong>'Basic' Trust Badge</strong>.
                                        </p>
                                        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-medium italic">
                                            Usually takes less than 24 hours. You'll receive an email once approved!
                                        </div>
                                    </div>
                                ) : isBasicComplete ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 animate-in zoom-in duration-500">
                                        <div className="size-20 rounded-full bg-teal-500 flex items-center justify-center mb-6 text-white shadow-lg shadow-teal-500/20">
                                            <span className="material-symbols-outlined text-5xl fill-1">verified</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Basic Level Verified!</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                                            Your business details are confirmed. You now have the <strong>Basic Trust Badge</strong> visible on your profile.
                                        </p>
                                        <button
                                            onClick={() => setActiveTab('identity')}
                                            className="mt-8 px-6 py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all flex items-center gap-2"
                                            type="button"
                                        >
                                            Next: Verify Identity
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="mb-2">
                                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Verify Your Business</h1>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                                Provide your basic company details to earn your <span className="text-amber-500 font-bold underline decoration-amber-500/30 underline-offset-4">'Basic' Trust Badge</span>.
                                            </p>
                                        </div>

                                        {/* Logo Upload */}
                                        <div className="flex flex-col gap-3">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-1">Business Logo</label>
                                            <div className="flex items-center gap-6">
                                                <div className="relative group">
                                                    <div className="size-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-amber-500 shadow-inner">
                                                        {logoPreview ? (
                                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">add_photo_alternate</span>
                                                        )}
                                                        {loading && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                                                                <LoadingIcon className="w-6 h-6 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleLogoUpload}
                                                        className="hidden"
                                                        accept="image/*"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                                                        type="button"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">upload</span>
                                                        Upload Logo
                                                    </button>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">PNG, JPG up to 5MB (Square recommended)</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">Work Email</label>
                                                <div className="relative group">
                                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-teal-600">mail</span>
                                                    <input
                                                        required
                                                        type="email"
                                                        value={basicData.email}
                                                        onChange={(e) => setBasicData({ ...basicData, email: e.target.value })}
                                                        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
                                                        placeholder="email@company.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">Phone Number</label>
                                                <div className="relative group">
                                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-teal-600">call</span>
                                                    <input
                                                        required
                                                        type="tel"
                                                        value={basicData.phone}
                                                        onChange={(e) => setBasicData({ ...basicData, phone: e.target.value })}
                                                        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
                                                        placeholder="+1 (555) 000-0000"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">Website</label>
                                                <div className="relative group">
                                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-teal-600">language</span>
                                                    <input
                                                        required
                                                        type="url"
                                                        value={basicData.website}
                                                        onChange={(e) => setBasicData({ ...basicData, website: e.target.value })}
                                                        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
                                                        placeholder="https://www.example.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">Social Handle</label>
                                                <div className="relative group">
                                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg transition-colors group-focus-within:text-teal-600">alternate_email</span>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={basicData.social_handle}
                                                        onChange={(e) => setBasicData({ ...basicData, social_handle: e.target.value })}
                                                        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
                                                        placeholder="@businessname"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Badge Preview Component */}
                                        <div className="mt-8 p-5 bg-amber-500/5 dark:bg-amber-400/5 rounded-2xl border border-amber-500/20 flex items-center gap-5 shadow-sm transform transition-all hover:scale-[1.01]">
                                            <div className="size-14 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                                <span className="material-symbols-outlined text-2xl fill-1">verified</span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-amber-500 leading-tight uppercase tracking-wider">Almost there!</h4>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Complete this section to unlock your first trust level and badges.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Form Actions Segment */}
                            {!isBasicComplete && !isBasicPending && (
                                <div className="shrink-0 p-8 pt-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={onClose}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-xs uppercase tracking-widest px-4 transition-colors"
                                            type="button"
                                        >
                                            Skip for now
                                        </button>
                                        <button
                                            disabled={loading}
                                            className="px-8 py-3.5 bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/25 hover:bg-teal-700 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                                            type="submit"
                                        >
                                            {loading ? <LoadingIcon className="w-5 h-5" /> : (
                                                <>
                                                    Submit for Review
                                                    <span className="material-symbols-outlined text-lg">send</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    ) : (
                        <form onSubmit={handleIdentitySubmit} className="flex-1 min-h-0 flex flex-col">
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {isIdPending ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="size-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                                            <span className="material-symbols-outlined text-5xl text-blue-500 animate-pulse">verified_user</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Final Review in Progress</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                                            You've provided all the necessary links. Our team is now performing a manual verification to award your <strong>Premium Blue Badge</strong>.
                                        </p>
                                        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-medium italic">
                                            This manual check typically takes 1-2 business days. Thank you for your patience!
                                        </div>
                                    </div>
                                ) : isIdVerified ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 animate-in zoom-in duration-500">
                                        <div className="size-24 rounded-full bg-blue-600 flex items-center justify-center mb-6 text-white shadow-xl shadow-blue-500/30">
                                            <span className="material-symbols-outlined text-6xl fill-1">verified</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Premium Trusted Agent!</h2>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed font-medium">
                                            Congratulations! Your identity is fully verified. You now enjoy maximum visibility and the highest trust rating on TraivoAI.
                                        </p>
                                        <button
                                            onClick={onClose}
                                            className="mt-10 px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            type="button"
                                        >
                                            Done
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {/* Trust Badge Hero */}
                                        <div className="@container">
                                            <div className="flex flex-col overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-400/10 shadow-sm sm:flex-row">
                                                <div className="h-40 w-full bg-slate-200 dark:bg-slate-800 sm:h-auto sm:w-1/3 overflow-hidden relative">
                                                    <img
                                                        alt="Identity Verification"
                                                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8zxyY3GGCTtS1ZQagUtrvSaD2fBnBqMb2J_WN4CFgciGHUnMdWv2g2vJ78YBO12Gym5Zaf97CK8xJOjbY1reRCo0pS2UK99xSC0Ttl-FjH-oXyYB6kSAsoFTtejxe4_IHq2yBQKakkujigZ0AAqRD0Ii_hewto_yyiRqJSdDrm-8sDI4bs17EBlsFinATYj21FYaumkBTTIXreFO7A0tpoSiCIoytGQUANv2hCC597s4vquwpmf-fDHvEY0S1p_x89Kj_ODhgInrU"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent"></div>
                                                </div>
                                                <div className="flex flex-1 flex-col justify-center p-7 sm:p-8">
                                                    <div className="flex items-center gap-3 mb-2.5">
                                                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-4xl fill-1">verified</span>
                                                        <h3 className="text-xl font-bold dark:text-white">Unlock the Blue Badge</h3>
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-4 font-medium italic">
                                                        The 'Blue Badge' is our platform's highest trust signal. Stand out by proving your business is legitimate and vetted.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            {/* Google Business */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                                                    <span className="material-symbols-outlined text-blue-600 text-lg">location_on</span>
                                                    Google Business Profile
                                                </label>
                                                <input
                                                    type="url"
                                                    value={identityData.google_business}
                                                    onChange={(e) => setIdentityData({ ...identityData, google_business: e.target.value })}
                                                    className="block w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 py-3 px-4 transition-all outline-none"
                                                    placeholder="https://g.page/your-business"
                                                />
                                            </div>
                                            {/* Travel Portals */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                                                    <span className="material-symbols-outlined text-blue-600 text-lg">travel_explore</span>
                                                    Travel Portal Listing
                                                </label>
                                                <input
                                                    type="url"
                                                    value={identityData.travel_portal_link}
                                                    onChange={(e) => setIdentityData({ ...identityData, travel_portal_link: e.target.value })}
                                                    className="block w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 py-3 px-4 transition-all outline-none"
                                                    placeholder="Viator, TripAdvisor, etc."
                                                />
                                            </div>
                                            {/* Facebook */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                                                    <span className="material-symbols-outlined text-blue-600 text-lg">public</span>
                                                    Facebook Page
                                                </label>
                                                <input
                                                    type="url"
                                                    value={identityData.facebook_page}
                                                    onChange={(e) => setIdentityData({ ...identityData, facebook_page: e.target.value })}
                                                    className="block w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 py-3 px-4 transition-all outline-none"
                                                    placeholder="https://facebook.com/your-page"
                                                />
                                            </div>
                                            {/* LinkedIn */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                                                    <span className="material-symbols-outlined text-blue-600 text-lg">work</span>
                                                    LinkedIn Company
                                                </label>
                                                <input
                                                    type="url"
                                                    value={identityData.linkedin_page}
                                                    onChange={(e) => setIdentityData({ ...identityData, linkedin_page: e.target.value })}
                                                    className="block w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 py-3 px-4 transition-all outline-none"
                                                    placeholder="https://linkedin.com/company/your-biz"
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-5 flex gap-4 items-start border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <span className="material-symbols-outlined text-blue-600 mt-0.5 text-xl">info</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                                                These links are optional but highly recommended. Providing at least two verifiable links significantly speeds up the platform verification process.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions Segment */}
                            {!isIdVerified && !isIdPending && (
                                <div className="shrink-0 p-8 pt-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-6">
                                        <button
                                            onClick={() => onComplete(status, basicData)}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-xs uppercase tracking-widest px-4 transition-colors order-2 sm:order-1"
                                            type="button"
                                        >
                                            Decide Later
                                        </button>
                                        <button
                                            disabled={loading}
                                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-3 active:scale-[0.98] order-1 sm:order-2"
                                            type="submit"
                                        >
                                            {loading ? <LoadingIcon className="w-5 h-5" /> : (
                                                <>
                                                    Submit Final Verification
                                                    <span className="material-symbols-outlined text-lg">verified</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

