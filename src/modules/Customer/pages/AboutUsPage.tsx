import React from 'react';
import Header from '../components/Header';
import { Sparkles, Users, Globe, Zap, Heart, MessageSquare, Compass, Megaphone, BookOpen, Layers, Mail, ShieldCheck, TrendingUp, Presentation } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans flex flex-col">
            <Header showBackground={true} />

            <div className="flex-1 overflow-y-auto">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-teal-50 via-white to-indigo-50/30 py-24 px-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(20,184,166,0.1),transparent)]" />
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
                            <Sparkles className="h-4 w-4" />
                            <span>The Future of Intelligent Travel</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter leading-none">
                            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-600 to-indigo-600">Traivo AI</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
                            We are a collective of AI enthusiasts dedicated to building a revolutionary marketplace where Travelers and Agents thrive through seamless AI collaboration.
                        </p>
                    </div>
                </section>

                <main className="max-w-6xl mx-auto px-6 py-20">
                    {/* Mission & Marketplace Section */}
                    <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-4xl font-black mb-8 text-gray-900 tracking-tight">One Platform, <span className="text-teal-600">Infinite Journeys.</span></h2>
                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                Traivo AI isn't just a tool; it's a bridge. We've created a unique ecosystem where cutting-edge AI technology meets human expertise. Our mission is to empower both the solo explorer and the professional agent with tools that were previously only available to giant travel enterprises.
                            </p>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-teal-50 p-3 rounded-2xl shrink-0"><ShieldCheck className="text-teal-600 w-6 h-6" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Privacy First</h4>
                                        <p className="text-gray-500 text-sm">Your data belongs to you. We never use your personal history to train public AI models.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-indigo-50 p-3 rounded-2xl shrink-0"><Globe className="text-indigo-600 w-6 h-6" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Global Ground-Truth</h4>
                                        <p className="text-gray-500 text-sm">Access real-time budget data and verified location insights that general AI simply can't reach.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 bg-slate-50 rounded-[3rem] p-10 border border-gray-100 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-200/20 blur-[80px] rounded-full" />
                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="bg-white p-6 rounded-3xl shadow-lg border border-teal-50 transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
                                    <TrendingUp className="text-teal-600 mb-4 h-8 w-8" />
                                    <h4 className="font-black text-xl mb-2 text-gray-900">Marketplace Synergy</h4>
                                    <p className="text-gray-500 text-sm">Agents list exclusive deals while AI optimizes the reach to most relevant travelers.</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-50 translate-x-10 transform rotate-1 hover:rotate-0 transition-transform cursor-default">
                                    <Zap className="text-indigo-600 mb-4 h-8 w-8" />
                                    <h4 className="font-black text-xl mb-2 text-gray-900">AI Collaboration</h4>
                                    <p className="text-gray-500 text-sm">Real-time group planning with integrated AI assistance for every decision.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Best Use Cases Derived from the Platform */}
                    <div className="mb-32">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black mb-4">Best Ways to Use Traivo AI</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto">Explore the diverse high-impact ways our community is utilizing the platform.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    title: "Personalized Itineraries",
                                    desc: "Generate day-by-day plans including transport, stays, and hidden spots unique to your style.",
                                    tag: "Travelers"
                                },
                                {
                                    title: "Group Expense Management",
                                    desc: "Track every penny and split costs automatically between friends or family.",
                                    tag: "Group Trips"
                                },
                                {
                                    title: "Professional Flyer Design",
                                    desc: "Agents create stunning marketing visuals for their customers in seconds via the Flyer Editor.",
                                    tag: "Agents"
                                },
                                {
                                    title: "Real-time Weather Sync",
                                    desc: "Get hyper-local forecasts synced directly with your daily itinerary stops.",
                                    tag: "Adventurers"
                                }
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-teal-200 transition-all group">
                                    <span className="inline-block px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black uppercase rounded-lg mb-4">{item.tag}</span>
                                    <h3 className="text-xl font-black mb-3 text-gray-900">{item.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feature Categories & Detailed Use Cases */}
                    <div className="bg-slate-900 rounded-[4rem] p-12 md:p-24 text-white mb-32 relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px]" />
                        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black mb-16 text-center">Tailored Features for <span className="text-teal-400">Everyone</span></h2>

                            <div className="grid md:grid-cols-3 gap-12">
                                {/* Explorers & Readers */}
                                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="bg-teal-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><Compass className="text-teal-400" /></div>
                                    <h3 className="text-2xl font-bold mb-4">Explorers & Readers</h3>
                                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">Search for any destination to uncover rich cultural data, history, and real-ground information.</p>
                                    <ul className="space-y-3 text-sm text-gray-300">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-teal-400 rounded-full" /> Detailed Weather Reports</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-teal-400 rounded-full" /> Hidden Gem Exploration</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-teal-400 rounded-full" /> Travel Blog Discovery</li>
                                    </ul>
                                </div>

                                {/* Social Media Creators */}
                                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="bg-cyan-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><TrendingUp className="text-cyan-400" /></div>
                                    <h3 className="text-2xl font-bold mb-4">Content Creators</h3>
                                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">Leverage published trip plans with real budget info to create authentic blog and social content.</p>
                                    <ul className="space-y-3 text-sm text-gray-300">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> Itinerary Data for Blogs</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> Visual Flyer Generation</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> Ground-truth Budget Data</li>
                                    </ul>
                                </div>

                                {/* Teams & Professionals */}
                                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="bg-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><Presentation className="text-indigo-400" /></div>
                                    <h3 className="text-2xl font-bold mb-4">Teams & Professionals</h3>
                                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">Create professional itineraries and information sheets for office travel or corporate retreats.</p>
                                    <ul className="space-y-3 text-sm text-gray-300">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Group Itinerary Printing</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Office Trip Visualization</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> Professional Flyer Export</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Why Traivo AI Comparison */}
                    <div className="flex flex-col md:flex-row gap-20 items-center mb-32">
                        <div className="flex-1">
                            <h2 className="text-4xl font-black mb-8 text-gray-900">Why Traivo AI?</h2>
                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                Unlike general AI chatbots, Traivo AI is built exclusively for travel. We integrate live weather, interactive maps, and a real-world marketplace into a single cohesive experience.
                            </p>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-teal-50 p-6 rounded-3xl">
                                    <h4 className="font-bold text-teal-800 text-3xl mb-1">0%</h4>
                                    <p className="text-teal-600 text-sm font-bold uppercase">Data for Training</p>
                                </div>
                                <div className="bg-indigo-50 p-6 rounded-3xl">
                                    <h4 className="font-bold text-indigo-800 text-3xl mb-1">Live</h4>
                                    <p className="text-indigo-600 text-sm font-bold uppercase">Marketplace Data</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                            {[
                                { title: "Specialized Context", desc: "Our AI understands travel nuances, from transit times to seasonal visa changes." },
                                { title: "Purpose-Built Tools", desc: "Built-in flyer editor, expense tracker, and interactive map sync." },
                                { title: "Direct Agent Access", desc: "The only platform connecting you instantly with verified travel agents & deals." }
                            ].map((point, i) => (
                                <div key={i} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-gray-900 mb-1">{point.title}</h4>
                                    <p className="text-gray-500 text-sm">{point.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="bg-teal-50 rounded-[3rem] p-12 md:p-20 text-center border border-teal-100 mb-20">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                            <Mail className="text-teal-600 h-8 w-8" />
                        </div>
                        <h2 className="text-4xl font-black mb-4">Dedicated Support</h2>
                        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                            Have questions or interested in partnership opportunities? Our team is here to help you navigate your journey.
                        </p>
                        <a href="mailto:info@traivoai.com" className="text-3xl md:text-4xl font-black text-teal-600 hover:text-teal-700 transition-colors underline underline-offset-8">
                            info@traivoai.com
                        </a>
                    </div>

                    {/* CTA Section */}
                    <div className="text-center py-24 bg-gradient-to-r from-teal-600 to-indigo-600 rounded-[4rem] text-white shadow-2xl shadow-teal-500/20">
                        <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Ready to Elevate Your Travel?</h2>
                        <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto">Join the most advanced AI travel ecosystem today and start exploring like never before.</p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Link to="/signup" className="bg-white text-teal-600 px-12 py-5 rounded-full font-black shadow-xl hover:bg-gray-50 transition-all transform hover:scale-105 active:scale-95 leading-none">
                                Join Traivo AI Now
                            </Link>
                            <Link to="/user/wanderchat" className="bg-black/20 backdrop-blur-md text-white border border-white/20 px-12 py-5 rounded-full font-black hover:bg-white/10 transition-all transform hover:scale-105 active:scale-95 leading-none">
                                Try Free AI Planner
                            </Link>
                        </div>
                    </div>
                </main>

                <footer className="border-t border-gray-100 py-16 px-6 bg-gray-50/50">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                        <div>
                            <span className="text-3xl font-black tracking-tighter">
                                <span className="text-teal-500">Traivo</span>
                                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">AI</span>
                            </span>
                            <p className="text-gray-400 mt-2 text-sm max-w-xs">Connecting the world through intelligent exploration and collaboration.</p>
                        </div>
                        <div className="flex gap-12 text-gray-500 text-sm font-bold uppercase tracking-widest">
                            <Link to="/user/policy" className="hover:text-teal-600 transition-colors">Privacy & Terms</Link>
                            <Link to="/user/contact" className="hover:text-teal-600 transition-colors">Support</Link>
                        </div>
                        <p className="text-gray-400 text-sm">© 2026 Traivo AI. Crafted by AI Enthusiasts with ❤️</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AboutUsPage;
