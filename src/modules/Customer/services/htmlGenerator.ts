import { TripPlanData } from '../../../types';

import DOMPurify from 'dompurify';

const icons: Record<string, string> = {
    Calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
    Sun: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    CarFront: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v3c0 .6.4 1 1 1h2"/><path d="M19 17H5a2 2 0 0 0-2 2v2h18v-2a2 2 0 0 0-2-2Z"/><path d="M6.5 17.5 5 15"/><path d="M17.5 17.5 19 15"/><path d="M7 11V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6"/></svg>`,
    BedDouble: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/><path d="M2 14h20"/></svg>`,
    Route: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></svg>`,
    HelpCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    DollarSign: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    Lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    WifiOff: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 13.05a10 10 0 0 0 3.27 2.02"/></svg>`,

};

const getIcon = (name: string) => icons[name] || icons['HelpCircle'];

const generateStatChip = (icon: string, value: string) => `
    <div class="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 flex-shrink-0">
        <div class="text-teal-600">${getIcon(icon)}</div>
        <span class="text-sm font-medium text-gray-700 whitespace-nowrap">${value}</span>
    </div>
`;

const generateBudgetCard = (budget: any, participants?: number) => `
    <div class="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-teal-600 text-white rounded-lg flex items-center justify-center">
                ${getIcon('DollarSign')}
            </div>
            <div>
                <p class="text-xs text-teal-700 font-bold uppercase tracking-wider">Estimated Budget</p>
                <p class="text-lg font-extrabold text-teal-900">${DOMPurify.sanitize(budget.total)} <span class="text-xs font-medium text-teal-600">Total</span></p>
            </div>
        </div>
        <div class="flex gap-4">
             <div>
                <p class="text-xs text-gray-500 font-medium">Per Person</p>
                <p class="text-base font-bold text-gray-800">${DOMPurify.sanitize(budget.perPerson)}</p>
            </div>
            ${participants ? `
            <div class="border-l border-teal-200 pl-4">
                <p class="text-xs text-gray-500 font-medium">For</p>
                <p class="text-base font-bold text-gray-800">${participants} ${participants === 1 ? 'Person' : 'People'}</p>
            </div>
            ` : ''}
        </div>
    </div>
`;

const generateItineraryItem = (item: any) => `
    <div class="itinerary-item p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 flex items-center justify-center bg-teal-100 text-teal-600 rounded-lg flex-shrink-0">
                ${getIcon(item.icon)}
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 text-sm mb-1">${DOMPurify.sanitize(item.time)} - ${DOMPurify.sanitize(item.activity)}</p>
                <p class="text-sm text-gray-600 leading-relaxed">${DOMPurify.sanitize(item.description)}</p>
            </div>
        </div>
    </div>
`;

const generateBookingCard = (booking: any) => {
    const shouldTruncate = booking.details.length > 80;
    const truncatedText = shouldTruncate ? booking.details.substring(0, 80) : booking.details;

    return `
    <div class="booking-card bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div class="flex items-center gap-4 p-4">
            <div class="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                <img 
                    src="${DOMPurify.sanitize(booking.imageUrl)}" 
                    alt="${DOMPurify.sanitize(booking.title)}" 
                    class="w-full h-full object-cover"
                    onerror="this.src='https://placehold.co/400x400/0d9488/ffffff?text=${encodeURIComponent(booking.title.substring(0, 5))}'"
                />
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 text-xs font-bold ${booking.type === 'Hotel' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'} rounded">${DOMPurify.sanitize(booking.type)}</span>
                </div>
                <h3 class="text-base font-bold text-gray-900 mb-1 truncate">${DOMPurify.sanitize(booking.title)}</h3>
                <div class="booking-description-container mb-2">
                    <p class="text-sm text-gray-600">
                        <span class="booking-preview">${DOMPurify.sanitize(truncatedText)}${shouldTruncate ? '...' : ''}</span>
                        ${shouldTruncate ? `<span class="booking-full hidden">${DOMPurify.sanitize(booking.details)}</span>` : ''}
                    </p>
                    ${shouldTruncate ? `
                        <button class="booking-read-more text-xs text-teal-600 hover:text-teal-700 font-medium mt-1">Read more</button>
                        <button class="booking-read-less text-xs text-teal-600 hover:text-teal-700 font-medium mt-1 hidden">Read less</button>
                    ` : ''}
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs text-gray-500">via <span class="font-semibold text-teal-600">${DOMPurify.sanitize(booking.bookingSite)}</span></p>
                        ${booking.price ? `<p class="text-sm font-bold text-teal-700 mt-1">${DOMPurify.sanitize(booking.price)}</p>` : ''}
                    </div>
                    <a href="${DOMPurify.sanitize(booking.bookingUrl)}" target="_blank" rel="noopener noreferrer" class="view-details-btn bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-teal-700 transition-colors">
                        View Details
                    </a>
                </div>
            </div>
        </div>
        <div class="px-4 pb-4">
            <p class="text-xs text-gray-500 mb-2">Other providers:</p>
            <div class="flex flex-wrap gap-2">
                ${booking.alternatives.map((alt: any) => `<a href="${DOMPurify.sanitize(alt.url)}" target="_blank" rel="noopener noreferrer" class="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline">${DOMPurify.sanitize(alt.name)}</a>`).join(' • ')}
            </div>
        </div>
    </div>
    `;
};

