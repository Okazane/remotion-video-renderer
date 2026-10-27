import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';

const FFMPEG_PATH = path.resolve(
  'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
);

/**
 * Chuẩn hóa âm lượng giọng đọc chuẩn truyền hình / TikTok (EBU R128 Loudness Normalization)
 */
export async function normalizeAudio(inputAudioPath, outputAudioPath) {
  if (!fs.existsSync(FFMPEG_PATH) || !fs.existsSync(inputAudioPath)) {
    return inputAudioPath;
  }

  const isSameFile = !outputAudioPath || outputAudioPath === inputAudioPath;
  const tempTarget = `${inputAudioPath}.norm.tmp.wav`;
  const finalTarget = outputAudioPath || inputAudioPath;

  return new Promise((resolve) => {
    // Bộ lọc loudnorm: -16 LUFS (chuẩn podcast/mobile), True Peak -1.5 dB
    const args = [
      '-y',
      '-i',
      inputAudioPath,
      '-af',
      'loudnorm=I=-16:TP=-1.5:LRA=11',
      '-ar',
      '48000',
      tempTarget
    ];

    execFile(FFMPEG_PATH, args, (error) => {
      if (error) {
        console.warn('⚠ FFmpeg normalize audio lỗi, dùng file gốc:', error.message);
        return resolve(inputAudioPath);
      }
      try {
        if (fs.existsSync(tempTarget)) {
          if (isSameFile) {
            fs.copyFileSync(tempTarget, finalTarget);
            fs.unlinkSync(tempTarget);
          } else if (tempTarget !== finalTarget) {
            fs.renameSync(tempTarget, finalTarget);
          }
          return resolve(finalTarget);
        }
      } catch (err) {
        console.warn('⚠ Lỗi rename file audio:', err.message);
      }
      resolve(inputAudioPath);
    });
  });
}

/**
 * Tiền xử lý ảnh ngang sang tỷ lệ 9:16 Full HD (1080x1920) siêu nét bằng FFmpeg
 */
export async function smartCropImage(inputImagePath, outputImagePath) {
  if (!fs.existsSync(FFMPEG_PATH) || !fs.existsSync(inputImagePath)) {
    return inputImagePath;
  }

  return new Promise((resolve) => {
    const args = [
      '-y',
      '-i',
      inputImagePath,
      '-vf',
      'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
      '-q:v',
      '2',
      outputImagePath
    ];

    execFile(FFMPEG_PATH, args, (error) => {
      if (error) {
        return resolve(inputImagePath);
      }
      resolve(outputImagePath);
    });
  });
}
