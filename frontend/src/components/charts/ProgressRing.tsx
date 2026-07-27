import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import React, { useEffect, useState } from 'react';

export interface ProgressRingProps {
  progress?: DynamicState;
  size?: DynamicState;
  strokeWidth?: DynamicState;
  color?: DynamicState;
  trackColor?: DynamicState;
  label?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function ProgressRing({ 
  progress = 0, 
  size = 60, 
  strokeWidth = 6, 
  color = 'var(--primary)', 
  trackColor = 'rgba(255,255,255,0.1)',
  label 
}: ProgressRingProps) {
  const [offset, setOffset] = useState<DynamicState>(0);
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const progressOffset = ((100 - progress) / 100) * circumference;
    // Slight delay to trigger CSS transition on mount
    const timer = setTimeout(() => setOffset(progressOffset), 100);
    return () => clearTimeout(timer);
  }, [progress, circumference]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset === 0 ? circumference : offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} // Subtle glow
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold font-display tracking-tight text-white">{label}</span>
        </div>
      )}
    </div>
  );
}
