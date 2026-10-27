import 'dotenv/config';
import { generateTTSForScene } from './server/services/tts.js';
import { fetchMediaForScene } from './server/services/media.js';
import { renderVideoMP4 } from './server/services/renderer.js';

async function main() {
  const args = process.argv.slice(2);
  let voice = 'vieneu-minhduc'; // Mặc định dùng VieNeu-TTS (Nam Bắc Tin Tức Dứt Khoát 48kHz)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--voice' && args[i + 1]) voice = args[++i];
  }

  console.log(`🚀 Bắt đầu render Video Thị Trường Vàng (9 Phân cảnh) với giọng: [${voice}]...`);

  const goldScenes = [
    {
      id: 'scene-1',
      sceneIndex: 0,
      headline: 'VÀNG ĐANG HẠ NHIỆT!',
      text: 'Vàng vừa quay đầu giảm mạnh! SJC và vàng nhẫn đồng loạt mất tới 1,6 triệu đồng mỗi lượng. Chuyện gì đang xảy ra?',
      keywords: ['gold bullion price drop crash market', 'gold SJC']
    },
    {
      id: 'scene-2',
      sceneIndex: 1,
      headline: 'SJC: 139,7 - 142,7 TRIỆU',
      text: 'Cập nhật chiều 19 tháng 8, giá vàng miếng SJC phổ biến được các doanh nghiệp đưa về khoảng 139,7 triệu đồng mua vào và 142,7 triệu đồng bán ra. So với phiên trước, cả hai chiều cùng giảm tới 1,6 triệu đồng một lượng.',
      keywords: ['gold bar finance trade money market', 'bullion SJC']
    },
    {
      id: 'scene-3',
      sceneIndex: 2,
      headline: 'DOJI, PNJ, PHÚ QUÝ ĐỒNG LOẠT GIẢM',
      text: 'Đáng chú ý, đây không phải câu chuyện riêng của SJC. DOJI, PNJ, Phú Quý, Bảo Tín Minh Châu và nhiều thương hiệu khác cũng điều chỉnh giảm khoảng 1,6 triệu đồng mỗi lượng.',
      keywords: ['gold store jewelry finance trading', 'gold price change']
    },
    {
      id: 'scene-4',
      sceneIndex: 3,
      headline: 'VÀNG NHẪN 9999 ĐIỀU CHỈNH',
      text: 'Vàng nhẫn bốn số chín cũng chịu áp lực điều chỉnh. Nhiều thương hiệu giảm mạnh, có nơi mức giảm lên tới hàng triệu đồng mỗi lượng. Trước đó, trong phiên sáng, vàng nhẫn cao nhất vẫn quanh 145,6 triệu đồng một lượng, nhưng sau đó thị trường tiếp tục điều chỉnh.',
      keywords: ['gold ring 9999 jewelry market rate', 'gold investment']
    },
    {
      id: 'scene-5',
      sceneIndex: 4,
      headline: 'NGUYÊN NHÂN TỪ THẾ GIỚI & FED',
      text: 'Nguyên nhân chính đến từ thị trường vàng thế giới. Giá vàng quốc tế đã có thời điểm rơi xuống quanh 4.335 đến 4.340 USD một ounce. Áp lực đến từ lợi suất trái phiếu Mỹ tăng, giá dầu tăng và tâm lý thận trọng của nhà đầu tư khi chờ thêm tín hiệu từ Fed.',
      keywords: ['federal reserve us dollar gold global economy', 'bond yield market']
    },
    {
      id: 'scene-6',
      sceneIndex: 5,
      headline: 'VÀNG THẾ GIỚI ĐANG RUNG LẮC',
      text: 'Tuy nhiên, đừng vội nghĩ vàng đã bước vào một chu kỳ giảm sâu. Bởi ngay trong chiều nay, giá vàng thế giới đã có lúc hồi phục khoảng 30 USD một ounce. Điều này cho thấy thị trường hiện vẫn cực kỳ nhạy cảm với các thông tin kinh tế và chính sách tiền tệ.',
      keywords: ['global market chart stock volatility bounce', 'gold rebound']
    },
    {
      id: 'scene-7',
      sceneIndex: 6,
      headline: 'CHÊNH LỆCH ĐẾN 6,4 TRIỆU ĐỒNG',
      text: 'Một điểm nhà đầu tư cũng cần lưu ý là khoảng cách giữa giá vàng trong nước và thế giới vẫn ở mức đáng kể. Có thời điểm chênh lệch vàng miếng trong nước so với giá quy đổi quốc tế lên khoảng 6,4 triệu đồng một lượng.',
      keywords: ['currency exchange money spread financial calculation', 'gold premium']
    },
    {
      id: 'scene-8',
      sceneIndex: 7,
      headline: 'CÓ NÊN BẮT ĐÁY LÚC NÀY?',
      text: 'Vậy đây có phải thời điểm bắt đáy? Chưa thể khẳng định. Vàng thế giới vẫn đang biến động mạnh, trong khi giá trong nước có thể điều chỉnh rất nhanh theo diễn biến quốc tế. Nhà đầu tư không nên FOMO hay tất tay lúc này.',
      keywords: ['investor risk strategy caution analysis', 'gold trading advice']
    },
    {
      id: 'scene-9',
      sceneIndex: 8,
      headline: 'ĐIỀU CHỈNH HAY ĐẢO CHIỀU?',
      text: 'Tóm lại, vàng trong nước đang hạ nhiệt rõ rệt, SJC và vàng nhẫn đồng loạt giảm mạnh, nhưng vàng thế giới vẫn đang rung lắc. Bạn nghĩ vàng sẽ tăng lại hay tiếp tục giảm? Hãy bình luận mức giá bạn đang chờ bên dưới và theo dõi kênh nhé.',
      keywords: ['community discussion comments gold trend analysis', 'gold market debate']
    }
  ];

  const processedScenes = [];
  let totalAudioSeconds = 0;

  console.log(`\n🎙 Bước 1: Sinh giọng đọc chuẩn 100% tiếng Việt (${voice}) & Chọn ảnh 4K bằng CLIP...`);
  for (let idx = 0; idx < goldScenes.length; idx++) {
    const scene = goldScenes[idx];
    console.log(`\n⏳ Đang xử lý phân cảnh ${idx + 1}/9: "${scene.headline}"...`);

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

  console.log(`\n📊 Tổng thời lượng video thực tế: ~${totalAudioSeconds.toFixed(1)} giây (9 phân cảnh)`);

  const projectProps = {
    title: 'Vàng trong nước hạ nhiệt – SJC và vàng nhẫn đồng loạt giảm mạnh',
    category: 'TÀI CHÍNH',
    sourceName: 'Cập nhật chiều 19/8/2026',
    sourceUrl: 'https://vnexpress.net',
    tickerText: 'Giá vàng SJC và vàng nhẫn 9999 đồng loạt giảm tới 1,6 triệu đồng/lượng • Vàng thế giới biến động quanh 4.335 USD/ounce',
    primaryColor: '#FACC15',
    accentColor: '#FF3B30',
    scenes: processedScenes
  };

  console.log('\n⏳ Bước 2: Bắt đầu render video MP4 [TikTokViral]...');
  const renderResult = await renderVideoMP4({
    compositionId: 'TikTokViral',
    inputProps: projectProps
  });

  console.log('\n🎉 VIDEO THỊ TRƯỜNG VÀNG ĐÃ ĐƯỢC TẠO THÀNH CÔNG!');
  console.log(`📁 File: ${renderResult.filePath}`);
  console.log(`⏱ Thời lượng: ~${totalAudioSeconds.toFixed(1)} giây`);
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
