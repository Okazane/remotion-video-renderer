import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { scrapeArticle } from './services/scraper.js';
import { rewriteContent } from './services/rewriter.js';
import { generateStoryboard } from './services/aiStoryboard.js';
import { generateTTSForScene, VOICES } from './services/tts.js';
import { fetchMediaForScene } from './services/media.js';
import { renderVideoMP4 } from './services/renderer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Serve static assets (audio, renders, images)
const PUBLIC_DIR = path.resolve('public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
app.use(express.static(PUBLIC_DIR));
app.use('/media', express.static(path.join(PUBLIC_DIR, 'media')));
app.use('/renders', express.static(path.join(PUBLIC_DIR, 'renders')));

// 1. Trích xuất bài báo từ URL
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Vui lòng cung cấp link bài báo hợp lệ' });
    }
    const data = await scrapeArticle(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Viết lại nội dung (Content Rewriter)
app.post('/api/rewrite', async (req, res) => {
  try {
    const { title, content, sourceName, tone } = req.body;
    if (!title && !content) {
      return res.status(400).json({ error: 'Thiếu thông tin bài viết' });
    }
    const rewritten = await rewriteContent({
      title: title || '',
      content: content || title,
      sourceName: sourceName || 'Báo chí tổng hợp',
      tone
    });
    res.json(rewritten);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Tạo phân cảnh kịch bản (Storyboard)
app.post('/api/generate-storyboard', async (req, res) => {
  try {
    const { rewrittenData, sourceName, leadImage } = req.body;
    const storyboard = await generateStoryboard({ rewrittenData, sourceName, leadImage });
    res.json(storyboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Sinh giọng đọc Edge-TTS cho phân cảnh
app.post('/api/generate-tts', async (req, res) => {
  try {
    const { text, voice, sceneId } = req.body;
    const ttsResult = await generateTTSForScene({ text, voice, sceneId });
    res.json(ttsResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Tìm kiếm ảnh/video minh họa
app.post('/api/fetch-media', async (req, res) => {
  try {
    const { keywords, sceneIndex, leadImage } = req.body;
    const media = await fetchMediaForScene({ keywords, sceneIndex, leadImage });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. PIPELINE 1-CLICK: Tự động hóa từ URL hoặc văn bản ra dự án video Remotion hoàn chỉnh
app.post('/api/pipeline/full', async (req, res) => {
  try {
    const { url, rawText, rawTitle, sourceName: customSource, voice = 'vi-VN-HoaiMyNeural' } = req.body;

    let title = rawTitle || '';
    let content = rawText || '';
    let sourceName = customSource || 'Báo chí tổng hợp';
    let leadImage = '';
    let sourceUrl = url || '';

    // Bước 1: Cào bài nếu có URL
    if (url) {
      const scraped = await scrapeArticle(url);
      title = scraped.title;
      content = scraped.fullContent;
      sourceName = scraped.sourceName || sourceName;
      leadImage = scraped.leadImage;
    }

    if (!title && !content) {
      return res.status(400).json({ error: 'Vui lòng cung cấp link bài báo hoặc văn bản nội dung' });
    }

    // Bước 2: Content Rewriter
    const rewritten = await rewriteContent({ title, content, sourceName });

    // Bước 3: AI Storyboard
    const storyboard = await generateStoryboard({ rewrittenData: rewritten, sourceName, leadImage });

    // Bước 4: Tạo TTS & Media cho từng Scene song song
    const processedScenes = await Promise.all(
      storyboard.scenes.map(async (scene, idx) => {
        // Sinh TTS
        const ttsData = await generateTTSForScene({
          text: scene.text,
          voice,
          sceneId: scene.id || `scene-${idx}`
        });

        // Tìm Media
        const mediaData = await fetchMediaForScene({
          keywords: scene.imageKeywords || [],
          sceneIndex: idx,
          leadImage
        });

        return {
          ...scene,
          durationInFrames: ttsData.durationInFrames || scene.durationInFrames,
          audioUrl: ttsData.audioUrl || '',
          captions: ttsData.captions || [],
          mediaUrl: mediaData.mediaUrl || scene.mediaUrl,
          mediaList: mediaData.mediaList || [mediaData.mediaUrl],
          mediaType: mediaData.mediaType || 'image'
        };
      })
    );

    const projectProps = {
      title: storyboard.title,
      category: storyboard.category || 'CẬP NHẬT',
      sourceName,
      sourceUrl,
      tickerText: `Thông tin tham khảo từ ${sourceName} • ${storyboard.title} • Bản tin chuyên đề`,
      primaryColor: '#0284C7',
      accentColor: '#38BDF8',
      scenes: processedScenes
    };

    res.json({
      success: true,
      originalData: { title, sourceName, leadImage, sourceUrl },
      rewrittenData: rewritten,
      projectProps
    });
  } catch (error) {
    console.error('Lỗi quy trình pipeline:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Render Video MP4
app.post('/api/render', async (req, res) => {
  try {
    const { compositionId, projectProps } = req.body;
    if (!projectProps || !projectProps.scenes || projectProps.scenes.length === 0) {
      return res.status(400).json({ error: 'Dữ liệu phân cảnh không hợp lệ' });
    }

    const renderResult = await renderVideoMP4({
      compositionId: compositionId || 'ShortNews',
      inputProps: projectProps
    });

    res.json(renderResult);
  } catch (error) {
    console.error('Lỗi render video:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Lấy danh sách giọng đọc và template hỗ trợ
app.get('/api/config', (req, res) => {
  res.json({
    voices: VOICES,
    templates: [
      {
        id: 'ShortNews',
        name: 'Short-form Tin Tức (9:16)',
        description: 'Tối ưu TikTok/Reels/Shorts, Ken Burns, phụ đề kinetic nhảy chữ, category badge',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16'
      },
      {
        id: 'NewsRoundup',
        name: 'Bản Tin Tổng Hợp (16:9)',
        description: 'Thời sự chuẩn mực, News Ticker chạy chữ, khung tóm tắt & trích nguồn',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9'
      },
      {
        id: 'ExplainerShort',
        name: 'Minimalist Story Explainer',
        description: 'Phóng sự tài liệu, nền mờ nghệ thuật, typography tinh tế',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16'
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Article-to-Video API Server đang chạy tại: http://localhost:${PORT}`);
});
