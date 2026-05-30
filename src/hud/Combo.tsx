import React from 'react';

export const ComboHud: React.FC<{ combo: number }> = ({ combo }) => {
  const mult = Math.min(5, Math.floor(combo / 5) + 1);
  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #f59e0b, #e11d48)',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 700,
        color: '#0a0a0e'
      }}
    >
      x{mult} · combo {combo}
    </div>
  );
};
