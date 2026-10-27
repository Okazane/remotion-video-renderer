import React from 'react';

interface SourceAttributionProps {
  sourceName: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'badge' | 'lower-third' | 'minimal';
}

export const SourceAttribution: React.FC<SourceAttributionProps> = ({
  sourceName,
  className = '',
  style = {},
  variant = 'badge'
}) => {
  if (!sourceName) return null;

  if (variant === 'lower-third') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          borderLeft: '3px solid #38BDF8',
          borderRadius: '0 8px 8px 0',
          color: '#94A3B8',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          ...style
        }}
        className={className}
      >
        <span>📌 Nguồn tham khảo:</span>
        <span style={{ color: '#F1F5F9', fontWeight: 700 }}>{sourceName}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '20px',
        color: '#CBD5E1',
        fontSize: '13px',
        fontWeight: 600,
        ...style
      }}
      className={className}
    >
      <span style={{ fontSize: '14px' }}>📰</span>
      <span>Nguồn:</span>
      <span style={{ color: '#38BDF8', fontWeight: 700 }}>{sourceName}</span>
    </div>
  );
};
