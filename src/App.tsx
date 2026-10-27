import React, { useState } from 'react';
import { Player } from '@remotion/player';
import {
  Sparkles,
  Play,
  Video,
  FileText,
  Layers,
  Download,
  RefreshCw,
  CheckCircle,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { defaultMockProject } from './remotion/Root.tsx';
import { VideoProjectProps } from './remotion/types.ts';
import { ShortNewsTemplate } from './remotion/templates/ShortNewsTemplate.tsx';
import { NewsRoundupTemplate } from './remotion/templates/NewsRoundupTemplate.tsx';
import { ExplainerTemplate } from './remotion/templates/ExplainerTemplate.tsx';

const SAMPLE_ARTICLES = [
  {
    title: 'Bước tiến của trí tuệ nhân tạo trong xử lý hình ảnh và video số 2026',
    source: 'VnExpress',
    url: 'https://vnexpress.net/khoa-hoc/tri-tue-nhan-tao',
    category: 'CÔNG NGHỆ',
    content: 'Các giải pháp trí tuệ nhân tạo thế hệ mới đang được ứng dụng rộng rãi trong quy trình tự động hóa sản xuất nội dung. Nhiều doanh nghiệp công nghệ đã tích hợp công cụ dựng video vào luồng làm việc hàng ngày, giúp tiết kiệm đến 70% thời gian biên tập và tối ưu hóa chi phí sản xuất.'
  },
  {
    title: 'Xu hướng đầu tư chuyển đổi số và phát triển hạ tầng năng lượng xanh',
    source: 'Dân Trí',
    url: 'https://dantri.com.vn/kinh-doanh',
    category: 'KINH TẾ',
    content: 'Kinh tế số và năng lượng tái tạo tiếp tục thu hút nguồn vốn đầu tư mạnh mẽ từ các tập đoàn đa quốc gia. Các chuyên gia nhận định xu hướng này không chỉ mang lại hiệu quả bền vững mà còn tạo ra hàng triệu cơ hội việc làm mới cho thị trường.'
  }
];

export default function App() {
  // Input State
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [articleUrl, setArticleUrl] = useState('https://vnexpress.net/khoa-hoc/tri-tue-nhan-tao');
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customSource, setCustomSource] = useState('VnExpress');

  // Pipeline Settings
  const [selectedVoice, setSelectedVoice] = useState('vi-VN-HoaiMyNeural');
  const [selectedTemplate, setSelectedTemplate] = useState<'ShortNews' | 'NewsRoundup' | 'ExplainerShort'>('ShortNews');

  // Project & Storyboard State
  const [projectData, setProjectData] = useState<VideoProjectProps>(defaultMockProject);
  const [rewrittenData, setRewrittenData] = useState<any>({
    rewrittenTitle: defaultMockProject.title,
    category: defaultMockProject.category,
    summary: 'Thông tin được biên tập lại hoàn toàn bằng văn phong khách quan, trung thực.',
    keyPoints: [
      'Đột phá mới trong công nghệ tạo video tự động hóa.',
      'Tối ưu hóa quy trình từ tin tức thành video ngắn.',
      'Trải nghiệm video với phụ đề động và đồ họa mượt mà.'
    ]
  });

  // Loading & Render State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);

  // Active Scene for Editor
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  // Calculate total video duration in frames
  const totalFrames = projectData.scenes.reduce(
    (acc, scene) => acc + (scene.durationInFrames || 150),
    0
  );

  // Chọn Component Template tương ứng
  const getTemplateComponent = (): React.FC<VideoProjectProps> => {
    switch (selectedTemplate) {
      case 'NewsRoundup':
        return NewsRoundupTemplate;
      case 'ExplainerShort':
        return ExplainerTemplate;
      case 'ShortNews':
      default:
        return ShortNewsTemplate;
    }
  };

  const getCompositionDimensions = () => {
    if (selectedTemplate === 'NewsRoundup') {
      return { width: 1920, height: 1080, aspect: '16:9' };
    }
    return { width: 1080, height: 1920, aspect: '9:16' };
  };

  const dimensions = getCompositionDimensions();

  // 1. Nạp bài báo mẫu
  const handleLoadSample = (sample: (typeof SAMPLE_ARTICLES)[0]) => {
    setInputMode('url');
    setArticleUrl(sample.url);
    setCustomTitle(sample.title);
    setCustomContent(sample.content);
    setCustomSource(sample.source);
  };

  // 2. Chạy quy trình Pipeline tự động
  const handleGeneratePipeline = async () => {
    setIsProcessing(true);
    setRenderedUrl(null);
    try {
      setStatusMessage('Đang trích xuất bài báo & đọc dữ liệu nguồn...');

      const payload =
        inputMode === 'url'
          ? { url: articleUrl, voice: selectedVoice, sourceName: customSource }
          : {
              rawTitle: customTitle,
              rawText: customContent,
              sourceName: customSource,
              voice: selectedVoice
            };

      setStatusMessage('Đang viết lại nội dung bằng văn phong riêng (Content Rewriter)...');

      const response = await fetch('/api/pipeline/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Có lỗi xảy ra trong quá trình xử lý');
      }

      setStatusMessage('Đang phân cảnh Storyboard, tạo giọng đọc TTS & phụ đề...');
      const data = await response.json();

      setRewrittenData(data.rewrittenData);
      setProjectData(data.projectProps);
      setActiveSceneIdx(0);
      setStatusMessage('Hoàn thành! Bạn có thể xem thử video ngay bây giờ.');
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // 3. Render video MP4 hoàn chỉnh
  const handleExportMP4 = async () => {
    setIsRendering(true);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositionId: selectedTemplate,
          projectProps: projectData
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi kết xuất video');
      }

      const result = await res.json();
      setRenderedUrl(result.videoUrl);
      alert('Kết xuất video thành công! Bạn có thể tải video về máy.');
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi khi render MP4: ${err.message}`);
    } finally {
      setIsRendering(false);
    }
  };

  // Cập nhật lời thoại phân cảnh
  const handleUpdateSceneText = (index: number, newText: string) => {
    const updatedScenes = [...projectData.scenes];
    updatedScenes[index] = { ...updatedScenes[index], text: newText };
    setProjectData({ ...projectData, scenes: updatedScenes });
  };

  // Cập nhật tiêu đề phân cảnh
  const handleUpdateSceneHeadline = (index: number, newHeadline: string) => {
    const updatedScenes = [...projectData.scenes];
    updatedScenes[index] = { ...updatedScenes[index], headline: newHeadline };
    setProjectData({ ...projectData, scenes: updatedScenes });
  };

  // Cập nhật ảnh minh họa
  const handleUpdateSceneMedia = (index: number, newUrl: string) => {
    const updatedScenes = [...projectData.scenes];
    updatedScenes[index] = { ...updatedScenes[index], mediaUrl: newUrl };
    setProjectData({ ...projectData, scenes: updatedScenes });
  };

  const TemplateComp = getTemplateComponent();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header Navigation Bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)'
            }}
          >
            <Video size={22} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#F8FAFC' }}>
              Article-to-Video Studio
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Động cơ Remotion • Viết lại văn phong riêng • Trích nguồn minh bạch
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--accent-cyan)'
            }}
          >
            <Sparkles size={14} />
            <span>Remotion Free License (Solo Creator)</span>
          </div>

          <button
            onClick={handleExportMP4}
            disabled={isRendering || isProcessing}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            {isRendering ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Đang render MP4...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Xuất Video MP4</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '420px 1fr 480px',
          gap: '24px',
          padding: '24px 32px',
          maxWidth: '1920px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        {/* === CỘT 1: INPUT & CẤU HÌNH PIPELINE === */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Box 1: Nhập dữ liệu bài báo */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--accent-cyan)" />
                <span>Nguồn Bài Báo / Chủ Đề</span>
              </h2>

              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-tertiary)', padding: '3px', borderRadius: '8px' }}>
                <button
                  onClick={() => setInputMode('url')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: inputMode === 'url' ? 'var(--accent-blue)' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Link URL
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: inputMode === 'text' ? 'var(--accent-blue)' : 'transparent',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Văn Bản
                </button>
              </div>
            </div>

            {inputMode === 'url' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Dán đường dẫn bài báo (VnExpress, Tuổi Trẻ, Dân Trí...):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    placeholder="https://vnexpress.net/..."
                    className="glass-input"
                    style={{ flex: 1 }}
                  />
                </div>

                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Thử nhanh với các bài báo mẫu:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {SAMPLE_ARTICLES.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLoadSample(sample)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'rgba(30, 41, 59, 0.4)',
                          color: '#E2E8F0',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                          📌 [{sample.source}] {sample.title}
                        </span>
                        <ChevronRight size={14} color="var(--accent-cyan)" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tiêu đề chủ đề:</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Nhập tiêu đề hoặc chủ đề..."
                    className="glass-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nội dung thông tin:</label>
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="Dán nội dung bài viết..."
                    rows={5}
                    className="glass-input"
                    style={{ width: '100%', marginTop: '4px', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tên nguồn tham khảo:</label>
                  <input
                    type="text"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    placeholder="Ví dụ: VnExpress / Tạp chí Khoa học"
                    className="glass-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Box 2: Cấu hình Giọng đọc & Template */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sliders size={18} color="var(--accent-cyan)" />
              <span>Thiết Lập Video & Template</span>
            </h2>

            {/* Chọn Template */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Chọn Mẫu Video (Remotion Template):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                <div
                  onClick={() => setSelectedTemplate('ShortNews')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedTemplate === 'ShortNews' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    backgroundColor: selectedTemplate === 'ShortNews' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>📱 Short-form Tin Tức (9:16)</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>TikTok / Shorts / Reels</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Hiệu ứng Ken Burns, phụ đề kinetic nhảy chữ, category badge chuẩn mực
                  </p>
                </div>

                <div
                  onClick={() => setSelectedTemplate('NewsRoundup')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedTemplate === 'NewsRoundup' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    backgroundColor: selectedTemplate === 'NewsRoundup' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>📺 Bản Tin Tổng Hợp (16:9)</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>Bản tin Thời sự TV</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Dải tin Ticker chạy chữ, bố cục chia đôi màn hình, lower-third trích nguồn
                  </p>
                </div>

                <div
                  onClick={() => setSelectedTemplate('ExplainerShort')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedTemplate === 'ExplainerShort' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    backgroundColor: selectedTemplate === 'ExplainerShort' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>🎬 Minimalist Explainer</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>Phóng sự tài liệu</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Nền cinematic blur, hộp trích dẫn số liệu, typography tinh tế
                  </p>
                </div>
              </div>
            </div>

            {/* Chọn Giọng Đọc */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Giọng đọc Microsoft Edge-TTS (Miễn phí):
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="glass-input"
                style={{ width: '100%', cursor: 'pointer' }}
              >
                <option value="vi-VN-HoaiMyNeural" style={{ background: '#0F172A' }}>
                  🇻🇳 Hoài My (Nữ - Truyền cảm, chuẩn đài truyền hình)
                </option>
                <option value="vi-VN-NamMinhNeural" style={{ background: '#0F172A' }}>
                  🇻🇳 Nam Minh (Nam - Đĩnh đạc, thời sự)
                </option>
                <option value="en-US-JennyNeural" style={{ background: '#0F172A' }}>
                  🇺🇸 Jenny (Nữ - Tiếng Anh bản xứ)
                </option>
                <option value="en-US-GuyNeural" style={{ background: '#0F172A' }}>
                  🇺🇸 Guy (Nam - Tiếng Anh bản xứ)
                </option>
              </select>
            </div>

            {/* Nút Tạo Video Tự Động */}
            <button
              onClick={handleGeneratePipeline}
              disabled={isProcessing}
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Đang xử lý Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Tạo Video Tự Động (1-Click)</span>
                </>
              )}
            </button>

            {statusMessage && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '12px',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={14} className="animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        </section>

        {/* === CỘT 2: NỘI DUNG ĐÃ VIẾT LẠI & TRÌNH BIÊN TẬP PHÂN CẢNH === */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: Minh bạch nội dung viết lại (Content Rewriter Card) */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#22C55E" />
                <span>Nội Dung Viết Lại (Văn Phong Riêng)</span>
              </h2>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Nguồn tham khảo:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{projectData.sourceName}</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                padding: '14px 16px',
                borderRadius: '10px',
                borderLeft: '4px solid var(--accent-cyan)',
                marginBottom: '14px'
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                {rewrittenData?.rewrittenTitle || projectData.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.5 }}>
                {rewrittenData?.summary || 'Nội dung tóm tắt sự kiện cốt lõi.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#94A3B8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <Info size={13} />
                <span>Không sao chép nguyên văn • Đảm bảo bản quyền</span>
              </div>
            </div>
          </div>

          {/* Card: Trình biên tập Storyboard từng phân cảnh */}
          <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--accent-cyan)" />
                <span>Phân Cảnh Video ({projectData.scenes.length} Scenes)</span>
              </h2>

              {/* Tabs chọn scene */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {projectData.scenes.map((s, idx) => (
                  <button
                    key={s.id || idx}
                    onClick={() => setActiveSceneIdx(idx)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: activeSceneIdx === idx ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Chi tiết Scene đang chọn */}
            {projectData.scenes[activeSceneIdx] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Tiêu đề phân cảnh {activeSceneIdx + 1}:
                  </label>
                  <input
                    type="text"
                    value={projectData.scenes[activeSceneIdx].headline}
                    onChange={(e) => handleUpdateSceneHeadline(activeSceneIdx, e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', marginTop: '4px', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Lời đọc giọng nói (Voiceover Script):
                  </label>
                  <textarea
                    value={projectData.scenes[activeSceneIdx].text}
                    onChange={(e) => handleUpdateSceneText(activeSceneIdx, e.target.value)}
                    rows={3}
                    className="glass-input"
                    style={{ width: '100%', marginTop: '4px', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Đường dẫn hình ảnh minh họa (Media URL):
                  </label>
                  <input
                    type="text"
                    value={projectData.scenes[activeSceneIdx].mediaUrl}
                    onChange={(e) => handleUpdateSceneMedia(activeSceneIdx, e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', marginTop: '4px', fontSize: '12px' }}
                  />
                </div>

                {/* Preview Thumbnail nhỏ của Scene */}
                <div
                  style={{
                    height: '140px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid var(--border-subtle)',
                    marginTop: 'auto'
                  }}
                >
                  <img
                    src={projectData.scenes[activeSceneIdx].mediaUrl}
                    alt="Scene Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#F8FAFC'
                    }}
                  >
                    Thời lượng: {((projectData.scenes[activeSceneIdx].durationInFrames || 150) / 30).toFixed(1)}s (
                    {projectData.scenes[activeSceneIdx].durationInFrames} frames)
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* === CỘT 3: LIVE REMOTION PLAYER & XEM TRỰC TIẾP === */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={18} color="var(--accent-cyan)" />
                <span>Xem Trước Trực Tiếp (Live Player)</span>
              </h2>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}
              >
                {dimensions.aspect} • {(totalFrames / 30).toFixed(1)}s
              </span>
            </div>

            {/* In-Browser Remotion Player */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#020617',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                padding: '12px'
              }}
            >
              <div
                style={{
                  width: selectedTemplate === 'NewsRoundup' ? '100%' : '270px',
                  maxHeight: '480px',
                  aspectRatio: selectedTemplate === 'NewsRoundup' ? '16/9' : '9/16',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <Player
                  component={TemplateComp as any}
                  inputProps={projectData as any}
                  durationInFrames={totalFrames}
                  fps={30}
                  compositionWidth={dimensions.width}
                  compositionHeight={dimensions.height}
                  style={{ width: '100%', height: '100%' }}
                  controls
                  autoPlay={false}
                  loop
                />
              </div>
            </div>

            {/* Thông báo tải video sau khi Render */}
            {renderedUrl && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} color="#22C55E" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
                    Video đã sẵn sàng!
                  </span>
                </div>

                <a
                  href={renderedUrl}
                  download="article-video.mp4"
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}
                >
                  <Download size={14} />
                  <span>Tải File MP4</span>
                </a>
              </div>
            )}

            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              💡 Mẹo: Nhấn nút Play để xem các hiệu ứng Ken Burns, phụ đề kinetic và chuyển cảnh mượt mà theo thời gian thực!
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
