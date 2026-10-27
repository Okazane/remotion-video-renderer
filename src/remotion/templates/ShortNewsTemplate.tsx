import React from 'react';
import {
  Audio,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import { VideoProjectProps, SceneData } from '../types.ts';
import { KenBurnsImage } from '../components/KenBurnsImage.tsx';
import { DynamicCaptions } from '../components/DynamicCaptions.tsx';
import { SourceAttribution } from '../components/SourceAttribution.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { FONT_IMPORTS, FONT_PRESETS } from '../styles/fonts.ts';

export const ShortNewsTemplate: React.FC<VideoProjectProps> = ({
  category = 'HÀNG KHÔNG',
  sourceName = 'VnExpress',
  scenes = [],
  primaryColor = '#0284C7',
  accentColor = '#38BDF8'
}) => {
  const { fps } = useVideoConfig();
  let accumulatedFrames = 0;

  const bgmSrc = staticFile('/media/audio/bgm-ambient.wav');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#020617',
        fontFamily: FONT_PRESETS.editorial.headline,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{FONT_IMPORTS}</style>

      {/* ── Background Music êm ái ── */}
      {bgmSrc && <Audio src={bgmSrc} volume={0.06} loop />}

      {/* ── 1. Top Header Category Bar ── */}
      <div
        style={{
          position: 'absolute',
          top: '48px',
          left: '36px',
          right: '36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 40
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: primaryColor,
            color: '#FFFFFF',
            padding: '10px 22px',
            borderRadius: '12px',
            fontFamily: FONT_PRESETS.editorial.badge,
            fontWeight: 900,
            fontSize: '15px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: '0 8px 25px rgba(2, 132, 199, 0.45)'
          }}
        >
          <span style={{ fontSize: '15px' }}>📰</span>
          <span>{category}</span>
        </div>
        <SourceAttribution sourceName={sourceName} variant="badge" />
      </div>

      {/* ── 2. Scenes Sequences ── */}
      {scenes.map((scene, index) => {
        const fromFrame = accumulatedFrames;
        const duration = scene.durationInFrames || 180;
        accumulatedFrames += duration;

        return (
          <Sequence key={scene.id || index} from={fromFrame} durationInFrames={duration}>
            <ShortNewsSceneContent
              scene={scene}
              duration={duration}
              fps={fps}
              sceneIndex={index}
              accentColor={accentColor}
            />
          </Sequence>
        );
      })}

      {/* ── 3. Bottom Progress Bar ── */}
      <ProgressBar color={accentColor} height={5} position="bottom" />
    </div>
  );
};

// ─── SCENE CONTENT ────────────────────────────────────────────────────────────
interface ShortNewsSceneContentProps {
  scene: SceneData;
  duration: number;
  fps: number;
  sceneIndex: number;
  accentColor: string;
}

const ShortNewsSceneContent: React.FC<ShortNewsSceneContentProps> = ({
  scene,
  duration,
  fps,
  sceneIndex,
  accentColor
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const headlineSlide = spring({ frame, fps, config: { damping: 16, stiffness: 160 } });

  const audioSrc = scene.audioUrl
    ? scene.audioUrl.startsWith('http') || scene.audioUrl.startsWith('data:')
      ? scene.audioUrl
      : staticFile(scene.audioUrl)
    : null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: fadeIn }}>
      {/* Background with Multi-directional Pan & Zoom */}
      <KenBurnsImage
        src={scene.mediaUrl}
        mediaList={scene.mediaList}
        durationInFrames={duration}
        sceneIndex={sceneIndex}
      />

      {/* Audio Voiceover */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* Gradient Overlay tăng chiều sâu và độ tương phản */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(180deg, rgba(2,6,23,0.8) 0%, rgba(2,6,23,0.18) 32%, rgba(2,6,23,0.5) 65%, rgba(2,6,23,0.96) 100%)',
          zIndex: 10
        }}
      />

      {/* ── Headline Card ── */}
      {scene.headline && (
        <div
          style={{
            position: 'absolute',
            top: '125px',
            left: '32px',
            right: '32px',
            zIndex: 30,
            transform: `translateY(${(1 - headlineSlide) * -22}px)`,
            opacity: headlineSlide
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(2, 8, 30, 0.85)',
              backdropFilter: 'blur(14px)',
              borderLeft: `5px solid ${accentColor}`,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px 22px 14px',
              borderRadius: '0 14px 14px 0',
              boxShadow: '0 12px 36px rgba(0,0,0,0.6)'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: FONT_PRESETS.editorial.headline,
                fontSize: '26px',
                fontWeight: 800,
                color: '#F0F8FF',
                lineHeight: 1.28,
                letterSpacing: '-0.01em',
                textShadow: '0 2px 8px rgba(0,0,0,0.6)'
              }}
            >
              {scene.headline}
            </h2>
          </div>
        </div>
      )}

      {/* ── Dynamic Captions (Phụ đề dưới chân) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '90px',
          left: '24px',
          right: '24px',
          zIndex: 30
        }}
      >
        <DynamicCaptions captions={scene.captions} accentColor={accentColor} />
      </div>
    </div>
  );
};
