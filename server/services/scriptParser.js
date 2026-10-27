import fs from 'fs';
import path from 'path';

/**
 * Ước tính thời lượng giọng đọc tiếng Việt (~2.3 - 2.5 từ/giây)
 */
export function estimateDuration(text) {
  if (!text) return 3;
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.round((words / 2.4) * 10) / 10);
}

/**
 * Trích xuất từ khóa hình ảnh cơ bản từ câu thoại nếu không có visual_query
 */
export function extractKeywords(text) {
  if (!text) return ['financial news'];
  const stopWords = new Set([
    'là', 'và', 'của', 'các', 'những', 'được', 'cho', 'có', 'trong', 'với',
    'đã', 'sẽ', 'đang', 'ở', 'tại', 'ra', 'vào', 'này', 'đó', 'thì', 'mà',
    'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười',
    'vừa', 'qua', 'lại', 'theo', 'như', 'đến', 'từ', 'cũng', 'để', 'rất'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[.,?!:;"'“”‘’()—\-_/]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  const unique = Array.from(new Set(words));
  return unique.slice(0, 5);
}

/**
 * Chuẩn hóa danh sách scenes theo schema thống nhất của toàn pipeline
 */
export function normalizeScenes(rawScenes = [], defaultTitle = '') {
  return rawScenes.map((s, idx) => {
    const text = (s.vo || s.text || s.voiceover || s.content || '').trim();
    let keywords = [];

    if (Array.isArray(s.visual_query)) {
      keywords = s.visual_query;
    } else if (typeof s.visual_query === 'string' && s.visual_query.trim()) {
      keywords = [s.visual_query.trim()];
    } else if (Array.isArray(s.keywords) && s.keywords.length > 0) {
      keywords = s.keywords;
    } else if (typeof s.keywords === 'string') {
      keywords = [s.keywords];
    } else {
      keywords = extractKeywords(text);
    }

    return {
      id: s.id ? (typeof s.id === 'string' && s.id.startsWith('scene-') ? s.id : `scene-${s.id}`) : `scene-${idx + 1}`,
      sceneIndex: idx,
      headline: s.headline || s.title || s.header || `PHÂN CẢNH ${idx + 1}`,
      text,
      keywords,
      visual_query: keywords.join(' '),
      durationHint: s.duration_hint || s.durationHint || estimateDuration(text)
    };
  });
}

/**
 * Phân tích kịch bản dạng Text/Markdown (có VO: ..., Hình ảnh: ..., hoặc các phân đoạn)
 */
function parseTextScript(rawText) {
  const lines = rawText.split('\n');
  const scenes = [];
  let currentScene = null;
  let title = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Tìm tiêu đề
    if ((line.startsWith('# ') || line.startsWith('KỊCH BẢN:')) && !title) {
      title = line.replace(/^[#\s*]+|KỊCH BẢN:\s*/gi, '').trim();
      continue;
    }

    // Nhận diện phân đoạn / scene marker
    const isSceneHeader =
      /^(?:#+\s*)?(?:PHÂN ĐOẠN|CẢNH|SCENE|\d+[\.\)])/i.test(line) ||
      /^\*\*\d+\.\s*\d{2}:\d{2}/.test(line);

    if (isSceneHeader) {
      if (currentScene && (currentScene.vo || currentScene.text)) {
        scenes.push(currentScene);
      }
      currentScene = {
        id: scenes.length + 1,
        headline: line.replace(/[*_#\[\]]/g, '').trim(),
        vo: '',
        visual_query: ''
      };
      continue;
    }

    // Nhận diện VO
    if (/^(?:VO|Voice-over|Lời thoại|MC|BTV):\s*/i.test(line)) {
      const voContent = line.replace(/^(?:VO|Voice-over|Lời thoại|MC|BTV):\s*/i, '').replace(/^["“”']|["“”']$/g, '').trim();
      if (!currentScene) {
        currentScene = { id: scenes.length + 1, headline: `PHÂN CẢNH ${scenes.length + 1}`, vo: '', visual_query: '' };
      }
      currentScene.vo = currentScene.vo ? `${currentScene.vo} ${voContent}` : voContent;
      continue;
    }

    // Nhận diện Hình ảnh / Visual
    if (/^(?:Hình ảnh|Visual|Image|Video):\s*/i.test(line)) {
      const visualContent = line.replace(/^(?:Hình ảnh|Visual|Image|Video):\s*/i, '').trim();
      if (currentScene) {
        currentScene.visual_query = visualContent;
      }
      continue;
    }

    // Nếu không có marker đặc biệt nhưng đang trong scene
    if (currentScene && !currentScene.vo && line.length > 5 && !line.startsWith('**') && !line.startsWith('---')) {
      currentScene.vo = line.replace(/^["“”']|["“”']$/g, '');
    }
  }

  if (currentScene && (currentScene.vo || currentScene.text)) {
    scenes.push(currentScene);
  }

  // Fallback nếu không có marker scene nào: Tách theo từng câu / đoạn văn
  if (scenes.length === 0) {
    const paragraphs = rawText
      .split(/(?<=[.!?])\s+|\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 10);

    paragraphs.forEach((p, idx) => {
      scenes.push({
        id: idx + 1,
        headline: `PHÂN CẢNH ${idx + 1}`,
        vo: p,
        visual_query: extractKeywords(p).join(' ')
      });
    });
  }

  return {
    title: title || 'Kịch bản tùy chỉnh',
    scenes
  };
}

/**
 * PARSER CHÍNH CHO KỊCH BẢN (JSON, TXT, MD HOẶC STRING RAW)
 */
export function parseScript(inputPathOrContent, options = {}) {
  let raw = '';
  let isFilePath = false;

  if (typeof inputPathOrContent === 'string' && (inputPathOrContent.endsWith('.json') || inputPathOrContent.endsWith('.txt') || inputPathOrContent.endsWith('.md'))) {
    const resolved = path.resolve(inputPathOrContent);
    if (fs.existsSync(resolved)) {
      raw = fs.readFileSync(resolved, 'utf-8');
      isFilePath = true;
    }
  }

  if (!raw) {
    raw = inputPathOrContent;
  }

  // 1. Trường hợp JSON
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed);
      const rawScenes = Array.isArray(data.scenes) ? data.scenes : (Array.isArray(data) ? data : []);
      const title = data.title || 'Kịch bản Video';
      return {
        title,
        category: data.category || 'TÀI CHÍNH',
        sourceName: data.sourceName || data.source || 'Kịch bản biên tập',
        sourceUrl: data.sourceUrl || '',
        tickerText: data.tickerText || data.ticker || '',
        primaryColor: data.primaryColor || '#00F2FE',
        accentColor: data.accentColor || '#FACC15',
        scenes: normalizeScenes(rawScenes, title)
      };
    } catch (err) {
      console.warn('⚠ Lỗi parse JSON script, thử chuyển sang parse dạng Text:', err.message);
    }
  }

  // 2. Trường hợp Text / Markdown
  const parsed = parseTextScript(raw);
  return {
    title: parsed.title,
    category: options.category || 'TÀI CHÍNH',
    sourceName: options.sourceName || 'Kịch bản biên tập',
    sourceUrl: options.sourceUrl || '',
    tickerText: options.tickerText || '',
    primaryColor: options.primaryColor || '#00F2FE',
    accentColor: options.accentColor || '#FACC15',
    scenes: normalizeScenes(parsed.scenes, parsed.title)
  };
}
