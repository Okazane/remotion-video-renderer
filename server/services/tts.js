import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import axios from 'axios';
import { normalizeAudio } from './media_processor.js';

const require = createRequire(import.meta.url);
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const mm = require('music-metadata');

const AUDIO_DIR = path.resolve('public/media/audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const PYTHON_PATH = path.resolve('tts_env/Scripts/python.exe');
const VIENEU_SCRIPT = path.resolve('server/services/vieneu_service.py');

// ─── DANH SÁCH GIỌNG ĐỌC HỖ TRỢ ───────────────────────────────────────────
export const VOICES = {
  // 🌟 VIENEU-TTS (Mô hình Local AI 48kHz — Ngữ điệu tự nhiên, bổng trầm như người thật)
  'vieneu-minhduc': {
    name: 'VieNeu - Minh Đức (Nam Bắc - Tin tức dứt khoát, ngữ điệu chuẩn)',
    provider: 'vieneu',
    voiceName: 'Minh Đức'
  },
  'vieneu-trucly': {
    name: 'VieNeu - Trúc Ly (Nữ Bắc - Tự nhiên, truyền cảm)',
    provider: 'vieneu',
    voiceName: 'Trúc Ly'
  },
  'vieneu-maianh': {
    name: 'VieNeu - Mai Anh (Nữ Bắc - Tin tức thời sự)',
    provider: 'vieneu',
    voiceName: 'Mai Anh'
  },
  'vieneu-phamtuyen': {
    name: 'VieNeu - Phạm Tuyên (Nam Bắc - Tự nhiên, đời thường)',
    provider: 'vieneu',
    voiceName: 'Phạm Tuyên'
  },
  'vieneu-thaison': {
    name: 'VieNeu - Thái Sơn (Nam Nam - Kể chuyện cuốn hút)',
    provider: 'vieneu',
    voiceName: 'Thái Sơn'
  },
  'vieneu-thuydung': {
    name: 'VieNeu - Thùy Dung (Nữ Nam - Tin tức miền Nam)',
    provider: 'vieneu',
    voiceName: 'Thùy Dung'
  },

  // 🇻🇳 EDGE NEURAL TTS (Bản địa hóa 100% chuẩn dấu)
  'vi-VN-HoaiMyNeural': {
    name: 'Hoài My (Edge-TTS Nữ BTV Thời Sự)',
    provider: 'edge',
    edgeName: 'vi-VN-HoaiMyNeural',
    defaultProfile: 'expressive'
  },
  'vi-VN-NamMinhNeural': {
    name: 'Nam Minh (Edge-TTS Nam BTV Truyền Hình)',
    provider: 'edge',
    edgeName: 'vi-VN-NamMinhNeural',
    defaultProfile: 'formal'
  },

  // 🌟 ELEVENLABS AI VOICES
  'elevenlabs-sarah': {
    name: 'ElevenLabs - Sarah (Nữ - Truyền cảm)',
    provider: 'elevenlabs',
    voiceId: 'EXAVITQu4vr4xnSDxMaL'
  },
  'elevenlabs-george': {
    name: 'ElevenLabs - George (Nam - Trầm ấm)',
    provider: 'elevenlabs',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb'
  }
};

export const VOICE_PROFILES = {
  expressive: { rate: '-4%', pitch: '+1Hz', volume: '+12%' },
  formal: { rate: '-3%', pitch: '+0Hz', volume: '+14%' },
  dramatic: { rate: '-1%', pitch: '+3Hz', volume: '+15%' },
  storytelling: { rate: '-6%', pitch: '-1Hz', volume: '+10%' },
  standard: { rate: '-3%', pitch: '+0Hz', volume: '+12%' }
};

/**
 * Chuẩn hóa văn bản tiếng Việt
 */
function normalizeTextForTTS(text) {
  return text
    .replace(/—/g, ', ')
    .replace(/…/g, '...')
    .replace(/\s*([,.;?!])\s*/g, '$1 ')
    .replace(/V1/gi, 'Vê một')
    .replace(/VN34/gi, 'Vê Nờ 34')
    .replace(/SJC/gi, 'Ét Giê Cê')
    .replace(/DOJI/gi, 'Đô di')
    .replace(/PNJ/gi, 'Pê En Gi')
    .replace(/BTMC/gi, 'Bảo Tín Minh Châu')
    .replace(/9999/g, 'bốn số chín')
    .replace(/USD/gi, 'đô la Mỹ')
    .replace(/Fed/g, 'Phét')
    .replace(/FOMO/gi, 'phô mô')
    .replace(/18 tháng/gi, 'mười tám tháng')
    .replace(/24 tháng/gi, 'hai mươi tư tháng')
    .replace(/19 tháng 8/gi, 'mười chín tháng tám')
    .replace(/1,6 triệu/gi, 'một phẩy sáu triệu')
    .replace(/139,7/gi, 'một trăm ba mươi chín phẩy bảy')
    .replace(/142,7/gi, 'một trăm bốn mươi hai phẩy bảy')
    .replace(/145,6/gi, 'một trăm bốn mươi lăm phẩy sáu')
    .replace(/6,4 triệu/gi, 'sáu phẩy bốn triệu')
    .replace(/4\.335/gi, 'bốn nghìn ba trăm ba mươi lăm')
    .replace(/4\.340/gi, 'bốn nghìn ba trăm bốn mươi')
    .replace(/TP\s*HCM|TP\.HCM/gi, 'Thành phố Hồ Chí Minh')
    .replace(/19\/8/g, 'mười chín tháng tám')
    .replace(/21\/8/g, 'hai mươi mốt tháng tám')
    .replace(/FTSE Russell/gi, 'Ép Tê Ét E Rớt-sô')
    .replace(/Fintech/gi, 'Fin-tếch')
    .replace(/BĐS/gi, 'bất động sản')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Gọi VieNeu-TTS (Python On-Device CPU ONNX)
 */
async function generateVieNeuTTS({ text, voiceName, finalFilePath }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      text,
      voice: voiceName || 'Minh Đức',
      output: finalFilePath
    });

    execFile(
      PYTHON_PATH,
      [VIENEU_SCRIPT, payload],
      { maxBuffer: 1024 * 1024 * 10, timeout: 45000 },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(stderr || error.message));
        }
        try {
          // Lấy dòng JSON cuối cùng trong stdout
          const lines = stdout.trim().split('\n');
          const jsonLine = lines[lines.length - 1];
          const result = JSON.parse(jsonLine);
          if (!result.success) {
            return reject(new Error(result.error || 'Lỗi sinh VieNeu'));
          }
          resolve(result);
        } catch (e) {
          reject(new Error(`Parse output thất bại: ${stdout}`));
        }
      }
    );
  });
}

