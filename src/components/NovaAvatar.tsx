import React from 'react';

export type NovaState = 'idle' | 'thinking' | 'responding';

interface NovaAvatarProps {
  state?: NovaState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NovaAvatar({ state = 'idle', size = 'md', className = '' }: NovaAvatarProps) {
  const dimensions =
    size === 'sm' ? 'w-11 h-11' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${dimensions} ${className}`}
      aria-label={`Nova AI Mentor (${state})`}
    >
      {state === 'thinking' && (
        <span
          className="absolute inset-0 rounded-full border-2 border-[#E84D96]/50 animate-nova-ring pointer-events-none"
          aria-hidden="true"
        />
      )}

      <div className="animate-nova-float w-full h-full flex items-center justify-center">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-[0_6px_14px_rgba(25,23,29,0.14)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Antenna / Neural Crest */}
          <line x1="60" y1="10" x2="60" y2="23" stroke="#19171D" strokeWidth="4" strokeLinecap="round" />
          <circle
            cx="60"
            cy="9"
            r="5"
            fill={state === 'thinking' ? '#E84D96' : '#19171D'}
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* Side Acoustic Pods */}
          <rect x="12" y="48" width="10" height="28" rx="5" fill="#302B35" />
          <rect x="98" y="48" width="10" height="28" rx="5" fill="#302B35" />
          <rect x="14" y="56" width="3" height="12" rx="1.5" fill="#E84D96" />
          <rect x="103" y="56" width="3" height="12" rx="1.5" fill="#E84D96" />

          {/* Architectural Ceramic Head Shell */}
          <rect
            x="20"
            y="22"
            width="80"
            height="76"
            rx="28"
            fill="#FFFFFF"
            stroke="#19171D"
            strokeWidth="3.5"
          />

          {/* Subtle Rose Rim Accent */}
          <path
            d="M32 30 H88"
            stroke="#F8E7EF"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Midnight Visor Glass */}
          <rect
            x="29"
            y="38"
            width="62"
            height="42"
            rx="16"
            fill="#19171D"
          />

          {/* Inner Visor Bevel */}
          <rect
            x="31"
            y="40"
            width="58"
            height="38"
            rx="14"
            stroke="#302B35"
            strokeWidth="1.5"
          />

          {/* Expressive Optical Eyes */}
          {state === 'thinking' ? (
            <g>
              <circle cx="46" cy="57" r="4.5" fill="#E84D96" />
              <circle cx="60" cy="57" r="3" fill="#FFB0CC" opacity="0.85" />
              <circle cx="74" cy="57" r="4.5" fill="#E84D96" />
            </g>
          ) : (
            <g className="animate-nova-blink">
              <rect x="40" y="49" width="11" height="14" rx="5.5" fill="#E84D96" />
              <circle cx="43.5" cy="53" r="2" fill="#FFFFFF" opacity="0.9" />
              <rect x="69" y="49" width="11" height="14" rx="5.5" fill="#E84D96" />
              <circle cx="72.5" cy="53" r="2" fill="#FFFFFF" opacity="0.9" />
            </g>
          )}

          {/* Mouth / Voice Waveform */}
          {state === 'responding' ? (
            <g>
              <rect x="50" y="67" width="3.5" height="8" rx="1.75" fill="#FFFFFF" className="animate-nova-wave-1" style={{ transformOrigin: '51.75px 71px' }} />
              <rect x="58" y="65" width="3.5" height="12" rx="1.75" fill="#E84D96" className="animate-nova-wave-2" style={{ transformOrigin: '59.75px 71px' }} />
              <rect x="66" y="67" width="3.5" height="8" rx="1.75" fill="#FFFFFF" className="animate-nova-wave-3" style={{ transformOrigin: '67.75px 71px' }} />
            </g>
          ) : (
            <path
              d="M51 69 Q60 74 69 69"
              stroke="#E8E4E9"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Collar Base */}
          <rect x="44" y="99" width="32" height="9" rx="4.5" fill="#19171D" />
          <rect x="53" y="102" width="14" height="3" rx="1.5" fill="#E84D96" />
        </svg>
      </div>
    </div>
  );
}
