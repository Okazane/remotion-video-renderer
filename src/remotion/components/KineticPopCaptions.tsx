import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { WordCaption } from '../types.ts';

interface KineticPopCaptionsProps {
  captions: WordCaption[];
  primaryColor?: string;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Tự động phát hiện emoji theo từ khóa tiếng Việt
 */
function getEmojiForKeyword(text: string): string {
  const w = text.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '');
  if (/đất|nhà|bấtđộngsản|quyhoạch|dựán/.test(w)) return '🏡';
  if (/tiền|thuế|tỷ|triệu|giá|phí|vốn|lãi/.test(w)) return '💰';
  if (/nguyhiểm|cảnhbáo|thuhồi|phạt|găm|đầucơ/.test(w)) return '🚨';
  if (/quyếtđịnh|nhanh|tốcđộ|tăng|sốt/.test(w)) return '⚡';
  if (/luật|chínhsách|nhànước|minhbạch|chuẩn/.test(w)) return '📜';
  if (/người|khách|dân|nhàđầutư|chuyêngia/.test(w)) return '👥';
  if (/máybay|phicông|cấtcánh|hàngkhông/.test(w)) return '✈️';
  if (/thànhcông|hiệuquả|an toàn/.test(w)) return '🎯';
  return '';
}

/**
 * Tự động chọn màu sắc nổi bật cho các từ khóa đặc biệt (Alex Hormozi Style)
 */
function getWordHighlightColor(word: string, fallbackColor: string): string {
  const w = word.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '');
  // Từ khóa cảnh báo / thuế / thu hồi -> Đỏ / Cam rực rỡ
  if (/thuế|thu hồi|găm|đầu cơ|phạt|chậm|bỏ hoang/.test(w)) return '#FF453A';
  // Từ khóa tiền bạc / giá trị / tăng trưởng -> Xanh lá Neon
  if (/tiền|giá trị|lũy tiến|tăng|lợi nhuận|vốn/.test(w)) return '#30D158';
  // Từ khóa cốt lõi -> Vàng Neon
  if (/đất|nhà nước|luật|chính sách|minh bạch|quy hoạch/.test(w)) return '#FFD60A';
  return fallbackColor;
}

export const KineticPopCaptions: React.FC<KineticPopCaptionsProps> = ({
  captions = [],
  primaryColor = '#FFE600',
  accentColor = '#00F0FF',
  style = {}
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  if (!captions || captions.length === 0) return null;

  // Chia thành cụm 2-3 từ để nhịp đọc nhanh, cuốn hút (chuẩn TikTok / Submagic / Alex Hormozi)
  const CHUNK_SIZE = 3;
  const chunks: WordCaption[][] = [];
  for (let i = 0; i < captions.length; i += CHUNK_SIZE) {
    chunks.push(captions.slice(i, i + CHUNK_SIZE));
  }

  const activeChunk = chunks.find((chunk) => {
    const start = chunk[0].start;
    const end = chunk[chunk.length - 1].end + 0.25;
    return currentSec >= start && currentSec <= end;
  }) || chunks[0];

  // Tìm từ đang đọc trong chunk
  const activeWordObj = activeChunk.find(
    (cap) => currentSec >= cap.start && currentSec <= cap.end
  );

  // Lấy emoji phù hợp với cụm từ
  const chunkText = activeChunk.map((c) => c.word).join('');
  const activeEmoji = getEmojiForKeyword(chunkText);

  // Hiệu ứng Fade & Slide nhẹ khi cụm từ mới xuất hiện
  const chunkStartFrame = activeChunk[0].start * fps;
  const chunkDiff = Math.max(0, frame - chunkStartFrame);
  const chunkPop = spring({
    frame: chunkDiff,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 200 }
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${0.92 + chunkPop * 0.08})`,
        transformOrigin: 'center bottom',
        width: '100%',
        ...style
      }}
    >
      {/* ── 1. Floating Animated Emoji (Nhảy lên khi sang từ khóa) ── */}
      {activeEmoji && (
        <div
          style={{
            fontSize: '52px',
            lineHeight: 1,
            marginBottom: '10px',
            filter: 'drop-shadow(0 0 20px rgba(255, 230, 0, 0.85)) drop-shadow(0 4px 10px rgba(0,0,0,0.8))',
            transform: `scale(${chunkPop}) translateY(${(1 - chunkPop) * 15}px)`,
            transformOrigin: 'center center'
          }}
        >
          {activeEmoji}
        </div>
      )}

      {/* ── 2. Kinetic Words Container (Trong suốt, nổi khối 3D trên mọi nền) ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px 18px',
          textAlign: 'center',
          padding: '16px 28px',
          borderRadius: '24px',
          // Nền đen mờ 80% nhẹ nhàng + viền sáng mỏng để đọc cực nét
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 1px 1px rgba(255,255,255,0.1)'
        }}
      >
        {activeChunk.map((cap, index) => {
          const isActive = currentSec >= cap.start && currentSec <= cap.end;
          const isPast = currentSec > cap.end;

          const wordStartFrame = cap.start * fps;
          const frameDiff = Math.max(0, frame - wordStartFrame);

          // Spring bounce mạnh mẽ khi từ bắt đầu được phát âm
          const wordSpring = isActive
            ? spring({
                frame: frameDiff,
                fps,
                config: { damping: 10, mass: 0.35, stiffness: 240 }
              })
            : 1;

          const scale = isActive ? 1.14 + wordSpring * 0.08 : 1;
          const highlightColor = getWordHighlightColor(cap.word, primaryColor);

          return (
            <span
              key={`${cap.word}-${index}`}
              style={{
                fontFamily: "'Montserrat', 'Be Vietnam Pro', sans-serif",
                fontSize: '46px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
                display: 'inline-block',
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                // Từ active: Màu Neon nổi bật kèm nền Badge hoặc Glow
                color: isActive ? '#000000' : isPast ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: isActive ? highlightColor : 'transparent',
                padding: isActive ? '6px 16px' : '6px 2px',
                borderRadius: isActive ? '12px' : '0px',
                // Stroke viền đen dày 3.5px để chữ không bao giờ bị chìm vào nền sáng
                WebkitTextStroke: isActive ? '0px' : '3.5px #000000',
                textShadow: isActive
                  ? `0 0 30px ${highlightColor}, 0 4px 8px rgba(0,0,0,0.8)`
                  : '0 4px 12px rgba(0,0,0,0.95)',
                boxShadow: isActive ? `0 10px 30px ${highlightColor}90` : 'none',
                transition: 'all 0.04s ease',
                willChange: 'transform'
              }}
            >
              {cap.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
