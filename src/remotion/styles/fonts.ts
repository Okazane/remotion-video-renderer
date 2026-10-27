/**
 * Google Fonts & Typography Presets cho Remotion Video Templates
 * Tối ưu hóa 100% hiển thị tiếng Việt có dấu, sắc nét trên mọi độ phân giải.
 */

export const FONT_IMPORTS = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@700;800;900&family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
`;

export const FONT_PRESETS = {
  // 1. Chuẩn Báo Chí & Thời Sự Việt Nam (Sắc nét, uy tín, dễ đọc)
  editorial: {
    headline: "'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif",
    body: "'Inter', sans-serif",
    badge: "'Be Vietnam Pro', sans-serif",
  },

  // 2. Chuẩn Viral Short-form (TikTok, Reels, Shorts - Đậm, Nổi bật, Năng động)
  viral: {
    headline: "'Montserrat', 'Be Vietnam Pro', sans-serif",
    captions: "'Montserrat', 'Be Vietnam Pro', sans-serif",
    badge: "'Montserrat', sans-serif",
  },

  // 3. Chuẩn Truyền Hình Tin Nóng (Breaking News, Broadcast)
  broadcast: {
    headline: "'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif",
    ticker: "'Inter', 'Be Vietnam Pro', sans-serif",
    badge: "'Be Vietnam Pro', sans-serif",
  },

  // 4. Chuẩn Phóng Sự Tài Liệu & Chuyên Sâu (Documentary, Explainer)
  documentary: {
    headline: "'Playfair Display', 'Be Vietnam Pro', serif",
    body: "'Inter', sans-serif",
    quote: "'Playfair Display', serif",
  }
};
