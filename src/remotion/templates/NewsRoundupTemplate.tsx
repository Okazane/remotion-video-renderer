import React from 'react';
import { Audio, Sequence, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoProjectProps, SceneData } from '../types.ts';
import { KenBurnsImage } from '../components/KenBurnsImage.tsx';
import { DynamicCaptions } from '../components/DynamicCaptions.tsx';
import { NewsTicker } from '../components/NewsTicker.tsx';
import { SourceAttribution } from '../components/SourceAttribution.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';

export const NewsRoundupTemplate: React.FC<VideoProjectProps> = ({
  title = 'BẢN TIN TỔNG HỢP',
  category = 'HÀNG KHÔNG',
  sourceName = 'VnExpress',
  tickerText = 'Cập nhật tin tức đời sống, kinh tế, công nghệ trong ngày • Thông tin được tổng hợp từ nguồn báo chính thống',
  scenes = [],
  primaryColor = '#0369A1',
  accentColor = '#38BDF8'
}) => {
  const { fps } = useVideoConfig();

  let accumulatedFrames = 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#090D16',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        color: '#F8FAFC'
      }}
    >
      {/* 1. Header Bar Top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          backgroundColor: '#0F172A',
          borderBottom: `2px solid ${primaryColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 40px',
          zIndex: 40,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              backgroundColor: primaryColor,
              color: '#FFFFFF',
              padding: '6px 16px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '0.05em'
            }}
          >
            {category.toUpperCase()}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: '#F1F5F9',
              letterSpacing: '-0.01em'
            }}
          >
            {title}
          </h1>
        </div>

        <SourceAttribution sourceName={sourceName} variant="badge" />
      </div>

      {/* 2. Scenes Sequences */}
      {scenes.map((scene, index) => {
        const fromFrame = accumulatedFrames;
        const duration = scene.durationInFrames || 180;
        accumulatedFrames += duration;

        return (
          <Sequence
            key={scene.id || index}
            from={fromFrame}
            durationInFrames={duration}
          >
            <BroadcastSceneContent
              scene={scene}
              duration={duration}
              fps={fps}
              accentColor={accentColor}
              sourceName={sourceName}
            />
          </Sequence>
        );
      })}

      {/* 3. Bottom News Ticker */}
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
          text={tickerText || `Nguồn thông tin tổng hợp từ ${sourceName} • Bản tin chuyên đề`}
          badgeText="BẢN TIN"
        />
        <ProgressBar color={accentColor} height={4} position="top" />
      </div>
    </div>
  );
};

interface BroadcastSceneProps {
  scene: SceneData;
  duration: number;
  fps: number;
  accentColor: string;
  sourceName: string;
}

const BroadcastSceneContent: React.FC<BroadcastSceneProps> = ({
  scene,
  duration,
  fps,
  accentColor,
  sourceName
}) => {
  const frame = useCurrentFrame();

  const sceneFade = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp'
  });

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 }
  });

  const audioSrc = scene.audioUrl
    ? scene.audioUrl.startsWith('http') || scene.audioUrl.startsWith('data:')
      ? scene.audioUrl
      : staticFile(scene.audioUrl)
    : null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '70px',
        bottom: '48px',
        left: 0,
        right: 0,
        opacity: sceneFade,
        display: 'flex',
        padding: '36px 40px',
        gap: '36px',
        alignItems: 'center'
      }}
    >
      {/* Audio giọng đọc */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* Cột trái: Tiêu đề, thông tin tóm tắt, phụ đề */}
      <div
        style={{
          flex: '1 1 45%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          transform: `translateX(${(1 - slideIn) * -30}px)`
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '6px',
              color: accentColor,
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '16px'
            }}
          >
            PHÂN CẢNH {scene.sceneIndex + 1}
          </div>

          <h2
            style={{
              margin: '0 0 16px 0',
              fontSize: '32px',
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.3,
              letterSpacing: '-0.02em'
            }}
          >
            {scene.headline}
          </h2>

          <SourceAttribution sourceName={sourceName} variant="lower-third" />
        </div>

        {/* Dynamic Subtitles trong khung */}
        <div style={{ marginTop: 'auto', marginBottom: '20px' }}>
          <DynamicCaptions
            captions={scene.captions}
            accentColor={accentColor}
            style={{ maxWidth: '100%', borderRadius: '12px' }}
          />
        </div>
      </div>

      {/* Cột phải: Media Frame (Hỗ trợ Multi-image Transition) */}
      <div
        style={{
          flex: '1 1 55%',
          height: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          backgroundColor: '#020617',
          transform: `translateX(${(1 - slideIn) * 30}px)`
        }}
      >
        <KenBurnsImage
          src={scene.mediaUrl}
          mediaList={scene.mediaList}
          durationInFrames={duration}
        />
      </div>
    </div>
  );
};
