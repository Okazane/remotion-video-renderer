const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');

const AUDIO_DIR = path.resolve('public/media/audio');
fs.mkdirSync(AUDIO_DIR, { recursive: true });

// Test toFile (sử dụng SSMLTemplate mặc định) với prosody
async function test() {
  const tts = new MsEdgeTTS();
  await tts.setMetadata('vi-VN-HoaiMyNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const text = 'Liên quan đến chuyến bay VN34 của Vietnam Airlines tại sân bay Munich, cơ trưởng đã đưa ra quyết định xử lý quan trọng khi nhận thấy chiều dài đường băng không còn đủ để dừng tàu bay an toàn.';

  // prosody thông qua built-in SSMLTemplate
  const dirPath = path.join(AUDIO_DIR, 'test_prosody_' + Date.now());
  fs.mkdirSync(dirPath, { recursive: true });

  const result = await tts.toFile(dirPath, text, {
    rate: '-5%',
    pitch: '+2Hz',
    volume: '+5%'
  });

  console.log('toFile result:', result);
  if (result && result.audioFilePath && fs.existsSync(result.audioFilePath)) {
    const stat = fs.statSync(result.audioFilePath);
    console.log('SUCCESS! File size:', stat.size, 'bytes');
    const meta = await mm.parseFile(result.audioFilePath);
    console.log('Duration:', meta.format.duration.toFixed(2), 's');
  }

  tts.close();
}

test().catch(e => console.error('ERROR:', e.message));
