import React from 'react';
import { Audio, Img, Sequence, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoProjectProps, SceneData } from '../types.ts';
import { DynamicCaptions } from '../components/DynamicCaptions.tsx';
import { SourceAttribution } from '../components/SourceAttribution.tsx';
import { ProgressBar } from '../components/ProgressBar.tsx';

export const ExplainerTemplate: React.FC<VideoProjectProps> = ({
  category = 'PHÂN TÍCH & TỔNG HỢP',
  sourceName = 'VnExpress',
  scenes = [],
  primaryColor = '#6366F1',
  accentColor = '#A5B4FC'
}) => {
  const { fps } = useVideoConfig();

  let accumulatedFrames = 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#030712',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        color: '#F9FAFB'
      }}
    >
      {/* 1. Header Minimalist */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
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
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '8px 18px',
            borderRadius: '30px',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '0.04em'
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: primaryColor
            }}
          />
          <span>{category}</span>
        </div>

        <SourceAttribution sourceName={sourceName} variant="badge" />
      </div>

      {/* 2. Scenes */}
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
            <ExplainerSceneContent
              scene={scene}
              duration={duration}
              fps={fps}
              accentColor={accentColor}
              primaryColor={primaryColor}
            />
          </Sequence>
        );
      })}

      <ProgressBar color={primaryColor} height={4} position="bottom" />
    </div>
  );
};

interface ExplainerSceneProps {
  scene: SceneData;
  duration: number;
  fps: number;
  accentColor: string;
  primaryColor: string;
}

const ExplainerSceneContent: React.FC<ExplainerSceneProps> = ({
  scene,
  duration,
  fps,
  accentColor,
  primaryColor
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp'
  });

  const zoom = interpolate(frame, [0, duration], [1.0, 1.08], {
    extrapolateRight: 'clamp'
  });

  const cardSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 140 }
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
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: fadeIn
      }}
    >
      {/* Background Blurred Ambient */}
      {scene.mediaUrl && (
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '120%',
            height: '120%',
            filter: 'blur(40px) brightness(0.35)',
            transform: `scale(${zoom})`,
            zIndex: 1
          }}
        >
          <Img src={scene.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Audio */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* Central Content Card */}
      <div
        style={{
          position: 'absolute',
          top: '110px',
          bottom: '160px',
          left: '40px',
          right: '40px',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${0.95 + cardSpring * 0.05})`
        }}
      >
        {/* Media Frame */}
        <div
          style={{
            width: '100%',
            maxWidth: '680px',
            height: '420px',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.1)',
            position: 'relative',
            marginBottom: '28px'
          }}
        >
          {scene.mediaUrl && (
            <Img
              src={scene.mediaUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${zoom})`
              }}
            />
          )}
        </div>

        {/* Headline Quote Box */}
        {scene.headline && (
          <div
            style={{
              maxWidth: '680px',
              backgroundColor: 'rgba(17, 24, 39, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px 24px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 700,
                color: '#F3F4F6',
                lineHeight: 1.4
              }}
            >
              "{scene.headline}"
            </p>
          </div>
        )}
      </div>

      {/* Dynamic Subtitles at Bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
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
