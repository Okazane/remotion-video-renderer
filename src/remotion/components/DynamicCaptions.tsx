import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { WordCaption } from '../types.ts';

interface DynamicCaptionsProps {
  captions: WordCaption[];
  accentColor?: string;
  style?: React.CSSProperties;
}

export const DynamicCaptions: React.FC<DynamicCaptionsProps> = ({
  captions = [],
  accentColor = '#38BDF8',
  style = {}
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  if (!captions || captions.length === 0) return null;

  // Nhóm 4-5 từ / chunk — phù hợp subtitle TV chuẩn
  const CHUNK_SIZE = 5;
  const chunks: WordCaption[][] = [];
  for (let i = 0; i < captions.length; i += CHUNK_SIZE) {
    chunks.push(captions.slice(i, i + CHUNK_SIZE));
  }

  const activeChunk = chunks.find((chunk) => {
    const start = chunk[0].start;
    const end = chunk[chunk.length - 1].end + 0.35;
    return currentSec >= start && currentSec <= end;
  });

  if (!activeChunk) return null;

  // Fade-in caption box khi chunk mới bắt đầu
  const chunkStart = activeChunk[0].start;
  const chunkStartFrame = chunkStart * fps;
  const boxFade = interpolate(frame, [chunkStartFrame, chunkStartFrame + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '6px 10px',
        padding: '18px 28px 16px',
        borderRadius: '14px',
        // Semi-transparent pill — chuẩn broadcast subtitle
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(12px)',
        // Subtle border — không lòe loẹt
        borderTop: `2px solid ${accentColor}40`,
        maxWidth: '92%',
        margin: '0 auto',
        opacity: boxFade,
        ...style
      }}
    >
      {activeChunk.map((cap, index) => {
        const isActive = currentSec >= cap.start && currentSec <= cap.end;
        const isPast = currentSec > cap.end;

        const wordStartFrame = cap.start * fps;
        const frameDiff = Math.max(0, frame - wordStartFrame);

        // Bounce nhỏ hơn — không quá lòe loẹt
        const bounce = isActive
          ? spring({ frame: frameDiff, fps, config: { damping: 14, mass: 0.6, stiffness: 180 } })
          : 1;

        const scale = isActive ? 1 + bounce * 0.06 : 1;

        return (
          <span
            key={`${cap.word}-${index}`}
            style={{
              // Be Vietnam Pro cho chữ tiếng Việt dấu đầy đủ, Inter làm fallback
              fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
              fontSize: '30px',
              fontWeight: isActive ? 800 : 600,
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
              display: 'inline-block',
              transform: `scale(${scale})`,
              transformOrigin: 'bottom center',
              // Active: màu accent sáng. Past: trắng thuần. Future: trắng mờ
              color: isActive ? accentColor : isPast ? '#F0F8FF' : 'rgba(255,255,255,0.5)',
              // Glow khi đang đọc — tinh tế hơn
              textShadow: isActive
                ? `0 0 20px ${accentColor}60, 0 2px 6px rgba(0,0,0,0.9)`
                : '0 2px 6px rgba(0,0,0,0.9)',
              transition: 'color 0.08s ease, font-weight 0.08s ease',
              padding: '2px 3px',
              // Underline khi active — marker rõ ràng kiểu subtile
              borderBottom: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
            }}
          >
            {cap.word}
          </span>
        );
      })}
    </div>
  );
};
