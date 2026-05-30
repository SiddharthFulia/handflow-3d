import React, { useEffect, useRef, useState } from 'react';
import { GameScene } from './scene/GameScene';
import { HandTracker } from './input/HandTracker';
import { Gestures, GestureIntent } from './input/Gestures';
import { KeyboardFallback } from './input/KeyboardFallback';
import { InputMux } from './input/InputMux';
import { Store, GamePhase } from './game/State';
import { StartScreen } from './hud/StartScreen';
import { PauseModal } from './hud/PauseModal';
import { GameOver } from './hud/GameOver';
import { ScoreHud } from './hud/Score';
import { ComboHud } from './hud/Combo';
import { DifficultyKey } from './game/Difficulty';

export const HandFlow: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const handRef = useRef<HandTracker | null>(null);
  const muxRef = useRef<InputMux | null>(null);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [handOk, setHandOk] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const store = new Store();
    const gestures = new Gestures();
    const keyboard = new KeyboardFallback();
    const mux = new InputMux(keyboard, gestures);
    muxRef.current = mux;

    const scene = new GameScene(canvasRef.current, store, mux);
    sceneRef.current = scene;
    scene.start();

    keyboard.attach(window);

    const unsubPhase = store.subscribe('phase', (p) => setPhase(p));
    const unsubScore = store.subscribe('score', (s) => setScore(s));
    const unsubCombo = store.subscribe('combo', (c) => setCombo(c));

    return () => {
      unsubPhase();
      unsubScore();
      unsubCombo();
      keyboard.detach(window);
      scene.dispose();
      handRef.current?.dispose();
    };
  }, []);

  const handleStart = async (difficulty: DifficultyKey) => {
    if (!videoRef.current || !sceneRef.current || !muxRef.current) return;
    sceneRef.current.store.setDifficulty(difficulty);

    if (!handRef.current) {
      try {
        const tracker = new HandTracker(videoRef.current);
        await tracker.init();
        tracker.onLandmarks((landmarks, t) => {
          const intent: GestureIntent | null = muxRef.current!.gestures.process(landmarks, t);
          if (intent) muxRef.current!.gestures.publish(intent);
        });
        handRef.current = tracker;
        setHandOk(true);
      } catch (err) {
        // camera blocked / mediapipe failed → keyboard-only
        // eslint-disable-next-line no-console
        console.warn('handflow-3d: hand tracking unavailable, keyboard only', err);
        setHandOk(false);
      }
    }

    sceneRef.current.beginRun();
  };

  const handlePause = () => sceneRef.current?.store.setPhase('paused');
  const handleResume = () => sceneRef.current?.store.setPhase('playing');
  const handleRestart = () => sceneRef.current?.beginRun();

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0e' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: 'absolute',
          right: 16,
          top: 16,
          width: 200,
          height: 150,
          objectFit: 'cover',
          borderRadius: 12,
          border: handOk ? '2px solid #f59e0b' : '2px solid #3f3f46',
          opacity: handOk ? 1 : 0.5,
          transform: 'scaleX(-1)',
          background: '#18181b'
        }}
      />
      {phase === 'playing' && <ScoreHud score={score} />}
      {phase === 'playing' && combo > 1 && <ComboHud combo={combo} />}
      {phase === 'menu' && <StartScreen onStart={handleStart} />}
      {phase === 'paused' && <PauseModal onResume={handleResume} onRestart={handleRestart} />}
      {phase === 'gameover' && (
        <GameOver
          score={score}
          onRestart={handleRestart}
          onMenu={() => sceneRef.current?.store.setPhase('menu')}
        />
      )}
      <button
        type="button"
        onClick={handlePause}
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          background: 'rgba(24,24,27,0.7)',
          color: '#fafaf9',
          border: '1px solid #3f3f46',
          borderRadius: 8,
          padding: '8px 12px',
          cursor: 'pointer',
          display: phase === 'playing' ? 'block' : 'none'
        }}
      >
        Pause
      </button>
    </div>
  );
};