const generateRecommendationCard = (rec: any) => {
    const shouldTruncate = rec.description.length > 120;
    const truncatedText = shouldTruncate ? rec.description.substring(0, 120) : rec.description;

    return `
    <div class="recommendation-card bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div class="flex items-start gap-4 p-4">
             <div class="w-12 h-12 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-lg flex-shrink-0">
                ${getIcon(rec.icon)}
            </div>
            <div class="flex-1 min-w-0">
                <span class="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded mb-2">${DOMPurify.sanitize(rec.type)}</span>
                <h3 class="text-base font-bold text-gray-900 mb-1">${DOMPurify.sanitize(rec.title)}</h3>
                <div class="rec-description-container">
                    <p class="text-sm text-gray-600 leading-relaxed">
                        <span class="rec-preview">${DOMPurify.sanitize(truncatedText)}${shouldTruncate ? '...' : ''}</span>
                        ${shouldTruncate ? `<span class="rec-full hidden">${DOMPurify.sanitize(rec.description)}</span>` : ''}
                    </p>
                    ${shouldTruncate ? `
                        <button class="rec-read-more text-xs text-gray-500 hover:text-gray-700 mt-2 font-medium">Read more</button>
                        <button class="rec-read-less text-xs text-gray-500 hover:text-gray-700 mt-2 font-medium hidden">Read less</button>
                    ` : ''}
                </div>
            </div>
        </div>
    </div>
    `;
};

