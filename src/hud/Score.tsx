import React from 'react';

export const ScoreHud: React.FC<{ score: number }> = ({ score }) => (
  <div
    style={{
      position: 'absolute',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(10,10,14,0.55)',
      padding: '8px 16px',
      borderRadius: 12,
      border: '1px solid rgba(245,158,11,0.4)',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: 1,
      fontSize: 28,
      fontWeight: 700,
      color: '#fafaf9',
      textShadow: '0 0 12px rgba(245,158,11,0.5)'
    }}
  >
    {score.toLocaleString()}
  </div>
);
