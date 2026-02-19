import React, { useState } from 'react';

interface InviteModalProps {
    onClose: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock sending invitation
        console.log(`Inviting ${email}`);
        setSent(true);
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-sm w-full">
                {sent ? (
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-800">Invitation Sent!</h2>
                        <p className="text-gray-600 mt-2">Your friend has been invited to join TraivoAI.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Invite a Friend</h2>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    type="email"
                                    id="invite-email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="friend@example.com"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-teal-500 text-white rounded-md">Send Invite</button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default InviteModal;
