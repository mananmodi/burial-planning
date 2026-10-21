import React from 'react';

const P = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  tag: <><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" /><circle cx="7.5" cy="7.5" r="1" /></>,
  wallet: <><path d="M3 7a2 2 0 012-2h13v4" /><path d="M3 7v11a2 2 0 002 2h15V9H5a2 2 0 01-2-2z" /><circle cx="16" cy="14.5" r="1" /></>,
  book: <><path d="M4 4h12a3 3 0 013 3v13H7a3 3 0 01-3-3z" /><path d="M4 17a3 3 0 013-3h12" /></>,
  heart: <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" />,
  star: <polygon points="12 2 15 9 22 9.5 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.5 9 9" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  file: <><path d="M6 2h8l5 5v15H6z" /><path d="M14 2v5h5M9 13h7M9 17h7" /></>,
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h13l-2 4 2 4H5" /></>,
  flower: <><circle cx="12" cy="12" r="2.5" /><path d="M12 9.5C10 6 10.5 3 12 3s2 3 0 6.5zM14.5 12c3.5-2 6.5-1.5 6.5 0s-3 2-6.5 0zM12 14.5c2 3.5 1.5 6.5 0 6.5s-2-3 0-6.5zM9.5 12C6 14 3 13.5 3 12s3-2 6.5 0z" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 21a7 7 0 0114 0" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14a5 5 0 015 5" /></>,
  paw: <><circle cx="6" cy="11" r="2" /><circle cx="10" cy="6.5" r="2" /><circle cx="14" cy="6.5" r="2" /><circle cx="18" cy="11" r="2" /><path d="M12 12c-3 0-5.5 3-5.5 5.5 0 2 1.5 2.5 3 2s2-.5 2.5-.5 1 .5 2.5.5 3-.5 3-2.5C17.5 15 15 12 12 12z" /></>,
  candle: <><path d="M12 2c1.5 2 2 3 0 5-2-2-1.5-3 0-5z" /><rect x="8" y="9" width="8" height="12" rx="1" /><path d="M12 7v2" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6 15h4" /></>,
  cross: <><path d="M12 2v20M6 8h12" /></>,
  music: <><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  camera: <><path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><circle cx="12" cy="13" r="3.5" /></>,
  video: <><rect x="2.5" y="5" width="13" height="14" rx="2" /><path d="M15.5 10l6-3v10l-6-3" /></>,
  brush: <><path d="M20 4c-6 1-10 5-11 10l3 3c5-1 9-5 10-11z" /><path d="M9 14c-3 0-5 2-5 6 4 0 6-2 6-5" /></>,
  medal: <><circle cx="12" cy="15" r="5.5" /><path d="M8.5 10.5L6 3h5l1 4 1-4h5l-2.5 7.5" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.5M12 17h.01" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  pin: <><path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  hands: <><path d="M3 12l5-5 4 3 4-3 5 5-9 8z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  leaf: <><path d="M20 4C9 4 4 9 4 16v4h4c7 0 12-5 12-16z" /><path d="M4 20c3-6 7-9 12-11" /></>,
  bell: <><path d="M6 16V11a6 6 0 0112 0v5l2 2H4z" /><path d="M10 21a2 2 0 004 0" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>,
};
export const ICON_NAMES = Object.keys(P);

const GUESS = [
  [/24\/7|hour|available|anytime/i, 'clock'], [/afford|price|cost/i, 'tag'], [/budget|flexible|financ|pay/i, 'wallet'],
  [/obituar|book|read/i, 'book'], [/grief|support|heal|compassion/i, 'heart'], [/personal|honor|wishes/i, 'star'],
  [/plan|pre-?plan/i, 'calendar'], [/paperwork|form|document/i, 'file'], [/veteran|military/i, 'flag'],
  [/pet|animal/i, 'paw'], [/famil|staff|team/i, 'users'], [/flower|memorial|tribute/i, 'flower'],
  [/cremat|candle|remember/i, 'candle'], [/call|phone/i, 'phone'], [/music|song/i, 'music'], [/photo|album/i, 'camera'], [/video/i, 'video'], [/art/i, 'brush'], [/mail|email/i, 'mail'], [/location|address|where/i, 'pin'], [/guarantee|trust/i, 'shield'],
];
export const guessIcon = (text, i = 0) =>
  (GUESS.find(([re]) => re.test(text)) || [null, ['heart', 'star', 'shield', 'flower', 'candle', 'check'][i % 6]])[1];

export default function Icon({ name, size = 28 }) {
  const body = P[name] || P.heart;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{body}</svg>
  );
}
