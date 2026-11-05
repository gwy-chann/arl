import React from 'react';

export interface CapacityMeterProps {
  percentage: number;
  isLow?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function CapacityMeter({
  percentage,
  isLow = false,
  className = '',
  ariaLabel,
}: Readonly<CapacityMeterProps>) {
  const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || `Stock capacity level ${clampedPercentage}%`}
      className={`
        meter relative flex-1 h-[7px] rounded-[9px]
        bg-bg-muted border border-border overflow-hidden min-w-[24px]
        ${isLow ? 'low' : ''}
        ${className}
      `}
    >
      <i
        style={{ width: `${clampedPercentage}%` }}
        className={`
          block h-full rounded-[9px] transition-all duration-300 ease-out
          ${isLow ? 'bg-danger' : 'bg-primary'}
        `}
      />
    </div>
  );
}
