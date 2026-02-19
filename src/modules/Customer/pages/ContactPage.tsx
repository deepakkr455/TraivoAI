import React, { useState } from 'react';
import Header from '../components/Header';
import { ChevronDown, Send, MessageSquare, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitContactMessage } from '../services/contactService';

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await submitContactMessage(formData);

        setLoading(false);
        if (result.success) {
            setSubmitted(true);
        } else {
            setError('Something went wrong. Please try again later.');
        }
    };

    return (
        <div className="h-screen bg-gray-50 text-gray-800 font-sans flex flex-col overflow-hidden">
            <Header showBackground={true} />

            <div className="flex-1 overflow-y-auto w-full">
                <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16">

                    {/* Standard Page Header - Matches SavedDeals/Subscription */}
                    <div className="flex flex-col items-center justify-center mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-bold mb-6">
                            <Sparkles className="w-4 h-4" /> We'd love to hear from you
                        </div> */}
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Touch</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            Have questions about your AI travel plans? Our team is ready to help you craft the perfect journey.
                        </p>
                    </div>

                    {/* Content Card - Split Layout (Image Left / Form Right) */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col lg:flex-row min-h-[600px] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">

                        {/* Left Side: Image (Visual Storytelling) */}
                        <div className="lg:w-1/2 relative min-h-[300px] lg:min-h-full">
                            <img
                                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80"
                                alt="Travel Landscapes"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-900/80 to-black/50 flex flex-col items-center justify-center text-center p-12">
                                <div className="max-w-xs lg:max-w-md">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
                                        <MessageSquare className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-6 leading-tight">
                                        Start Your Next <br />
                                        <span className="text-teal-400">Adventure</span> With Us
                                    </h2>
                                    <p className="text-base lg:text-lg text-gray-200 leading-relaxed opacity-90">
                                        "Travel is the only thing you buy that makes you richer."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Contact Form */}
                        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-white relative">
                            {submitted ? (
                                <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                                    <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                                        We'll get back to you at <span className="font-bold text-gray-800">{formData.email}</span> shortly.
                                    </p>
                                    <button
                                        onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                                        className="text-teal-600 font-bold hover:text-teal-700 transition-colors"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="name"
                                                required
                                                className="peer w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-transparent font-medium text-gray-900"
                                                placeholder="Name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                            <label htmlFor="name" className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-bold text-teal-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-teal-600 peer-focus:bg-white">
                                                Name
                                            </label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                id="email"
                                                required
                                                className="peer w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-transparent font-medium text-gray-900"
                                                placeholder="Email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                            <label htmlFor="email" className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-bold text-teal-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-teal-600 peer-focus:bg-white">
                                                Email
                                            </label>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <select
                                            id="subject"
                                            className="peer w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all appearance-none font-medium text-gray-900"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        >
                                            <option value="" disabled></option>
                                            <option value="support">Technical Support</option>
                                            <option value="billing">Subscription & Billing</option>
                                            <option value="partnership">Partnership Inquiries</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <label htmlFor="subject" className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-bold text-teal-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-teal-600 peer-focus:bg-white">
                                            Topic
                                        </label>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>

                                    <div className="relative">
                                        <textarea
                                            id="message"
                                            required
                                            rows={4}
                                            className="peer w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none placeholder-transparent font-medium text-gray-900"
                                            placeholder="Message"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        ></textarea>
                                        <label htmlFor="message" className="absolute left-4 -top-2.5 bg-white px-1 text-xs font-bold text-teal-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-teal-600 peer-focus:bg-white">
                                            Message
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
                                        ) : (
                                            <>
                                                Send Message
                                                <Send className="w-4 h-4 text-teal-400 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ContactPage;
