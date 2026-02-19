import React, { useEffect } from 'react';
import { AffiliateListing } from '../types';
import { incrementAffiliateView, incrementAffiliateClick } from '../services/supabaseService';

interface AffiliateCardProps {
    listing: AffiliateListing;
}

export const AffiliateCard: React.FC<AffiliateCardProps> = ({ listing }) => {

    const cardRef = React.useRef<HTMLDivElement>(null);
    const hasViewed = React.useRef(false);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Track View when visible for 2 seconds
    useEffect(() => {
        if (hasViewed.current || !listing.id) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    // Element is visible (50%), start timer
                    timerRef.current = setTimeout(() => {
                        if (!hasViewed.current && listing.id) {
                            incrementAffiliateView(listing.id);
                            hasViewed.current = true;
                            observer.disconnect();
                        }
                    }, 2000); // 2 seconds threshold
                } else {
                    // Element left visibility, clear timer
                    if (timerRef.current) {
                        clearTimeout(timerRef.current);
                        timerRef.current = null;
                    }
                }
            },
            { threshold: 0.5 } // 50% of the card must be visible
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            observer.disconnect();
        };
    }, [listing.id]);

    // Track Click Handler
    const handleCardClick = () => {
        incrementAffiliateClick(listing.id);
    };

    // Track Mouse State for iframe click detection
    const isMouseOver = React.useRef(false);

    useEffect(() => {
        const onWindowBlur = () => {
            if (isMouseOver.current) {
                // Window lost focus while mouse was over this card (usually an iframe click)
                handleCardClick();

                // CRITICAL: Refocus the window after a short delay.
                // If we don't refocus, the next click on a different iframe won't trigger a "blur" event
                // because the window is already blurred.
                setTimeout(() => {
                    window.focus();
                }, 100);
            }
        };

        window.addEventListener('blur', onWindowBlur);
        return () => window.removeEventListener('blur', onWindowBlur);
    }, []);

    // Dynamically load external scripts if needed (e.g., GetYourGuide)
    useEffect(() => {
        if (listing.affiliate_source === 'getyourguide' || listing.embed_code.includes('data-gyg-')) {
            const scriptId = 'gyg-partner-widget';

            // Function to trigger GYG processing with retry logic
            const refreshWidgets = () => {
                // Poll for the GYG object availability
                const checkInterval = setInterval(() => {
                    const gyg = (window as any).GetYourGuide;
                    if (gyg) {
                        // console.log("GYG Object found, triggering load...");
                        if (gyg.widget && typeof gyg.widget.load === 'function') {
                            gyg.widget.load();
                            clearInterval(checkInterval); // Success
                        } else if (gyg.q) {
                            gyg.q.push(() => {
                                // console.log("Pushed to GYG queue");
                                if (gyg.widget && typeof gyg.widget.load === 'function') {
                                    gyg.widget.load();
                                }
                            });
                            clearInterval(checkInterval); // Queued
                        }
                    } else {
                        // console.log("Waiting for GYG script...");
                    }
                }, 500); // Check every 500ms

                // Stop checking after 10 seconds to avoid infinite polling
                setTimeout(() => clearInterval(checkInterval), 10000);
            };

            if (!document.getElementById(scriptId)) {
                // console.log("Injecting GYG script...");
                const script = document.createElement('script');
                script.id = scriptId;
                script.defer = true;
                script.src = 'https://widget.getyourguide.com/dist/pa.umd.production.min.js';
                // script.onload = refreshWidgets; // Onload might race, let polling handle it
                document.body.appendChild(script);
                refreshWidgets();
            } else {
                // Script already exists, just trigger refresh
                // console.log("GYG script exists, refreshing...");
                refreshWidgets();
            }
        }
    }, [listing.id]); // Re-run if listing changes, specific to ID to be safe

    return (
        <div
            ref={cardRef}
            onClickCapture={handleCardClick}
            onMouseEnter={() => { isMouseOver.current = true; }}
            onMouseLeave={() => { isMouseOver.current = false; }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full cursor-pointer relative group"
        >

            {/* If we have an embed code, render it */}
            {listing.embed_code ? (
                <div className="w-full overflow-hidden min-h-[150px] relative bg-gray-50 flex items-center justify-center">
                    {/* Wrapper for widget to ensure it doesn't break layout */}
                    <div
                        dangerouslySetInnerHTML={{ __html: listing.embed_code }}
                        className="w-full"
                    />
                </div>
            ) : (
                /* Fallback if no embed code (manual link) */
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Preview</span>
                </div>
            )}
        </div>
    );
};
