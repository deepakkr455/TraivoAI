import React, { useState, useRef } from 'react';
import { LoadingIcon } from '../Icons';
import { uploadMedia, updateOnboardingStatus } from '../../services/supabaseService';
import { X, Upload, CheckCircle, ArrowRight, Shield, Building, Globe, Instagram, Phone, Mail, Award, Check } from 'lucide-react';
import { Badge } from '../Badge';

interface OnboardingModalProps {
    businessId: string;
    profile?: any;
    onComplete: (status: string, businessDetails: any, idDetails?: any) => void;
    onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ businessId, profile, onComplete, onClose }) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'identity'>('basic');
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
            // Update profile with basic data + logo
            await updateOnboardingStatus(
                businessId,
                'basic_submitted',
                {
                    ...basicData,
                    logo_url: basicData.logo_url
                }
            );
            setActiveTab('identity');
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
            // Update profile with identity details
            await updateOnboardingStatus(
                businessId,
                'id_verified',
                undefined,
                identityData
            );
            onComplete('id_verified', basicData, identityData);
        } catch (error) {
            console.error('Identity verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verify Your Presence</h2>
                        <p className="text-xs text-gray-500 mt-1">Build trust with your customers by verifying your business identity.</p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex border-b border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'basic' ? 'border-teal-600 text-teal-600 bg-teal-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        1. Basic (Mandatory)
                    </button>
                    <button
                        onClick={() => setActiveTab('identity')}
                        className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'identity' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        2. Identity (Optional)
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'basic' ? (
                        <form onSubmit={handleBasicSubmit} className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-teal-500">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-400 text-center px-1">Upload Logo</span>
                                        )}
                                        {loading && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <LoadingIcon className="w-5 h-5 text-white" />
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
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-teal-600 hover:scale-110 transition-transform"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Business Logo</h4>
                                    <p className="text-[10px] text-gray-500 leading-tight">This logo will be displayed on all your trip listings and agent profile.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Social Handle</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="@yourhandle"
                                        value={basicData.social_handle}
                                        onChange={(e) => setBasicData({ ...basicData, social_handle: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number</label>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="+91..."
                                        value={basicData.phone}
                                        onChange={(e) => setBasicData({ ...basicData, phone: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Work Email</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="biz@company.com"
                                        value={basicData.email}
                                        onChange={(e) => setBasicData({ ...basicData, email: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Website</label>
                                    <input
                                        required
                                        type="url"
                                        placeholder="https://..."
                                        value={basicData.website}
                                        onChange={(e) => setBasicData({ ...basicData, website: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
                            >
                                Submit Basic Info
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleIdentitySubmit} className="space-y-4">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Google Business Profile / Maps</label>
                                    <input
                                        type="url"
                                        placeholder="https://g.page/yourbiz"
                                        value={identityData.google_business}
                                        onChange={(e) => setIdentityData({ ...identityData, google_business: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Travel Portal Listing (Viator, Viator, Tripadvisor)</label>
                                    <input
                                        type="url"
                                        placeholder="https://www.tripadvisor.in/..."
                                        value={identityData.travel_portal_link}
                                        onChange={(e) => setIdentityData({ ...identityData, travel_portal_link: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Facebook Page</label>
                                        <input
                                            type="url"
                                            placeholder="URL"
                                            value={identityData.facebook_page}
                                            onChange={(e) => setIdentityData({ ...identityData, facebook_page: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">LinkedIn Page</label>
                                        <input
                                            type="url"
                                            placeholder="URL"
                                            value={identityData.linkedin_page}
                                            onChange={(e) => setIdentityData({ ...identityData, linkedin_page: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed italic">
                                    Verify your identity to unlock the Blue Badge – the highest trust signal for travelers on Traivo AI.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
                            >
                                Submit for Verification
                            </button>
                            <button
                                type="button"
                                onClick={() => onComplete('basic_submitted', basicData)}
                                className="w-full text-xs text-gray-500 font-bold hover:text-gray-700 uppercase tracking-widest pt-2"
                            >
                                Skip for now
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
