import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import axios from 'axios';

const PYTHON_PATH = path.resolve('tts_env/Scripts/python.exe');
const CLIP_SCRIPT = path.resolve('server/services/clip_matcher.py');

const CURATED_THEMES = {
  crypto: [
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=2160&auto=format&fit=crop&q=95', // Blockchain network 3D
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=2160&auto=format&fit=crop&q=95', // Digital tech chip
    'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=2160&auto=format&fit=crop&q=95', // Bitcoin cryptocurrency
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=2160&auto=format&fit=crop&q=95', // Token virtual assets
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=2160&auto=format&fit=crop&q=95', // Cyber security network
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=2160&auto=format&fit=crop&q=95'  // Fintech data dashboard
  ],
  carbon: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=2160&auto=format&fit=crop&q=95', // Planet earth from space
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=2160&auto=format&fit=crop&q=95', // Green nature tree ecology
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=2160&auto=format&fit=crop&q=95', // Green forest carbon credit
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=2160&auto=format&fit=crop&q=95', // Wind turbines clean energy
    'https://images.unsplash.com/photo-1508873696983-2df5703bc225?w=2160&auto=format&fit=crop&q=95'  // Renewable green energy
  ],
  vietnam: [
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=2160&auto=format&fit=crop&q=95', // Saigon Landmark 81 skyline night
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=2160&auto=format&fit=crop&q=95', // Da Nang Dragon Bridge night
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=2160&auto=format&fit=crop&q=95', // High tech modern center
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2160&auto=format&fit=crop&q=95'  // Financial district skyscrapers
  ],
  gold: [
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=2160&auto=format&fit=crop&q=95', // Gold bars stack
    'https://images.unsplash.com/photo-1579226905180-636b76d96082?w=2160&auto=format&fit=crop&q=95', // Gold coins & finance
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=2160&auto=format&fit=crop&q=95', // Stock market drop red chart
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=2160&auto=format&fit=crop&q=95', // Gold ring jewelry luxury
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=2160&auto=format&fit=crop&q=95', // US Dollar currency money
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=2160&auto=format&fit=crop&q=95', // Financial trading screen
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=2160&auto=format&fit=crop&q=95', // Investment assets
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2160&auto=format&fit=crop&q=95'  // Wall street financial district
  ],
  realestate: [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1448630360428-65456885c650?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=2160&auto=format&fit=crop&q=95'
  ],
  aviation: [
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1483450388369-9ed95738483c?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=2160&auto=format&fit=crop&q=95'
  ],
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=2160&auto=format&fit=crop&q=95'
  ],
  economy: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=2160&auto=format&fit=crop&q=95'
  ],
  society: [
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=2160&auto=format&fit=crop&q=95'
  ],
  general: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?w=2160&auto=format&fit=crop&q=95',
    'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=2160&auto=format&fit=crop&q=95'
  ]
};

/**
 * 1. PEXELS API SEARCH
 */
