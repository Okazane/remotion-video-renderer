import axios from 'axios';
import * as cheerio from 'cheerio';

const SOURCE_NAME_MAP = {
  'vnexpress.net': 'VnExpress',
  'tuoitre.vn': 'Tuổi Trẻ Online',
  'dantri.com.vn': 'Dân Trí',
  'thanhnien.vn': 'Báo Thanh Niên',
  'vietnamnet.vn': 'VietNamNet',
  'vtv.vn': 'VTV News',
  'cafef.vn': 'CafeF',
  'cafebiz.vn': 'CafeBiz',
  'genk.vn': 'GenK',
  'tinhte.vn': 'Tinh Tế',
  'bbc.com': 'BBC News Tiếng Việt',
  'techcrunch.com': 'TechCrunch',
  'theverge.com': 'The Verge'
};

export async function scrapeArticle(url) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace(/^www\./, '');

    let detectedSource = SOURCE_NAME_MAP[domain];
    if (!detectedSource) {
      // Tách tên domain làm nguồn mặc định
      const parts = domain.split('.');
      detectedSource = parts.length > 1 ? parts[0].toUpperCase() : domain;
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 12000
    });

    const $ = cheerio.load(response.data);

    // 1. Trích xuất Tiêu đề
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim();

    // 2. Trích xuất Mô tả / Tóm tắt
    const summary =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('p.description, .sapo, .lead, h2.description').first().text().trim();

    // 3. Trích xuất Ảnh đại diện chính (và nâng cấp lên độ phân giải gốc cao nhất)
    let leadImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('article img, .fck_detail img, .main-detail img').first().attr('src') ||
      '';

    if (leadImage && !leadImage.startsWith('http')) {
      leadImage = new URL(leadImage, url).toString();
    }

    // Nâng cấp ảnh VnExpress / Dân Trí / Báo mạng lên ảnh gốc Master chất lượng cao nhất
    if (leadImage) {
      leadImage = leadImage
        .replace(/_\d+x\d+\.(jpg|jpeg|png|webp)/gi, '.$1')
        .replace(/_r_\d+x\d+\.(jpg|jpeg|png|webp)/gi, '.$1')
        .replace(/\/zoom\/\d+_\d+\//gi, '/');
    }

    // 4. Trích xuất Tên nguồn (site name)
    const siteName =
      $('meta[property="og:site_name"]').attr('content') || detectedSource;

    // 5. Trích xuất toàn bộ các đoạn văn nội dung
    const paragraphs = [];
    $('article p, .fck_detail p, .content p, .detail-content p, .article-body p').each(
      (_, el) => {
        const text = $(el).text().trim();
        // Loại bỏ các đoạn text quảng cáo hoặc quá ngắn
        if (
          text.length > 25 &&
          !text.toLowerCase().includes('xem thêm') &&
          !text.toLowerCase().includes('đọc thêm') &&
          !text.toLowerCase().includes('theo dõi chúng tôi')
        ) {
          paragraphs.push(text);
        }
      }
    );

    const fullContent = paragraphs.join('\n\n') || summary || title;

    return {
      success: true,
      url,
      title: title.replace(/\s+/g, ' ').trim(),
      summary: summary ? summary.replace(/\s+/g, ' ').trim() : '',
      sourceName: siteName,
      leadImage,
      fullContent,
      paragraphsCount: paragraphs.length
    };
  } catch (error) {
    console.error('Lỗi khi cào bài báo:', error.message);
    throw new Error(`Không thể trích xuất bài báo từ link: ${error.message}`);
  }
}
