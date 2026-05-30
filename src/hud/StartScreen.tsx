import React, { useState } from 'react';
import { DifficultyKey, CURVES } from '../game/Difficulty';

interface Props {
  onStart: (d: DifficultyKey) => void;
}

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  border: '1px solid #3f3f46',
  background: '#101015',
  color: '#fafaf9',
  cursor: 'pointer',
  minWidth: 140,
  textAlign: 'left'
};

export const StartScreen: React.FC<Props> = ({ onStart }) => {
  const [picked, setPicked] = useState<DifficultyKey>('medium');
  const keys: DifficultyKey[] = ['easy', 'medium', 'hard', 'classic'];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.12), rgba(10,10,14,0.85) 60%)'
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 760 }}>
        <h1
          style={{
            fontSize: 56,
            margin: 0,
            background: 'linear-gradient(135deg, #f59e0b, #e11d48, #d946ef)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: -1
          }}
        >
          HandFlow 3D
        </h1>
        <p style={{ color: '#d4d4d8', marginTop: 8 }}>
          Lift your palm into frame. Slide left or right to change lanes. Raise to jump, drop to roll.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          {keys.map((k) => {
            const c = CURVES[k];
            const active = picked === k;
            return (
              <button
                type="button"
                key={k}
                onClick={() => setPicked(k)}
                style={{
                  ...card,
                  borderColor: active ? '#f59e0b' : '#3f3f46',
                  boxShadow: active ? '0 0 0 3px rgba(245,158,11,0.18)' : 'none'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 18, textTransform: 'uppercase' }}>{k}</div>
                <div style={{ color: '#a1a1aa', fontSize: 12, marginTop: 4 }}>
                  {c.startSpeed}-{c.topSpeed} u/s
                </div>
                <div style={{ color: '#a1a1aa', fontSize: 12 }}>density {c.obstacleDensity.toFixed(2)}</div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onStart(picked)}
          style={{
            marginTop: 28,
            padding: '14px 36px',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #e11d48)',
            color: '#0a0a0e',
            fontWeight: 700,
            fontSize: 18,
            cursor: 'pointer'
          }}
        >
          Start run
        </button>
      </div>
    </div>
  );
};
