import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { WordCaption } from '../types.ts';

interface TramAICaptionsProps {
  captions: WordCaption[];
  primaryColor?: string;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Tự động phát hiện icon/emoji biểu cảm sinh động theo chủ đề (chuẩn Trạm AI)
 */
function getEmojiForKeyword(text: string): string {
  const w = text.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '');
  if (/đất|nhà|bấtđộngsản|quyhoạch|dựán|côngtrình/.test(w)) return '🏡';
  if (/tiền|thuế|tỷ|triệu|giá|phí|vốn|lãi|lợinhuận/.test(w)) return '💰';
  if (/nguyhiểm|cảnhbáo|thuhồi|phạt|găm|đầucơ|bỏhoang/.test(w)) return '🚨';
  if (/quyếtđịnh|nhanh|tốcđộ|tăng|sốt|bùngnổ/.test(w)) return '⚡';
  if (/luật|chínhsách|nhànước|minhbạch|chuẩn|văn bản/.test(w)) return '📜';
  if (/người|khách|dân|nhàđầutư|chuyêngia|cộngđồng/.test(w)) return '👥';
  if (/máybay|phicông|cấtcánh|hàngkhông|sânbay/.test(w)) return '✈️';
  if (/thànhcông|hiệuquả|antoàn|chuẩnxác/.test(w)) return '🎯';
  if (/côngnghệ|ai|robot|chuyendoiso|thôngminh/.test(w)) return '🤖';
  return '';
}

/**
 * Phân loại màu sắc nổi bật cho từ khóa chính theo phong cách Trạm AI:
 * - Thuế, phạt, cảnh báo -> Đỏ Cam (#FF3B30)
 * - Tiền bạc, giá trị, tăng trưởng -> Xanh lục Neon (#00E676)
 * - Mặc định từ đang nói -> Vàng Chanh (#FFE600)
 */
function getActiveWordBadgeColor(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '');
  if (/thuế|thu hồi|găm|đầu cơ|phạt|chậm|bỏ hoang|nguy hiểm/.test(w)) return '#FF3B30';
  if (/tiền|giá trị|lũy tiến|tăng|lợi nhuận|vốn|tỷ|triệu/.test(w)) return '#00E676';
  if (/đất|nhà nước|luật|chính sách|minh bạch|quy hoạch|mua|bán/.test(w)) return '#FFE600';
  return '#FFE600'; // Vàng Neon thương hiệu
}

export const TramAICaptions: React.FC<TramAICaptionsProps> = ({
  captions = [],
  primaryColor = '#FFE600',
  style = {}
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  if (!captions || captions.length === 0) return null;

  // Ngắt nhịp 2-3 từ mỗi dòng tạo nhịp đọc dồn dập (chuẩn Trạm AI / CapCut / Submagic)
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

  // Lấy emoji theo từ khóa của cả cụm
  const chunkText = activeChunk.map((c) => c.word).join('');
  const activeEmoji = getEmojiForKeyword(chunkText);

  // Hiệu ứng Pop-in khi cụm từ mới xuất hiện
  const chunkStartFrame = activeChunk[0].start * fps;
  const chunkDiff = Math.max(0, frame - chunkStartFrame);
  const chunkPop = spring({
    frame: chunkDiff,
    fps,
    config: { damping: 12, mass: 0.4, stiffness: 220 }
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${0.9 + chunkPop * 0.1})`,
        transformOrigin: 'center center',
        width: '100%',
        ...style
      }}
    >
      {/* ── 1. Floating Animated Emoji (Phóng to nảy lên trên cụm từ) ── */}
      {activeEmoji && (
        <div
          style={{
            fontSize: '56px',
            lineHeight: 1,
            marginBottom: '8px',
            filter: 'drop-shadow(0 0 25px rgba(255, 230, 0, 0.9)) drop-shadow(0 6px 12px rgba(0,0,0,0.9))',
            transform: `scale(${chunkPop}) translateY(${(1 - chunkPop) * 20}px)`,
            transformOrigin: 'center center'
          }}
        >
          {activeEmoji}
        </div>
      )}

      {/* ── 2. Cụm chữ Trạm AI: Chữ in hoa lớn, viền đen dày, từ active có hộp màu nổi ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px 16px',
          textAlign: 'center',
          // Lớp bảo vệ chống chìm nhẹ nhàng (không đóng hộp đen nặng nề)
          padding: '12px 24px',
          borderRadius: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(8px)'
        }}
      >
        {activeChunk.map((cap, index) => {
          const isActive = currentSec >= cap.start && currentSec <= cap.end;
          const isPast = currentSec > cap.end;

          const wordStartFrame = cap.start * fps;
          const frameDiff = Math.max(0, frame - wordStartFrame);

          // Spring nảy mạnh mẽ khi từ được phát âm
          const wordSpring = isActive
            ? spring({
                frame: frameDiff,
                fps,
                config: { damping: 10, mass: 0.35, stiffness: 260 }
              })
            : 1;

          const scale = isActive ? 1.15 + wordSpring * 0.08 : 1;
          const badgeBgColor = getActiveWordBadgeColor(cap.word);

          return (
            <span
              key={`${cap.word}-${index}`}
              style={{
                fontFamily: "'Montserrat', 'Be Vietnam Pro', sans-serif",
                fontSize: '48px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                display: 'inline-block',
                transform: `scale(${scale})`,
                transformOrigin: 'center center',

                // Active: Hộp Pill màu Neon + Chữ đen tuyền sắc lẹm
                // Inactive: Chữ trắng tinh + Stroke viền đen 4px + Drop shadow
                color: isActive ? '#000000' : isPast ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                backgroundColor: isActive ? badgeBgColor : 'transparent',
                padding: isActive ? '6px 18px' : '6px 2px',
                borderRadius: isActive ? '14px' : '0px',

                WebkitTextStroke: isActive ? '0px' : '4px #000000',
                textShadow: isActive
                  ? `0 0 35px ${badgeBgColor}, 0 4px 10px rgba(0,0,0,0.8)`
                  : '0 5px 14px rgba(0,0,0,0.98)',
                boxShadow: isActive ? `0 10px 30px ${badgeBgColor}95` : 'none',

                transition: 'all 0.03s ease',
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
