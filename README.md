# 🎬 Article-to-Video Studio (Tích Hợp Remotion Engine)

Hệ thống tự động hóa chuyển đổi bài báo điện tử hoặc chủ đề văn bản thành video tin tức hoàn chỉnh, sử dụng công nghệ dựng video lập trình **Remotion (React)**, tích hợp **Content Rewriter (viết lại văn phong riêng)** và cơ chế **ghi nguồn minh bạch (Source Attribution)**.

---

## 🌟 Tính Năng Nổi Bật

1. **3 Bộ Template Remotion Chuẩn Mực**:
   - 📱 **Short-form Tin Tức (9:16)** *(Tối ưu TikTok, YouTube Shorts, Reels)*: Hiệu ứng Ken Burns zoom ảnh mượt mà, phụ đề kinetic nhảy chữ nổi bật (`spring` bounce), Category Badge trung tính (không giật gân), thanh tiến trình và khung nguồn tham khảo.
   - 📺 **Bản Tin Tổng Hợp (16:9)** *(Chuẩn Thời Sự Truyền Hình)*: Dải tin Ticker Bar chạy chữ ngang (Marquee), bố cục chia đôi màn hình (Split-screen) giữa đồ họa thông tin và video tư liệu, Lower-Thirds trích dẫn nguồn báo chính thống.
   - 🎬 **Minimalist Explainer (Đa tỉ lệ)** *(Phóng sự & Tài liệu)*: Nền Cinematic Blur nghệ thuật, hộp trích dẫn số liệu / danh ngôn, typography tinh tế.

2. **Content Rewriter Thông Minh (Đảm bảo bản quyền)**:
   - Tự động diễn đạt lại 100% bằng câu chữ mới, chỉ giữ lại các sự kiện, số liệu và mốc thời gian cốt lõi.
   - Hỗ trợ AI đa tầng: Google Gemini 1.5 Flash, OpenAI GPT-4o-mini hoặc bộ xử lý phân tích ngữ nghĩa Offline Heuristic Engine.

3. **Xem Trước Trực Tiếp Không Cần Render (In-Browser Live Player)**:
   - Tích hợp `@remotion/player` cho phép bạn phát, tua, xem trước âm thanh, chuyển cảnh và phụ đề động ngay trên trình duyệt theo thời gian thực với tốc độ tức thì.

4. **Trích Xuất Đa Báo Điện Tử (Scraper Service)**:
   - Tự động bóc tách tiêu đề, nội dung sạch, ảnh đại diện và tên tòa soạn từ mọi link báo (VnExpress, Tuổi Trẻ, Dân Trí, Thanh Niên, VietNamNet, BBC...).

5. **Giấy phép cá nhân miễn phí**:
   - Áp dụng gói cá nhân/nhóm nhỏ miễn phí của Remotion (hỗ trợ sử dụng thương mại cho cá nhân và công ty $\le$ 3 người).

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Khởi động Backend API Server & Frontend
Mở 2 cửa sổ terminal tại thư mục `D:\Antigravity`:

**Terminal 1 (Backend API Port 5000):**
```powershell
npm run server
```

**Terminal 2 (Frontend Web App Port 3000):**
```powershell
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:3000`**

---

### 2. Mở Remotion Studio (Trình biên tập Timeline chuyên nghiệp)
Nếu bạn muốn can thiệp sâu vào timeline hoặc tinh chỉnh từng frame của Remotion:
```powershell
npm run remotion:studio
```

---

## ⚙️ Cấu Hình File `.env` (Tùy Chọn)

Tạo hoặc chỉnh sửa file `.env` tại thư mục gốc:
```env
PORT=5000

# (Tùy chọn) Khóa API Google Gemini để tăng cường viết lại kịch bản
GEMINI_API_KEY=your_gemini_api_key

# (Tùy chọn) Khóa API OpenAI
OPENAI_API_KEY=your_openai_api_key

# (Tùy chọn) Khóa API Pexels để tải stock video chất lượng cao
PEXELS_API_KEY=your_pexels_api_key
```

*Lưu ý: Hệ thống đã tích hợp sẵn bộ xử lý thông minh cục bộ (Offline Engine) và kho ảnh tuyển chọn HD, ứng dụng vẫn hoạt động trơn tru ngay cả khi không nhập bất kỳ API key nào.*

---

## 📁 Cấu Trúc Mã Nguồn

```
D:\Antigravity/
├── src/
│   ├── remotion/
│   │   ├── components/
│   │   │   ├── DynamicCaptions.tsx   # Phụ đề kinetic nhảy chữ
│   │   │   ├── KenBurnsImage.tsx     # Hiệu ứng zoom/pan chuyển động
│   │   │   ├── NewsTicker.tsx        # Dải tin chạy chữ ngang
│   │   │   ├── SourceAttribution.tsx # Khung trích dẫn nguồn bài báo
│   │   │   └── ProgressBar.tsx       # Thanh tiến trình video
│   │   ├── templates/
│   │   │   ├── ShortNewsTemplate.tsx    # Template 9:16 Video ngắn
│   │   │   ├── NewsRoundupTemplate.tsx  # Template 16:9 Bản tin thời sự
│   │   │   └── ExplainerTemplate.tsx    # Template phóng sự tài liệu
│   │   ├── Root.tsx                  # Đăng ký các Composition
│   │   ├── types.ts                  # Khai báo dữ liệu Storyboard
│   │   └── index.ts                  # Entrypoint Remotion
│   ├── App.tsx                       # Dashboard web & Live Player
│   ├── main.tsx
│   └── index.css
├── server/
│   ├── services/
│   │   ├── scraper.js                # Trích xuất báo chí & metadata
│   │   ├── rewriter.js               # Content Rewriter độc lập
│   │   ├── aiStoryboard.js           # Phân cảnh kịch bản video
│   │   ├── tts.js                    # Microsoft Edge-TTS + Subtitle
│   │   ├── media.js                  # Tìm kiếm hình ảnh / video
│   │   └── renderer.js               # Render video MP4 với Remotion
│   ├── test-pipeline.js              # Script kiểm thử tự động
│   └── index.js                      # Express API điều phối
├── package.json
└── vite.config.ts
```
