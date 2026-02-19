import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface PayUFormProps {
    amount: number;
    productInfo: string;
    firstName: string;
    email: string;
    phone: string;
    txnid: string;
    surl: string; // Success URL
    furl: string; // Failure URL
    udf2?: string; // userId
    udf3?: string; // planName
    udf4?: string; // userType
    udf5?: string; // billingCycle
}

const PayUForm: React.FC<PayUFormProps> = ({
    amount,
    productInfo,
    firstName,
    email,
    phone,
    txnid,
    surl,
    furl,
    udf2,
    udf3,
    udf4,
    udf5,
}) => {
    const [hash, setHash] = useState<string>('');
    const [merchantKey, setMerchantKey] = useState<string>('');
    const [error, setError] = useState<string>('');
    const formRef = useRef<HTMLFormElement>(null);

    // Construct Edge Function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const functionUrl = supabaseUrl
        ? `${supabaseUrl}/functions/v1/payu-api`
        : '';

    useEffect(() => {
        const generateHash = async () => {
            try {
                if (!functionUrl) throw new Error("Supabase URL missing");

                const frontendRedirectUrl = surl;

                const { data, error } = await supabase.functions.invoke('payu-api', {
                    body: {
                        action: 'generate-hash',
                        txnid,
                        amount,
                        productinfo: productInfo,
                        firstname: firstName,
                        email,
                        udf1: frontendRedirectUrl, // Sending frontend URL as udf1
                        udf2, // userId
                        udf3, // planName
                        udf4, // userType
                        udf5, // billingCycle
                    },
                });

                if (error) throw error;
                if (data?.error) throw new Error(data.error);

                setHash(data.hash);
                setMerchantKey(data.key);
            } catch (err: any) {
                console.error('Error generating hash:', err);
                setError('Failed to initiate payment. Please try again.');
            }
        };

        if (txnid && amount) {
            generateHash();
        }
    }, [txnid, amount, productInfo, firstName, email, surl, functionUrl, udf2, udf3, udf4]);

    useEffect(() => {
        if (hash && merchantKey && formRef.current) {
            formRef.current.submit();
        }
    }, [hash, merchantKey]);

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!hash) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-gray-100 shadow-xl">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
                <p className="text-gray-600 font-bold">Securing your transaction...</p>
            </div>
        );
    }

    return (
        <form
            ref={formRef}
            action="https://test.payu.in/_payment"
            method="post"
            style={{ display: 'none' }}
        >
            <input type="hidden" name="key" value={merchantKey} />
            <input type="hidden" name="txnid" value={txnid} />
            <input type="hidden" name="productinfo" value={productInfo} />
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="firstname" value={firstName} />
            <input type="hidden" name="lastname" value="" />

            {/* Point surl and furl to the Edge Function */}
            <input type="hidden" name="surl" value={functionUrl} />
            <input type="hidden" name="furl" value={functionUrl} />

            {/* Pass the custom parameters */}
            <input type="hidden" name="udf1" value={surl} />
            <input type="hidden" name="udf2" value={udf2 || ""} />
            <input type="hidden" name="udf3" value={udf3 || ""} />
            <input type="hidden" name="udf4" value={udf4 || ""} />
            <input type="hidden" name="udf5" value={udf5 || ""} />

            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="hash" value={hash} />
        </form>
    );
};

export default PayUForm;
