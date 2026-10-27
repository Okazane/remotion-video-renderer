import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { scrapeArticle } from './server/services/scraper.js';
import { parseScript } from './server/services/scriptParser.js';
import { rewriteContent } from './server/services/rewriter.js';
import { generateStoryboard } from './server/services/aiStoryboard.js';
import { generateTTSForScene } from './server/services/tts.js';
import { fetchMediaForScene } from './server/services/media.js';
import { renderVideoMP4 } from './server/services/renderer.js';
import { preflightCheck, expandScenesToMeetTarget } from './server/services/preflightDuration.js';

/**
 * CLI Tool — Article & Script to Video Pipeline
 * Cú pháp:
 *   1. Chế độ Báo điện tử (URL):
 *      node cli.js --url "https://vnexpress.net/..." --template "TikTokViral" --voice "vieneu-minhduc" --render
 *
 *   2. Chế độ Kịch bản có sẵn (JSON / TXT / MD):
 *      node cli.js --mode script --input "kichban.json" --template "TikTokViral" --voice "vieneu-minhduc" --render
 *      node cli.js --input "kichban.txt" --template "TikTokViral" --voice "vieneu-minhduc" --render
 */
async function main() {
  const args = process.argv.slice(2);
  let mode = ''; // 'url' | 'script'
  let url = '';
  let input = '';
  let text = '';
  let title = '';
  let template = 'TikTokViral';
  let voice = 'vieneu-minhduc'; // Mặc định dùng VieNeu-TTS 48kHz chuẩn tự nhiên
  let profile = null;
  let shouldRender = false;
  let forceHumanize = false;
  let customSource = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && args[i + 1]) mode = args[++i].toLowerCase();
    if (args[i] === '--url' && args[i + 1]) url = args[++i];
    if (args[i] === '--input' && args[i + 1]) input = args[++i];
    if (args[i] === '--script' && args[i + 1]) input = args[++i];
    if (args[i] === '--text' && args[i + 1]) text = args[++i];
    if (args[i] === '--title' && args[i + 1]) title = args[++i];
    if (args[i] === '--template' && args[i + 1]) template = args[++i];
    if (args[i] === '--voice' && args[i + 1]) voice = args[++i];
    if (args[i] === '--profile' && args[i + 1]) profile = args[++i];
    if (args[i] === '--source' && args[i + 1]) customSource = args[++i];
    if (args[i] === '--forceHumanize') forceHumanize = true;
    if (args[i] === '--render') shouldRender = true;
  }

  // Tự động nhận diện mode
  if (!mode) {
    if (url) mode = 'url';
    else if (input || text) mode = 'script';
  }

  if (!url && !input && !text && !title) {
    console.log(`
🎬 Article & Script to Video CLI Pipeline (VieNeu-TTS + Pexels + OpenAI CLIP + FFmpeg)

Cách sử dụng:
  1. Chế độ Báo điện tử (URL):
     node cli.js --url "<URL>" --template <TikTokViral|BreakingNews|ShortNews|NewsRoundup|ExplainerShort> [--voice vieneu-minhduc] [--render]

  2. Chế độ Kịch bản có sẵn (Script File hoặc Raw Text):
     node cli.js --mode script --input "kichban.json" [--voice vieneu-minhduc] [--render]
     node cli.js --mode script --input "kichban.txt" [--voice vieneu-minhduc] [--render]

Tùy chọn:
  --mode           url | script (Tự động phát hiện nếu bỏ trống)
  --input          Đường dẫn file .json, .txt, .md hoặc nội dung kịch bản
  --template       TikTokViral (9:16) | BreakingNews (9:16) | ShortNews (9:16) | NewsRoundup (16:9) | ExplainerShort (9:16)
  --voice          vieneu-minhduc (Nam Bắc - Tin tức) | vieneu-trucly (Nữ Bắc) | vieneu-maianh | vieneu-thaison | vieneu-thuydung | vi-VN-HoaiMyNeural
  --forceHumanize  Bắt buộc chạy qua bộ lọc AI Rewriter ngay cả khi dùng script tay
  --render         Kích hoạt kết xuất file MP4 hoàn chỉnh
    `);
    process.exit(0);
  }

  console.log(`\n🚀 Đang khởi động Article & Script to Video Pipeline [Mode: ${mode.toUpperCase()}]...`);

  let finalScenes = [];
  let projectTitle = title;
  let category = 'TÀI CHÍNH';
  let sourceName = customSource || 'Báo chí tổng hợp';
  let sourceUrl = url || '';
  let tickerText = '';
  let primaryColor = '#00F2FE';
  let accentColor = '#FACC15';
  let leadImage = '';

  // ══════════════════════════════════════════════════════════════════════════
  // NHÁNH 1: MODE = SCRIPT (Nhận kịch bản trực tiếp từ JSON/TXT/MD)
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === 'script') {
    const rawInput = input || text;
    console.log(`📝 Bước 1: Phân tích và chuẩn hóa kịch bản từ input...`);
    const parsed = parseScript(rawInput, { category, sourceName });

    projectTitle = projectTitle || parsed.title;
    category = parsed.category;
    sourceName = parsed.sourceName || sourceName;
    sourceUrl = parsed.sourceUrl || sourceUrl;
    tickerText = parsed.tickerText || '';
    primaryColor = parsed.primaryColor;
    accentColor = parsed.accentColor;
    finalScenes = parsed.scenes;

    console.log(`✔ Đã nạp kịch bản: "${projectTitle}" (${finalScenes.length} phân cảnh)`);

    // Tùy chọn: Chạy qua bộ viết lại nếu bật cờ --forceHumanize
    if (forceHumanize) {
      console.log('✍ Bước 2: Chạy Humanize Rewrite theo yêu cầu (--forceHumanize)...');
      const rewritten = await rewriteContent({ title: projectTitle, content: finalScenes.map(s => s.text).join('\n\n'), sourceName });
      const storyboard = await generateStoryboard({ rewrittenData: rewritten, sourceName });
      finalScenes = storyboard.scenes;
      projectTitle = rewritten.rewrittenTitle;
      category = rewritten.category;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NHÁNH 2: MODE = URL (Cào báo tự động)
  // ══════════════════════════════════════════════════════════════════════════
  else {
    console.log(`📡 Bước 1: Trích xuất bài báo từ: ${url}`);
    const scraped = await scrapeArticle(url);
    projectTitle = projectTitle || scraped.title;
    const content = scraped.fullContent;
    sourceName = scraped.sourceName || sourceName;
    sourceUrl = scraped.sourceUrl || url;
    leadImage = scraped.leadImage;
    console.log(`✔ Đã trích xuất: "${projectTitle}" (Nguồn: ${sourceName})`);

    console.log('✍ Bước 2: Viết lại kịch bản theo chuẩn Humanize...');
    const rewritten = await rewriteContent({ title: projectTitle, content, sourceName });
    projectTitle = rewritten.rewrittenTitle;
    category = rewritten.category;

    console.log('🎬 Bước 3: Phân cảnh AI Storyboard...');
    const storyboard = await generateStoryboard({ rewrittenData: rewritten, sourceName, leadImage });
    finalScenes = storyboard.scenes;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BƯỚC 4: PRE-FLIGHT DURATION CHECK (Kiểm soát thời lượng >= 45s)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n📏 Bước 4: Kiểm tra thời lượng kịch bản (Pre-flight Check)...');
  let flightReport = preflightCheck(finalScenes);

  console.log('┌─────────────────────────────────────────────────────┐');
  for (const s of flightReport.scenes) {
    const bar = '█'.repeat(Math.min(20, Math.round(s.estimatedSeconds)));
    const status = s.ok ? '✔' : '⚠';
    console.log(`│ ${status} ${(s.sceneId).padEnd(10)} ${bar.padEnd(20)} ~${s.estimatedSeconds.toFixed(1)}s (${s.wordCount} chữ)`);
  }
  console.log('├─────────────────────────────────────────────────────┤');
  console.log(`│ Tổng ước tính: ${flightReport.totalEstimatedSeconds.toFixed(1)}s / Mục tiêu: ${flightReport.targetSeconds}s`);

  if (flightReport.isOk || mode === 'script') {
    console.log(`│ ✅ THỜI LƯỢNG ĐẠT CHUẨN (${flightReport.totalEstimatedSeconds.toFixed(1)}s)`);
    console.log('└─────────────────────────────────────────────────────┘\n');
  } else {
    console.log(`│ ⚠️  THIẾU ${flightReport.deficit.toFixed(1)}s — Đang tự động mở rộng kịch bản...`);
    console.log('└─────────────────────────────────────────────────────┘');
    finalScenes = expandScenesToMeetTarget(finalScenes);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BƯỚC 5: SINH GIỌNG ĐỌC (VIENEU-TTS) & CHẤM ĐIỂM ẢNH 4K (OPENAI CLIP)
  // ══════════════════════════════════════════════════════════════════════════
  console.log(`🎙 Bước 5: Sinh giọng đọc AI (${voice}) & Chấm điểm ảnh OpenAI CLIP...`);
  const processedScenes = [];
  let actualTotalSeconds = 0;

  for (let idx = 0; idx < finalScenes.length; idx++) {
    const scene = finalScenes[idx];
    console.log(`\n⏳ Đang xử lý phân cảnh ${idx + 1}/${finalScenes.length}: "${scene.headline || scene.title || 'Phân cảnh'}"...`);

    const ttsData = await generateTTSForScene({
      text: scene.text,
      voice,
      profile,
      sceneId: scene.id || `scene-${idx + 1}`
    });

    const mediaData = await fetchMediaForScene({
      keywords: scene.keywords || scene.imageKeywords || [],
      sceneIndex: idx,
      headline: scene.headline || scene.title || '',
      leadImage: idx === 0 ? leadImage : ''
    });

    const actualSeconds = ttsData.durationInFrames / 30;
    actualTotalSeconds += actualSeconds;

    processedScenes.push({
      ...scene,
      durationInFrames: ttsData.durationInFrames || 150,
      audioUrl: ttsData.audioUrl || '',
      captions: ttsData.captions || [],
      mediaUrl: mediaData.mediaUrl,
      mediaList: mediaData.mediaList,
      mediaType: mediaData.mediaType || 'image'
    });
  }

  console.log(`\n📊 Tổng thời lượng video thực tế: ~${actualTotalSeconds.toFixed(1)} giây (${processedScenes.length} phân cảnh)`);

  const projectProps = {
    title: projectTitle,
    category,
    sourceName,
    sourceUrl,
    tickerText: tickerText || `${projectTitle} • Nguồn: ${sourceName}`,
    primaryColor,
    accentColor,
    scenes: processedScenes
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BƯỚC 6: RENDER VIDEO REMOTION (NẾU BẬT --render)
  // ══════════════════════════════════════════════════════════════════════════
  if (shouldRender) {
    console.log(`\n⏳ Bước 6: Bắt đầu render video MP4 [${template}]...`);
    const renderResult = await renderVideoMP4({
      compositionId: template,
      inputProps: projectProps
    });

    console.log('\n🎉 VIDEO ĐÃ ĐƯỢC TẠO THÀNH CÔNG!');
    console.log(`📁 File: ${renderResult.filePath}`);
    console.log(`⏱ Thời lượng: ~${actualTotalSeconds.toFixed(1)} giây`);
    console.log(`📐 Template: ${template} (9:16 Full HD)`);
  } else {
    console.log('\n💡 Tip: Thêm cờ `--render` để tự động render thành file MP4 hoàn chỉnh.');
  }
}

main().catch((err) => {
  console.error('❌ Pipeline lỗi:', err);
  process.exit(1);
});