/**
 * Gọi ElevenLabs TTS API
 */
async function generateElevenLabsTTS({ text, voiceId, apiKey, finalFilePath }) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'EXAVITQu4vr4xnSDxMaL'}`;
  const response = await axios.post(
    url,
    {
      text,
      model_id: 'eleven_flash_v2_5',
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.8
      }
    },
    {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg'
      },
      responseType: 'arraybuffer',
      timeout: 30000
    }
  );

  fs.writeFileSync(finalFilePath, Buffer.from(response.data));
  return finalFilePath;
}

/**
 * Gọi Edge TTS
 */
async function generateEdgeTTS({ text, voiceName, prosody, attemptDir, finalFilePath }) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const result = await tts.toFile(attemptDir, text, {
    rate: prosody.rate,
    pitch: prosody.pitch,
    volume: prosody.volume
  });

  try { tts.close(); } catch {}

  if (!result || !result.audioFilePath || !fs.existsSync(result.audioFilePath)) {
    throw new Error('Không nhận được audio từ Edge TTS');
  }

  fs.copyFileSync(result.audioFilePath, finalFilePath);
  return finalFilePath;
}

/**
 * MAIN TTS DISPATCHER — Hỗ trợ VieNeu-TTS, Edge-TTS, ElevenLabs
 */
export async function generateTTSForScene({
  text,
  voice = 'vieneu-minhduc', // Mặc định dùng VieNeu-TTS (Ngữ điệu tự nhiên)
  profile = null,
  sceneId = 'scene-1'
}) {
  const voiceConfig = VOICES[voice] || VOICES['vieneu-minhduc'] || VOICES['vi-VN-HoaiMyNeural'];
  const normalizedText = normalizeTextForTTS(text);

  const timestamp = Date.now();
  const ext = voiceConfig.provider === 'vieneu' ? 'wav' : 'mp3';
  const finalFilePath = path.join(AUDIO_DIR, `${sceneId}-${timestamp}.${ext}`);
  const audioUrl = `/media/audio/${path.basename(finalFilePath)}`;

  // ── TH1: VIENEU-TTS (Mô hình Local AI 48kHz — Ngữ điệu tự nhiên nhất) ──────
  if (voiceConfig.provider === 'vieneu' && fs.existsSync(PYTHON_PATH)) {
    try {
      console.log(`🎙 Đang sinh giọng đọc VieNeu AI (${voiceConfig.name})...`);
      const res = await generateVieNeuTTS({
        text: normalizedText,
        voiceName: voiceConfig.voiceName,
        finalFilePath
      });

      const durationSeconds = res.duration || Math.max(5, text.split(/\s+/).length * 0.35);
      const durationInFrames = Math.round(durationSeconds * 30);

      console.log(`✔ VieNeu TTS (${voiceConfig.name}): ${durationSeconds.toFixed(2)}s (${durationInFrames} frames)`);

      // Chuẩn hóa âm lượng EBU R128 bằng FFmpeg
      await normalizeAudio(finalFilePath, finalFilePath);

      return {
        success: true,
        audioUrl,
        filePath: finalFilePath,
        durationInFrames,
        captions: buildWordTimestamps(text, durationSeconds)
      };
    } catch (err) {
      console.warn(`⚠ VieNeu TTS lỗi (${err.message}), chuyển sang fallback Edge TTS...`);
    }
  }

  // ── TH2: ELEVENLABS ───────────────────────────────────────────────────────
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (voiceConfig.provider === 'elevenlabs' && elevenKey) {
    try {
      console.log(`🎙 Đang sinh giọng đọc ElevenLabs AI (${voiceConfig.name})...`);
      await generateElevenLabsTTS({
        text: normalizedText,
        voiceId: voiceConfig.voiceId || 'EXAVITQu4vr4xnSDxMaL',
        apiKey: elevenKey,
        finalFilePath
      });

      const metadata = await mm.parseFile(finalFilePath);
      const durationSeconds = metadata.format.duration || Math.max(5, text.split(/\s+/).length * 0.35);
      const durationInFrames = Math.round(durationSeconds * 30);

      console.log(`✔ ElevenLabs TTS (${voiceConfig.name}): ${durationSeconds.toFixed(2)}s`);
      return {
        success: true,
        audioUrl,
        filePath: finalFilePath,
        durationInFrames,
        captions: buildWordTimestamps(text, durationSeconds)
      };
    } catch (err) {
      console.warn(`⚠ ElevenLabs TTS lỗi (${err.message}), chuyển sang fallback Edge TTS...`);
    }
  }

  // ── TH3: EDGE TTS (Fallback) ─────────────────────────────────────────────
  const activeProfile = profile || voiceConfig.defaultProfile || 'expressive';
  const prosody = VOICE_PROFILES[activeProfile] || VOICE_PROFILES.expressive;
  const tempDir = path.join(AUDIO_DIR, `tmp-${sceneId}-${timestamp}`);

  const safeCleanupDir = (dir) => {
    try {
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
  };

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptDir = `${tempDir}-attempt${attempt}`;
    try {
      fs.mkdirSync(attemptDir, { recursive: true });

      const edgeVoiceName = voiceConfig.edgeName || 'vi-VN-HoaiMyNeural';
      await generateEdgeTTS({
        text: normalizedText,
        voiceName: edgeVoiceName,
        prosody,
        attemptDir,
        finalFilePath
      });

      safeCleanupDir(attemptDir);

      const metadata = await mm.parseFile(finalFilePath);
      const durationSeconds = metadata.format.duration || Math.max(5, text.split(/\s+/).length * 0.35);
      const durationInFrames = Math.round(durationSeconds * 30);

      console.log(`✔ Edge TTS (${voiceConfig.name}): ${durationSeconds.toFixed(2)}s`);

      return {
        success: true,
        audioUrl,
        filePath: finalFilePath,
        durationInFrames,
        captions: buildWordTimestamps(text, durationSeconds)
      };
    } catch (err) {
      safeCleanupDir(attemptDir);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }
  }

  // Fallback an toàn
  const words = text.trim().split(/\s+/).filter(Boolean);
  const durationSeconds = Math.max(6, words.length * 0.35);
  return {
    success: false,
    audioUrl: '',
    durationInFrames: Math.round(durationSeconds * 30),
    captions: buildWordTimestamps(text, durationSeconds)
  };
}

function buildWordTimestamps(text, totalDurationSeconds) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const availableTime = Math.max(0.5, totalDurationSeconds - 0.25);
  const totalChars = words.reduce((acc, w) => acc + w.length, 0);

  let currentSec = 0.1;
  return words.map((w) => {
    const proportion = w.length / (totalChars || 1);
    const wordDuration = Math.max(0.14, proportion * availableTime);
    const start = parseFloat(currentSec.toFixed(2));
    const end = parseFloat((currentSec + wordDuration).toFixed(2));
    currentSec += wordDuration + 0.015;
    return { word: w, start, end };
  });
}
