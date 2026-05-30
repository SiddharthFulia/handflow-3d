import React from 'react';

interface Props {
  score: number;
  onRestart: () => void;
  onMenu: () => void;
}

const btn: React.CSSProperties = {
  padding: '12px 22px',
  borderRadius: 10,
  border: '1px solid #3f3f46',
  background: '#18181b',
  color: '#fafaf9',
  fontWeight: 600,
  cursor: 'pointer'
};

export const GameOver: React.FC<Props> = ({ score, onRestart, onMenu }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)'
    }}
  >
    <div
      style={{
        padding: 32,
        borderRadius: 20,
        background: '#0a0a0e',
        border: '1px solid rgba(225,29,72,0.6)',
        textAlign: 'center',
        minWidth: 320
      }}
    >
      <h2 style={{ margin: 0, fontSize: 32, color: '#e11d48' }}>Run ended</h2>
      <div style={{ marginTop: 12, color: '#a1a1aa' }}>Final score</div>
      <div style={{ fontSize: 56, fontWeight: 800, color: '#fafaf9', margin: '8px 0' }}>{score.toLocaleString()}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
        <button type="button" onClick={onRestart} style={{ ...btn, background: '#f59e0b', color: '#0a0a0e', borderColor: '#f59e0b' }}>
          Run again
        </button>
        <button type="button" onClick={onMenu} style={btn}>
          Menu
        </button>
      </div>
    </div>
  </div>
);
