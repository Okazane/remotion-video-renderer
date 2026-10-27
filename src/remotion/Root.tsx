import React from 'react';
import { Composition } from 'remotion';
import { ShortNewsTemplate } from './templates/ShortNewsTemplate.tsx';
import { TikTokViralTemplate } from './templates/TikTokViralTemplate.tsx';
import { BreakingNewsTemplate } from './templates/BreakingNewsTemplate.tsx';
import { NewsRoundupTemplate } from './templates/NewsRoundupTemplate.tsx';
import { ExplainerTemplate } from './templates/ExplainerTemplate.tsx';
import { VideoProjectProps } from './types.ts';

// ============================================================
// Default props dùng để preview trong Remotion Studio
// ============================================================
export const defaultMockProject: VideoProjectProps = {
  title: 'Bản Tin Chuyển Đổi Số Và Công Nghệ AI 2026',
  category: 'CÔNG NGHỆ',
  sourceName: 'VnExpress & Dân Trí',
  sourceUrl: 'https://vnexpress.net',
  tickerText: 'Trí tuệ nhân tạo tiếp tục tạo đột phá trong quy trình sản xuất nội dung số',
  primaryColor: '#0284C7',
  accentColor: '#38BDF8',
  scenes: [
    {
      id: 'scene-1',
      sceneIndex: 0,
      headline: 'Đột phá mới trong công nghệ AI',
      text: 'Công nghệ trí tuệ nhân tạo đang giúp các nhà sáng tạo nội dung rút ngắn đáng kể thời gian biên tập.',
      durationInFrames: 180,
      mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=80',
      mediaList: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=80'],
      mediaType: 'image',
      captions: [
        { word: 'Công', start: 0.2, end: 0.5 }, { word: 'nghệ', start: 0.5, end: 0.8 },
        { word: 'AI', start: 0.8, end: 1.2 }, { word: 'đang', start: 1.2, end: 1.5 },
        { word: 'thay', start: 1.5, end: 1.8 }, { word: 'đổi', start: 1.8, end: 2.2 },
        { word: 'mọi', start: 2.2, end: 2.5 }, { word: 'thứ.', start: 2.5, end: 3.0 }
      ]
    },
    {
      id: 'scene-2',
      sceneIndex: 1,
      headline: 'Tối ưu hóa quy trình video ngắn',
      text: 'Các nội dung tin tức được tóm lược bằng văn phong chuẩn mực và trích dẫn nguồn minh bạch.',
      durationInFrames: 180,
      mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&auto=format&fit=crop&q=80',
      mediaList: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&auto=format&fit=crop&q=80'],
      mediaType: 'image',
      captions: [
        { word: 'Nội', start: 0.2, end: 0.5 }, { word: 'dung', start: 0.5, end: 0.8 },
        { word: 'tin', start: 0.8, end: 1.1 }, { word: 'tức', start: 1.1, end: 1.4 },
        { word: 'được', start: 1.4, end: 1.7 }, { word: 'viết', start: 1.7, end: 2.0 },
        { word: 'lại', start: 2.0, end: 2.4 }, { word: 'chuẩn', start: 2.4, end: 2.8 },
        { word: 'mực.', start: 2.8, end: 3.2 }
      ]
    }
  ]
};

// Tính tổng số frame động từ inputProps
const calcTotalFrames = (props: VideoProjectProps): number => {
  if (!props.scenes || props.scenes.length === 0) return 540;
  return props.scenes.reduce((acc, s) => acc + (s.durationInFrames || 180), 0);
};

const calculateMetadata = ({ props }: { props: VideoProjectProps }) => {
  const durationInFrames = calcTotalFrames(props);
  return { durationInFrames };
};

export const RemotionRoot: React.FC = () => {
  const previewFrames = calcTotalFrames(defaultMockProject);

  return (
    <>
      {/* 1. Short News Template (9:16 - 1080x1920) — TikTok / Reels / Shorts Chuẩn Báo Chí */}
      <Composition
        id="ShortNews"
        component={ShortNewsTemplate as any}
        durationInFrames={previewFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultMockProject as any}
        calculateMetadata={calculateMetadata as any}
      />

      {/* 2. TikTok Viral Template (9:16 - 1080x1920) — Alex Hormozi / MrBeast Style Nổi Bật */}
      <Composition
        id="TikTokViral"
        component={TikTokViralTemplate as any}
        durationInFrames={previewFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          ...defaultMockProject,
          primaryColor: '#FACC15',
          accentColor: '#00F2FE'
        } as any}
        calculateMetadata={calculateMetadata as any}
      />

      {/* 3. Breaking News Pro (9:16 - 1080x1920) — Thời Sự Tin Nóng Truyền Hình */}
      <Composition
        id="BreakingNews"
        component={BreakingNewsTemplate as any}
        durationInFrames={previewFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          ...defaultMockProject,
          primaryColor: '#DC2626',
          accentColor: '#FACC15'
        } as any}
        calculateMetadata={calculateMetadata as any}
      />

      {/* 4. News Roundup Broadcast Template (16:9 - 1920x1080) — YouTube / TV */}
      <Composition
        id="NewsRoundup"
        component={NewsRoundupTemplate as any}
        durationInFrames={previewFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultMockProject as any}
        calculateMetadata={calculateMetadata as any}
      />

      {/* 5. Explainer Template (9:16 - 1080x1920) — Documentary / Phóng Sự */}
      <Composition
        id="ExplainerShort"
        component={ExplainerTemplate as any}
        durationInFrames={previewFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultMockProject as any}
        calculateMetadata={calculateMetadata as any}
      />
    </>
  );
};
