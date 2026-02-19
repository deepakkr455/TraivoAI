import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowLeft, Download, Layout, FileText, Image as ImageIcon, Plus, Trash2, Sparkles, Wand2, ChevronDown, Loader2 } from 'lucide-react';
import { FlyerData, TemplateId } from './types';
import { TEMPLATES, DEFAULT_FLYER_DATA, THEME_COLORS } from './constants';
import { FlyerPreview } from './FlyerTemplates';
import { generateTravelImage, parseItineraryWithAI } from '../../services/geminiService';
import { useSubscription } from '../../../../hooks/useSubscription';

interface TravelFlyerEditorProps {
    onBack: () => void;
}

const TravelFlyerEditor: React.FC<TravelFlyerEditorProps> = ({ onBack }) => {
    const [data, setData] = useState<FlyerData>(DEFAULT_FLYER_DATA);
    const [activeTemplate, setActiveTemplateState] = useState<TemplateId>('luxury');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [generationPrompt, setGenerationPrompt] = useState('');
    const [rawItineraryText, setRawItineraryText] = useState('');
    const [view, setView] = useState<'edit' | 'preview'>('edit');
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [itineraryError, setItineraryError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showLineItems, setShowLineItems] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        studio: true,
        templates: true,
        smart: false,
        assets: true,
        info: true,
        items: false
    });

    const { userSubscription, availablePlans, dailyQueryCount, checkQuota, refresh } = useSubscription();

    const setActiveTemplate = (id: TemplateId) => {
        setActiveTemplateState(id);
        // Apply sensible defaults for each template
        const updates: Partial<FlyerData> = {};
        if (id === 'luxury') {
            updates.layoutPattern = 'diagonal-slice';
            updates.fontFamily = 'serif';
            updates.bgStyle = 'textured';
        } else if (id === 'editorial') {
            updates.layoutPattern = 'editorial';
            updates.fontFamily = 'sans';
            updates.bgStyle = 'clean';
        } else if (id === 'adventure') {
            updates.layoutPattern = 'modern-collage'; // Will show as "Mosaic" in UI
            updates.fontFamily = 'display';
            updates.bgStyle = 'gradient';
        } else if (id === 'mosaic') {
            updates.layoutPattern = 'modern-collage';
            updates.fontFamily = 'sans';
            updates.bgStyle = 'textured';
        } else if (id === 'chronicle') {
            updates.layoutPattern = 'chronicle';
            updates.fontFamily = 'serif';
            updates.bgStyle = 'clean';
        }
        setData(prev => ({ ...prev, ...updates }));
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleItineraryChange = (idx: number, field: string, value: string) => {
        const newItinerary = [...data.itinerary];
        newItinerary[idx] = { ...newItinerary[idx], [field]: value };
        setData(prev => ({ ...prev, itinerary: newItinerary }));
    };

    const addItineraryItem = () => {
        setData(prev => ({
            ...prev,
            itinerary: [...prev.itinerary, { day: `Day ${prev.itinerary.length + 1}`, title: '', description: '', price: '' }]
        }));
    };

    const removeItineraryItem = (idx: number) => {
        setData(prev => ({
            ...prev,
            itinerary: prev.itinerary.filter((_, i) => i !== idx)
        }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        setData(prev => ({ ...prev, images: [...prev.images, event.target?.result as string].slice(-3) }));
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleSmartImport = async () => {
        setItineraryError(null);
        // Check Quota
        if (!checkQuota(availablePlans, userSubscription, dailyQueryCount)) {
            const planName = userSubscription?.plan_name || 'free';
            setItineraryError(`You've reached your daily limit for the ${planName} plan. Upgrade for more.`);
            return;
        }

        if (!rawItineraryText.trim()) {
            setItineraryError("Please paste text to format.");
            return;
        }
        setIsParsing(true);
        try {
            const result = await parseItineraryWithAI(rawItineraryText, userSubscription?.user_id);
            if (result && result.itinerary.length > 0) {
                setData(prev => ({
                    ...prev,
                    itinerary: result.itinerary,
                    title: result.suggestedTitle || prev.title,
                    subtitle: result.suggestedSubtitle || prev.subtitle
                }));
                setRawItineraryText('');
                setShowLineItems(true);
            } else {
                setItineraryError("AI failed to parse. Try pasting a structured list of days.");
            }
        } catch (err) {
            setItineraryError("Failed to connect to AI service.");
        } finally {
            setIsParsing(false);
            refresh(); // Update quota count
        }
    };

    const handleGenerateImage = async () => {
        setImageError(null);

        if (data.images.length >= 3) {
            setImageError("Maximum 3 images allowed. Please remove one user to add another.");
            return;
        }

        // Check Quota
        if (!checkQuota(availablePlans, userSubscription, dailyQueryCount)) {
            const planName = userSubscription?.plan_name || 'free';
            setImageError(`You've reached your daily limit for the ${planName} plan. Upgrade for more.`);
            return;
        }

        if (!generationPrompt.trim()) {
            setImageError("Please describe the image you want to generate.");
            return;
        }
        setIsGenerating(true);
        try {
            const url = await generateTravelImage(generationPrompt, userSubscription?.user_id);
            if (url) {
                setData(prev => ({ ...prev, images: [url, ...data.images].slice(0, 3) }));
            } else {
                setImageError("Failed to generate image.");
            }
        } catch (err) {
            setImageError("Image generation service unavailable.");
        } finally {
            setIsGenerating(false);
            refresh(); // Update quota count
        }
    };

    const handleExportPDF = async () => {
        if (!containerRef.current) return;
        setIsExporting(true);

        try {
            const pages = containerRef.current.querySelectorAll('.flyer-page');
            if (pages.length === 0) return;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;

                // Ensure images are loaded
                const imgs = Array.from(page.querySelectorAll('img'));
                await Promise.all(imgs.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
                }));

                const canvas = await html2canvas(page, {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.85);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            pdf.save(`${data.title.replace(/\s+/g, '_')}_Flyer.pdf`);
        } catch (err) {
            console.error("PDF Export failed:", err);
            setError("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const removeImage = (idx: number) => {
        setData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden animate-in fade-in duration-500 font-sans">
            {/* Top Navigation Bar - Floating Style */}
            <header className="absolute top-0 left-0 right-0 z-50 px-6 py-4 pointer-events-none">
                <div className="max-w-[1920px] mx-auto flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-white/20 p-2 pr-6 rounded-2xl shadow-sm">
                        <button
                            onClick={onBack}
                            className="p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-800"
                            title="Back to Chat"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Wand2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-slate-900 leading-none tracking-tight">VoyageFlyer Studio</h1>
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Design Mode</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-sm">
                        <div className="flex p-1 bg-slate-100/50 rounded-xl">
                            <button
                                onClick={() => setView('edit')}
                                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Editor
                            </button>
                            <button
                                onClick={() => setView('preview')}
                                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${view === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Preview
                            </button>
                        </div>
                        <div className="w-px h-8 bg-slate-200 mx-1"></div>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2.5 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {isExporting ? 'Generating...' : 'Export PDF'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex flex-col lg:flex-row w-full pt-24 lg:pt-0">
                {/* Modern Editor Sidebar */}
                <section ref={sidebarRef} className={`w-full lg:w-[420px] 2xl:w-[480px] bg-white border-r border-slate-100 overflow-y-auto shrink-0 transition-all z-40 lg:pt-24 pb-12 ${view === 'preview' ? 'hidden' : 'block'}`}>
                    <div className="px-6 pb-6 space-y-8">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                {error}
                            </div>
                        )}

                        {/* Templates - Moved to Top */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 px-1">
                                <Layout className="w-4 h-4 text-indigo-500" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Templates</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {TEMPLATES.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTemplate(t.id)}
                                        className={`relative group overflow-hidden rounded-2xl border-2 transition-all ${activeTemplate === t.id ? 'border-indigo-600 shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-indigo-200 hover:shadow-lg'}`}
                                    >
                                        <div className="aspect-[4/3] w-full relative">
                                            <img src={t.thumbnail} className="w-full h-full object-cover" alt={t.name} />
                                            <div className={`absolute inset-0 transition-opacity ${activeTemplate === t.id ? 'bg-indigo-900/10' : 'bg-black/0 group-hover:bg-black/5'}`}></div>
                                        </div>
                                        <div className="p-3 bg-white border-t border-slate-100">
                                            <p className={`text-[10px] font-black uppercase tracking-wider ${activeTemplate === t.id ? 'text-indigo-600' : 'text-slate-600'}`}>{t.name}</p>
                                        </div>
                                        {activeTemplate === t.id && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                                                <Sparkles className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Design Customization */}
                        <div className="space-y-6 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 px-1">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Design System</h2>
                            </div>

                            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-6">
                                {/* Typography */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Typography Style</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { id: 'sans', name: 'Modern', class: 'font-sans' },
                                            { id: 'serif', name: 'Elegant', class: 'font-serif' },
                                            { id: 'display', name: 'Bold', class: 'font-black' }
                                        ].map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => setData(prev => ({ ...prev, fontFamily: f.id as any }))}
                                                className={`py-3 px-2 rounded-xl border-2 text-xs transition-all relative overflow-hidden group ${data.fontFamily === f.id
                                                    ? 'border-indigo-600 bg-white text-indigo-600 shadow-md'
                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200'}`}
                                            >
                                                <span className={`relative z-10 ${f.class}`}>{f.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Layouts */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Composition Pattern</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'modern-collage', name: 'Mosaic Grid' },
                                            { id: 'diagonal-slice', name: 'Dynamic Slice' },
                                            { id: 'chronicle', name: 'The Chronicle' },
                                            { id: 'editorial', name: 'Editorial' }
                                        ].map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setData(prev => ({ ...prev, layoutPattern: p.id as any }))}
                                                className={`py-3 px-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all text-left flex items-center justify-between group ${data.layoutPattern === p.id
                                                    ? 'border-indigo-600 bg-white text-indigo-600 shadow-md'
                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200'}`}
                                            >
                                                {p.name}
                                                <div className={`w-2 h-2 rounded-full ${data.layoutPattern === p.id ? 'bg-indigo-600' : 'bg-slate-200 group-hover:bg-indigo-200'}`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Theme */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Color Atmosphere</label>
                                    <div className="flex flex-wrap gap-3">
                                        {THEME_COLORS.map((color) => (
                                            <button
                                                key={color.value}
                                                onClick={() => setData(prev => ({ ...prev, colorTheme: color.value }))}
                                                className={`w-10 h-10 rounded-full border-2 transition-all transform hover:scale-110 flex items-center justify-center ${data.colorTheme === color.value ? 'border-indigo-600 shadow-lg scale-110' : 'border-transparent shadow-sm'}`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            >
                                                {data.colorTheme === color.value && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* Content Editors */}
                        <div className="space-y-6 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 px-1">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Content</h2>
                            </div>

                            {/* Info */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-1">
                                <button onClick={() => toggleSection('info')} className="w-full p-4 flex items-center justify-between text-left group">
                                    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Basic Information</span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.info ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`px-4 pb-4 space-y-4 ${expandedSections.info ? 'block' : 'hidden'}`}>
                                    <div className="space-y-3">
                                        <div className="group">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">Title</label>
                                            <input type="text" name="title" value={data.title} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all" />
                                        </div>
                                        <div className="group">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">Subtitle</label>
                                            <textarea name="subtitle" value={data.subtitle} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none h-20" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="group">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">No. of Days</label>
                                                <input type="text" name="duration" value={data.duration || `${data.itinerary.length} Days`} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all" />
                                            </div>
                                            <div className="group">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">Price</label>
                                                <input type="text" name="priceTotal" value={data.priceTotal} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-emerald-700 focus:border-emerald-500 focus:bg-white outline-none transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Images */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-1">
                                <button onClick={() => toggleSection('assets')} className="w-full p-4 flex items-center justify-between text-left group">
                                    <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Visual Assets</span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.assets ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`px-4 pb-4 space-y-4 ${expandedSections.assets ? 'block' : 'hidden'}`}>
                                    <div className="grid grid-cols-3 gap-3">
                                        {data.images.map((img, i) => (
                                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100 shadow-sm">
                                                <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`gallery-${i}`} />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                                <button
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {data.images.length < 3 && (
                                            <label className="aspect-square border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 text-indigo-400 transition-all group overflow-hidden">
                                                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform mb-1" />
                                                <span className="text-[8px] font-black uppercase tracking-wider text-center px-1">Add Photo</span>
                                                <input type="file" className="hidden" multiple onChange={handleFileUpload} accept="image/*" />
                                            </label>
                                        )}
                                    </div>
                                    <div className="flex gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                        <input
                                            type="text"
                                            value={generationPrompt}
                                            onChange={(e) => setGenerationPrompt(e.target.value)}
                                            placeholder="Generate with AI..."
                                            className="flex-1 px-3 py-2 text-xs bg-transparent outline-none font-medium text-slate-700 placeholder:text-slate-400"
                                        />
                                        <button
                                            onClick={handleGenerateImage}
                                            disabled={isGenerating}
                                            className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {imageError && (
                                        <p className="text-[10px] text-red-500 font-bold mt-2 px-1 animate-in slide-in-from-top-1 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                                            {imageError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Itinerary */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-1">
                                <button onClick={() => toggleSection('items')} className="w-full p-4 flex items-center justify-between text-left group">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Itinerary & Details</span>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{data.itinerary.length}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.items ? 'rotate-180' : ''}`} />
                                </button>

                                <div className={`px-4 pb-4 space-y-4 ${expandedSections.items ? 'block' : 'hidden'}`}>
                                    {/* Smart Import */}
                                    <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> AI Importer
                                            </span>
                                        </div>
                                        <textarea
                                            value={rawItineraryText}
                                            onChange={(e) => setRawItineraryText(e.target.value)}
                                            placeholder="Paste itinerary text here to auto-format..."
                                            className="w-full p-3 bg-white border border-indigo-100 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-sm h-20 mb-2"
                                        />
                                        <button
                                            onClick={handleSmartImport}
                                            disabled={isParsing || !rawItineraryText.trim()}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 transition-colors"
                                        >
                                            {isParsing ? 'Processing...' : 'Auto-Format'}
                                        </button>
                                        {itineraryError && (
                                            <p className="text-[10px] text-red-500 font-bold mt-2 px-1 animate-in slide-in-from-top-1 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                                                {itineraryError}
                                            </p>
                                        )}
                                    </div>

                                    {/* List */}
                                    <div className="space-y-3">
                                        {data.itinerary.map((item, idx) => (
                                            <div key={idx} className="p-3 bg-white rounded-xl border-2 border-slate-100 relative group hover:border-indigo-200 transition-all shadow-sm">
                                                <button onClick={() => removeItineraryItem(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                                <div className="flex gap-2 mb-2">
                                                    <input type="text" value={item.day} onChange={(e) => handleItineraryChange(idx, 'day', e.target.value)} className="w-16 px-2 py-1.5 text-[10px] font-black bg-slate-50 text-slate-700 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" />
                                                    <input type="text" placeholder="Title" value={item.title} onChange={(e) => handleItineraryChange(idx, 'title', e.target.value)} className="flex-1 px-2 py-1.5 text-xs font-bold bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-indigo-500" />
                                                </div>
                                                <textarea value={item.description} onChange={(e) => handleItineraryChange(idx, 'description', e.target.value)} className="w-full px-2 py-2 text-[10px] text-slate-800 bg-slate-50 border border-slate-200 rounded-lg h-16 resize-none outline-none focus:border-indigo-500 leading-relaxed" />
                                            </div>
                                        ))}
                                        <button onClick={addItineraryItem} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                                            <Plus className="w-4 h-4" /> Add Day
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Modern Preview Area */}
                <section className={`flex-1 bg-slate-100/50 relative overflow-hidden flex flex-col items-center justify-center ${view === 'edit' ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>

                    <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center pt-8 pb-20 lg:pt-24 px-4 sm:px-8">
                        <div className="w-full max-w-[850px] flex flex-col items-center relative z-10 transition-all duration-500">

                            {/* Live Preview Header */}
                            <div className="w-full mb-6 flex items-center justify-between text-slate-400 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Live Preview</span>
                                </div>
                                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                                    <span>A4 Portrait</span>
                                    <span>300 DPI</span>
                                </div>
                            </div>

                            <div ref={containerRef} className="w-full min-h-screen origin-top transition-transform duration-300">
                                <FlyerPreview
                                    data={data}
                                    templateId={activeTemplate}
                                    onUpdate={(field, val) => setData(prev => ({ ...prev, [field as keyof FlyerData]: val }))}
                                    onItineraryUpdate={(idx, field, val) => handleItineraryChange(idx, field as string, val)}
                                    isEditable={view === 'edit'}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            @media print { 
              .flyer-page { margin-bottom: 0 !important; break-after: page; box-shadow: none !important; } 
            }
          `}</style>
        </div>
    );
};

export default TravelFlyerEditor;
