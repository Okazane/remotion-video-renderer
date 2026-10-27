import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { WordCaption } from '../types.ts';

interface ViralFinancialCaptionsProps {
  captions: WordCaption[];
  primaryColor?: string;
  accentColor?: string;
  style?: React.CSSProperties;
}

// ─── PHÂN LOẠI TỪ KHÓA THEO CHUẨN TÀI CHÍNH / VÀNG / BẤT ĐỘNG SẢN ────────────────
const RED_KEYWORDS_REGEX =
  /\b(giảm|hạ nhiệt|mất|điều chỉnh|áp lực|rơi|giảm sâu|rung lắc|fomo|tất tay|cảnh báo|nguy hiểm|thuế|thu hồi|đầu cơ|găm giữ|bỏ hoang|lũy tiến|phạt|giá ảo|chậm)\b/i;

const YELLOW_KEYWORDS_REGEX =
  /\b(vàng|sjc|doji|pnj|phú quý|bảo tín|nhẫn|9999|usd|fed|lợi suất|trái phiếu|dầu|thế giới|18 tháng|24 tháng|19 tháng 8|\d+[\,\.]?\d*|triệu|tỷ|đất|tiền|giá|tăng|hồi phục|lợi nhuận|chi phí|bắt đáy|luật)\b/i;

const MEGA_IMPACT_REGEX =
  /\b(vàng hạ nhiệt|-1,6 triệu|sjc|vàng nhẫn|9999|fed|rung lắc|bắt đáy|điều chỉnh hay đảo chiều|18 tháng|24 tháng|thu hồi đất|đánh thuế|giá ảo)\b/i;

interface CaptionChunk {
  words: WordCaption[];
  start: number;
  end: number;
  isMegaImpact: boolean;
  hasRed: boolean;
  hasYellow: boolean;
}

/**
 * Chia phụ đề theo NHỊP NÓI thông minh (2–5 từ / cụm, ngắt theo dấu câu hoặc khoảng thời gian 0.6–2.0s)
 */
function buildSmartRhythmChunks(captions: WordCaption[]): CaptionChunk[] {
  if (!captions || captions.length === 0) return [];

  const chunks: CaptionChunk[] = [];
  let currentGroup: WordCaption[] = [];

  for (let i = 0; i < captions.length; i++) {
    const item = captions[i];
    currentGroup.push(item);

    const hasPunctuation = /[,.?!…;:]$/.test(item.word.trim());
    const isChunkFull = currentGroup.length >= 4;
    const isNextFar =
      i < captions.length - 1 && captions[i + 1].start - item.end > 0.45;
    const isLast = i === captions.length - 1;

    // Ngắt cụm khi đủ 2-4 từ, hoặc gặp dấu câu, hoặc có khoảng nghỉ âm thanh
    if (
      (currentGroup.length >= 2 && (hasPunctuation || isNextFar)) ||
      isChunkFull ||
      isLast
    ) {
      const start = currentGroup[0].start;
      const end = currentGroup[currentGroup.length - 1].end;
      const fullChunkText = currentGroup.map((w) => w.word).join(' ');

      chunks.push({
        words: [...currentGroup],
        start,
        end,
        isMegaImpact: MEGA_IMPACT_REGEX.test(fullChunkText),
        hasRed: RED_KEYWORDS_REGEX.test(fullChunkText),
        hasYellow: YELLOW_KEYWORDS_REGEX.test(fullChunkText)
      });
      currentGroup = [];
    }
  }

  return chunks;
}

