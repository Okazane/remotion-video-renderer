import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface ProgressBarProps {
  color?: string;
  height?: number;
  position?: 'top' | 'bottom';
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  color = '#38BDF8',
  height = 4,
  position = 'bottom',
  style = {}
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        [position]: 0,
        height: `${height}px`,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        zIndex: 50,
        overflow: 'hidden',
        ...style
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}`,
          transition: 'none'
        }}
      />
    </div>
  );
};
