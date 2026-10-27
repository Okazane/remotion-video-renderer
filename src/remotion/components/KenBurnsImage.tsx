import React from 'react';
import { Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export type CameraMovement =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left-zoom'
  | 'pan-right-zoom'
  | 'tilt-up-zoom';

interface KenBurnsImageProps {
  src?: string;
  mediaList?: string[];
  durationInFrames: number;
  movement?: CameraMovement;
  sceneIndex?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const KenBurnsImage: React.FC<KenBurnsImageProps> = ({
  src,
  mediaList = [],
  durationInFrames,
  movement,
  sceneIndex = 0,
  className = '',
  style = {}
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rawImages = (mediaList && mediaList.length > 0 ? mediaList : [src]).filter(Boolean) as string[];
  const images =
    rawImages.length > 0
      ? rawImages
      : ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1280&auto=format&fit=crop&q=80'];

  // Chọn kiểu chuyển động camera tự động dựa trên sceneIndex và imageIndex nếu không chỉ định
  const getMovement = (imgIdx: number): CameraMovement => {
    if (movement) return movement;
    const moves: CameraMovement[] = [
      'zoom-in',
      'pan-right-zoom',
      'zoom-out',
      'pan-left-zoom',
      'tilt-up-zoom'
    ];
    return moves[(sceneIndex * 2 + imgIdx) % moves.length];
  };

  // Tính toán hiệu ứng biến đổi hình ảnh (Transform Matrix) theo Camera Movement
  const computeTransform = (localFrame: number, localDuration: number, moveType: CameraMovement) => {
    const progress = Math.min(1, Math.max(0, localFrame / localDuration));

    switch (moveType) {
      case 'zoom-in': {
        const scale = interpolate(progress, [0, 1], [1.0, 1.18]);
        const translateY = interpolate(progress, [0, 1], [0, -15]);
        return `scale(${scale}) translateY(${translateY}px)`;
      }
      case 'zoom-out': {
        const scale = interpolate(progress, [0, 1], [1.2, 1.02]);
        const translateY = interpolate(progress, [0, 1], [-15, 0]);
        return `scale(${scale}) translateY(${translateY}px)`;
      }
      case 'pan-left-zoom': {
        const scale = interpolate(progress, [0, 1], [1.14, 1.18]);
        const translateX = interpolate(progress, [0, 1], [25, -25]);
        return `scale(${scale}) translateX(${translateX}px)`;
      }
      case 'pan-right-zoom': {
        const scale = interpolate(progress, [0, 1], [1.14, 1.18]);
        const translateX = interpolate(progress, [0, 1], [-25, 25]);
        return `scale(${scale}) translateX(${translateX}px)`;
      }
      case 'tilt-up-zoom': {
        const scale = interpolate(progress, [0, 1], [1.12, 1.18]);
        const translateY = interpolate(progress, [0, 1], [20, -20]);
        return `scale(${scale}) translateY(${translateY}px)`;
      }
      default: {
        const scale = interpolate(progress, [0, 1], [1.0, 1.15]);
        return `scale(${scale})`;
      }
    }
  };

  // Flash cut chuyển cảnh nhẹ (chớp sáng 5 frame) khi phân cảnh mới bắt đầu
  const sceneFlash = interpolate(frame, [0, 5], [0.35, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  // Trường hợp chỉ có 1 ảnh duy nhất
  if (images.length === 1) {
    const currentMove = getMovement(0);
    const transform = computeTransform(frame, durationInFrames, currentMove);

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#020617',
          ...style
        }}
        className={className}
      >
        {/* Tầng 1: Blurred Ambient Background (Lấp đầy toàn khung) */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '120%',
            height: '120%',
            filter: 'blur(30px) brightness(0.35)',
            zIndex: 1
          }}
        >
          <Img src={images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Tầng 2: Main Image with Dynamic Ken Burns */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2
          }}
        >
          <Img
            src={images[0]}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform,
              transformOrigin: 'center center',
              willChange: 'transform'
            }}
          />
        </div>

        {/* Tầng 3: Flash Cut Transition */}
        {sceneFlash > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#FFFFFF',
              opacity: sceneFlash,
              zIndex: 10,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    );
  }

  // Trường hợp chuyển tiếp giữa nhiều ảnh trong 1 phân cảnh
  const framesPerImage = Math.floor(durationInFrames / images.length);
  const transitionDuration = 16; // 16 frames = ~0.53s mượt mà

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#020617',
        ...style
      }}
      className={className}
    >
      {images.map((imgUrl, idx) => {
        const startFrame = idx * framesPerImage;
        const endFrame = idx === images.length - 1 ? durationInFrames : (idx + 1) * framesPerImage;

        // Bỏ qua render nếu ngoài khung hiển thị
        if (frame < startFrame - transitionDuration || frame > endFrame + transitionDuration) {
          return null;
        }

        // Tính Opacity hòa tan (Cross-dissolve)
        let opacity = 1;
        if (idx > 0 && frame >= startFrame && frame <= startFrame + transitionDuration) {
          opacity = interpolate(frame, [startFrame, startFrame + transitionDuration], [0, 1], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp'
          });
        } else if (idx < images.length - 1 && frame >= endFrame - transitionDuration && frame <= endFrame) {
          opacity = interpolate(frame, [endFrame - transitionDuration, endFrame], [1, 0], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp'
          });
        }

        const localFrame = Math.max(0, frame - startFrame);
        const localDuration = endFrame - startFrame;
        const currentMove = getMovement(idx);
        const transform = computeTransform(localFrame, localDuration, currentMove);

        // Flash cut nhẹ giữa các ảnh con
        const imgFlash =
          idx > 0 && frame >= startFrame && frame <= startFrame + 4
            ? interpolate(frame, [startFrame, startFrame + 4], [0.3, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              })
            : 0;

        return (
          <React.Fragment key={`${imgUrl}-${idx}`}>
            {/* Tầng 1: Blurred Ambient Background */}
            <div
              style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '120%',
                height: '120%',
                filter: 'blur(30px) brightness(0.35)',
                opacity,
                zIndex: idx + 1
              }}
            >
              <Img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* Tầng 2: Main Image with Multi-direction Pan & Zoom */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity,
                zIndex: idx + 2
              }}
            >
              <Img
                src={imgUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform,
                  transformOrigin: 'center center',
                  willChange: 'transform'
                }}
              />
            </div>

            {/* Tầng 3: Flash Cut giữa các ảnh */}
            {imgFlash > 0.01 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  opacity: imgFlash,
                  zIndex: 20,
                  pointerEvents: 'none'
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Flash cut khi mở đầu phân cảnh */}
      {sceneFlash > 0.01 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#FFFFFF',
            opacity: sceneFlash,
            zIndex: 30,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};
