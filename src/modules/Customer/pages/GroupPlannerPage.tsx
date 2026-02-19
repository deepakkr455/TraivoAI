import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';
import type { GroupPlan, Invitation } from '../../../types';
import LoadingSpinner from '../../../components/LoadingSpinner';


const PlannerUnavailable: React.FC = () => (
  <div className="bg-gray-50 min-h-screen py-8">
    <div className="container mx-auto max-w-2xl px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Group Planner Unavailable</h1>
      <p className="text-gray-600 mb-6">Supabase connection missing.</p>
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
        <p className="font-bold">Configuration Error</p>
        <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to <code>.env</code></p>
      </div>
    </div>
  </div>
);

const MembersSection: React.FC<{ plan: GroupPlan; onInvite: (email: string) => void }> = ({ plan, onInvite }) => {
  const { user } = useAuth();
  const isOwner = user?.id === plan.owner_id;
  const [inviteEmail, setInviteEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      onInvite(inviteEmail.trim());
      setInviteEmail('');
    }
  };

  const accepted = plan.plan_members;
  const pending = plan.invitations.filter(i => i.status === 'pending');
  const declined = plan.invitations.filter(i => i.status === 'declined');

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Trip Members</h2>

      {/* Accepted */}
      <div className="mb-5">
        <h3 className="font-medium text-green-700 flex items-center gap-2 mb-2">
          Accepted
          <span className="text-sm font-normal text-gray-600">({accepted.length})</span>
        </h3>
        <div className="space-y-1">
          {accepted.map(m => (
            <div key={m.user_id} className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg text-sm">
              <span className="font-medium">{m.user_name}</span>
              {m.user_id === plan.owner_id && <span className="text-xs bg-amber-200 px-2 py-1 rounded">Owner</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Pending */}
      <div className="mb-5">
        <h3 className="font-medium text-amber-700 flex items-center gap-2 mb-2">
          Pending
          <span className="text-sm font-normal text-gray-600">({pending.length})</span>
        </h3>
        <div className="space-y-1">
          {pending.map(i => (
            <div key={i.id} className="py-2 px-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              {i.invited_email}
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm text-gray-500 italic">No pending invites</p>}
        </div>
      </div>

      {/* Declined */}
      <div className="mb-5">
        <h3 className="font-medium text-red-700 flex items-center gap-2 mb-2">
          Declined
          <span className="text-sm font-normal text-gray-600">({declined.length})</span>
        </h3>
        <div className="space-y-1">
          {declined.map(i => (
            <div key={i.id} className="py-2 px-3 bg-red-50 rounded-lg text-sm text-red-500 line-through">
              {i.invited_email}
            </div>
          ))}
          {declined.length === 0 && <p className="text-sm text-gray-500 italic">No declines</p>}
        </div>
      </div>

      {/* Invite Form */}
      {isOwner && (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-6 pt-6 border-t">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="Invite by email..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            required
          />
          <button type="submit" className="px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600">
            Invite
          </button>
        </form>
      )}
    </div>
  );
};

const GroupPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<GroupPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationHandled, setInvitationHandled] = useState(false);

  // Form states
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [description, setDescription] = useState('');
  const [proposalInputs, setProposalInputs] = useState({ DATES: '', PLACES: '', ACCOMMODATION: '' });
  const [doubtInput, setDoubtInput] = useState('');
  const [expenseInput, setExpenseInput] = useState({ description: '', amount: '' });

  const fetchPlan = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('plans')
      .select(`
        *,
        plan_members(*),
        invitations(*),
        proposals(*, votes(*)),
        expenses(*),
        doubts(*)
      `)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      setError('Could not load plan.');
    } else {
      setPlan(data as any);
    }
    setLoading(false);
  }, [user]);

  // Auto-accept invitation from URL
  useEffect(() => {
    if (!user || invitationHandled) return;

    const params = new URLSearchParams(location.search);
    const invitationId = params.get('invitation');
    if (!invitationId) return;

    (async () => {
      try {
        const { data: inv } = await supabase
          .from('invitations')
          .select('*')
          .eq('id', invitationId)
          .eq('invited_email', user.email)
          .single();

        if (inv && inv.status === 'pending') {
          // Extract user name from metadata or use email as fallback
          const userName = (user as any).user_metadata?.full_name || user.email || 'Unknown User';

          await supabase.from('plan_members').insert({
            plan_id: inv.plan_id,
            user_id: user.id,
            user_name: userName,
          });

          await supabase.from('invitations').update({
            status: 'accepted',
            invited_user_id: user.id
          }).eq('id', invitationId);

          fetchPlan();
        }

        window.history.replaceState({}, '', '/planner');
      } catch (e) {
        console.error('Auto-accept failed:', e);
      } finally {
        setInvitationHandled(true);
      }
    })();
  }, [user, location.search, invitationHandled, fetchPlan]);

  useEffect(() => {
    if (supabase) {
      fetchPlan();
    } else {
      setLoading(false);
    }
  }, [fetchPlan]);



  const handleInvite = async (email: string) => {
    if (!plan || !supabase) return;

    const { error } = await supabase
      .from('invitations')
      .insert({
        plan_id: plan.id,
        invited_email: email.trim().toLowerCase(),
        status: 'pending',
        invited_user_id: user.id
      });

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        alert('This user has already been invited!');
      } else {
        alert('Failed to send invite. Try again.');
      }
    } else {
      alert('Invitation sent!');
      fetchPlan();
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    const { data, error } = await supabase
      .from('plans')
      .insert({
        owner_id: user.id,
        destination,
        dates,
        description,
        status: 'planning'
      })
      .select()
      .single();

    if (error) {
      setError('Failed to create plan.');
    } else {
      setPlan(data as any);
      setDestination('');
      setDates('');
      setDescription('');
    }
  };

  const handleAddProposal = async (category: 'DATES' | 'PLACES' | 'ACCOMMODATION') => {
    if (!user || !plan || !proposalInputs[category].trim()) return;
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        plan_id: plan.id,
        user_id: user.id,
        user_name: user.email,
        category,
        title: proposalInputs[category]
      })
      .select('*, votes(*)')
      .single();

    if (error) {
      alert('Failed to add proposal.');
    } else {
      setPlan(p => p ? { ...p, proposals: [...p.proposals, data] } : null);
      setProposalInputs(s => ({ ...s, [category]: '' }));
    }
  };

  const handleVote = async (proposalId: string) => {
    if (!user || !plan) return;
    const vote = plan.proposals.find(p => p.id === proposalId)?.votes.find(v => v.user_id === user.id);
    if (vote) {
      await supabase.from('votes').delete().eq('id', vote.id);
    } else {
      await supabase.from('votes').insert({ proposal_id: proposalId, user_id: user.id });
    }
    fetchPlan();
  };

  const handleAddDoubt = async () => {
    if (!user || !plan || !doubtInput.trim()) return;
    const { data, error } = await supabase
      .from('doubts')
      .insert({ plan_id: plan.id, user_id: user.id, user_name: user.email, text: doubtInput })
      .select()
      .single();
    if (error) alert('Failed to post doubt.');
    else setPlan(p => p ? { ...p, doubts: [...p.doubts, data] } : null);
    setDoubtInput('');
  };

  const handleAddExpense = async () => {
    if (!user || !plan || !expenseInput.description.trim() || !expenseInput.amount) return;
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        plan_id: plan.id,
        user_id: user.id,
        user_name: user.email,
        description: expenseInput.description,
        amount: parseFloat(expenseInput.amount)
      })
      .select()
      .single();
    if (error) alert('Failed to log expense.');
    else setPlan(p => p ? { ...p, expenses: [...p.expenses, data] } : null);
    setExpenseInput({ description: '', amount: '' });
  };

  const getWinner = (category: string) => {
    const props = plan?.proposals.filter(p => p.category === category) || [];
    return props.length > 0 ? props.reduce((a, b) => (b.votes.length > a.votes.length ? b : a)) : null;
  };

  const winners = {
    DATES: getWinner('DATES'),
    PLACES: getWinner('PLACES'),
    ACCOMMODATION: getWinner('ACCOMMODATION')
  };

  const canStartTrip = winners.DATES && winners.PLACES && winners.ACCOMMODATION;

  if (!supabase) return <PlannerUnavailable />;
  if (loading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>;
  if (error) return <div className="text-center text-red-500 py-20">{error}</div>;

  if (!plan) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto max-w-2xl px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Group Plan</h1>
          <p className="text-gray-600 mb-6">Plan your next adventure with friends.</p>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="mt-1 w-full p-2 border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dates</label>
                <input type="text" value={dates} onChange={e => setDates(e.target.value)} className="mt-1 w-full p-2 border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full p-2 border rounded-md"></textarea>
              </div>
              <button type="submit" className="w-full py-2 px-4 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-600">
                Create Plan
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trip to {plan.destination}</h1>
          <p className="text-gray-600 mt-2">{plan.dates} | {plan.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Proposals */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Proposals & Voting</h2>
              {['DATES', 'PLACES', 'ACCOMMODATION'].map(cat => (
                <div key={cat} className="mb-6">
                  <h3 className="font-bold text-lg mb-2 text-purple-700 capitalize">{cat.toLowerCase()}</h3>
                  <div className="space-y-2">
                    {plan.proposals.filter(p => p.category === cat).map(p => (
                      <div key={p.id} className={`flex justify-between items-center p-2 rounded-md ${winners[cat]?.id === p.id ? 'bg-green-100' : ''}`}>
                        <span>{p.title} <span className="text-xs text-gray-500">- {p.user_name}</span></span>
                        <button onClick={() => handleVote(p.id)} className="flex items-center gap-2 px-3 py-1 border rounded-full text-sm">
                          {p.votes.some(v => v.user_id === user?.id) ? 'Check' : 'Like'} {p.votes.length}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder={`Suggest ${cat.toLowerCase()}...`}
                      value={proposalInputs[cat as keyof typeof proposalInputs]}
                      onChange={e => setProposalInputs(s => ({ ...s, [cat]: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    />
                    <button onClick={() => handleAddProposal(cat as any)} className="px-4 py-2 bg-purple-500 text-white rounded-md">Add</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Doubts */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Doubts & Discussion</h2>
              <div className="space-y-2 mb-4">
                {plan.doubts.map(d => (
                  <div key={d.id} className="p-2 bg-gray-50 rounded-md">
                    <p className="text-sm"><strong>{d.user_name}:</strong> {d.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={doubtInput} onChange={e => setDoubtInput(e.target.value)} placeholder="Ask a question..." className="w-full p-2 border rounded-md" />
                <button onClick={handleAddDoubt} className="px-4 py-2 bg-teal-500 text-white rounded-md">Post</button>
              </div>
            </div>

            {/* Expenses */}
            {plan.status === 'ongoing' && (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Budget & Expenses</h2>
                <div className="space-y-2 mb-4">
                  {plan.expenses.map(exp => (
                    <div key={exp.id} className="flex justify-between p-2">
                      <span>{exp.description} ({exp.user_name})</span>
                      <span className="font-semibold">${exp.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <input type="text" value={expenseInput.description} onChange={e => setExpenseInput(s => ({ ...s, description: e.target.value }))} placeholder="Description" className="w-full p-2 border rounded-md" />
                  <input type="number" value={expenseInput.amount} onChange={e => setExpenseInput(s => ({ ...s, amount: e.target.value }))} placeholder="Amount" className="w-1/3 p-2 border rounded-md" />
                  <button onClick={handleAddExpense} className="px-4 py-2 bg-purple-500 text-white rounded-md">Log</button>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="font-bold text-lg">Total: ${plan.expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              {plan.status === 'planning' ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Trip Readiness</h2>
                  <button
                    onClick={async () => {
                      await supabase.from('plans').update({ status: 'ongoing' }).eq('id', plan.id);
                      fetchPlan();
                    }}
                    disabled={!canStartTrip}
                    className="w-full py-2 px-4 rounded-md text-white font-semibold bg-green-500 disabled:bg-gray-400 hover:bg-green-600"
                  >
                    Start The Journey
                  </button>
                  {!canStartTrip && <p className="text-xs text-center text-gray-500 mt-2">Need winners in all categories.</p>}
                </>
              ) : (
                <div className="text-center p-4 bg-blue-100 rounded-lg">
                  <h2 className="text-xl font-bold text-blue-800">Trip is Ongoing!</h2>
                  <p className="text-blue-700">Log expenses below.</p>
                </div>
              )}
            </div>
            <MembersSection plan={plan} onInvite={handleInvite} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPlannerPage;