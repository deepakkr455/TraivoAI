import React, { useState, useEffect, useRef } from 'react';
import { FlyerData, TemplateId, ItineraryItem } from './types';

interface FlyerProps {
    data: FlyerData;
    templateId: TemplateId;
    onUpdate?: (field: keyof FlyerData, value: any) => void;
    onItineraryUpdate?: (index: number, field: keyof ItineraryItem, value: any) => void;
    isEditable?: boolean;
}

const EditableText = ({
    initialValue,
    onSave,
    isEditable = true,
    className = "",
    multiline = false,
    placeholder = "Click to edit"
}: {
    initialValue: string;
    onSave?: (val: string) => void;
    isEditable?: boolean;
    className?: string;
    multiline?: boolean;
    placeholder?: string;
}) => {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        if (ref.current && ref.current.innerText !== initialValue && isEditable) {
            ref.current.innerText = initialValue;
        }
    }, [initialValue, isEditable]);

    if (!isEditable || !onSave) return <span className={className}>{initialValue}</span>;

    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
        const newValue = e.currentTarget.innerText;
        if (newValue !== initialValue) {
            onSave(newValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    return (
        <span
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`cursor-text outline-none hover:ring-2 hover:ring-indigo-500/30 focus:ring-2 focus:ring-indigo-500 rounded px-[2px] -mx-[2px] transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400/50 ${className}`}
            data-placeholder={placeholder}
        >
            {initialValue}
        </span>
    );
};

const PageWrapper = ({ children, pageNumber, data, onLabelUpdate, isEditable }: { children: React.ReactNode; pageNumber: number; data: FlyerData; onLabelUpdate?: (key: string, val: string) => void; isEditable?: boolean }) => {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 850) {
                const newScale = (width - 40) / 794;
                setScale(Math.min(newScale, 1));
            } else {
                setScale(1);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const labels = data.labels || {};

    return (
        <div className="flex flex-col items-center w-full">
            <div
                className={`flyer-page w-full bg-white relative overflow-hidden shadow-2xl mb-16 last:mb-0 origin-top transform transition-all duration-300 ${data.fontFamily === 'serif' ? 'font-serif' : data.fontFamily === 'display' ? 'font-black' : 'font-sans'}`}
                style={{
                    aspectRatio: '1 / 1.4142',
                    width: '794px',
                    height: '1123px',
                    transform: `scale(${scale})`,
                    background: data.bgStyle === 'gradient' ? `linear-gradient(135deg, white 0%, ${data.colorTheme}05 100%)` : 'white'
                }}
            >
                {children}
                <div className="absolute bottom-8 right-10 flex items-center gap-3 no-print pointer-events-none">
                    <div className="w-12 h-[1px]" style={{ backgroundColor: `${data.colorTheme}40` }}></div>
                    <span className="text-[8px] font-bold tracking-[0.3em] opacity-40 uppercase" style={{ color: data.colorTheme }}>
                        <EditableText
                            initialValue={labels.pageLabel || 'Page'}
                            onSave={val => onLabelUpdate?.('pageLabel', val)}
                            isEditable={isEditable}
                        /> {pageNumber}
                    </span>
                </div>
                {data.bgStyle === 'textured' && (
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}></div>
                )}
            </div>
            <div style={{ height: scale < 1 ? `${1123 * scale}px` : '0px', marginBottom: scale < 1 ? '2rem' : '0' }}></div>
        </div>
    );
};

const ItineraryTimeline = ({
    items,
    absOffset,
    themeColor,
    isEditable,
    onItineraryUpdate,
    className = ""
}: {
    items: ItineraryItem[];
    absOffset: number;
    themeColor: string;
    isEditable: boolean;
    onItineraryUpdate?: (index: number, field: keyof ItineraryItem, value: any) => void;
    className?: string;
}) => {
    return (
        <div className={`space-y-7 ${className}`}>
            {items.map((item, idx) => {
                const absIndex = absOffset + idx;
                const showDayBadge = idx === 0 || item.day !== items[idx - 1].day;

                return (
                    <div key={idx} className="group relative pl-10">
                        <div className="absolute left-[3px] top-2 bottom-0 w-[1px] bg-slate-100 group-last:bg-transparent"></div>
                        <div className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full ring-4 ring-white" style={{ backgroundColor: themeColor }}></div>

                        <div className="flex justify-between items-baseline mb-1.5">
                            <div className="font-bold text-slate-900 text-[13px] tracking-wide uppercase flex-1 mr-4" style={{ color: themeColor }}>
                                <EditableText
                                    initialValue={item.title}
                                    onSave={val => onItineraryUpdate?.(absIndex, 'title', val)}
                                    isEditable={isEditable}
                                />
                            </div>
                            {showDayBadge && (
                                <div className="text-[9px] font-black px-2 py-0.5 rounded ml-4 uppercase tracking-wider bg-slate-100 text-slate-500 shrink-0">
                                    <EditableText
                                        initialValue={item.day}
                                        onSave={val => onItineraryUpdate?.(absIndex, 'day', val)}
                                        isEditable={isEditable}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            <EditableText
                                initialValue={item.description}
                                onSave={val => onItineraryUpdate?.(absIndex, 'description', val)}
                                multiline
                                isEditable={isEditable}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const FlyerPreview: React.FC<FlyerProps> = ({ data, templateId, onUpdate, onItineraryUpdate, isEditable = true }) => {
    const images = data.images.length > 0 ? data.images : [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1506929199175-609cf3fe4e67?auto=format&fit=crop&q=80&w=1200'
    ];

    const themeColor = data.colorTheme || '#0f172a';
    const labels = data.labels || {};

    const handleLabelUpdate = (key: string, value: string) => {
        if (onUpdate) {
            onUpdate('labels', { ...labels, [key]: value });
        }
    };

    const itemsPerPage1 = 5;
    const itemsPerSubsequentPage = 6;

    const pages: ItineraryItem[][] = [];
    if (data.itinerary.length > 0) {
        pages.push(data.itinerary.slice(0, itemsPerPage1));
        for (let i = itemsPerPage1; i < data.itinerary.length; i += itemsPerSubsequentPage) {
            pages.push(data.itinerary.slice(i, i + itemsPerSubsequentPage));
        }
    } else {
        pages.push([]);
    }

    return (
        <div className="flex flex-col w-full items-center">
            {pages.map((pageItems, listIndex) => {
                const isFirstPage = listIndex === 0;

                return (
                    <PageWrapper key={listIndex} pageNumber={listIndex + 1} data={data} onLabelUpdate={handleLabelUpdate} isEditable={isEditable}>
                        {isFirstPage ? (
                            <div className="h-full flex flex-col">
                                <div className="h-[52%] relative group overflow-hidden">
                                    {data.layoutPattern === 'diagonal-slice' ? (
                                        <div className="absolute inset-0 flex">
                                            <div className="w-[75%] h-full relative overflow-hidden shadow-2xl z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)' }}>
                                                <img src={images[0]} className="w-full h-full object-cover" alt="Hero 1" />
                                                <div className="absolute inset-0 bg-black/10"></div>
                                            </div>
                                            <div className="absolute top-0 right-0 w-[40%] h-full" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)' }}>
                                                <img src={images[1] || images[0]} className="w-full h-full object-cover brightness-90" alt="Hero 2" />
                                            </div>
                                        </div>
                                    ) : data.layoutPattern === 'editorial' ? (
                                        <div className="absolute inset-0 grid grid-cols-12 gap-1 bg-white">
                                            <div className="col-span-8 overflow-hidden relative">
                                                <img src={images[0]} className="w-full h-full object-cover grayscale-[20%] contrast-110" alt="Ed 1" />
                                            </div>
                                            <div className="col-span-4 overflow-hidden relative flex flex-col gap-1">
                                                <div className="flex-1 relative overflow-hidden">
                                                    <img src={images[1] || images[0]} className="w-full h-full object-cover grayscale-[40%]" alt="Ed 2" />
                                                </div>
                                                <div className="flex-1 relative overflow-hidden bg-slate-900 flex items-center justify-center p-6">
                                                    <div className="border border-white/20 w-full h-full flex items-center justify-center">
                                                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest text-center">
                                                            <EditableText
                                                                initialValue={labels.visualJournal || 'Visual\nJournal'}
                                                                onSave={val => handleLabelUpdate('visualJournal', val)}
                                                                multiline
                                                                isEditable={isEditable}
                                                            />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <img src={images[0]} className="w-full h-full object-cover" alt="Hero" />
                                            {data.layoutPattern === 'modern-collage' && images[1] && (
                                                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full border-[1.5rem] border-white/10 backdrop-blur-sm overflow-hidden z-20 shadow-2xl">
                                                    <img src={images[1]} className="w-full h-full object-cover" alt="Feature" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent pointer-events-none"></div>
                                    <div className="absolute bottom-16 left-12 right-12 z-30">
                                        <div className="flex items-center gap-5 mb-6">
                                            <div className="h-[2px] w-16 shadow-lg" style={{ backgroundColor: themeColor }}></div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/90 drop-shadow-md">
                                                <EditableText
                                                    initialValue={labels.heroTag || 'Curated Expedition'}
                                                    onSave={val => handleLabelUpdate('heroTag', val)}
                                                    isEditable={isEditable}
                                                />
                                            </p>
                                        </div>
                                        <div className="max-w-[90%] mb-6">
                                            <EditableText
                                                initialValue={data.title}
                                                onSave={val => onUpdate?.('title', val)}
                                                className="text-6xl md:text-7xl font-black text-white uppercase leading-[0.85] tracking-tighter drop-shadow-2xl block"
                                                isEditable={isEditable}
                                            />
                                        </div>
                                        <div className="flex items-end justify-between border-t border-white/20 pt-6 mt-8">
                                            <div className="max-w-[60%]">
                                                <EditableText
                                                    initialValue={data.subtitle}
                                                    onSave={val => onUpdate?.('subtitle', val)}
                                                    className="text-white/80 text-sm font-medium italic leading-relaxed drop-shadow-md block"
                                                    multiline
                                                    isEditable={isEditable}
                                                />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">
                                                    <EditableText
                                                        initialValue={labels.durationLabel || 'Duration'}
                                                        onSave={val => handleLabelUpdate('durationLabel', val)}
                                                        isEditable={isEditable}
                                                    />
                                                </span>
                                                <span className="text-xl text-white font-black tracking-tight"><EditableText initialValue={data.duration || `${data.itinerary.length} Days`} onSave={val => onUpdate?.('duration', val)} /></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 px-12 py-10 flex gap-16 relative">
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-8">
                                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                                                    <EditableText
                                                        initialValue={labels.voyageTitle || 'The Voyage Detail'}
                                                        onSave={val => handleLabelUpdate('voyageTitle', val)}
                                                        isEditable={isEditable}
                                                    />
                                                </h2>
                                                <div className="h-px w-24 bg-slate-200"></div>
                                            </div>
                                            <ItineraryTimeline
                                                items={pageItems}
                                                absOffset={0}
                                                themeColor={themeColor}
                                                isEditable={isEditable}
                                                onItineraryUpdate={onItineraryUpdate}
                                            />
                                        </div>
                                        <div className="pt-8 flex items-center gap-4 opacity-40">
                                            <div className="w-4 h-4 rounded-full border border-slate-900 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                                            </div>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-900">
                                                <EditableText
                                                    initialValue={labels.officialItinerary || 'Official Itinerary'}
                                                    onSave={val => handleLabelUpdate('officialItinerary', val)}
                                                    isEditable={isEditable}
                                                />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-[280px] flex flex-col gap-6 pt-4">
                                        <div className="p-8 rounded-[24px] shadow-2xl relative overflow-hidden bg-white border border-slate-100">
                                            <div className="absolute top-0 right-0 w-40 h-40 blur-[60px] opacity-20" style={{ backgroundColor: themeColor }}></div>
                                            <span className="inline-block px-3 py-1 rounded-full bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">
                                                <EditableText
                                                    initialValue={labels.investmentTitle || 'Investment'}
                                                    onSave={val => handleLabelUpdate('investmentTitle', val)}
                                                    isEditable={isEditable}
                                                />
                                            </span>
                                            <div className="text-4xl font-black tracking-tighter mb-2" style={{ color: themeColor }}>
                                                <EditableText initialValue={data.priceTotal} onSave={val => onUpdate?.('priceTotal', val)} isEditable={isEditable} />
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium leading-relaxed mb-8">
                                                <EditableText initialValue={labels.investmentDesc || 'Includes all accommodations and guided excursions.'} onSave={val => handleLabelUpdate('investmentDesc', val)} multiline isEditable={isEditable} />
                                            </div>
                                            <button className="w-full py-4 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.25em]" style={{ backgroundColor: themeColor }}>
                                                <EditableText initialValue={labels.bookButton || 'Reserve Now'} onSave={val => handleLabelUpdate('bookButton', val)} isEditable={isEditable} />
                                            </button>
                                        </div>
                                        <div className="flex-1 rounded-[24px] overflow-hidden shadow-lg relative">
                                            <img src={images[2] || images[0]} className="w-full h-full object-cover" alt="Mood" />
                                            <div className="absolute inset-0 bg-black/40"></div>
                                            <div className="absolute bottom-6 left-6 text-white">
                                                <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-80">
                                                    <EditableText initialValue={labels.moodTitle || 'Mood'} onSave={val => handleLabelUpdate('moodTitle', val)} isEditable={isEditable} />
                                                </p>
                                                <p className="text-xl font-serif italic">
                                                    <EditableText initialValue={labels.moodDesc || 'Serenity'} onSave={val => handleLabelUpdate('moodDesc', val)} isEditable={isEditable} />
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col px-16 py-14">
                                <header className="flex justify-between items-start mb-16 border-b border-slate-100 pb-8">
                                    <div className="max-w-[60%]">
                                        <div className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3" style={{ color: themeColor }}>
                                            <EditableText initialValue={data.title} onSave={val => onUpdate?.('title', val)} isEditable={isEditable} />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-px w-8 bg-slate-300"></div>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                                <EditableText initialValue={labels.detailedSchedule || 'Detailed Schedule'} onSave={val => handleLabelUpdate('detailedSchedule', val)} isEditable={isEditable} />
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-1">
                                            <EditableText initialValue={labels.contactTitle || 'Contact'} onSave={val => handleLabelUpdate('contactTitle', val)} isEditable={isEditable} />
                                        </p>
                                        <div className="text-sm font-bold text-slate-900"><EditableText initialValue={data.contactEmail} onSave={val => onUpdate?.('contactEmail', val)} isEditable={isEditable} /></div>
                                        <div className="text-sm font-bold text-slate-900"><EditableText initialValue={data.contactPhone} onSave={val => onUpdate?.('contactPhone', val)} isEditable={isEditable} /></div>
                                    </div>
                                </header>
                                <div className="flex-1 content-start">
                                    <ItineraryTimeline
                                        items={pageItems}
                                        absOffset={itemsPerPage1 + (listIndex - 1) * itemsPerSubsequentPage}
                                        themeColor={themeColor}
                                        isEditable={isEditable}
                                        onItineraryUpdate={onItineraryUpdate}
                                        className="max-w-[700px] mx-auto"
                                    />
                                </div>
                                <footer className="mt-auto pt-8 border-t border-slate-100 flex justify-center">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-30">
                                        <EditableText initialValue={labels.curatedBy || 'Curated by WanderHub'} onSave={val => handleLabelUpdate('curatedBy', val)} isEditable={isEditable} />
                                    </span>
                                </footer>
                            </div>
                        )}
                    </PageWrapper>
                );
            })}
        </div>
    );
};
