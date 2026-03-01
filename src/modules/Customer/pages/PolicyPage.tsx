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
                            Welcome to Traivo AI ("we," "our," or "us"). By accessing or using our AI-powered travel planning platform (the "Platform"), you agree to be bound by these Terms of Use and our Privacy Policy. Traivo AI provides AI-driven travel recommendations, itinerary planning, and related services to customers and travel agents.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Scope of Traivo AI</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Traivo AI is a Software-as-a-Service (SaaS) marketplace designed to support two primary user groups:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-600 mb-4">
                            <li><strong>Customers</strong> — individuals who use the Platform to plan, research, manage, or book travel for personal or business purposes.</li>
                            <li><strong>Travel Agents & Service Providers</strong> — businesses or individuals who list travel packages, services, or offers on the Platform under subscription plans.</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed">
                            The Platform facilitates connections between customers and travel agents but does not act as a principal travel agent or hold customer payments on behalf of agents. Users must use the Platform for lawful, intended travel purposes.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. AI Usage & Disclaimer</h2>
                        <div className="bg-blue-50 p-6 rounded-xl mb-6 border border-blue-100">
                            <h3 className="font-bold text-blue-800 mb-2">How We Use AI</h3>
                            <p className="text-blue-700 text-sm">
                                Traivo AI leverages advanced generative AI and machine learning models provided by third-party providers (e.g., OpenRouter AI, Gemini, OpenAI, Tavily etc) to synthesize travel data, forecast weather, estimate prices, and generate creative content.
                            </p>
                        </div>
                        <ul className="list-disc pl-5 space-y-4 text-gray-600">
                            <li><strong>Accuracy & Probabilistic Nature:</strong> While we strive for precision, AI-generated content is probabilistic and may occasionally be inaccurate. Always verify critical travel details with primary or official sources.</li>
                            <li><strong>Decision-Making & Liability:</strong> Traivo AI is a planning and recommendation tool — not a licensed travel agent. We are not responsible for financial loss or dissatisfaction resulting from reliance on AI-generated suggestions.</li>
                            <li><strong>Unpredictability & Hallucinations:</strong> In rare cases, AI may produce "hallucinations" (plausible-sounding but incorrect results). We implement safeguards, but users should exercise judgment.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Data Privacy & Security</h2>
                        <p className="text-gray-600 mb-6">
                            Your data privacy and security are top priorities. We deploy robust technical, administrative, and organizational measures to protect your information.
                        </p>

                        <div className="bg-amber-50 p-6 rounded-xl mb-6 border border-amber-100">
                            <h3 className="font-bold text-amber-800 mb-2">No Fine-Tuning on Your PII</h3>
                            <p className="text-amber-700 text-sm">
                                Traivo AI does <strong>NOT</strong> use your personal data, chat history, or trip details to fine-tune or train public foundation models. Personal Identifiable Information (PII) is not sold for commercial purposes.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Data & Usage</h3>
                                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                    <li><strong>Conversation Data:</strong> Chats are stored securely to provide session context. We may analyze anonymized query data to improve service quality.</li>
                                    <li><strong>Minimal Retention:</strong> We retain minimum necessary information for identity and authenticity checks only.</li>
                                    <li><strong>Third-Party Integrations:</strong> Affiliate widgets share trip intent only when you explicitly interact with affiliate links.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Third-Party Models & Processors</h3>
                                <p className="text-gray-600 text-sm">
                                    We use third-party AI service providers (e.g., OpenRouter AI, Gemini, OpenAI, Tavily etc) as processors. They may process inputs to generate outputs; please provide personal information cautiously.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Security</h3>
                                <p className="text-gray-600 text-sm">
                                    We implement industry-standard encryption for data in transit and at rest. While we act to secure data, no system is entirely risk-free.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. User Accounts, Agents & Verification</h2>
                        <div className="space-y-4 text-gray-600">
                            <p><strong>Accounts & Roles:</strong> Users may register as Customers or Travel Agents. Travel Agents may list packages and services under subscription plans.</p>
                            <p><strong>Agent Verification:</strong> Travel Agents are subject to verification based on internet presence and minimum KYC checks. Verification reduces, but does not eliminate, risk; Traivo AI does not guarantee the accuracy or reliability of any third-party agent.</p>
                            <p><strong>Payments & Transactions:</strong> Traivo AI operates as a marketplace platform and does NOT hold customers' payments on behalf of agents by default. Transaction terms are agreed between the parties.</p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. User Responsibilities & Acceptable Use</h2>
                        <p className="text-gray-600">You agree NOT to use Traivo AI to:</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2 text-gray-600">
                            <li>Generate illegal, harmful, or fraudulent content.</li>
                            <li>Attempt to manipulate, jailbreak, or bypass safety policies.</li>
                            <li>Perform commercial scraping of proprietary travel data or AI outputs.</li>
                        </ul>
                        <p className="text-gray-600 mt-4 text-sm font-medium">
                            Users are responsible for verifying travel information and ensuring compliance with applicable laws and travel regulations.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Subscriptions, Billing & Refunds</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Premium subscription plans provide enhanced AI capabilities (e.g., higher query limits, advanced routing, agent lead prioritization). Subscriptions are billed in advance. Refunds are processed on a case-by-case basis, subject to statutory consumer rights.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Limitation of Liability & Indemnity</h2>
                        <div className="space-y-4 text-gray-600">
                            <p>To the maximum extent permitted by applicable law, Traivo AI and its affiliates will NOT be liable for any indirect, incidental, or consequential damages arising from use of the Platform.</p>
                            <p>Traivo AI does NOT guarantee availability, accuracy, or completeness of listings. The Platform is provided on an "as-is" and "as-available" basis.</p>
                            <p><strong>Indemnity:</strong> Users agree to indemnify and hold Traivo AI harmless against third-party claims arising from user conduct or breach of these Terms.</p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Third-Party Links & Services</h2>
                        <p className="text-gray-600 leading-relaxed">
                            The Platform may contain links, widgets, or integrations with third-party services (booking partners, payment processors, map providers). These external services have their own terms and privacy policies; Traivo AI is not responsible for their practices.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Changes to These Terms & Policy</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may update these Terms and Privacy Policy periodically. When significant changes occur, we will provide notice via the Platform. Continued use after changes indicates acceptance of the revised terms.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Governing Law & Dispute Resolution</h2>
                        <p className="text-gray-600 leading-relaxed">
                            These Terms are governed by the laws of the jurisdiction in which Traivo AI is incorporated. Users agree to pursue good-faith resolution of disputes and may be required to submit to arbitration or competent courts where legally mandated.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Contact & Support</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have questions about these Terms or privacy practices, please contact TraivoAI at <strong>info@traivoai.com</strong> or through the Platform's Help & Support channels.
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
