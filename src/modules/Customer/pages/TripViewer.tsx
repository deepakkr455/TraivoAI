// pages/TripViewer.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, Trash2, UserPlus, X, Check, Clock, AlertCircle, Users, Mail, Send } from 'lucide-react';
import { plansService, TripWithAccess } from '../services/plansService';
import { invitationsService, Invitation } from '../services/invitationsService';
import { planMembersService, PlanMember } from '../services/planMembersService';
import { supabase } from '../../../services/supabaseClient';
import { messageService } from '../services/messageService';
import { generateTripPlanHtml } from '../services/htmlGenerator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { StageNotificationPanel } from '../components/StageNotificationPanel';
import { TripProgressBreadcrumb } from '../components/TripProgressBreadcrumb';

interface TripViewerProps {
  trip: TripWithAccess;
  blobUrl: string;
  onBack: () => void;
  onDelete: () => void;
  onAcceptInvitation?: () => void;
  onDeclineInvitation?: () => void;
  isResponding?: boolean;
}

export const TripViewer: React.FC<TripViewerProps> = ({
  trip,
  blobUrl,
  onBack,
  onDelete,
  onAcceptInvitation,
  onDeclineInvitation,
  isResponding = false,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<PlanMember[]>([]);
  const [ownerName, setOwnerName] = useState<string>('Trip Owner');
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('TripViewer mounted with trip:', trip);
  }, [trip]);

  // Load invitations, members, and owner info when component mounts
  useEffect(() => {
    if (!trip?.id) return;

    loadInvitations();
    loadMembers();
    loadOwnerInfo();

    // Set up polling to refresh members every 5 seconds
    const interval = setInterval(() => {
      loadMembers();
      loadInvitations();
    }, 5000);

    return () => clearInterval(interval);
  }, [trip.id]);

  const loadInvitations = async () => {
    if (!trip.id) return;
    setIsLoadingInvitations(true);
    const result = await invitationsService.getInvitationsForPlan(trip.id);

    if (result.success && result.data) {
      setInvitations(result.data);
    } else if (result.error) {
      console.error('Failed to load invitations:', result.error);
    }

    setIsLoadingInvitations(false);
  };

  const loadMembers = async () => {
    if (!trip.id) return;
    setIsLoadingMembers(true);
    const result = await planMembersService.getPlanMembers(trip.id);

    if (result.success && result.data) {
      setMembers(result.data);
    } else if (result.error) {
      console.error('Failed to load members:', result.error);
    }

    setIsLoadingMembers(false);
  };

  const loadOwnerInfo = async () => {
    if (!supabase || !trip.ownerId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', trip.ownerId)
        .single();

      if (data && data.full_name) {
        setOwnerName(data.full_name);
      }
    } catch (err) {
      console.error('Error loading owner info:', err);
    }
  };

  /* PDF Download Logic - Chunked Rendering */
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress('Preparing layout...');

    try {
      const planData = (trip as any).updatedPlanData || (trip as any).planData;
      const printHtml = generateTripPlanHtml(planData, { printMode: true });

      // Create container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      // Set width close to A4 ratio. A4 @ 96dpi is ~794px width.
      // We use 1100px for better quality, then scale it down.
      container.style.width = '1100px';
      container.classList.add('print-mode');
      container.innerHTML = printHtml;
      document.body.appendChild(container);

      // Function to wait for all images to load
      const waitForImages = async (container: HTMLElement) => {
        const images = Array.from(container.getElementsByTagName('img'));
        const promises = images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if one image fails
          });
        });
        // Also wait for fonts if possible
        const fontsPromise = (document as any).fonts ? (document as any).fonts.ready : Promise.resolve();
        return Promise.all([...promises, fontsPromise]);
      };

      // Wait for images and fonts intelligently (much faster than fixed 3s)
      await Promise.race([
        waitForImages(container),
        new Promise(resolve => setTimeout(resolve, 5000)) // Cap at 5s total as safety
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // ~210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // ~297mm

      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);

      let cursorY = margin;

      // Select all marked PDF sections
      // We look for elements with class 'pdf-section' which we added in htmlGenerator
      const sections = Array.from(container.querySelectorAll('.pdf-section'));

      if (sections.length === 0) {
        // Fallback if no sections found (shouldn't happen with updated htmlGenerator)
        throw new Error('No PDF sections found');
      }

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        setDownloadProgress(`Rendering page ${i + 1} of ${sections.length}...`);

        // Render section to canvas
        const canvas = await html2canvas(section as HTMLElement, {
          scale: 2, // Reduced from 3 to 2 for performance
          useCORS: true,
          logging: false,
          width: 1100,
          windowWidth: 1100,
          backgroundColor: '#ffffff' // Force white background
        });

        const imgData = canvas.toDataURL('image/png'); // Use PNG for lossless quality
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        // Check availability on current page
        // If content is taller than page usage, we might still have to split it if it's > 1 page itself (handled below)
        // Basic check: if it fits, add it. If not, add new page.
        if (cursorY + imgHeight > pdfHeight - margin) {
          // If it doesn't fit, add new page
          pdf.addPage();
          cursorY = margin;
        }

        // Add image
        // If the single component is taller than a Page, we have to let it flow/crop or handle it.
        // For now, assuming most sections (single days) fit on one page. 
        // If a day is huge, it will be scaled to fit width, but might overflow height.
        // We will just add it. If it overflows, it might be cut.
        // IMPROVEMENT: If imgHeight > pdfHeight, we must split it.

        if (imgHeight < pdfHeight - (margin * 2)) {
          // Fits on one page (even if new page needed)
          pdf.addImage(imgData, 'JPEG', margin, cursorY, contentWidth, imgHeight);
          cursorY += imgHeight + 5; // 5mm gap
        } else {
          // Super tall section (rare for single day, but possible)
          // We print what fits, add page, print rest.
          let heightLeft = imgHeight;
          let printOffset = 0; // Position in the source image

          // First chunk
          // Available space on current page
          const spaceOnCurrentPage = pdfHeight - margin - cursorY;

          // We can't really "slice" the jpeg easily with addImage without complex src cropping.
          // Easier trick: Print the whole image shifted up, with a clipping mask? No.
          // Robust way: html2canvas the whole thing, then manually split logic.
          // BUT, since we loop sections, let's just force a new page for safety if it's huge
          if (cursorY > margin) {
            pdf.addPage();
            cursorY = margin;
          }

          // Naive loop for tall content
          let pageCursor = 0; // Where we are drawing on the PDF page (relative to top)

          // Just add it and let it flow? JS PDF addImage doesn't auto-flow.
          // We use the multi-page logic for this specific section
          let internalCursor = 0; // where we are in the image

          while (heightLeft > 0) {
            const heightToPrint = Math.min(heightLeft, pdfHeight - (margin * 2));

            // How to crop: addImage(imageData, format, x, y, w, h, alias, compression, rotation) 
            // JS PDF doesn't support source-cropping args in standard addImage.
            // We have to use the "move image up" trick with a mask, or just overlap.
            // "mask" in jsPDF is hard.
            // "Move image up" is the standard trick:
            // On page 1: draw at y=0.
            // On page 2: draw at y = -pageHeight.

            pdf.addImage(imgData, 'JPEG', margin, cursorY - internalCursor, contentWidth, imgHeight);

            // If we have more to print, add page
            internalCursor += (pdfHeight - (margin * 2));
            heightLeft -= (pdfHeight - (margin * 2));

            if (heightLeft > 0) {
              pdf.addPage();
              cursorY = margin;
            } else {
              cursorY = margin + Math.min(imgHeight, (pdfHeight - (margin * 2))) % (pdfHeight - (margin * 2));
              // actually tracking cursorY after a split is tricky.
              // simplified: just end the loop. Reset cursor for next component is safer on new page.
              cursorY = margin + (imgHeight - internalCursor) + 5; // roughly
              // If we are on a fresh page (likely), updates cursor.
              // The logic above needs valid math.
              // fallback: just accept the page break state.
              cursorY = pdfHeight; // force new page for next component
            }
          }

          // After large item, just start next one on new page to be clean
          cursorY = pdfHeight;
        }

      }

      setDownloadProgress('Saving PDF...');
      const fileName = `${trip.title.replace(/[^a-z0-9]/gi, '_')}_Itinerary.pdf`;
      pdf.save(fileName);
      document.body.removeChild(container);

    } catch (error) {
      console.error('PDF Generation Failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.title,
          text: `Check out my trip plan: ${trip.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed', error);
      }
    } else {
      alert('Share feature not available. Link copied to clipboard!');
    }
  };

  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete "${trip.title}"?`)) {
      onDelete();
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSendingInvite(true);
    setError(null);

    const result = await invitationsService.sendInvitation(trip.id, inviteEmail);

    if (result.success) {
      setInviteEmail('');
      await loadInvitations();
    } else {
      setError(result.error || 'Failed to send invitation');
    }

    setIsSendingInvite(false);
  };

  const handleCancelInvite = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    const result = await invitationsService.cancelInvitation(invitationId);

    if (result.success) {
      await loadInvitations();
    } else {
      setError(result.error || 'Failed to cancel invitation');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this trip?`)) {
      return;
    }

    const result = await planMembersService.removeMember(memberId);

    if (result.success) {
      await loadMembers();
    } else {
      setError(result.error || 'Failed to remove member');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    let date: Date;
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      date = new Date(dateString);
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  if (!trip) {
    return <div className="p-4 text-red-500">Error: Trip data is missing.</div>;
  }

  // Safely access track_expenses
  const trackExpenses = (trip as any).track_expenses;

  return (
    <div className="h-screen w-screen bg-gray-50 flex relative overflow-hidden font-sans">
      {/* Mobile Sidebar Toggle Button - Floating Bottom Right */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed bottom-6 right-6 lg:hidden z-40 bg-teal-600 hover:bg-teal-700 text-white shadow-lg p-4 rounded-full transition-all hover:shadow-xl hover:scale-105 active:scale-95"
        title="Toggle invite panel"
      >
        <UserPlus className="w-6 h-6" />
      </button>

      {/* Floating Action Buttons - Desktop */}
      {trip.isOwner && (
        <div className="hidden lg:flex absolute top-[1.5rem] right-[350px] z-20 items-center gap-2">
          <button
            onClick={handleDownload}
            className={`bg-white/95 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg p-2.5 rounded-full transition-all border border-gray-200 group relative ${isDownloading ? 'cursor-wait' : ''}`}
            title={isDownloading ? downloadProgress : "Download trip plan"}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                {downloadProgress && (
                  <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                    {downloadProgress}
                  </span>
                )}
              </>
            ) : (
              <Download className="w-5 h-5 text-gray-600 group-hover:text-teal-600" />
            )}
          </button>

          <button
            onClick={handleShare}
            className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg p-2.5 rounded-full transition-all border border-gray-200 group"
            title="Share trip"
          >
            <Share2 className="w-5 h-5 text-gray-600 group-hover:text-teal-600" />
          </button>

          <button
            onClick={handleDeleteClick}
            className="bg-white/95 backdrop-blur-sm hover:bg-red-50 shadow-md hover:shadow-lg p-2.5 rounded-full transition-all border border-gray-200 group"
            title="Delete trip"
          >
            <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
          </button>
        </div>
      )}

      {/* Mobile Action Buttons */}
      {trip.isOwner && (
        <div className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-4 bg-white/95 backdrop-blur-md shadow-2xl rounded-full px-6 py-3 border border-gray-100 ring-1 ring-gray-200">
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group relative"
            title={isDownloading ? downloadProgress : "Download trip plan"}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                {downloadProgress && (
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                    {downloadProgress}
                  </span>
                )}
              </>
            ) : (
              <Download className="w-5 h-5 text-gray-600 group-hover:text-teal-600" />
            )}
          </button>

          <div className="w-px h-6 bg-gray-300"></div>

          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
            title="Share trip"
          >
            <Share2 className="w-5 h-5 text-gray-600 group-hover:text-teal-600" />
          </button>

          <div className="w-px h-6 bg-gray-300"></div>

          <button
            onClick={handleDeleteClick}
            className="p-2 hover:bg-red-50 rounded-full transition-colors group"
            title="Delete trip"
          >
            <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
          </button>
        </div>
      )}

      {/* Main Container - Row on Desktop, Column on Mobile */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left Vertical Sidebar (Desktop Only) */}
        <div className="hidden lg:flex w-30 flex-col z-20">
          <div className="p-4 border-b border-gray-100 mb-2">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-teal-700 transition-colors font-medium w-full px-2 py-2 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto theme-scrollbar p-2">
            <TripProgressBreadcrumb
              currentStatus={trip.status}
              isAdmin={trip.isOwner}
              isMember={trip.isMember}
              tripId={trip.id}
              trackExpenses={trackExpenses}
              orientation="vertical"
            />
          </div>
        </div>

        {/* Center Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto relative">

          {/* Mobile Header (Hidden on Large Screens) */}
          <div className={`lg:hidden bg-white border-b border-gray-200 sticky top-0 z-50 ${isSidebarOpen ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-teal-700 transition-colors font-medium px-2 py-1 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </button>
            </div>

            {/* Horizontal Breadcrumb for Mobile */}
            <div className="px-4 pb-2">
              <TripProgressBreadcrumb
                currentStatus={trip.status}
                isAdmin={trip.isOwner}
                isMember={trip.isMember}
                tripId={trip.id}
                trackExpenses={trackExpenses}
                orientation="horizontal"
              />
            </div>
          </div>

          {/* Trip Plan Iframe */}
          <div className="flex-1 overflow-hidden bg-gray-100/50 relative">
            <iframe
              src={blobUrl}
              className="w-full h-full border-none"
              title={trip.title}
              sandbox="allow-scripts"
            />
          </div>



        </div>

        {/* Right Sidebar - Invite Friends & Members */}
        <div className={`
            fixed lg:relative
            top-0 right-0 h-full
            w-full sm:w-[380px] lg:w-[340px]
            bg-white border-l border-gray-200
            flex flex-col overflow-hidden shadow-2xl lg:shadow-none
            transform transition-transform duration-300 ease-in-out
            z-40 lg:z-0
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          {/* Header (Only visible on mobile/when opened as sidebar) */}
          <div className="lg:hidden p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="font-semibold text-gray-800">Trip Collaboration</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Invite Section */}
          {trip.isOwner && (
            <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-600" />
                Invite Friends
              </h2>

              {/* <button
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    window.location.href = '/login';
                    return;
                  }

                  // Use ownerId as agentId fallback if we don't have a specific agent
                  const agentId = trip.ownerId || '29605330-80a2-4752-9b2f-2267f565f3f3';
                  const customerName = (user as any)?.user_metadata?.full_name || user.email || 'Traveler';
                  const avatarUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture || null;

                  const inquiryId = await messageService.checkOrCreateInquiry('TRIP_QUERY', agentId, user.id, customerName, avatarUrl, trip.id);
                  if (inquiryId) {
                    window.location.href = `/user/messages?inquiry_id=${inquiryId}`;
                  }
                }}
                className="w-full mb-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 font-bold"
              >
                <Send className="w-4 h-4" />
                Chat with an Agent
              </button> */}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Name@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                  disabled={isSendingInvite}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-700 shadow-sm transition-all placeholder:text-gray-400"
                />
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail || !inviteEmail.includes('@') || isSendingInvite}
                  className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSendingInvite ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending Invite...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Invite</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}



          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-2 py-2 theme-scrollbar">
            {(isLoadingInvitations || isLoadingMembers) && members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-3"></div>
                <p className="text-sm text-gray-500">Loading members...</p>
              </div>
            ) : (
              <div className="space-y-6 p-2">
                {/* Trip Members */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Trip Members ({members.filter(m => m.user_id !== trip.ownerId).length + 1})
                  </h3>

                  <div className="space-y-2">
                    {/* Owner - Always first */}
                    <div className="flex items-center gap-3 p-3 bg-teal-50/50 border border-teal-100 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                        {trip.isOwner ? 'ME' : getInitials(ownerName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">
                            {trip.isOwner ? 'You (Owner)' : ownerName}
                          </p>
                          <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">Admin</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">Created {formatDate(trip.createdAt)}</p>
                      </div>
                    </div>

                    {/* Actual Members */}
                    {members.filter(m => m.user_id !== trip.ownerId).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 hover:border-teal-200 rounded-xl transition-all hover:shadow-md group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                          {getInitials(member.user_name || 'U')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {member.user_name || 'Team Member'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined {formatDate(member.created_at)}
                          </p>
                        </div>
                        {trip.isOwner && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.user_name || 'this member')}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove member"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Pending Invites ({pendingInvitations.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingInvitations.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl"
                        >
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-sm">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {invite.invited_email}
                            </p>
                            <p className="text-xs text-amber-600/80 mt-0.5">
                              Sent {formatDate(invite.created_at)}
                            </p>
                          </div>
                          {trip.isOwner && (
                            <button
                              onClick={() => handleCancelInvite(invite.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel invite"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Invitation Notification - Only for pending invitations */}
            {trip.invitation && trip.invitation.status === 'pending' && (
              <div className="m-4 p-5 rounded-2xl border-2 border-teal-500 bg-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-teal-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">You're Invited!</h3>
                <p className="text-sm text-gray-600 mb-4 relative z-10">
                  Join <span className="font-semibold text-teal-700">{trip.title}</span> and start planning together.
                </p>

                <div className="flex gap-2 relative z-10">
                  <button
                    onClick={onAcceptInvitation}
                    disabled={isResponding}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-3 rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    {isResponding ? '...' : <><Check className="w-4 h-4" /> Accept</>}
                  </button>
                  <button
                    onClick={onDeclineInvitation}
                    disabled={isResponding}
                    className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold py-2 px-3 rounded-lg text-sm shadow-sm transition-all flex items-center justify-center gap-1"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* Stage Notification Panel - Show for everyone (owner and members) */}
          <div className="p-4 border-b border-gray-100">
            <StageNotificationPanel
              stage={trip.status}
              tripId={trip.id}
              isAdmin={trip.isOwner}
              isMember={trip.isMember}
            />
          </div>
          {/* Admin Control: Start Collaboration */}
          {trip.isOwner && (trip.status === 'planning' || trip.status === 'invite') && (
            <div className="p-4 bg-teal-50 border-b border-teal-100">
              <button
                onClick={async () => {
                  if (window.confirm('Start collaboration phase? Members will be notified.')) {
                    const result = await plansService.updatePlanStatus(trip.id, 'collaboration');
                    if (result.success) {
                      window.location.reload();
                    } else {
                      alert('Failed to start collaboration');
                    }
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Start Collaboration
              </button>
            </div>
          )}

        </div>

        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
      </div>
    </div >
  );
};
