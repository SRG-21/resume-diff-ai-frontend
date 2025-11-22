import React from 'react';

interface SkillChipsProps {
  skills: string[];
  variant: 'matched' | 'missing';
  className?: string;
}

export const SkillChips: React.FC<SkillChipsProps> = ({
  skills,
  variant,
  className = '',
}) => {
  if (skills.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        {variant === 'matched' ? 'No matched skills found' : 'No missing skills - Perfect match!'}
      </p>
    );
  }

  const chipClass = variant === 'matched' ? 'skill-chip-matched' : 'skill-chip-missing';

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="list">
      {skills.map((skill, index) => (
        <span key={`${skill}-${index}`} className={chipClass} role="listitem">
          {skill}
        </span>
      ))}
    </div>
  );
};
