import React, { useEffect, useState, useRef } from 'react';
import { getAffiliateBanners, incrementAffiliateView, incrementAffiliateClick } from '../services/supabaseService';
import { AffiliateListing } from '../types';

interface AffiliateBannerProps {
    bannerType: 'horizontal-banner' | 'vertical-banner' | 'square-banner';
    className?: string;
    source?: string;
}

export const AffiliateBanner: React.FC<AffiliateBannerProps> = ({ bannerType, className, source }) => {
    const [banner, setBanner] = useState<AffiliateListing | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadBanner = async () => {
            console.log(`[AffiliateBanner] Fetching banners for type: ${bannerType}${source ? ` (source: ${source})` : ''}`);
            const banners = await getAffiliateBanners(bannerType, 5, source);
            console.log(`[AffiliateBanner] Fetched ${banners.length} banners for ${bannerType}`, banners);

            if (banners.length > 0) {
                // Randomize
                const randomIndex = Math.floor(Math.random() * banners.length);
                const selected = banners[randomIndex];
                console.log(`[AffiliateBanner] Selected banner:`, selected.title, `(${selected.banner_type})`);
                setBanner(selected);
                incrementAffiliateView(selected.id);
            } else {
                console.warn(`[AffiliateBanner] No active banners found even with broad fallback.`);
            }
        };
        loadBanner();
    }, [bannerType]);

    useEffect(() => {
        if (banner && containerRef.current) {
            console.log(`[AffiliateBanner] Injecting embed code for ${banner.id}`);
            const container = containerRef.current;
            // Clear previous content
            container.innerHTML = banner.embed_code;

            // Manually execute scripts
            const scripts = container.querySelectorAll('script');
            scripts.forEach((script) => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                    newScript.async = true;
                    console.log(`[AffiliateBanner] Loading external script: ${script.src}`);
                } else {
                    newScript.textContent = script.textContent;
                    console.log(`[AffiliateBanner] Executing inline script`);
                }
                container.appendChild(newScript);
                script.remove();
            });
        }
    }, [banner]);

    if (!banner) {
        // Fallback for debugging visibility
        return <div className="hidden">No Banner Data</div>;
    }

    return (
        <div
            className={`affiliate-banner-container overflow-hidden flex justify-center border border-transparent ${bannerType === 'horizontal-banner' ? 'my-6' : ''} ${className}`}
            onClick={() => incrementAffiliateClick(banner.id)}
            style={{
                minHeight: bannerType === 'vertical-banner' ? '400px' : '100px',
                height: bannerType === 'vertical-banner' ? '100%' : 'auto'
            }}
        >
            <div ref={containerRef} className="w-full flex justify-center" />
        </div>
    );
};
