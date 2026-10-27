import fs from 'fs';
import path from 'path';

/**
 * Script tạo file WAV nhạc nền Ambient / Lofi Drone nhẹ nhàng chuẩn 44.1kHz 16-bit stereo.
 * Tạo không gian âm thanh điện ảnh phía sau giọng đọc.
 */
const SAMPLE_RATE = 44100;
const DURATION_SEC = 30; // 30s loop
const NUM_SAMPLES = SAMPLE_RATE * DURATION_SEC;
const NUM_CHANNELS = 2;

const buffer = Buffer.alloc(44 + NUM_SAMPLES * NUM_CHANNELS * 2);

// WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + NUM_SAMPLES * NUM_CHANNELS * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
buffer.writeUInt16LE(NUM_CHANNELS, 22); // NumChannels
buffer.writeUInt32LE(SAMPLE_RATE, 24);  // SampleRate
buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * 2, 28); // ByteRate
buffer.writeUInt16LE(NUM_CHANNELS * 2, 32); // BlockAlign
buffer.writeUInt16LE(16, 34); // BitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(NUM_SAMPLES * NUM_CHANNELS * 2, 40);

// Chords: Dm9 (D3, F3, A3, C4, E4) - hợp âm điện ảnh bí ẩn, sâu lắng
const chords = [
  [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
  [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
  [116.54, 146.83, 174.61, 220.00, 261.63], // Bbmaj7
  [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
];

let offset = 44;
for (let i = 0; i < NUM_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  const chordIdx = Math.floor((t / (DURATION_SEC / chords.length))) % chords.length;
  const currentChord = chords[chordIdx];

  // Smooth crossfade between chords
  const chordTime = t % (DURATION_SEC / chords.length);
  const chordEnv = Math.sin((chordTime / (DURATION_SEC / chords.length)) * Math.PI);

  let leftSample = 0;
  let rightSample = 0;

  // Tổng hợp sóng sin êm dịu (warm ambient pad)
  currentChord.forEach((freq, idx) => {
    const lfo = 1 + 0.05 * Math.sin(2 * Math.PI * 0.2 * t + idx);
    const wave = Math.sin(2 * Math.PI * freq * lfo * t);
    const sub = 0.4 * Math.sin(2 * Math.PI * (freq * 0.5) * t); // sub harmonic
    const pan = (idx / (currentChord.length - 1)) * 0.6 + 0.2; // stereo spread

    const sample = (wave * 0.6 + sub) * (0.08 / currentChord.length) * chordEnv;
    leftSample += sample * (1 - pan);
    rightSample += sample * pan;
  });

  // Soft low-pulse kick / heartbeat (nhịp tim thời sự êm ái mỗi 2s)
  const pulseTime = t % 2.0;
  if (pulseTime < 0.2) {
    const pulseEnv = Math.exp(-pulseTime * 20);
    const pulseWave = Math.sin(2 * Math.PI * 55 * Math.exp(-pulseTime * 15) * pulseTime);
    const pulseVal = pulseWave * pulseEnv * 0.04;
    leftSample += pulseVal;
    rightSample += pulseVal;
  }

  // Soft master limiter
  leftSample = Math.max(-0.95, Math.min(0.95, leftSample));
  rightSample = Math.max(-0.95, Math.min(0.95, rightSample));

  const intL = Math.floor(leftSample * 32767);
  const intR = Math.floor(rightSample * 32767);

  buffer.writeInt16LE(intL, offset);
  buffer.writeInt16LE(intR, offset + 2);
  offset += 4;
}

const outDir = path.resolve('public/media/audio');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, 'bgm-ambient.wav');
fs.writeFileSync(outFile, buffer);
console.log('✔ Đã tạo file nhạc nền BGM Ambient thành công:', outFile);
