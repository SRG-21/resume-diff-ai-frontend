import React, { useEffect, useState } from 'react';

interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  percentage,
  size = 200,
  strokeWidth = 12,
  animate = true,
}) => {
  const [displayPercentage, setDisplayPercentage] = useState(animate ? 0 : percentage);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayPercentage / 100) * circumference;

  // Color based on percentage
  const getColor = (percent: number) => {
    if (percent >= 80) return '#10b981'; // green-500
    if (percent >= 60) return '#f59e0b'; // amber-500
    if (percent >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  useEffect(() => {
    if (!animate) return;

    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepValue = percentage / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayPercentage(percentage);
        clearInterval(timer);
      } else {
        setDisplayPercentage(Math.round(stepValue * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [percentage, animate]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl md:text-5xl font-bold" style={{ color: getColor(percentage) }}>
          {displayPercentage}%
        </span>
        <span className="text-sm text-gray-600 mt-1">Match</span>
      </div>
    </div>
  );
};
