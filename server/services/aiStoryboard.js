export async function generateStoryboard({ rewrittenData, sourceName, leadImage = '' }) {
  const storyScenes = rewrittenData.storyScenes || [];

  if (storyScenes.length > 0) {
    return {
      title: rewrittenData.rewrittenTitle,
      category: rewrittenData.category || 'CẬP NHẬT',
      sourceName,
      tickerText: `Thông tin tham khảo từ ${sourceName} • ${rewrittenData.rewrittenTitle}`,
      scenes: storyScenes.map((s, idx) => {
        const words = s.text.split(/\s+/).length;
        const durationSeconds = Math.max(5.0, words * 0.38 + 1.5);
        const durationInFrames = Math.round(durationSeconds * 30);

        return {
          id: `scene-${idx + 1}`,
          sceneIndex: idx,
          headline: s.headline,
          text: s.text,
          durationInFrames,
          mediaUrl: idx === 0 && leadImage ? leadImage : '',
          mediaType: 'image',
          imageKeywords: s.keywords || ['news', 'event'],
          captions: []
        };
      })
    };
  }

  // Dự phòng nếu không có storyScenes
  const points = rewrittenData.keyPoints || [rewrittenData.summary, rewrittenData.fullRewrittenScript];
  return {
    title: rewrittenData.rewrittenTitle,
    category: rewrittenData.category || 'CẬP NHẬT',
    sourceName,
    tickerText: `Thông tin tham khảo từ ${sourceName} • ${rewrittenData.rewrittenTitle}`,
    scenes: points.map((p, idx) => ({
      id: `scene-${idx + 1}`,
      sceneIndex: idx,
      headline: `Thông tin chi tiết ${idx + 1}`,
      text: p,
      durationInFrames: 180,
      mediaUrl: idx === 0 && leadImage ? leadImage : '',
      mediaType: 'image',
      imageKeywords: ['news', 'event'],
      captions: []
    }))
  };
}
