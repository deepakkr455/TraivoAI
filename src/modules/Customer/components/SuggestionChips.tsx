import React from 'react';
import { SuggestionChipProps } from '../../../types';


const suggestions = [
  'Create a new trip',
  'Inspire me where to go',
  'Plan a road trip',
  'Plan a last-minute escape',
];

const realisticPrompts: { [key: string]: string } = {
  'Create a new trip': 'I want to plan a trip to [Destination] for [Number] days. I am interested in [Interests]...',
  'Inspire me where to go': 'Suggest 3 unique destinations for a [Type] vacation in [Month].',
  'Plan a road trip': 'Plan a scenic road trip from [City A] to [City B] lasting [Number] days.',
  'Plan a last-minute escape': 'I need a weekend getaway from [City] this Friday. I want to...'
};

import { UserPersonalization } from '../../../types';

interface ExtendedSuggestionChipProps extends SuggestionChipProps {
  isDarkBackground?: boolean;
  personalization?: UserPersonalization;
}

export const SuggestionChips: React.FC<ExtendedSuggestionChipProps> = ({ onChipClick, isDarkBackground = true, personalization }) => {
  const getPersonalizedPrompt = (key: string, template: string) => {
    if (!personalization) return template;
    let prompt = template;

    // Fill in blanks if we have data
    if (personalization.city && (prompt.includes('[Destination]') || prompt.includes('[City]') || prompt.includes('[City A]'))) {
      const loc = personalization.state ? `${personalization.city}, ${personalization.state}` : personalization.city;
      prompt = prompt.replace('[Destination]', loc).replace('[City]', loc).replace('[City A]', loc);
    }
    if (personalization.interests && personalization.interests.length > 0) {
      const interestsStr = personalization.interests.join(', ');
      if (prompt.includes('[Interests]')) prompt = prompt.replace('[Interests]', interestsStr);
      if (prompt.includes('[Type]')) prompt = prompt.replace('[Type]', personalization.interests[0]);
    }
    return prompt;
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {suggestions.map((text) => (
        <button
          key={text}
          onClick={() => {
            const template = realisticPrompts[text] || text;
            onChipClick(getPersonalizedPrompt(text, template));
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isDarkBackground
            ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
            : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
            }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
};