import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

type StatusTone = 'rose' | 'green' | 'amber' | 'red' | 'charcoal';

const TONE_CLASSES: Record<StatusTone, string> = {
  rose: 'bg-[#F8E7EF] text-[#AD1A68] dark:bg-[#E84D96]/20 dark:text-[#FF8EC4]',
  green: 'bg-[#EBF5F1] text-[#27866D] dark:bg-[#27866D]/20 dark:text-[#6EE7B7]',
  amber: 'bg-[#FDF6EC] text-[#C58A32] dark:bg-[#C58A32]/20 dark:text-[#FCD34D]',
  red: 'bg-[#FBEBED] text-[#C95765] dark:bg-[#C95765]/20 dark:text-[#FDA4AF]',
  charcoal: 'bg-[#E8E4E9] text-[#302B35] dark:bg-[#302B35] dark:text-[#E8E4E9]',
};

const DOT_CLASSES: Record<StatusTone, string> = {
  rose: 'bg-[#E84D96]',
  green: 'bg-[#27866D]',
  amber: 'bg-[#C58A32]',
  red: 'bg-[#C95765]',
  charcoal: 'bg-[#302B35] dark:bg-[#A39CA9]',
};

export function StatusBadge({
  label,
  tone = 'charcoal',
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap shrink-0 ${TONE_CLASSES[tone]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASSES[tone]}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F8E7EF] via-[#F8F6F7] to-[#EDE5F2] dark:from-[#2C212C] dark:via-[#1F1C26] dark:to-[#272030] border border-[#E8E4E9] dark:border-[#342E3D] text-[#574148] dark:text-[#D5CFD9] p-4 ${className}`}
      >
        <Building2 className="w-6 h-6 text-[#E84D96] mb-1.5" />
        <span className="text-xs font-medium text-center line-clamp-1">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
