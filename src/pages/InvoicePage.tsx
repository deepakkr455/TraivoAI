import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Printer, Download, ArrowLeft, CheckCircle2, Building, User, ReceiptText, Sparkles } from 'lucide-react';
import Header from '../modules/Customer/components/Header';
import { useAuth } from '../hooks/useAuth';

interface InvoiceData {
    id: string;
    txnid: string;
    plan_name: string;
    amount: number;
    status: string;
    created_at: string;
    payu_id: string;
    users: {
        name: string;
        email: string;
    };
}

const InvoicePage: React.FC = () => {
    const { txnid } = useParams<{ txnid: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!txnid) return;

            try {
                // Fetch basic record first. Join with 'users' inside auth schema is restricted.
                const { data, error } = await supabase
                    .from('payment_history')
                    .select('*')
                    .eq('txnid', txnid)
                    .single();

                if (error) {
                    console.error('Invoice Database Error:', error);
                    throw error;
                }

                // Map the data - use Auth user or data from raw_response
                setInvoice({
                    ...data,
                    users: {
                        name: user?.name || data.raw_response?.firstname || 'Valued Wanderer',
                        email: user?.email || data.raw_response?.email || ''
                    }
                });
            } catch (err) {
                console.error('Error fetching invoice:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [txnid, user]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-500 w-6 h-6 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-6">
                    <ReceiptText className="w-10 h-10 text-gray-300" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Invoice Not Found</h1>
                <p className="text-gray-500 mb-10 max-w-xs font-medium">We couldn't locate the transaction ID: <span className="text-teal-600 font-bold">{txnid}</span></p>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    <ArrowLeft className="w-5 h-5" /> Return to WanderHub
                </button>
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900 overflow-hidden print:bg-white pb-20">
            <div className="print:hidden">
                <Header showBackground={true} />
            </div>

            <div className="flex-1 overflow-y-auto w-full pt-12 pb-20 print:pt-0">
                <div className="max-w-4xl mx-auto px-6">
                    {/* Premium Actions bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 print:hidden">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-black uppercase tracking-widest text-xs transition-all border-b-2 border-transparent hover:border-gray-900 pb-1"
                        >
                            <ArrowLeft className="w-4 h-4" /> Go Back
                        </button>
                        <div className="flex gap-4">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-50 text-gray-900 rounded-2xl font-black hover:bg-gray-50 shadow-sm transition-all"
                            >
                                <Printer className="w-5 h-5" /> Print Receipt
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-8 py-3 bg-teal-500 text-white rounded-2xl font-black hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-teal-500/40 transition-all"
                            >
                                <Download className="w-5 h-5" /> Save PDF
                            </button>
                        </div>
                    </div>

                    {/* The Invoice Document */}
                    <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 print:shadow-none print:border-none print:rounded-none">
                        {/* High-End Header */}
                        <div className="bg-[#0F172A] text-white p-16 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-teal-500 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-teal-500/20 rotate-6">
                                        <Sparkles className="text-white w-7 h-7" />
                                    </div>
                                    <span className="text-3xl font-black tracking-tighter uppercase italic">WanderHub</span>
                                </div>
                                <h1 className="text-5xl font-black tracking-tight mb-4">Official Receipt</h1>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full">
                                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-teal-400">Payment Confirmed</span>
                                </div>
                            </div>

                            <div className="relative z-10 text-right mt-12 md:mt-0 flex flex-col items-end">
                                {/* Mock QR Code for Premium Vibe */}
                                <div className="w-24 h-24 bg-white p-2 rounded-2xl mb-6 shadow-2xl shadow-black/50 print:bg-white border border-gray-100 flex items-center justify-center">
                                    <div className="w-[80%] h-[80%] flex flex-wrap gap-[2px]">
                                        {Array.from({ length: 64 }).map((_, i) => (
                                            <div key={i} className={`w-[10%] h-[10%] bg-black/80 rounded-[1px] ${Math.random() > 0.4 ? 'opacity-100' : 'opacity-0'}`} />
                                        ))}
                                    </div>
                                </div>
                                <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 leading-none text-right">Merchant ID</div>
                                <div className="text-2xl font-mono font-black text-white tracking-tighter uppercase text-right mb-4">
                                    WHub-{invoice.txnid.split('_').pop()?.substring(0, 10) || invoice.txnid.substring(0, 10)}
                                </div>
                                <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 leading-none text-right">Gateway Reference</div>
                                <div className="text-2xl font-mono font-black text-teal-400 tracking-tighter uppercase text-right">
                                    {invoice.payu_id || 'N/A'}
                                </div>
                                <div className="mt-6 text-right">
                                    <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1 leading-none text-right">Issue Date</div>
                                    <div className="font-bold text-lg leading-none">{formatDate(invoice.created_at)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Customer & Merchant Grid */}
                        <div className="p-16 grid grid-cols-1 md:grid-cols-2 gap-16 border-b border-gray-50">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-teal-600">
                                    <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
                                        <Building className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Provider</span>
                                </div>
                                <div>
                                    <div className="font-black text-gray-900 text-2xl tracking-tight mb-2 uppercase italic">WanderHub Travels</div>
                                    <div className="text-gray-500 font-medium leading-relaxed">
                                        Digital Nomad Plaza, Suite 404<br />
                                        Bangalore, IN - 560001
                                    </div>
                                    <a href="mailto:support@wanderhub.ai" className="text-teal-600 font-bold text-sm underline decoration-teal-500/20 underline-offset-4 mt-4 block">support@wanderhub.ai</a>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-teal-600">
                                    <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Customer</span>
                                </div>
                                <div>
                                    <div className="font-black text-gray-900 text-2xl tracking-tight mb-2 uppercase">{invoice.users?.name}</div>
                                    <div className="text-gray-500 font-medium leading-relaxed">{invoice.users?.email}</div>
                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Payment Gateway</div>
                                        <div className="text-sm font-bold text-gray-400 uppercase tracking-tighter leading-none">Verified by PayU India</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Table */}
                        <div className="p-16">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="pb-6 text-left text-xs font-black uppercase tracking-[0.2em] text-gray-400">Description</th>
                                        <th className="pb-6 text-center text-xs font-black uppercase tracking-[0.2em] text-gray-400">Qty</th>
                                        <th className="pb-6 text-right text-xs font-black uppercase tracking-[0.2em] text-gray-400">Total Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="group border-b border-gray-50">
                                        <td className="py-12 pr-12">
                                            <div className="font-black text-gray-900 text-2xl uppercase tracking-tighter mb-2 italic">Premium {invoice.plan_name} Membership</div>
                                            <div className="text-sm text-gray-400 font-medium max-w-sm leading-relaxed">
                                                Unlimited AI trip planning, real-time collaboration, global weather reports, and exclusive member discounts.
                                            </div>
                                        </td>
                                        <td className="py-12 text-center text-xl font-black text-gray-400">01</td>
                                        <td className="py-12 text-right">
                                            <div className="text-3xl font-black text-gray-900 tracking-tighter italic">₹{invoice.amount.toLocaleString()}</div>
                                            <div className="text-[10px] font-black text-teal-500 uppercase tracking-widest mt-1">Inclusive of all taxes</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Digital signature mock and T&C */}
                            <div className="mt-20 flex flex-col md:flex-row justify-between items-end gap-12">
                                <div className="max-w-sm">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4 italic underline decoration-teal-500/40">Traveler Agreement</h4>
                                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                                        This membership is non-transferable and valid for 30 days. By using WanderHub, you agree to our Terms of Service and Privacy Policy. Happy wandering!
                                    </p>
                                </div>
                                <div className="bg-[#F8FAFC] p-10 rounded-[2.5rem] border border-gray-100 w-full md:w-[320px]">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                                        <span className="font-black text-gray-500 tracking-tighter italic whitespace-nowrap">₹{invoice.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-8">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Tax (0%)</span>
                                        <span className="font-black text-gray-500 tracking-tighter italic">₹0.00</span>
                                    </div>
                                    <div className="pt-8 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                                        <span className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Amount Paid</span>
                                        <span className="text-4xl font-black text-teal-600 tracking-tighter italic whitespace-nowrap leading-none">₹{invoice.amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cinematic Footer */}
                        <div className="bg-[#F8FAFC] px-16 py-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-green-500/5">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 italic tracking-tight uppercase leading-none mb-1 text-teal-600 underline decoration-teal-500/10">Adventure Starts Now</h3>
                                    <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase">Thank you for choosing WanderHub v1.0</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center md:items-end">
                                <button className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 hover:text-teal-600 transition-colors">wanderhub.ai/terms</button>
                                <div className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">Digital Auth ID: {invoice.id}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePage;
