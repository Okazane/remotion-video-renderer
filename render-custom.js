import 'dotenv/config';
import { generateTTSForScene } from './server/services/tts.js';
import { fetchMediaForScene } from './server/services/media.js';
import { renderVideoMP4 } from './server/services/renderer.js';

async function main() {
  const args = process.argv.slice(2);
  let voice = 'vieneu-minhduc'; // Mặc định dùng VieNeu-TTS (48kHz Local AI - Ngữ điệu tự nhiên)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--voice' && args[i + 1]) voice = args[++i];
  }

  console.log(`🚀 Bắt đầu render Video theo Kịch bản 6 Phân cảnh với giọng: [${voice}]...`);

  const customScenes = [
    {
      id: 'scene-1',
      sceneIndex: 0,
      headline: 'Mua đất để đó chờ tăng giá?',
      text: 'Bạn mua đất rồi để đó chờ giá tăng, liệu sắp tới có thể phải trả thêm tiền chỉ vì không sử dụng đất? Đây không còn là câu chuyện riêng của thị trường, mà đang được đặt lên bàn nghị sự khi sửa Luật Đất đai.',
      keywords: ['land property investment real estate', 'money']
    },
    {
      id: 'scene-2',
      sceneIndex: 1,
      headline: 'Đề xuất đánh thuế găm đất',
      text: 'Chính phủ đang định hướng sử dụng chính sách thuế và công cụ tài chính để hạn chế đầu cơ, găm giữ và bỏ hoang đất. Nói đơn giản, nếu giữ đất chỉ để chờ tăng giá mà không đưa vào sử dụng, chi phí để ôm đất sẽ tăng lên.',
      keywords: ['real estate tax finance house', 'property calculation']
    },
    {
      id: 'scene-3',
      sceneIndex: 2,
      headline: 'Thuế lũy tiến và thu hồi',
      text: 'Với dự án chậm đưa đất vào sử dụng, dự thảo đề xuất nộp tiền theo hướng lũy tiến, tức là càng chậm thì chi phí càng tăng. Nếu vẫn không triển khai, Nhà nước có thể thu hồi đất. Đất nông nghiệp bỏ không 18 tháng, hoặc đất lâm nghiệp 24 tháng cũng có thể bị xem xét thu hồi.',
      keywords: ['land retrieval farm construction project', 'law property']
    },
    {
      id: 'scene-4',
      sceneIndex: 3,
      headline: 'Minh bạch giá và hạ tầng',
      text: 'Mục tiêu lớn là đưa đất vào sử dụng hiệu quả thay vì bị găm giữ chờ giá. Cách xác định giá đất sẽ dựa trên dữ liệu công khai, minh bạch để hạn chế giá ảo. Đồng thời, Nhà nước nghiên cứu điều tiết phần giá trị tăng thêm khi đất hưởng lợi từ quy hoạch và hạ tầng.',
      keywords: ['urban infrastructure city planning data', 'real estate development']
    },
    {
      id: 'scene-5',
      sceneIndex: 4,
      headline: 'Thay đổi cuộc chơi ôm đất',
      text: 'Quan trọng là chính sách phân biệt rõ giữa người sử dụng đất thực chất và người găm giữ đầu cơ. Đây mới là định hướng dự thảo, nhưng nếu được luật hóa, nó sẽ thay đổi hoàn toàn cách các nhà đầu tư tính toán việc ôm đất trong dài hạn.',
      keywords: ['investor strategy real estate market', 'finance economy']
    },
    {
      id: 'scene-6',
      sceneIndex: 5,
      headline: 'Ý kiến của bạn thế nào?',
      text: 'Vậy theo bạn, tăng chi phí với người găm giữ đất có giúp hạ nhiệt giá bất động sản, hay cuối cùng chi phí này lại bị cộng vào giá bán cho người mua nhà? Hãy để lại ý kiến của bạn ở phần bình luận bên dưới.',
      keywords: ['discussion comments community real estate', 'society housing']
    }
  ];

  const processedScenes = [];
  let totalAudioSeconds = 0;

  console.log(`\n🎙 Bước 1: Sinh giọng đọc chuẩn 100% tiếng Việt (${voice}) & Chọn ảnh Ultra-HD 4K...`);
  for (let idx = 0; idx < customScenes.length; idx++) {
    const scene = customScenes[idx];
    console.log(`\n⏳ Đang xử lý phân cảnh ${idx + 1}/6: "${scene.headline}"...`);

    const ttsData = await generateTTSForScene({
      text: scene.text,
      voice,
      sceneId: scene.id
    });

    const mediaData = await fetchMediaForScene({
      keywords: scene.keywords,
      sceneIndex: idx
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

  console.log(`\n📊 Tổng thời lượng video thực tế: ~${totalAudioSeconds.toFixed(1)} giây (6 phân cảnh)`);

  const projectProps = {
    title: 'Dùng thuế để hạn chế đầu cơ, găm giữ đất',
    category: 'BẤT ĐỘNG SẢN',
    sourceName: 'VnExpress & Sửa Luật Đất Đai',
    sourceUrl: 'https://vnexpress.net',
    tickerText: 'Đề xuất đánh thuế và công cụ tài chính đối với hành vi găm giữ, bỏ hoang đất đai',
    primaryColor: '#FFE600',
    accentColor: '#00F0FF',
    scenes: processedScenes
  };

  console.log('\n⏳ Bước 2: Bắt đầu render video MP4 [TikTokViral] (Trạm AI Captions)...');
  const renderResult = await renderVideoMP4({
    compositionId: 'TikTokViral',
    inputProps: projectProps
  });

  console.log('\n🎉 VIDEO HOÀN CHỈNH ĐÃ ĐƯỢC TẠO THÀNH CÔNG!');
  console.log(`📁 File: ${renderResult.filePath}`);
  console.log(`⏱ Thời lượng: ~${totalAudioSeconds.toFixed(1)} giây`);
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
