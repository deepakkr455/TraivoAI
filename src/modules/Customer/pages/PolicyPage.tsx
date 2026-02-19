import React from 'react';
import Header from '../components/Header';
import { Shield } from 'lucide-react';

const PolicyPage: React.FC = () => {
    return (
        <div className="h-screen bg-gray-50 text-gray-800 font-sans flex flex-col overflow-hidden">
            <Header showBackground={true} />

            <div className="flex-1 overflow-y-auto w-full">
                <main className="max-w-4xl mx-auto px-6 py-12">
                    {/* Centered Page Header */}
                    <div className="flex flex-col items-center justify-center mb-12 text-center">
                        {/* <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 hover:rotate-6 transition-transform">
                        <Shield className="h-8 w-8 text-white" />
                    </div> */}

                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Privacy & <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Terms</span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Our commitment to protecting your data and your rights.
                        </p>
                    </div>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Introduction</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Welcome to Traivo AI ("we," "our," or "us"). By accessing or using our AI-powered travel planning platform, you agree to be bound by these Terms of Use and our Privacy Policy. Our services leverage advanced Artificial Intelligence (AI) to provide personalized travel recommendations, itinerary planning, and real-time assistance.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. AI Usage & Disclaimer</h2>
                        <div className="bg-blue-50 p-6 rounded-xl mb-4 border border-blue-100">
                            <h3 className="font-bold text-blue-800 mb-2">How We Use AI</h3>
                            <p className="text-blue-700 text-sm">
                                Traivo AI utilizes advanced Generative AI models to synthesize travel data, forecast weather, and generate creative content.
                            </p>
                        </div>
                        <ul className="list-disc pl-5 space-y-3 text-gray-600">
                            <li><strong>Accuracy:</strong> While we strive for precision, AI-generated content (itineraries, weather forecasts, prices) is probabilistic and may occasionally be inaccurate. Always verify critical travel details (visa requirements, flight times, health advisories) with official sources.</li>
                            <li><strong>Decision Making:</strong> Traivo AI is a planning tool, not a travel agent. We are not liable for any financial loss, missed connections, or dissatisfaction resulting from reliance on AI-generated suggestions.</li>
                            <li><strong>Unpredictability:</strong> In rare cases, AI may produce "hallucinations" (plausible-sounding but false information). We implement strict safeguards, but users should exercise judgment.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Data Privacy & Security</h2>
                        <p className="text-gray-600 mb-4">
                            Your data privacy is our top priority. We implement robust security measures to protect your information within our AI ecosystem.
                        </p>
                        <div className="bg-amber-50 p-6 rounded-xl mb-6 border border-amber-100">
                            <h3 className="font-bold text-amber-800 mb-2">Important Security Notice</h3>
                            <ul className="list-disc pl-5 space-y-3 text-amber-700 text-sm">
                                <li><strong>No Fine-Tuning:</strong> We do <strong>not</strong> use your personal data, chat history, or trip details to fine-tune or train any AI models. Your data remains your own.</li>
                                <li><strong>Data Security:</strong> We implement high-encryption standards and secure data handling procedures to ensure your information is protected during every interaction.</li>
                            </ul>
                        </div>
                        <ul className="list-disc pl-5 space-y-3 text-gray-600">
                            <li><strong>Conversation Data:</strong> Your chats with Traivo AI are stored securely to provide context for your session and allow you to revisit your history. We may analyze anonymized query data internally to improve our service quality.</li>
                            <li><strong>Personal Information:</strong> We do not sell your personal data. Trip details are shared with third-party booking partners (e.g., Skyscanner, Booking.com) <em>only</em> when you explicitly interact with a booking or affiliate link.</li>
                            <li><strong>Model Training:</strong> Your personal identifiable information (PII) is <strong>not</strong> used to train public foundation models.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. User Responsibilities</h2>
                        <p className="text-gray-600">You agree strictly NOT to use Traivo AI for:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-600">
                            <li>Generating illegal, harmful, or fraudulent content.</li>
                            <li>Attempting to "jailbreak" or manipulate the AI to violate safety policies.</li>
                            <li>Commercial scraping of our proprietary travel data or AI outputs.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Subscription & Payments</h2>
                        <p className="text-gray-600">
                            Premium features offer enhanced AI capabilities (unlimited queries, complex routing, advanced tools). Subscriptions are billed in advance. Refunds are handled on a case-by-case basis as per statutory rights.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Limitation of Liability</h2>
                        <p className="text-gray-600">
                            To the maximum extent permitted by law, Traivo AI shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the service.
                        </p>
                    </section>

                    <div className="text-center text-sm text-gray-400 mt-20">
                        Last Updated: January 2026
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PolicyPage;
