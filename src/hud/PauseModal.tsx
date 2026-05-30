import React from 'react';

interface Props {
  onResume: () => void;
  onRestart: () => void;
}

const btn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: '1px solid #3f3f46',
  background: '#18181b',
  color: '#fafaf9',
  fontWeight: 600,
  cursor: 'pointer'
};

export const PauseModal: React.FC<Props> = ({ onResume, onRestart }) => (
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
        border: '1px solid rgba(245,158,11,0.4)',
        textAlign: 'center'
      }}
    >
      <h2 style={{ margin: 0, fontSize: 28, color: '#fafaf9' }}>Paused</h2>
      <p style={{ color: '#a1a1aa', marginTop: 8 }}>Take a breath. Your run is waiting.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
        <button type="button" onClick={onResume} style={{ ...btn, background: '#f59e0b', color: '#0a0a0e', borderColor: '#f59e0b' }}>
          Resume
        </button>
        <button type="button" onClick={onRestart} style={btn}>
          Restart
        </button>
      </div>
    </div>
  </div>
);
