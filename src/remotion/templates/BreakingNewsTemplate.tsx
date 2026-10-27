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
import { NewsTicker } from '../components/NewsTicker.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { FONT_IMPORTS, FONT_PRESETS } from '../styles/fonts.ts';

export const BreakingNewsTemplate: React.FC<VideoProjectProps> = ({
  category = 'TIN NÓNG',
  sourceName = 'VnExpress',
  tickerText = 'BẢN TIN NÓNG • Cập nhật diễn biến mới nhất • Nguồn thông tin chính thống',
  scenes = [],
  primaryColor = '#DC2626', // Đỏ Crimson chuẩn Breaking News
  accentColor = '#FACC15'  // Vàng Gold
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
        fontFamily: FONT_PRESETS.broadcast.headline,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{FONT_IMPORTS}</style>

      {/* ── BGM Loop ── */}
      {bgmSrc && <Audio src={bgmSrc} volume={0.07} loop />}

      {/* ── 1. Breaking News Header Bar (Top) ── */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 40
        }}
      >
        {/* Breaking Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: primaryColor,
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '15px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: '0 8px 25px rgba(220, 38, 38, 0.6)'
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 10px #FFFFFF'
            }}
          />
          <span>🔴 BREAKING NEWS</span>
        </div>

        {/* Nguồn tin xác thực */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
            color: '#E2E8F0',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>Nguồn:</span>
          <span style={{ color: accentColor }}>{sourceName}</span>
        </div>
      </div>

      {/* ── 2. Scenes Sequences ── */}
      {scenes.map((scene, index) => {
        const fromFrame = accumulatedFrames;
        const duration = scene.durationInFrames || 180;
        accumulatedFrames += duration;

        return (
          <Sequence key={scene.id || index} from={fromFrame} durationInFrames={duration}>
            <BreakingNewsSceneContent
              scene={scene}
              duration={duration}
              fps={fps}
              sceneIndex={index}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </Sequence>
        );
      })}

      {/* ── 3. Bottom News Ticker & Progress Bar ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40
        }}
      >
        <NewsTicker
          text={tickerText || `Cập nhật từ ${sourceName} • Theo dõi tin tức liên tục trong ngày`}
          badgeText="LIVE"
          badgeColor={primaryColor}
        />
        <ProgressBar color={accentColor} height={4} position="top" />
      </div>
    </div>
  );
};

// ─── SCENE CONTENT ────────────────────────────────────────────────────────
const BreakingNewsSceneContent: React.FC<{
  scene: SceneData;
  duration: number;
  fps: number;
  sceneIndex: number;
  primaryColor: string;
  accentColor: string;
}> = ({ scene, duration, fps, sceneIndex, primaryColor, accentColor }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const slideSpring = spring({ frame, fps, config: { damping: 15, stiffness: 140 } });

  const audioSrc = scene.audioUrl
    ? scene.audioUrl.startsWith('http') || scene.audioUrl.startsWith('data:')
      ? scene.audioUrl
      : staticFile(scene.audioUrl)
    : null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: fadeIn }}>
      <KenBurnsImage
        src={scene.mediaUrl}
        mediaList={scene.mediaList}
        durationInFrames={duration}
        sceneIndex={sceneIndex}
      />

      {audioSrc && <Audio src={audioSrc} />}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(180deg, rgba(2,6,23,0.8) 0%, rgba(2,6,23,0.18) 32%, rgba(2,6,23,0.6) 65%, rgba(2,6,23,0.96) 100%)',
          zIndex: 10
        }}
      />

      {/* Headline Lower-Third Card */}
      {scene.headline && (
        <div
          style={{
            position: 'absolute',
            top: '110px',
            left: '24px',
            right: '24px',
            zIndex: 30,
            transform: `translateY(${(1 - slideSpring) * -20}px)`,
            opacity: slideSpring
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(16px)',
              borderLeft: `6px solid ${primaryColor}`,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              padding: '16px 22px',
              borderRadius: '0 12px 12px 0',
              boxShadow: '0 15px 40px rgba(0,0,0,0.7)'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '26px',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {scene.headline}
            </h2>
          </div>
        </div>
      )}

      {/* Dynamic Captions */}
      <div
        style={{
          position: 'absolute',
          bottom: '75px',
          left: '20px',
          right: '20px',
          zIndex: 30
        }}
      >
        <DynamicCaptions captions={scene.captions} accentColor={accentColor} />
      </div>
    </div>
  );
};
