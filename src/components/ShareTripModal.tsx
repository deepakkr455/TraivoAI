// components/ShareTripModal.tsx
import React, { useState, useEffect } from 'react';
import { plansService } from '../modules/Customer/services/plansService';
import { planMembersService } from '../modules/Customer/services/planMembersService';
import { invitationsService } from '../modules/Customer/services/invitationsService';
import { X, Mail, Share2, UserPlus, Users, Trash2 } from 'lucide-react';

interface ShareTripModalProps {
  tripId: string;
  tripTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({
  tripId,
  tripTitle,
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    const result = await planMembersService.getPlanMembers(tripId);

    if (result.success && result.data) {
      // Map PlanMember to Member interface
      const mappedMembers: Member[] = result.data.map(m => ({
        id: m.id,
        name: m.user_name || 'Unknown',
        email: 'Member', // PlanMember doesn't have email in the DB table, it might be in profiles
      }));
      setMembers(mappedMembers);
    }
    setLoadingMembers(false);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const result = await invitationsService.sendInvitation(tripId, email.trim());

    if (result.success) {
      setMessage({ type: 'success', text: `Successfully shared trip with ${email} ` });
      setEmail('');
      loadMembers(); // Refresh the list
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to share trip' });
    }

    setIsLoading(false);
  };

  const handleRemoveMember = async (memberId: string, userName: string) => {
    if (!window.confirm(`Remove ${userName} from this trip ? `)) {
      return;
    }

    const result = await planMembersService.removeMember(memberId);

    if (result.success) {
      setMessage({ type: 'success', text: `Removed ${userName} from trip` });
      loadMembers();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to remove member' });
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}# / user / trip / ${tripId} `;
    navigator.clipboard.writeText(link);
    setMessage({ type: 'success', text: 'Link copied to clipboard!' });

    setTimeout(() => setMessage(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-teal-100 p-2 rounded-lg">
                <Share2 className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Share Trip</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 ml-11">{tripTitle}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share by Email Form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite by Email
            </label>
            <form onSubmit={handleShare} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {isLoading ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p - 4 rounded - lg flex items - start gap - 3 ${message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
                } `}
            >
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Copy Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Share Link
            </label>
            <button
              onClick={handleCopyLink}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Copy Shareable Link
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Note: Users must be invited before they can access the trip
            </p>
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">
                Shared With ({members.length})
              </label>
            </div>

            {loadingMembers ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
                No one invited yet
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-teal-600 font-medium text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-white hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};