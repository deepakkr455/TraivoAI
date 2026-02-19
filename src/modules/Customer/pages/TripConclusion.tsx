// pages/TripConclusion.tsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CheckCircle,
  Globe,
  MessageSquare,
  Star,
  Send,
  Sparkles,
  TrendingUp,
  DollarSign,
  MapPin,
  Calendar,
  ThumbsUp,
  Award,
  Lock,
  Share2,
  ArrowLeft,
} from 'lucide-react';
import { TripSummaryData, conclusionService, Feedback } from '../services/conclusionService';
import { generateTripSummary } from '../services/geminiService';
import { plansService } from '../services/plansService';

interface TripConclusionProps {
  tripTitle: string;
  tripId: string;
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
  summaryData: TripSummaryData;
  onFinish: () => void;
  onEmailReport?: () => void;
}

export const TripConclusion: React.FC<TripConclusionProps> = ({
  tripTitle,
  tripId,
  currentUserId,
  currentUserName,
  isAdmin,
  summaryData,
  onFinish,
  onEmailReport,
}) => {
  const [aiSummary, setAiSummary] = useState<string>(summaryData.aiSummary || '');
  const [isLoadingSummary, setIsLoadingSummary] = useState(!summaryData.aiSummary);
  const [isPublic, setIsPublic] = useState(false); // Ideally passed in props or fetched
  const [showPublicSuccess, setShowPublicSuccess] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Load initial data
  useEffect(() => {
    // Load feedback
    const loadFeedback = async () => {
      const result = await conclusionService.getFeedback(tripId);
      if (result.success && result.data) {
        setFeedbacks(result.data);
        // Check if user has already submitted
        const myFeedback = result.data.find(f => f.user_id === currentUserId);
        if (myFeedback) {
          setHasSubmittedFeedback(true);
        }
      }
    };
    loadFeedback();

    // Check if trip is public (optimization: could happen in parent)
    const checkPublic = async () => {
      const planResult = await plansService.getPlan(tripId);
      if (planResult.success && planResult.data) {
        setIsPublic(planResult.data.isPublic);
      }
    };
    checkPublic();

    // Generate AI Summary if missing
    if (!aiSummary) {
      if (isAdmin) {
        generateAndSaveSummary();
      } else {
        setIsLoadingSummary(false);
      }
    }
  }, [tripId, currentUserId, isAdmin]);

  const generateAndSaveSummary = async () => {
    setIsLoadingSummary(true);

    const highlightString = summaryData.visitedPlaces;

    // Generate new summary
    const summary = await generateTripSummary(
      summaryData.visitedPlaces[0] || tripTitle,
      `${summaryData.totalDays} days`,
      highlightString,
      summaryData.totalExpense
    );

    setAiSummary(summary);

    // Save to DB
    await conclusionService.saveConclusion(tripId, {
      ...summaryData,
      aiSummary: summary
    });

    setIsLoadingSummary(false);
  };

  const handleMakePublic = async () => {
    if (!isAdmin) return;

    try {
      // Use plansService to update visibility
      // Assuming updatePlanStatus or similar exists, or direct update
      // For now, let's assume we need to update the boolean field
      // We might need to add a specific method to plansService if it doesn't exist for distinct fields vs json
      // But looking at previous files, updatePlanData stores JSON. 
      // We'll trust the user wants to update the `is_public` column.
      // Since plansService.ts wasn't explicitly shown with `updateVisibility`, 
      // I will assume simple implementation or alert if missing.

      // Let's implement a direct update for now via supabase in service if needed, 
      // or assume we can reuse a generic update. 
      // Actually, plansService has `updatePlanStatus`, maybe we can add `updatePlanVisibility`.
      // For now, I'll assume we add it or use what's there. 
      // Let's call a hypothetical `updatePlanVisibility` and I'll ensure to add it to plansService later if needed.
      // WAIT: I can just use `plansService` if I modify it.

      // For this file, I will call `plansService.makePlanPublic(tripId)`.
      // I will implement this method in plansService shortly.
      await plansService.makePlanPublic(tripId, true);

      setIsPublic(true);
      setShowPublicSuccess(true);

      setTimeout(() => {
        setShowPublicSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error making trip public:', error);
      alert('Failed to make trip public. Please try again.');
    }
  };

  const handleSubmitFeedback = async () => {
    if (userRating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const result = await conclusionService.submitFeedback(
        tripId,
        currentUserId,
        currentUserName,
        userRating,
        userComment
      );

      if (!result.success) throw new Error(result.error);

      // Refresh feedback list
      const feedResult = await conclusionService.getFeedback(tripId);
      if (feedResult.success && feedResult.data) {
        setFeedbacks(feedResult.data);
      }

      setHasSubmittedFeedback(true);
      setUserRating(0);
      setUserComment('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  };

  const renderStars = (rating: number, interactive: boolean = false, onSelect?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onSelect && onSelect(star)}
            disabled={!interactive}
            className={`transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          >
            <Star
              className={`w-6 h-6 ${star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
                }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Centered Editorial Title with Back Button */}
          <div className="max-w-7xl mx-auto mb-10 md:mb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-center gap-6 relative">
              <button
                onClick={onFinish}
                className="md:absolute left-0 p-3 bg-white text-gray-400 hover:text-teal-600 rounded-full border border-gray-100 transition-all active:scale-95 shadow-sm group flex items-center gap-2 px-4 md:px-3 mb-4 md:mb-0 w-fit self-start md:self-auto"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Back</span>
              </button>

              <div className="text-center w-full px-2">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full mb-6 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight leading-tight">
                  Trip <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Concluded!</span>
                </h1>
                <p className="text-xs md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                  {tripTitle}
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* AI Summary Section */}
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 px-8 py-6 border-b border-gray-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                      <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                      AI Journey <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Summary</span>
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Your Adventure Recap</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {isLoadingSummary ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Generating your personalized journey summary...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="prose prose-lg prose-slate max-w-none
                      prose-headings:text-gray-900 prose-headings:font-black prose-headings:tracking-tight
                      prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-gray-900 prose-strong:font-bold
                      prose-ul:list-disc prose-ul:ml-6 prose-ul:text-gray-700
                      prose-li:text-gray-700 prose-li:mb-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {aiSummary}
                      </ReactMarkdown>
                    </div>

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-200">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-100 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-teal-600" />
                        </div>
                        <p className="text-3xl font-black text-gray-900">{summaryData.totalDays}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Days</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-black text-gray-900">{summaryData.visitedPlaces.length}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Places</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className="text-3xl font-black text-gray-900">{summaryData.activities}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Activities</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-3xl font-black text-gray-900">${summaryData.totalExpense.toFixed(0)}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Spent</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Make Public Section (Admin Only) */}
            {isAdmin && (
              <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="bg-gradient-to-r from-teal-50/50 to-blue-50/50 px-8 py-6 border-b border-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                        <Globe className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
                        Share Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Journey</span>
                      </h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Admin Only</p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                      Admin
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <p className="text-gray-700 mb-6 font-medium">
                    Make this trip plan public to inspire other travelers! Your journey summary and itinerary
                    will be visible to the community, helping others plan similar adventures.
                  </p>

                  <div className="flex items-center justify-between bg-gray-50/50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-4">
                      {isPublic ? (
                        <>
                          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-7 h-7 text-green-600" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-base">Trip is Public</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5 uppercase tracking-wider">Visible to all users</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                            <Lock className="w-7 h-7 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-base">Trip is Private</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5 uppercase tracking-wider">Only visible to members</p>
                          </div>
                        </>
                      )}
                    </div>

                    {!isPublic && (
                      <button
                        onClick={handleMakePublic}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-teal-600/10 active:scale-95 text-sm uppercase tracking-wider"
                      >
                        <Share2 className="w-5 h-5" />
                        Make Public
                      </button>
                    )}
                  </div>

                  {showPublicSuccess && (
                    <div className="mt-6 bg-green-50/50 border border-green-200/50 rounded-[1.5rem] p-4 flex items-center gap-3 animate-fadeIn">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-800 font-medium">
                        Success! Your trip is now public and visible to the community.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="bg-gradient-to-r from-yellow-50/50 to-orange-50/50 px-8 py-6 border-b border-gray-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                      <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                      Trip <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">Feedback</span>
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Share Your Experience</p>
                  </div>
                  {feedbacks.length > 0 && (
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-orange-200/50 shadow-sm">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-black text-gray-900 text-lg">{calculateAverageRating()}</span>
                      <span className="text-sm text-gray-600 font-medium">({feedbacks.length})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Submit Feedback */}
                {!hasSubmittedFeedback ? (
                  <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="font-black text-gray-900 mb-6 text-base uppercase tracking-wider">Share Your Experience</h3>

                    {/* Rating */}
                    <div className="mb-6">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                        Rate this trip
                      </label>
                      {renderStars(userRating, true, setUserRating)}
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                        Comments (optional)
                      </label>
                      <textarea
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        placeholder="Share your thoughts about this trip..."
                        rows={4}
                        className="w-full px-6 py-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none font-medium"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={userRating === 0 || isSubmittingFeedback}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg shadow-teal-600/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-sm uppercase tracking-wider"
                    >
                      {isSubmittingFeedback ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50/50 border border-green-200/50 rounded-[1.5rem] p-6 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ThumbsUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-green-800 font-black uppercase tracking-wider">
                      Thank you for your feedback! Your input helps improve future trips.
                    </p>
                  </div>
                )}

                {/* Existing Feedbacks */}
                {feedbacks.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-black text-gray-900 flex items-center gap-2 text-base uppercase tracking-wider">
                      <Award className="w-5 h-5 text-teal-600" />
                      Member Reviews ({feedbacks.length})
                    </h3>

                    {feedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-black text-lg">
                                {feedback.user_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-black text-gray-900">{feedback.user_name}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                                {new Date(feedback.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {renderStars(feedback.rating, false)}
                        </div>
                        {feedback.comment && (
                          <p className="text-gray-700 text-sm pl-15 font-medium">{feedback.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {feedbacks.length === 0 && hasSubmittedFeedback && (
                  <p className="text-center text-gray-500 py-8 font-medium">
                    Be the first to leave feedback for this trip!
                  </p>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-center pt-4">
              <button
                onClick={onFinish}
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-12 py-4 rounded-full font-black text-base transition-all shadow-lg hover:shadow-xl active:scale-95 uppercase tracking-wider"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TripConclusion;