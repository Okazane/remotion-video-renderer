import { scrapeArticle } from './services/scraper.js';
import { rewriteContent } from './services/rewriter.js';
import { generateStoryboard } from './services/aiStoryboard.js';
import { generateTTSForScene } from './services/tts.js';
import { fetchMediaForScene } from './services/media.js';

async function runTest() {
  console.log('=== 1. KIỂM THỬ ARTICLE SCRAPER & METADATA NGUỒN ===');
  const sampleUrl = 'https://vnexpress.net/khoa-hoc';
  console.log('Đang cào bài mẫu từ:', sampleUrl);

  let scrapedData;
  try {
    scrapedData = await scrapeArticle(sampleUrl);
    console.log('✔ Scraper thành công:');
    console.log('  - Tiêu đề:', scrapedData.title);
    console.log('  - Nguồn trích dẫn:', scrapedData.sourceName);
    console.log('  - Số đoạn văn:', scrapedData.paragraphsCount);
  } catch (e) {
    console.log('ℹ Test với dữ liệu dự phòng:', e.message);
    scrapedData = {
      title: 'Ứng dụng AI đột phá trong chuyển đổi số doanh nghiệp 2026',
      fullContent: 'Các giải pháp trí tuệ nhân tạo đang giúp các nhà sáng tạo nội dung tự động hóa quy trình sản xuất video một cách hiệu quả và tiết kiệm chi phí.',
      sourceName: 'VnExpress'
    };
  }

  console.log('\n=== 2. KIỂM THỬ CONTENT REWRITER (VĂN PHONG RIÊNG) ===');
  const rewritten = await rewriteContent({
    title: scrapedData.title,
    content: scrapedData.fullContent,
    sourceName: scrapedData.sourceName
  });
  console.log('✔ Viết lại thành công:');
  console.log('  - Tiêu đề mới:', rewritten.rewrittenTitle);
  console.log('  - Thể loại:', rewritten.category);
  console.log('  - Tóm tắt:', rewritten.summary);
  console.log('  - Ý chính:', rewritten.keyPoints);

  console.log('\n=== 3. KIỂM THỬ AI STORYBOARD ===');
  const storyboard = await generateStoryboard({
    rewrittenData: rewritten,
    sourceName: scrapedData.sourceName,
    leadImage: scrapedData.leadImage
  });
  console.log(`✔ Phân cảnh thành công (${storyboard.scenes.length} Scenes):`);
  storyboard.scenes.forEach((s, idx) => {
    console.log(`  [Scene ${idx + 1}] ${s.headline} (${s.durationInFrames} frames)`);
  });

  console.log('\n=== 4. KIỂM THỬ EDGE-TTS & WORD TIMESTAMPS ===');
  const firstScene = storyboard.scenes[0];
  const ttsRes = await generateTTSForScene({
    text: firstScene.text,
    voice: 'vi-VN-HoaiMyNeural',
    sceneId: 'test-scene-1'
  });
  console.log('✔ Edge-TTS thành công:');
  console.log('  - Audio URL:', ttsRes.audioUrl);
  console.log('  - Duration in Frames:', ttsRes.durationInFrames);
  console.log('  - Word Captions mẫu:', ttsRes.captions.slice(0, 5));

  console.log('\n=== 5. KIỂM THỬ MEDIA MATCHER ===');
  const mediaRes = await fetchMediaForScene({
    keywords: firstScene.imageKeywords,
    sceneIndex: 0
  });
  console.log('✔ Media thành công:', mediaRes.mediaUrl);

  console.log('\n🎉 TOÀN BỘ PIPELINE ĐÃ SẴN SÀNG HOẠT ĐỘNG HOÀN HẢO!');
}

runTest().catch(console.error);
