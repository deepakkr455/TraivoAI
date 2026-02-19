// Example usage of TravelPersonalization component
// This can be used in any page or modal

import React, { useState } from 'react';
import TravelPersonalization, { PersonalizationData } from '../components/TravelPersonalization';

const ExampleUsage: React.FC = () => {
    const [showPersonalization, setShowPersonalization] = useState(false);

    const handleComplete = (data: PersonalizationData) => {
        console.log('Personalization data:', data);
        // Save to backend or state management
        // Example: await updateUserPreferences(data);
        setShowPersonalization(false);
    };

    const handleCancel = () => {
        setShowPersonalization(false);
    };

    return (
        <div>
            {/* Trigger Button */}
            <button
                onClick={() => setShowPersonalization(true)}
                className="px-6 py-3 bg-teal-600 text-white rounded-full font-bold"
            >
                Personalize Your Experience
            </button>

            {/* Modal/Overlay Usage */}
            {showPersonalization && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="max-w-4xl w-full">
                        <TravelPersonalization
                            onComplete={handleComplete}
                            onCancel={handleCancel}
                            initialData={{
                                tripTypes: ['adventure', 'culture'],
                                excitement: ['mountains', 'history'],
                                pace: 'balanced',
                                budget: 'mid',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Or use inline in a page */}
            <div className="container mx-auto py-12">
                <TravelPersonalization
                    onComplete={handleComplete}
                />
            </div>
        </div>
    );
};

export default ExampleUsage;
