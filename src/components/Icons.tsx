
import React from 'react';

// This file provides SVG icons as React components, similar to lucide-react.
// This avoids a runtime dependency on an external script.

export const Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);

export const LaylaLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}>
    <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z"/><path d="M12 12a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
  </Icon>
);

export const Paperclip: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </Icon>
);

export const Mic: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </Icon>
);

export const SendHorizonal: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Icon {...props}>
    <path d="m3 3 3 9-3 9 19-9Z" />
    <path d="M6 12h16" />
  </Icon>
);

export const Bot: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}>
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
    </Icon>
);

export const Calendar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></Icon>
);

export const Sun: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></Icon>
);

export const CarFront: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v3c0 .6.4 1 1 1h2"/><path d="M19 17H5a2 2 0 0 0-2 2v2h18v-2a2 2 0 0 0-2-2Z"/><path d="M6.5 17.5 5 15"/><path d="M17.5 17.5 19 15"/><path d="M7 11V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6"/></Icon>
);

export const BedDouble: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/><path d="M2 14h20"/></Icon>
);

export const Key: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L21 8l-3-3"/></Icon>
);

export const Sailboat: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M2 21c.9.2 2.2.3 3.5.3 2.1 0 3.8-.7 5.1-1.9 1.3-1.2 2-2.8 2.4-4.5.4-1.8.6-3.8.6-5.9 0-.4 0-.8-.1-1.2l-1.3 5.2c-.1.5-.6 1-1.1 1.1l-5.2 1.3c-.4 0-.8.1-1.2.1 0 0 0 0 0 0-2.1 0-4.1.2-5.9.6-1.7.4-3.3 1.1-4.5 2.4C3.7 17.2 3 18.9 3 21c0 .2.1.3.2.4l.4.2c.2.1.4.1.6.1H21"/></Icon>
);

export const HelpCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></Icon>
);

export const WifiOff: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a1 1 0 0 1 1 1"/><path d="M12 18a1 1 0 0 1 1 1"/><path d="M15.5 19.5a1 1 0 0 1 1 1"/><path d="M19.17 12.83a4.004 4.004 0 0 0-5.66-5.66"/><path d="M5.07 8.93a12.01 12.01 0 0 1 13.86 0"/></Icon>
);

export const Lightbulb: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></Icon>
);

export const Route: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /><circle cx="18" cy="5" r="3" /></Icon>
);

export const ArrowRight: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></Icon>
);