export const generateTripPlanHtml = (data: TripPlanData, options?: { printMode?: boolean }): string => {
    const heroText = data.heroImageText || data.title || 'WanderHub Trip';
    const heroImageSrc = data.heroImageUrl || `https://placehold.co/1200x400/0d9488/ffffff?text=${encodeURIComponent(heroText)}`;
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${DOMPurify.sanitize(data.title)}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                body { 
                    font-family: 'Inter', sans-serif;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .tab-button.active { 
                    background-color: #0f766e; /* teal-700 */
                    color: white;
                }
                .tab-pane { 
                    display: none;
                }
                .tab-pane.active { 
                    display: block; 
                }
                /* Print Mode Styles */
                .print-mode .tab-button {
                    display: none;
                }
                .print-mode #tab-nav {
                    display: none;
                }
                .print-mode .tab-pane {
                    display: block !important;
                    margin-bottom: 2rem;
                    page-break-inside: avoid;
                }
                .print-mode .itinerary-item {
                    border: 1px solid #e5e7eb;
                }
                /* Print Mode specific fixes */
                .print-mode .scrollbar-hide {
                    overflow: visible !important;
                    flex-wrap: wrap !important;
                }
                .print-mode .grid-cols-1 {
                    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
                .print-mode .view-details-btn, 
                .print-mode .booking-read-more,
                .print-mode .rec-read-more {
                    display: none !important;
                }
                .print-mode .booking-preview,
                .print-mode .rec-preview {
                    display: none !important;
                }
                .print-mode .booking-full,
                .print-mode .rec-full {
                    display: inline !important;
                }
                .print-mode .pdf-section {
                    padding: 10px !important; /* Add padding to prevent edge clipping */
                    background-color: white; /* Ensure white background */
                }
            </style>
        </head>
        <body class="bg-gray-50 ${options?.printMode ? 'print-mode' : ''}">
            <main class="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
                
                <header id="pdf-section-header" class="mb-6 pdf-section">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-3 py-1 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Subcontinent Specialist</span>
                        ${data.confirmedDates ? `<span class="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                            Dates Confirmed
                        </span>` : ''}
                    </div>
                    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">${DOMPurify.sanitize(data.title)}</h1>
                    <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div class="flex items-center gap-1">
                            ${getIcon('Calendar')}
                            <span>${DOMPurify.sanitize(data.dates)}</span>
                        </div>
                    </div>
                </header>

                <div id="pdf-section-hero" class="pdf-section mb-8">
                     <div class="rounded-2xl overflow-hidden h-72 md:h-96 w-full relative">
                           <img src="${DOMPurify.sanitize(heroImageSrc)}" 
                                 alt="${DOMPurify.sanitize(data.heroImageText)}" 
                                 class="w-full h-full object-cover">
                           <div class="absolute bottom-4 left-4 right-4">
                                <div class="bg-black/40 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white">
                                    <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Trip Overview</p>
                                    <h2 class="text-xl font-bold">${DOMPurify.sanitize(data.title)}</h2>
                                </div>
                           </div>
                    </div>
                </div>

                ${data.budget ? `<div id="pdf-section-budget" class="pdf-section">${generateBudgetCard(data.budget, data.participants)}</div>` : ''}

                <div id="pdf-section-stats" class="pdf-section mb-8">
                    <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        ${generateStatChip('Calendar', DOMPurify.sanitize(data.stats?.duration || 'N/A'))}
                        ${generateStatChip('Sun', DOMPurify.sanitize(data.stats?.weather || 'Check Forecast'))}
                        ${generateStatChip('CarFront', DOMPurify.sanitize(data.stats?.transport || 'Mixed'))}
                        ${generateStatChip('BedDouble', DOMPurify.sanitize(data.stats?.stay || 'Hotels'))}
                        ${generateStatChip('Route', DOMPurify.sanitize(data.stats?.distance || 'Var'))}
                    </div>
                </div>

                <section class="mb-8">
                    <h2 id="pdf-section-itinerary-title" class="pdf-section text-2xl font-bold text-gray-900 mb-6">Itinerary</h2>
                    
                    <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        <nav class="flex gap-2" id="tab-nav">
                            ${(data.dailyItinerary || []).map((day, index) => `
                                <button class="tab-button flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors" data-tab="day${day.day}">
                                    <span class="w-6 h-6 flex items-center justify-center bg-teal-100 text-teal-700 rounded-full text-xs font-bold">${day.day}</span>
                                    ${DOMPurify.sanitize(day.title.split(',')[0] || 'Day ' + day.day)}
                                </button>
                            `).join('')}
                        </nav>
                    </div>

                    <div id="tab-content">
                       ${(data.dailyItinerary || []).map(dayPlan => `
                            <div class="tab-pane" id="day${dayPlan.day}">
                                <div class="bg-white rounded-xl border border-gray-200 p-6 mb-4 pdf-section pdf-day">
                                    <div class="flex items-start gap-4 mb-4">
                                        <div class="w-10 h-10 flex items-center justify-center bg-teal-500 text-white rounded-full text-lg font-bold flex-shrink-0">${dayPlan.day}</div>
                                        <div>
                                            <h3 class="text-xl font-bold text-gray-900">${DOMPurify.sanitize(dayPlan.title)}</h3>
                                        </div>
                                    </div>
                                    <div class="space-y-3 mt-4">
                                        ${(dayPlan.items || []).map(generateItineraryItem).join('')}
                                    </div>
                                </div>
                            </div>
                            `).join('')}
                    </div>
                </section>

                </section>

                <div id="pdf-section-combined-bookings-recs" class="pdf-section grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section>
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">Key Bookings</h2>
                        <div class="space-y-4">
                            ${(data.bookings || []).map(generateBookingCard).join('')}
                        </div>
                    </section>

                    <section>
                        <h2 class="text-2xl font-bold text-gray-900 mb-6">AI Recommendations ✨</h2>
                        <div class="space-y-4">
                            ${(data.recommendations || []).map(generateRecommendationCard).join('')}
                        </div>
                    </section>
                </div>

                <footer class="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                    <p>Generated by WanderAI • ${new Date().getFullYear()}</p>
                </footer>
            </main>

            <script>
                document.addEventListener('DOMContentLoaded', () => {
                    const tabNav = document.getElementById('tab-nav');
                    const tabContent = document.getElementById('tab-content');
                    if (!tabNav || !tabContent) return;

                    const tabButtons = tabNav.querySelectorAll('.tab-button');
                    const tabPanes = tabContent.querySelectorAll('.tab-pane');
                    
                    if (tabButtons.length > 0 && tabButtons[0] && tabPanes[0]) {
                        tabButtons[0].classList.add('active');
                        tabPanes[0].classList.add('active');
                    }

                    tabNav.addEventListener('click', (e) => {
                        const button = e.target.closest('.tab-button');
                        if (button) {
                            const tab = button.dataset.tab;
                            tabButtons.forEach(btn => btn.classList.remove('active'));
                            button.classList.add('active');
                            tabPanes.forEach(pane => {
                                pane.classList.toggle('active', pane.id === tab);
                            });
                        }
                    });

                    // Generic Read more/less handler
                    const setupToggle = (containerSelector, moreSelector, lessSelector, previewSelector, fullSelector) => {
                        document.addEventListener('click', e => {
                            if (e.target.matches(moreSelector)) {
                                const container = e.target.closest(containerSelector);
                                if (!container) return;
                                container.querySelector(previewSelector).classList.add('hidden');
                                container.querySelector(fullSelector).classList.remove('hidden');
                                container.querySelector(moreSelector).classList.add('hidden');
                                container.querySelector(lessSelector).classList.remove('hidden');
                            }
                            if (e.target.matches(lessSelector)) {
                                const container = e.target.closest(containerSelector);
                                if (!container) return;
                                container.querySelector(previewSelector).classList.remove('hidden');
                                container.querySelector(fullSelector).classList.add('hidden');
                                container.querySelector(moreSelector).classList.remove('hidden');
                                container.querySelector(lessSelector).classList.add('hidden');
                            }
                        });
                    };

                    setupToggle('.booking-description-container', '.booking-read-more', '.booking-read-less', '.booking-preview', '.booking-full');
                    setupToggle('.rec-description-container', '.rec-read-more', '.rec-read-less', '.rec-preview', '.rec-full');
                });
            </script>
        </body>
        </html>
    `;
};