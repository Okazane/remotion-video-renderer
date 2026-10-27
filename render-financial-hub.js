import 'dotenv/config';
import { generateTTSForScene } from './server/services/tts.js';
import { fetchMediaForScene } from './server/services/media.js';
import { renderVideoMP4 } from './server/services/renderer.js';

async function main() {
  const args = process.argv.slice(2);
  let voice = 'vieneu-minhduc'; // Mặc định dùng VieNeu-TTS (48kHz Local AI - Nam Bắc Tin Tức Dứt Khoát)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--voice' && args[i + 1]) voice = args[++i];
  }

  console.log(`🚀 Bắt đầu render Video 29 Phân cảnh (Trung tâm tài chính quốc tế) với giọng: [${voice}]...`);

  const scenes = [
    // [HOOK]
    {
      id: 'scene-1',
      sceneIndex: 0,
      headline: 'ĐẶC KHU TÀI CHÍNH CHO TIỀN SỐ',
      text: 'Việt Nam sắp có một đặc khu tài chính cho tiền số và tín chỉ carbon.',
      keywords: ['vietnam technology map blockchain crypto', 'crypto future']
    },
    {
      id: 'scene-2',
      sceneIndex: 1,
      headline: 'ĐỀ XUẤT MỚI NGÀY 19/8',
      text: 'Đề xuất mới nhất vừa được đưa ra ngày 19/8.',
      keywords: ['breaking news financial calendar 19 august', 'finance update']
    },
    // [VÀO VẤN ĐỀ]
    {
      id: 'scene-3',
      sceneIndex: 2,
      headline: 'ƯU TIÊN TÀI SẢN MÃ HÓA & CARBON',
      text: 'Tài sản mã hóa và tín chỉ carbon quốc tế được đề xuất ưu tiên triển khai sớm.',
      keywords: ['crypto bitcoin green carbon credits ecology', 'blockchain ecology']
    },
    {
      id: 'scene-4',
      sceneIndex: 3,
      headline: 'TP.HCM VÀ ĐÀ NẴNG',
      text: 'Địa điểm áp dụng là Trung tâm tài chính quốc tế tại Thành phố Hồ Chí Minh và Đà Nẵng.',
      keywords: ['saigon landmark 81 da nang dragon bridge', 'vietnam map city']
    },
    {
      id: 'scene-5',
      sceneIndex: 4,
      headline: 'CUỘC HỌP DO PHÓ THỦ TƯỚNG CHỦ TRÌ',
      text: 'Đề xuất được đưa ra tại cuộc họp do Phó thủ tướng Nguyễn Văn Thắng chủ trì.',
      keywords: ['government meeting conference room formal', 'leadership council']
    },
    // [6 NHÓM SẢN PHẨM]
    {
      id: 'scene-6',
      sceneIndex: 5,
      headline: '6 NHÓM SẢN PHẨM ƯU TIÊN',
      text: 'Tổng cộng có 6 nhóm sản phẩm, dịch vụ được đề xuất ưu tiên.',
      keywords: ['infographic 6 products financial services', 'finance chart']
    },
    {
      id: 'scene-7',
      sceneIndex: 6,
      headline: '1. QUỸ ĐẦU TƯ & QUẢN LÝ TÀI SẢN',
      text: 'Đầu tiên là quỹ đầu tư và quản lý tài sản.',
      keywords: ['investment fund asset management chart', 'wealth management']
    },
    {
      id: 'scene-8',
      sceneIndex: 7,
      headline: '2. TÀI SẢN MÃ HÓA DỰA TRÊN TÀI SẢN THỰC',
      text: 'Thứ hai, tài sản mã hóa dựa trên tài sản thực.',
      keywords: ['real world assets tokenization blockchain', 'tokenized real estate']
    },
    {
      id: 'scene-9',
      sceneIndex: 8,
      headline: '3. TÍN CHỈ CARBON QUỐC TẾ',
      text: 'Thứ ba, tín chỉ carbon quốc tế.',
      keywords: ['carbon credit green earth planet ecology', 'clean renewable energy']
    },
    {
      id: 'scene-10',
      sceneIndex: 9,
      headline: '4. SÀN HÀNG HÓA PHÁI SINH',
      text: 'Thứ tư, sàn giao dịch hàng hóa và hàng hóa phái sinh.',
      keywords: ['commodity exchange candlestick chart trade', 'stock market display']
    },
    {
      id: 'scene-11',
      sceneIndex: 10,
      headline: '5. CÔNG NGHỆ TÀI CHÍNH (FINTECH)',
      text: 'Thứ năm, công nghệ tài chính, hay còn gọi là fintech.',
      keywords: ['fintech digital banking smartphone payment', 'electronic finance']
    },
    {
      id: 'scene-12',
      sceneIndex: 11,
      headline: '6. TRÁI PHIẾU',
      text: 'Và cuối cùng là trái phiếu.',
      keywords: ['bonds financial security certificate', 'government bonds']
    },
    // [QUAN ĐIỂM BỘ TÀI CHÍNH]
    {
      id: 'scene-13',
      sceneIndex: 12,
      headline: 'XUẤT PHÁT TỪ NHU CẦU THỰC',
      text: 'Theo Bộ Tài chính, sản phẩm mới phải xuất phát từ nhu cầu thực của nền kinh tế.',
      keywords: ['ministry of finance economy balance scale', 'financial policy']
    },
    {
      id: 'scene-14',
      sceneIndex: 13,
      headline: 'BẢO ĐẢM AN NINH QUỐC GIA',
      text: 'Đồng thời phải tuân thủ điều ước quốc tế và bảo đảm an ninh quốc gia.',
      keywords: ['security shield international treaty global law', 'national security cyber']
    },
    {
      id: 'scene-15',
      sceneIndex: 14,
      headline: 'HOÀN THIỆN ĐIỀU KIỆN VẬN HÀNH',
      text: 'Thay vì mở rộng nhiều cơ chế cùng lúc, ưu tiên trước mắt là hoàn thiện điều kiện vận hành thực tế.',
      keywords: ['gears mechanism operational execution', 'system workflow']
    },
    {
      id: 'scene-16',
      sceneIndex: 15,
      headline: 'HOÀN THIỆN QUY ĐỊNH PHÁP LÝ',
      text: 'Các quy định về ngoại hối, tín dụng, tài sản bảo đảm cũng cần sớm hoàn thiện.',
      keywords: ['foreign exchange credit guarantee document legal', 'banking compliance']
    },
    // [CHỈ ĐẠO PHÓ THỦ TƯỚNG]
    {
      id: 'scene-17',
      sceneIndex: 16,
      headline: 'CHỈ ĐẠO THIẾT KẾ SẢN PHẨM MỚI',
      text: 'Phó thủ tướng Nguyễn Văn Thắng yêu cầu Bộ Tài chính sớm thiết kế các sản phẩm tài chính mới.',
      keywords: ['financial blueprint architecture design', 'economic strategy']
    },
    {
      id: 'scene-18',
      sceneIndex: 17,
      headline: 'TẠO GIAO DỊCH THỰC CHẤT',
      text: 'Ưu tiên những sản phẩm có khả năng tạo ra giao dịch thực chất.',
      keywords: ['handshake business transaction growth', 'commercial trade']
    },
    {
      id: 'scene-19',
      sceneIndex: 18,
      headline: 'VẬN HÀNH THÔNG SUỐT',
      text: 'Mục tiêu trước mắt là Trung tâm phải vận hành thông suốt.',
      keywords: ['smooth operation high tech network green light', 'digital core']
    },
    {
      id: 'scene-20',
      sceneIndex: 19,
      headline: 'HÌNH THÀNH THƯƠNG VỤ CỤ THỂ',
      text: 'Phải có thành viên, có sản phẩm, và sớm hình thành thương vụ cụ thể.',
      keywords: ['business team product deal contract signing', 'corporate agreement']
    },
    {
      id: 'scene-21',
      sceneIndex: 20,
      headline: 'THU HÚT VỐN TRUNG VÀ DÀI HẠN',
      text: 'Trọng tâm là thu hút nguồn vốn trung và dài hạn cho nền kinh tế.',
      keywords: ['capital flow investment money vietnam growth', 'financial inflow']
    },
    // [TIẾN ĐỘ CHUẨN BỊ]
    {
      id: 'scene-22',
      sceneIndex: 21,
      headline: 'TP.HCM VÀ ĐÀ NẴNG ĐÃ SẴN SÀNG',
      text: 'Thành phố Hồ Chí Minh và Đà Nẵng đã chủ động bố trí nguồn lực và hạ tầng.',
      keywords: ['landmark 81 saigon da nang dragon bridge night', 'vietnam modern skyline']
    },
    {
      id: 'scene-23',
      sceneIndex: 22,
      headline: 'BÁO CÁO HỆ THỐNG IT THÁNG 9',
      text: 'Thành phố Hồ Chí Minh sẽ báo cáo hệ thống công nghệ thông tin dùng chung trong tháng 9.',
      keywords: ['server datacenter cloud network technology', 'high tech server rack']
    },
    {
      id: 'scene-24',
      sceneIndex: 23,
      headline: 'CƠ CHẾ THANH TRA LIÊN BỘ',
      text: 'Cơ chế thanh tra, giám sát liên bộ cũng sẽ ban hành trong tháng 9.',
      keywords: ['audit inspection government compliance review', 'legal regulation']
    },
    {
      id: 'scene-25',
      sceneIndex: 24,
      headline: 'TÒA ÁN & TRỌNG TÀI QUỐC TẾ',
      text: 'Tòa án chuyên biệt và trung tâm trọng tài quốc tế dự kiến ra mắt ngay trong tháng này.',
      keywords: ['international arbitration court gavel justice scale', 'law court balance']
    },
    // [KẾT — CƠ HỘI & CTA]
    {
      id: 'scene-26',
      sceneIndex: 25,
      headline: 'FTSE RUSSELL CÔNG BỐ NGÀY 21/8',
      text: 'Đáng chú ý, ngày 21/8 tới, FTSE Russell sẽ công bố cổ phiếu Việt Nam vào rổ chỉ số toàn cầu.',
      keywords: ['ftse russell global stock market index vietnam', 'stock exchange trading']
    },
    {
      id: 'scene-27',
      sceneIndex: 26,
      headline: 'THỜI ĐIỂM VÀNG ĐÓN DÒNG VỐN',
      text: 'Đây được xem là thời điểm vàng để Thành phố Hồ Chí Minh và Đà Nẵng đón dòng vốn quốc tế.',
      keywords: ['golden opportunity international capital foreign investment', 'global finance']
    },
    {
      id: 'scene-28',
      sceneIndex: 27,
      headline: 'TRUNG TÂM TÀI CHÍNH TĂNG TỐC',
      text: 'Trung tâm tài chính quốc tế Việt Nam đang tăng tốc từng ngày.',
      keywords: ['vietnam financial hub future skyline digital transformation', 'smart city night']
    },
    {
      id: 'scene-29',
      sceneIndex: 28,
      headline: 'BẠN NGHĨ SAO VỀ CƠ HỘI NÀY?',
      text: 'Bạn nghĩ sao về cơ hội này? Hãy để lại bình luận bên dưới và theo dõi kênh nhé.',
      keywords: ['community discussion comments engagement call to action', 'social conversation']
    }
  ];

  const processedScenes = [];
  let totalAudioSeconds = 0;

  console.log(`\n🎙 Bước 1: Sinh giọng đọc VieNeu AI (${voice}) & Chấm điểm 4K bằng OpenAI CLIP cho 29 phân cảnh...`);
  for (let idx = 0; idx < scenes.length; idx++) {
    const scene = scenes[idx];
    console.log(`\n⏳ Đang xử lý phân cảnh ${idx + 1}/29: "${scene.headline}"...`);

    const ttsData = await generateTTSForScene({
      text: scene.text,
      voice,
      sceneId: scene.id
    });

    const mediaData = await fetchMediaForScene({
      keywords: scene.keywords,
      sceneIndex: idx,
      headline: scene.headline
    });

    const sec = ttsData.durationInFrames / 30;
    totalAudioSeconds += sec;

    processedScenes.push({
      ...scene,
      durationInFrames: ttsData.durationInFrames,
      audioUrl: ttsData.audioUrl,
      captions: ttsData.captions,
      mediaUrl: mediaData.mediaUrl,
      mediaList: mediaData.mediaList,
      mediaType: 'image'
    });
  }

  console.log(`\n📊 Tổng thời lượng video thực tế: ~${totalAudioSeconds.toFixed(1)} giây (29 phân cảnh)`);

  const projectProps = {
    title: 'Đề xuất ưu tiên tài sản mã hóa, tín chỉ carbon tại Trung tâm tài chính quốc tế',
    category: 'TÀI CHÍNH QUỐC TẾ',
    sourceName: 'VnExpress (19/8/2026)',
    sourceUrl: 'https://vnexpress.net',
    tickerText: 'Đề xuất ưu tiên 6 nhóm sản phẩm tại Trung tâm tài chính quốc tế TP.HCM và Đà Nẵng • Tài sản mã hóa & Tín chỉ carbon',
    primaryColor: '#00F2FE', // Cyan Tech / Fintech
    accentColor: '#FACC15', // Gold Growth
    scenes: processedScenes
  };

  console.log('\n⏳ Bước 2: Bắt đầu render video MP4 [TikTokViral] (29 Cảnh)...');
  const renderResult = await renderVideoMP4({
    compositionId: 'TikTokViral',
    inputProps: projectProps
  });

  console.log('\n🎉 VIDEO 29 PHÂN CẢNH ĐÃ ĐƯỢC TẠO THÀNH CÔNG!');
  console.log(`📁 File: ${renderResult.filePath}`);
  console.log(`⏱ Thời lượng: ~${totalAudioSeconds.toFixed(1)} giây`);
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
