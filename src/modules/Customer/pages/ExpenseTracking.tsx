// pages/ExpenseTracking.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  IndianRupee,
  Users,
  TrendingUp,
  Edit2,
  Check,
  X,
  Sparkles,
  MessageCircle,
  Calculator,
  AlertCircle,
  Flag,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import GeminiExpenseService from '../services/GeminiExpenseService';
import { plansService } from '../services/plansService';

interface TripMember {
  id: string;
  name: string;
  expectedAmount: number;
  actualAmount: number;
  expenses: string[]; // AI-generated short summaries
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isProcessed: boolean;
  extractedExpense?: {
    amount: number;
    items: { name: string; subAmount: number }[];
  };
}

interface ExpenseTrackingProps {
  tripTitle: string;
  tripId: string;
  members: TripMember[];
  currentUserId: string;
  isAdmin?: boolean;
  onBack: () => void;
}

export const ExpenseTracking: React.FC<ExpenseTrackingProps> = ({
  tripTitle,
  tripId,
  members: initialMembers,
  currentUserId,
  isAdmin = false,
  onBack,
}) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TripMember[]>(initialMembers.map(m => ({
    ...m,
    actualAmount: 0,
    expenses: [],
  })));
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'system',
      userName: 'AI Assistant',
      message: 'Hi! Report your expenses naturally. For example: "Spent ₹500 on lunch and ₹200 on taxi"',
      timestamp: new Date(),
      isProcessed: false,
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
    loadExpenses();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    const { data, error } = await supabase
      .from('expense_chats')
      .select('*')
      .eq('plan_id', tripId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading chat history:', error);
      return;
    }

    if (data && data.length > 0) {
      const formatted: ChatMessage[] = data.map(chat => ({
        id: chat.id,
        userId: chat.user_id || (chat.is_system ? 'system' : 'unknown'),
        userName: chat.user_name || (chat.is_system ? 'AI Assistant' : 'Traveler'),
        message: chat.message,
        timestamp: new Date(chat.created_at),
        isProcessed: !!chat.extracted_data,
        extractedExpense: chat.extracted_data,
      }));
      setMessages(formatted);
    }
  };

  const loadExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
    // .eq('plan_id', tripId);

    if (error) {
      console.error('Error loading expenses:', error);
      return;
    }

    // Aggregate by user
    const aggregated: { [userId: string]: { amount: number; expenses: any[] } } = {};
    data.forEach(exp => {
      if (!aggregated[exp.user_id]) {
        aggregated[exp.user_id] = { amount: 0, expenses: [] };
      }
      aggregated[exp.user_id].amount += Number(exp.amount);

      if (exp.items && Array.isArray(exp.items)) {
        aggregated[exp.user_id].expenses.push(...exp.items);
      } else {
        aggregated[exp.user_id].expenses.push(exp.description);
      }
    });

    setMembers(prev => prev.map(member => ({
      ...member,
      actualAmount: aggregated[member.id]?.amount || 0,
      expenses: aggregated[member.id]?.expenses || [],
    })));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSendingMessage(true);

    const userName = members.find(m => m.id === currentUserId)?.name || 'You';

    // 1. Save User Message to DB
    const { data: userChatData, error: userChatError } = await supabase
      .from('expense_chats')
      .insert({
        plan_id: tripId,
        user_id: currentUserId,
        user_name: userName,
        message: newMessage,
        is_system: false
      })
      .select()
      .single();

    if (userChatError) {
      console.error("Error saving user chat:", userChatError);
    }

    const userMessage: ChatMessage = {
      id: userChatData?.id || Date.now().toString(),
      userId: currentUserId,
      userName: userName,
      message: newMessage,
      timestamp: new Date(),
      isProcessed: false,
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      // 2. Call AI with History
      const historyForAI = messages.map(m => ({
        role: (m.userId === 'system' ? 'model' : 'user') as 'user' | 'model',
        content: m.message
      }));

      const extracted = await GeminiExpenseService.geminiExtractExpense(
        newMessage,
        historyForAI,
        tripId,
        currentUserId,
        userName
      );

      if (extracted) {
        let expenseRecordId = null;

        if (extracted.isCorrection) {
          // Find most recent expense for this user on this plan
          const { data: lastExp } = await supabase
            .from('expenses')
            .select('id')
            .eq('plan_id', tripId)
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastExp) {
            const { error: updateError } = await supabase
              .from('expenses')
              .update({
                description: extracted.description,
                amount: extracted.amount,
                items: extracted.items
              })
              .eq('id', lastExp.id);

            if (updateError) throw updateError;
            expenseRecordId = lastExp.id;
          }
        }

        if (!expenseRecordId) {
          // New expense
          const { data: newExp, error: insertError } = await supabase
            .from('expenses')
            .insert({
              plan_id: tripId,
              user_id: currentUserId,
              user_name: userMessage.userName,
              description: extracted.description,
              amount: extracted.amount,
              items: extracted.items
            })
            .select()
            .single();

          if (insertError) throw insertError;
          expenseRecordId = newExp.id;
        }

        // 3. Save AI Response to DB
        const aiResponseMsg = extracted.isCorrection
          ? `✓ Corrected: ₹${extracted.amount} for ${(extracted.items || []).map(item => `${item.name} (₹${item.subAmount})`).join(', ')}`
          : `✓ Recorded: ₹${extracted.amount} for ${(extracted.items || []).map(item => `${item.name} (₹${item.subAmount})`).join(', ')}`;

        const { data: aiChatData } = await supabase
          .from('expense_chats')
          .insert({
            plan_id: tripId,
            user_id: null,
            user_name: 'AI Assistant',
            message: aiResponseMsg,
            is_system: true,
            extracted_data: extracted
          })
          .select()
          .single();

        // 4. Update local state
        await loadExpenses(); // Refresh all totals from DB properly

        const aiResponse: ChatMessage = {
          id: aiChatData?.id || (Date.now() + 1).toString(),
          userId: 'system',
          userName: 'AI Assistant',
          message: aiResponseMsg,
          timestamp: new Date(),
          isProcessed: true,
          extractedExpense: {
            amount: extracted.amount,
            items: (extracted.items || []).map(item => ({ name: item.name || 'Expense', subAmount: item.subAmount || 0 })),
          },
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        const aiFailMsg = 'I couldn\'t find an expense amount. Please mention the amount, e.g., "Spent ₹500 on lunch"';

        const { data: aiChatData } = await supabase
          .from('expense_chats')
          .insert({
            plan_id: tripId,
            user_name: 'AI Assistant',
            message: aiFailMsg,
            is_system: true
          })
          .select()
          .single();

        const aiResponse: ChatMessage = {
          id: aiChatData?.id || (Date.now() + 1).toString(),
          userId: 'system',
          userName: 'AI Assistant',
          message: aiFailMsg,
          timestamp: new Date(),
          isProcessed: false,
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Error processing expense:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: 'system',
        userName: 'AI Assistant',
        message: 'Sorry, there was an error processing your expense. Please try again.',
        timestamp: new Date(),
        isProcessed: false,
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleEditAmount = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setEditingMemberId(memberId);
      setEditAmount(member.actualAmount.toString());
    }
  };

  const handleSaveAmount = async (memberId: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) return;

    // Note: Editing total amount isn't directly supported by schema since expenses are itemized.
    // For simplicity, we'll assume this is for admin override, but in real app, might need adjustments.
    // Here, we'll just update local state as per original, but in production, perhaps add a adjustment entry.

    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, actualAmount: amount } : m
    ));
    setEditingMemberId(null);
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditAmount('');
  };

  const calculateTotal = () => {
    return members.reduce((sum, member) => sum + member.actualAmount, 0);
  };

  const calculateTotalExpected = () => {
    return members.reduce((sum, member) => sum + member.expectedAmount, 0);
  };

  const getCurrentMemberName = () => {
    return members.find(m => m.id === currentUserId)?.name || 'You';
  };

  const handleConcludeTrip = async () => {
    setIsConcluding(true);
    try {
      // 1. Update Status FIRST
      const statusResult = await plansService.updatePlanStatus(tripId, 'concluded');
      if (!statusResult.success) {
        console.error('Failed to update status:', statusResult.error);
        alert(`Failed to conclude trip: ${statusResult.error || 'Unknown error'}`);
        setIsConcluding(false);
        return;
      }

      // 2. Trigger Email
      try {
        await import('../services/conclusionService').then(({ conclusionService }) => {
          return conclusionService.triggerExpenseEmail(tripId);
        });
      } catch (emailError) {
        console.error("Email failed but continuing:", emailError);
        // Don't block navigation if email fails
      }

      // 3. Navigate
      navigate(`/user/trip/${tripId}/summary`, { state: { tripTitle, tripId } });
    } catch (error) {
      console.error("Error concluding trip:", error);
      alert(`Error concluding trip: ${(error as Error).message}`);
    } finally {
      setIsConcluding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      <main className="flex-1 overflow-y-auto w-full">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Centered Editorial Title with Back Button */}
          <div className="max-w-7xl mx-auto mb-10 md:mb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-center gap-6 relative">
              <button
                onClick={onBack}
                className="md:absolute left-0 p-3 bg-white text-gray-400 hover:text-teal-600 rounded-full border border-gray-100 transition-all active:scale-95 shadow-sm group flex items-center gap-2 px-4 md:px-3 mb-4 md:mb-0 w-fit self-start md:self-auto"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Back</span>
              </button>

              <div className="text-center w-full px-2">
                <h1 className="text-2xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight leading-tight">
                  Track <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">Expenses</span>
                </h1>
                <p className="text-xs md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                  {tripTitle} • {members.length} Members
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={handleConcludeTrip}
                  disabled={isConcluding}
                  className="md:absolute right-0 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-purple-600/10 active:scale-95 text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {isConcluding ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  Conclude Trip
                </button>
              )}
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Chat Interface */}
              <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-[calc(100vh-280px)] min-h-[600px]">
                <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 px-8 py-6 border-b border-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                        Report <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Expenses</span>
                      </h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">AI-Powered Tracking</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-purple-200/50 shadow-sm">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-black text-gray-700 uppercase tracking-wider">AI</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50"
                >
                  {messages.map((msg) => {
                    const isSystem = msg.userId === 'system';
                    const isCurrentUser = msg.userId === currentUserId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${isSystem
                            ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                            : isCurrentUser
                              ? 'bg-teal-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                        >
                          {!isCurrentUser && !isSystem && (
                            <p className="text-xs font-black uppercase tracking-wider mb-2 text-gray-500">
                              {msg.userName}
                            </p>
                          )}
                          <p className="text-sm font-medium">{msg.message}</p>
                          <p
                            className={`text-xs mt-2 ${isSystem || isCurrentUser ? 'text-white/70' : 'text-gray-500'
                              }`}
                          >
                            {msg.timestamp.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {isSendingMessage && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm font-medium">Processing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-6 border-t border-gray-100 bg-white">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                      placeholder={`${getCurrentMemberName()}, describe your expense...`}
                      disabled={isSendingMessage}
                      className="flex-1 bg-gray-50/50 text-gray-900 placeholder-gray-400 rounded-2xl px-6 py-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 font-medium transition-all"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSendingMessage}
                      className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full transition-all shadow-lg shadow-teal-600/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-3 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI will automatically extract amounts and categorize expenses
                  </p>
                </div>
              </div>

              {/* Right Column - Expense Summary */}
              <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-[calc(100vh-280px)] min-h-[600px]">
                <div className="bg-gradient-to-r from-teal-50/50 to-blue-50/50 px-8 py-6 border-b border-gray-50/50">
                  <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-gray-900">
                    <Calculator className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
                    Expense <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Summary</span>
                  </h2>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expected</p>
                      <p className="text-lg font-black text-gray-900 mt-1">
                        ₹{calculateTotalExpected().toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Actual</p>
                      <p className="text-lg font-black text-teal-600 mt-1">
                        ₹{calculateTotal().toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Difference</p>
                      <p className={`text-lg font-black mt-1 ${calculateTotal() > calculateTotalExpected()
                        ? 'text-red-600'
                        : 'text-green-600'
                        }`}>
                        {calculateTotal() > calculateTotalExpected() ? '+' : ''}
                        ₹{(calculateTotal() - calculateTotalExpected()).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className={`rounded-2xl p-6 border transition-all hover:shadow-md ${member.id === currentUserId
                        ? 'border-teal-200 bg-teal-50/30'
                        : 'border-gray-200 bg-gray-50/30'
                        }`}
                    >
                      {/* Member Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-gray-900 text-base">
                              {member.name}
                              {member.id === currentUserId && (
                                <span className="ml-2 text-xs bg-teal-600 text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </h3>
                          </div>
                          <p className="text-[10px] font-black text-teal-600 uppercase tracking-wider block mt-1">
                            Expected Budget: ₹{member.expectedAmount.toFixed(2)}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-2">
                          {editingMemberId === member.id ? (
                            <>
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-28 px-3 py-2 text-sm border border-teal-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveAmount(member.id)}
                                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all active:scale-95"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all active:scale-95"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className={`text-xl font-black ${member.actualAmount > member.expectedAmount
                                ? 'text-red-600'
                                : member.actualAmount === member.expectedAmount
                                  ? 'text-green-600'
                                  : 'text-gray-900'
                                }`}>
                                ₹{member.actualAmount.toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleEditAmount(member.id)}
                                className="p-2 text-gray-400 hover:text-teal-600 transition-colors rounded-full hover:bg-teal-50"
                                title="Edit amount"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expense Items */}
                      {member.expenses.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-wrap gap-2">
                            {member.expenses.map((expense: any, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 bg-white text-gray-700 text-xs px-3 py-1.5 rounded-full border border-gray-300 font-medium"
                              >
                                {typeof expense === 'string' ? expense : `${expense.name}: ₹${expense.amount || expense.subAmount || 0}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {member.expenses.length === 0 && (
                        <p className="text-xs text-gray-400 italic mt-3 font-medium">
                          No expenses reported yet
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Footer */}
                <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-8 py-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-white" />
                      <span className="text-lg font-black text-white uppercase tracking-wider">Total</span>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-white">
                        ₹{calculateTotal().toFixed(2)}
                      </p>
                      <p className="text-xs text-white/80 mt-1 font-medium">
                        of ₹{calculateTotalExpected().toFixed(2)} expected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            {/* <div className="mt-8 bg-blue-50/50 border border-blue-200/50 rounded-[1.5rem] p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest leading-none mb-1 text-blue-900">
                  AI-Powered Expense Tracking
                </p>
                <p className="text-xs font-medium text-blue-700/80">
                  Simply describe your expenses in natural language. Our AI will automatically
                  extract amounts, categorize items, and update your expense summary in real-time.
                </p>
              </div>
            </div> */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExpenseTracking;