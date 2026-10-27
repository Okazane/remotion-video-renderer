import React from 'react';
import { useCurrentFrame } from 'remotion';

interface NewsTickerProps {
  text: string;
  badgeText?: string;
  badgeColor?: string;
  borderColor?: string;
  speed?: number; // pixels per frame
  className?: string;
  style?: React.CSSProperties;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({
  text,
  badgeText = 'TIN MỚI',
  badgeColor = '#0284C7',
  borderColor = '#38BDF8',
  speed = 3.5,
  className = '',
  style = {}
}) => {
  const frame = useCurrentFrame();

  // Dải tin chạy chữ ngang lặp lại mượt mà
  const offset = (frame * speed) % 2500;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '46px',
        backgroundColor: '#090D16',
        borderTop: `2px solid ${borderColor}`,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 -4px 25px rgba(0,0,0,0.6)',
        ...style
      }}
      className={className}
    >
      {/* Huy hiệu Tin tức cố định */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: badgeColor,
          color: '#FFFFFF',
          padding: '0 20px',
          height: '100%',
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          zIndex: 10,
          boxShadow: '6px 0 16px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap'
        }}
      >
        <span style={{ fontSize: '15px' }}>⚡</span>
        <span>{badgeText}</span>
      </div>

      {/* Vùng chữ chạy ngang */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            whiteSpace: 'nowrap',
            transform: `translateX(-${offset}px)`,
            willChange: 'transform'
          }}
        >
          <span
            style={{
              fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              color: '#F1F5F9',
              paddingRight: '120px',
              letterSpacing: '0.01em'
            }}
          >
            {text} • {text} • {text}
          </span>
        </div>
      </div>
    </div>
  );
};