async function searchPexels(query, count = 5) {
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (!pexelsKey) return [];

  try {
    const res = await axios.get(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`,
      {
        headers: { Authorization: pexelsKey },
        timeout: 8000
      }
    );
    if (res.data && res.data.photos && res.data.photos.length > 0) {
      return res.data.photos.map((p) => p.src.large2x || p.src.large || p.src.original);
    }
  } catch (err) {
    console.warn('⚠ Pexels search lỗi, dùng fallback pool:', err.message);
  }
  return [];
}

/**
 * 2. OPENAI CLIP SEMANTIC RANKING
 */
async function rankImagesWithCLIP(prompt, urls) {
  if (!urls || urls.length <= 1 || !fs.existsSync(PYTHON_PATH) || !fs.existsSync(CLIP_SCRIPT)) {
    return urls;
  }

  return new Promise((resolve) => {
    const payload = JSON.stringify({ prompt, urls });
    execFile(
      PYTHON_PATH,
      [CLIP_SCRIPT, payload],
      { timeout: 15000 },
      (error, stdout) => {
        if (error || !stdout) {
          return resolve(urls);
        }
        try {
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const data = JSON.parse(lastLine);
          if (data.success && data.ranked_urls && data.ranked_urls.length > 0) {
            return resolve(data.ranked_urls);
          }
        } catch {}
        resolve(urls);
      }
    );
  });
}

/**
 * Phát hiện chủ đề từ keywords
 */
function detectTheme(keywords) {
  const q = (keywords || []).join(' ').toLowerCase();

  if (
    q.includes('crypto') || q.includes('mã hóa') || q.includes('tiền số') ||
    q.includes('blockchain') || q.includes('token') || q.includes('fintech')
  ) return 'crypto';

  if (
    q.includes('carbon') || q.includes('tín chỉ') || q.includes('green') ||
    q.includes('sinh thái') || q.includes('môi trường')
  ) return 'carbon';

  if (
    q.includes('hồ chí minh') || q.includes('đà nẵng') || q.includes('saigon') ||
    q.includes('việt nam') || q.includes('vietnam') || q.includes('hạ tầng')
  ) return 'vietnam';

  if (
    q.includes('vàng') || q.includes('sjc') || q.includes('nhẫn') ||
    q.includes('gold') || q.includes('bullion') || q.includes('ounce') ||
    q.includes('bạc') || q.includes('trang sức') || q.includes('doji') || q.includes('pnj')
  ) return 'gold';

  if (
    q.includes('đất') || q.includes('bất động sản') || q.includes('thuế') ||
    q.includes('nhà ở') || q.includes('đầu cơ') || q.includes('găm giữ') ||
    q.includes('land') || q.includes('real estate') || q.includes('property') ||
    q.includes('housing') || q.includes('tax')
  ) return 'realestate';

  if (
    q.includes('plane') || q.includes('pilot') || q.includes('flight') ||
    q.includes('airline') || q.includes('airport') || q.includes('runway') ||
    q.includes('boeing') || q.includes('airbus') || q.includes('cockpit') ||
    q.includes('aviation') || q.includes('phi công') || q.includes('máy bay')
  ) return 'aviation';

  if (
    q.includes('tech') || q.includes('ai') || q.includes('digital') ||
    q.includes('software') || q.includes('computer') || q.includes('code') ||
    q.includes('công nghệ') || q.includes('robot') || q.includes('internet')
  ) return 'technology';

  if (
    q.includes('economy') || q.includes('finance') || q.includes('market') ||
    q.includes('stock') || q.includes('invest') || q.includes('trade') ||
    q.includes('kinh tế') || q.includes('tài chính') || q.includes('chứng khoán')
  ) return 'economy';

  if (
    q.includes('city') || q.includes('society') || q.includes('people') ||
    q.includes('community') || q.includes('social') ||
    q.includes('xã hội') || q.includes('cộng đồng')
  ) return 'society';

  return 'general';
}

/**
 * MAIN MEDIA FETCHER
 */
export async function fetchMediaForScene({
  keywords = [],
  sceneIndex = 0,
  leadImage = '',
  headline = ''
}) {
  const theme = detectTheme(keywords);
  const themePool = CURATED_THEMES[theme] || CURATED_THEMES.general;

  // 1. Tìm thêm ảnh từ Pexels (nếu có API key)
  const searchQuery = (keywords.length > 0 ? keywords.join(' ') : headline) || theme;
  const pexelsImages = await searchPexels(searchQuery, 4);

  // 2. Gom danh sách ứng viên
  const candidates = [...pexelsImages, ...themePool];

  // 3. Dùng OpenAI CLIP chấm điểm & chọn top 2 ảnh chuẩn ngữ nghĩa nhất
  const promptForCLIP = `${headline} ${keywords.join(' ')}`;
  const ranked = await rankImagesWithCLIP(promptForCLIP, candidates.slice(0, 6));

  const primaryImg =
    sceneIndex === 0 && leadImage
      ? leadImage
      : ranked[0] || themePool[sceneIndex % themePool.length];

  const secondaryImg =
    ranked[1] || themePool[(sceneIndex + 2) % themePool.length];

  return {
    mediaUrl: primaryImg,
    mediaList: [primaryImg, secondaryImg],
    mediaType: 'image'
  };
}

/**
 * Xử lý tìm kiếm và khớp ảnh ngữ nghĩa cho toàn bộ danh sách phân cảnh
 */
export async function matchMediaPerScene(scenes = [], leadImage = '') {
  const results = [];
  for (let idx = 0; idx < scenes.length; idx++) {
    const s = scenes[idx];
    const media = await fetchMediaForScene({
      keywords: s.keywords || (s.visual_query ? [s.visual_query] : []),
      sceneIndex: idx,
      headline: s.headline || '',
      leadImage: idx === 0 ? leadImage : ''
    });
    results.push(media);
  }
  return results;
}
