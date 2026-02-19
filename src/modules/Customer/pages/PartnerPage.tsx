import React, { useState } from 'react';
import Header from '../components/Header';
import { Mail, Building, Send } from 'lucide-react';

const PartnerPage: React.FC = () => {
    const [formData, setFormData] = useState({
        companyName: '',
        businessDetails: '',
        email: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Partner Inquiry:', formData);
        // Here you would typically call an API
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-[#0f111a] text-white font-sans flex flex-col">
            <div className="bg-[#0f111a]/90 backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
                <Header />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="w-full max-w-2xl relative z-10">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Let's work together</h1>
                        <p className="text-gray-400 text-lg">Fill out the details below and we'll be in touch!</p>
                    </div>

                    {isSubmitted ? (
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-teal-500/30 rounded-2xl p-12 text-center animate-fade-in shadow-2xl">
                            <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Send className="w-10 h-10 text-teal-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Thank You!</h2>
                            <p className="text-gray-300">We've received your details and will get back to you shortly.</p>
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="mt-8 text-teal-400 hover:text-teal-300 font-medium underline underline-offset-4"
                            >
                                Send another inquiry
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-200 ml-1">
                                    <Building className="w-4 h-4 text-purple-400" />
                                    What is your company name? <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-transparent border-b-2 border-gray-700/50 px-4 py-3 text-lg focus:outline-none focus:border-teal-500 transition-colors placeholder-gray-600 focus:bg-gray-800/20 rounded-t-lg"
                                    placeholder="Enter company name here"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-200 ml-1">
                                    <Mail className="w-4 h-4 text-blue-400" />
                                    Tell us about your business and your interest in iWander... <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={1} // Starts small but user can expand if needed, or we can make it auto-grow
                                    className="w-full bg-transparent border-b-2 border-gray-700/50 px-4 py-3 text-lg focus:outline-none focus:border-teal-500 transition-colors placeholder-gray-600 resize-none focus:bg-gray-800/20 rounded-t-lg"
                                    placeholder="Enter details here"
                                    value={formData.businessDetails}
                                    onChange={(e) => setFormData({ ...formData, businessDetails: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-200 ml-1">
                                    <Mail className="w-4 h-4 text-teal-400" />
                                    Enter your email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-transparent border-b-2 border-gray-700/50 px-4 py-3 text-lg focus:outline-none focus:border-teal-500 transition-colors placeholder-gray-600 focus:bg-gray-800/20 rounded-t-lg"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-purple-500/20 transform transition-all hover:-translate-y-1 active:translate-y-0"
                                >
                                    SUBMIT
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Footer mockup */}
            <div className="py-12 px-6 border-t border-gray-800/50 mt-12 bg-black/20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-2xl font-bold">
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">iWander</span>
                        </div>
                        <p className="text-gray-500 text-sm">Powering in-destination experiences</p>
                        <div className="flex gap-4 opacity-50">
                            {/* Social/App icons placeholders */}
                            <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm text-gray-400">
                        <div className="space-y-4">
                            <h4 className="font-bold text-blue-400 uppercase tracking-wider text-xs">Other Pages</h4>
                            <ul className="space-y-2">
                                <li className="hover:text-white cursor-pointer">Home</li>
                                <li className="hover:text-white cursor-pointer">Work With Us</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-blue-400 uppercase tracking-wider text-xs">Quick Links</h4>
                            <ul className="space-y-2">
                                <li className="hover:text-white cursor-pointer">Privacy Policy</li>
                                <li className="hover:text-white cursor-pointer">Term Of Service</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-blue-400 uppercase tracking-wider text-xs">Contact Us</h4>
                            <p>Our Support and Sales team is available at <span className="text-white">subscriptions@iwander.io</span></p>
                            <div className="w-5 h-5 bg-blue-600 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                 .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default PartnerPage;
