import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CheckCircle, XCircle } from 'lucide-react';

const PaymentStatusPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed' | 'tampered'>('verifying');

    // PayU sends data as Form Data (POST) usually, but sometimes as query params depending on config.
    // Ideally, react-router-dom doesn't handle POST data directly. 
    // IMPORTANT: For redirect flow, PayU sends POST data to the URL. 
    // In a SPA (Single Page App), handling POST redirects is tricky because the index.html is served.
    // Usually, the POST data is lost if not handled by the server serving the SPA.
    // HOWEVER, we can use the URL parameters if configured, OR we have to rely on the fact that 
    // for this specific architecture, we might be getting parameters in the URL if we set surl/furl properly to include them 
    // OR we simply won't get the POST body in a purely client-side routing.

    // STRATEGY: 
    // 1. PayU POSTs to server.
    // 2. Since this is a SPA on Vite (likely static serving), we can't accept POST.
    // 3. User might need to point `surl` and `furl` to a backend endpoint which then redirects to frontend with query params.
    // 4. ALTERNATIVELY, PayU allows standard redirect with query params? Not by default for security.
    // 5. Let's assume for this simplified integration that we will try to read from URL params 
    // (which implies the developer changed PayU settings or used a middleware).
    // BUT: The standard approach with SPA is to having a backend endpoint handle the callback.

    // Let's implement looking at URL params for now, assuming the user might bridge it or uses query param mode if available. 
    // If `txnid` is present in URL, we try to verify.

    // Actually, a better approach for SPAs without a backend callback handler:
    // We can't easily read POST body in client-side JS.
    // The user *must* have a backend endpoint to receive the POST and redirect to the frontend with params.
    // Since we have Supabase Functions, we *could* create a function `payu-callback` that accepts the POST and redirects to the frontend.

    // Let's stick to the plan: implement the page. I will add a note about the POST data issue.
    // I will assume for now we can get the txnid from params `?txnid=...&status=...` (Simulated or bridged).

    const txnid = searchParams.get('txnid');
    const status = searchParams.get('status');
    const amount = searchParams.get('amount');
    const hash = searchParams.get('hash');
    const mihpayid = searchParams.get('mihpayid');
    const email = searchParams.get('email');
    const firstname = searchParams.get('firstname');
    const productinfo = searchParams.get('productinfo');
    const udf4 = searchParams.get('udf4');

    useEffect(() => {
        const verifyTransaction = async () => {
            // Priority 1: Full verification via Edge Function
            if (txnid && hash && status === 'success') {
                try {
                    const { data, error } = await supabase.functions.invoke('payu-api', {
                        body: {
                            action: 'verify-hash',
                            txnid,
                            amount,
                            productinfo,
                            firstname,
                            email,
                            status,
                            hash,
                            udf1: searchParams.get('udf1'),
                            udf2: searchParams.get('udf2'),
                            udf3: searchParams.get('udf3'),
                            udf4,
                            udf5: searchParams.get('udf5'),
                            mihpayid,
                        },
                    });

                    if (!error && data?.verified) {
                        setVerificationStatus('success');
                        return;
                    }
                } catch (err) {
                    console.error('Core verification failed, trying fallback...', err);
                }
            }

            // Priority 2: Fallback - check if database already recorded success 
            // (The Edge Function bridge might have already processed the POST)
            if (txnid && status === 'success') {
                try {
                    const historyTable = udf4 === 'affiliate' ? 'agent_subscription_payment_history' : 'payment_history';
                    const { data: record } = await supabase
                        .from(historyTable)
                        .select('status')
                        .eq('txnid', txnid)
                        .maybeSingle();

                    if (record?.status === 'success') {
                        setVerificationStatus('success');
                        return;
                    }
                } catch (err) {
                    console.error('Fallback check failed:', err);
                }
            }

            // If we reached here, and it's a success status but verification failed
            if (status === 'success') {
                setVerificationStatus('tampered');
            } else {
                setVerificationStatus('failed');
            }
        };

        if (txnid) {
            verifyTransaction();
        } else {
            setVerificationStatus('failed');
        }
    }, [txnid, status, amount, hash, searchParams, mihpayid, email, firstname, productinfo, udf4]);


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                {verificationStatus === 'verifying' && (
                    <p className="text-lg text-gray-600">Verifying payment...</p>
                )}

                {verificationStatus === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful</h2>
                        <div className="bg-gray-50 p-4 rounded-xl mb-6 space-y-2">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Merchant ID</p>
                            <p className="text-gray-800 font-mono font-black">WHub-{txnid}</p>
                            <div className="border-t border-gray-100 my-2"></div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Gateway Reference (PayU)</p>
                            <p className="text-gray-800 font-mono font-black">{mihpayid || 'N/A'}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate(searchParams.get('udf4') === 'affiliate' ? '/agent-portal/creator' : '/user/dashboard')}
                                className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-500/20"
                            >
                                {searchParams.get('udf4') === 'affiliate' ? 'Go to Creator Page' : 'Go to Dashboard'}
                            </button>
                        </div>
                    </>
                )}

                {(verificationStatus === 'failed' || verificationStatus === 'tampered') && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-6">
                            {verificationStatus === 'tampered' ? 'Security check failed.' : 'The transaction could not be completed.'}
                        </p>
                        <button
                            onClick={() => navigate(searchParams.get('udf4') === 'affiliate' ? '/agent-portal/subscription' : '/user/subscription')}
                            className="bg-gray-800 text-white px-6 py-2 rounded-xl hover:bg-gray-700 transition"
                        >
                            {searchParams.get('udf4') === 'affiliate' ? 'Try Again' : 'Return to Plans'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentStatusPage;
