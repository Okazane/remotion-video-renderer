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
import { ViralFinancialCaptions } from '../components/ViralFinancialCaptions.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';
import { FONT_IMPORTS, FONT_PRESETS } from '../styles/fonts.ts';

export const TikTokViralTemplate: React.FC<VideoProjectProps> = ({
  category = 'KINH TẾ',
  sourceName = 'VnExpress',
  scenes = [],
  primaryColor = '#FFE600', // Electric Yellow
  accentColor = '#00F0FF'  // Electric Cyan
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
        fontFamily: FONT_PRESETS.viral.headline,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{FONT_IMPORTS}</style>

      {/* ── Background Music (BGM) loop êm ── */}
      {bgmSrc && <Audio src={bgmSrc} volume={0.06} loop />}

      {/* ── 1. Top Progress Bar & Header Pill ── */}
      <ProgressBar color={primaryColor} height={8} position="top" />

      <div
        style={{
          position: 'absolute',
          top: '48px',
          left: '36px',
          right: '36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50
        }}
      >
        {/* Category Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: `2px solid ${primaryColor}`,
            color: '#FFFFFF',
            padding: '8px 22px',
            borderRadius: '50px',
            fontWeight: 900,
            fontSize: '15px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: `0 0 25px ${primaryColor}70, 0 4px 15px rgba(0,0,0,0.8)`
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: primaryColor,
              boxShadow: `0 0 10px ${primaryColor}`
            }}
          />
          <span>{category}</span>
        </div>

        {/* Source Badge */}
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            padding: '7px 18px',
            borderRadius: '30px',
            fontSize: '13px',
            fontWeight: 800,
            color: '#F1F5F9',
            boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
          }}
        >
          {sourceName}
        </div>
      </div>

      {/* ── 2. Scenes Sequences ── */}
      {scenes.map((scene, index) => {
        const fromFrame = accumulatedFrames;
        const duration = scene.durationInFrames || 180;
        accumulatedFrames += duration;

        return (
          <Sequence key={scene.id || index} from={fromFrame} durationInFrames={duration}>
            <TikTokImmersiveSceneContent
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
    </div>
  );
};

// ─── TIKTOK IMMERSIVE CENTERED SCENE CONTENT ──────────────────────────────
interface TikTokImmersiveSceneContentProps {
  scene: SceneData;
  duration: number;
  fps: number;
  sceneIndex: number;
  primaryColor: string;
  accentColor: string;
}

const TikTokImmersiveSceneContent: React.FC<TikTokImmersiveSceneContentProps> = ({
  scene,
  duration,
  fps,
  sceneIndex,
  primaryColor,
  accentColor
}) => {
  const frame = useCurrentFrame();

  const punchSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 180 }
  });
  const sceneScale = 1 + (1 - punchSpring) * 0.04;

  const audioSrc = scene.audioUrl
    ? scene.audioUrl.startsWith('http') || scene.audioUrl.startsWith('data:')
      ? scene.audioUrl
      : staticFile(scene.audioUrl)
    : null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: `scale(${sceneScale})`,
        transformOrigin: 'center center'
      }}
    >
      {/* Audio Voiceover */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* ── TẦNG 1: Full-bleed Ultra-HD Ken Burns Media ── */}
      <KenBurnsImage
        src={scene.mediaUrl}
        mediaList={scene.mediaList}
        durationInFrames={duration}
        sceneIndex={sceneIndex}
      />

      {/* Cinematic Gradient Vignette */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(180deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.12) 22%, rgba(2,6,23,0.18) 60%, rgba(2,6,23,0.95) 100%)',
          zIndex: 10
        }}
      />

      {/* ── TẦNG 2: Headline Banner ở phía trên ── */}
      {scene.headline && (
        <div
          style={{
            position: 'absolute',
            top: '125px',
            left: '32px',
            right: '32px',
            zIndex: 30,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(2, 6, 23, 0.92)',
              backdropFilter: 'blur(16px)',
              borderLeft: `6px solid ${primaryColor}`,
              borderTop: '1px solid rgba(255, 255, 255, 0.18)',
              padding: '16px 26px',
              borderRadius: '0 16px 16px 0',
              boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
              maxWidth: '100%'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: FONT_PRESETS.viral.headline,
                fontSize: '25px',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.3,
                textTransform: 'uppercase',
                letterSpacing: '0.01em',
                textShadow: '0 2px 8px rgba(0,0,0,0.9)'
              }}
            >
              {scene.headline}
            </h2>
          </div>
        </div>
      )}

      {/* ── TẦNG 3: Viral Financial Captions (Tối ưu 9 nguyên tắc: 2-5 từ, Trắng/Vàng/Đỏ, Vị trí 28%) ── */}
      <ViralFinancialCaptions
        captions={scene.captions}
        primaryColor={primaryColor}
      />
    </div>
  );
};
