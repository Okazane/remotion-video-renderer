import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const RENDERS_DIR = path.resolve('public/renders');

if (!fs.existsSync(RENDERS_DIR)) {
  fs.mkdirSync(RENDERS_DIR, { recursive: true });
}

let bundledLocation = null;

export async function getOrBundleRemotion() {
  if (!bundledLocation) {
    const entryPoint = path.resolve('src/remotion/index.ts');
    console.log('Đang bundle Remotion Root tại:', entryPoint);
    bundledLocation = await bundle({
      entryPoint,
      // Đảm bảo tương thích với môi trường Node / React 18
      webpackOverride: (config) => config
    });
    console.log('Bundle Remotion thành công!');
  }
  return bundledLocation;
}

export async function renderVideoMP4({ compositionId = 'ShortNews', inputProps, onProgress }) {
  const bundleLocation = await getOrBundleRemotion();

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps
  });

  const outputFileName = `video-${Date.now()}.mp4`;
  const outputLocation = path.join(RENDERS_DIR, outputFileName);

  console.log(`Bắt đầu render [${compositionId}] -> ${outputLocation}`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation,
    inputProps,
    onProgress: ({ renderedFrames, totalFrames }) => {
      const progress = Math.round((renderedFrames / totalFrames) * 100);
      if (onProgress) onProgress(progress);
    }
  });

  console.log(`Render hoàn tất: ${outputLocation}`);

  return {
    success: true,
    fileName: outputFileName,
    videoUrl: `/renders/${outputFileName}`,
    filePath: outputLocation
  };
}