export const ViralFinancialCaptions: React.FC<ViralFinancialCaptionsProps> = ({
  captions = [],
  primaryColor = '#FACC15',
  style = {}
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  if (!captions || captions.length === 0) return null;

  const chunks = React.useMemo(() => buildSmartRhythmChunks(captions), [captions]);

  // Tìm chunk đang hiển thị theo thời gian thực
  const activeChunk = chunks.find((chunk) => {
    // Thêm padding hiển thị 0.18s để mắt đọc kịp trước khi chuyển nhịp
    return currentSec >= chunk.start && currentSec <= chunk.end + 0.18;
  }) || chunks[0];

  if (!activeChunk) return null;

  // Frame bắt đầu của cụm từ
  const chunkStartFrame = activeChunk.start * fps;
  const chunkDiff = Math.max(0, frame - chunkStartFrame);

  // Animation Pop nhanh, dứt khoát (damping: 15, stiffness: 240)
  const chunkPop = spring({
    frame: chunkDiff,
    fps,
    config: { damping: 15, mass: 0.35, stiffness: 240 }
  });

  const isMega = activeChunk.isMegaImpact;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '28%', // Vị trí vàng: 28% tính từ đáy (tránh TikTok UI, không che chủ thể)
        left: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        pointerEvents: 'none',
        ...style
      }}
    >
      {/* ── Cụm Phụ đề Động (1–2 dòng, tối đa 2–5 từ) ── */}
      <div
        style={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMega ? '14px 20px' : '10px 14px',
          textAlign: 'center',
          maxWidth: '94%',
          // Hiệu ứng Pop Scale từ 95% -> 100%
          transform: `scale(${0.95 + chunkPop * 0.05})`,
          transformOrigin: 'center center'
        }}
      >
        {activeChunk.words.map((wObj, idx) => {
          const rawWord = wObj.word.trim();
          const cleanWord = rawWord.toLowerCase().replace(/[^a-z0-9à-ỹ]/gi, '');

          // Phân loại màu theo 3 quy tắc: ĐỎ (cảnh báo/thuế/thu hồi) -> VÀNG (tiền/con số/đất) -> TRẮNG (mặc định)
          const isRed = RED_KEYWORDS_REGEX.test(rawWord);
          const isYellow = !isRed && YELLOW_KEYWORDS_REGEX.test(rawWord);

          const isCurrentActiveWord =
            currentSec >= wObj.start && currentSec <= wObj.end + 0.08;

          // Animation scale cho từ đang nói hoặc từ quan trọng
          const wordStartFrame = wObj.start * fps;
          const wordDiff = Math.max(0, frame - wordStartFrame);
          const wordPop = isCurrentActiveWord
            ? spring({
                frame: wordDiff,
                fps,
                config: { damping: 12, mass: 0.3, stiffness: 260 }
              })
            : 1;

          // Xác định màu sắc
          let textColor = '#FFFFFF';
          let bgColor = 'transparent';
          let scaleMultiplier = 1;

          if (isRed) {
            textColor = '#FF3B30'; // ĐỎ CẢNH BÁO
            scaleMultiplier = 1.08;
          } else if (isYellow) {
            textColor = '#FACC15'; // VÀNG ĐIỂM NHẤN
            scaleMultiplier = 1.08;
          }

          if (isCurrentActiveWord) {
            scaleMultiplier = isMega ? 1.2 : 1.14;
          }

          const baseFontSize = isMega ? 56 : 46;

          return (
            <span
              key={`${wObj.word}-${idx}`}
              style={{
                fontFamily: "'Montserrat', 'Be Vietnam Pro', -apple-system, sans-serif",
                fontSize: `${baseFontSize}px`,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                display: 'inline-block',
                transform: `scale(${scaleMultiplier * (isCurrentActiveWord ? 0.95 + wordPop * 0.05 : 1)})`,
                transformOrigin: 'center center',

                color: textColor,

                // Viền đen dày 4px sắc nét chống chìm chữ trên mọi background
                WebkitTextStroke: isMega ? '4.5px #000000' : '3.8px #000000',
                paintOrder: 'stroke fill',

                // Shadow đen tạo chiều sâu dứt khoát
                textShadow: isCurrentActiveWord
                  ? isRed
                    ? '0 0 25px rgba(255, 59, 48, 0.85), 0 5px 15px rgba(0,0,0,0.95)'
                    : '0 0 25px rgba(250, 204, 21, 0.85), 0 5px 15px rgba(0,0,0,0.95)'
                  : '0 4px 12px rgba(0,0,0,0.95), 0 8px 24px rgba(0,0,0,0.85)',

                padding: '2px 4px',
                transition: 'transform 0.05s ease-out',
                willChange: 'transform'
              }}
            >
              {rawWord}
            </span>
          );
        })}
      </div>
    </div>
  );
};
