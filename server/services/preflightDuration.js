/**
 * PRE-FLIGHT DURATION CHECK
 * ============================================================
 * Ước tính thời lượng TTS từ số chữ MÀ KHÔNG CẦN GỌI TTS THỰC TẾ.
 * 
 * Tốc độ đọc đo lường thực tế:
 *   - ElevenLabs (Flash v2.5 / Multilingual): ~4.2 chữ / giây
 *   - Microsoft Edge TTS (vi-VN rate -5%):   ~3.0 chữ / giây
 *
 * Mục tiêu tối thiểu: 45 giây (TARGET_DURATION_SECONDS)
 */

export const TARGET_DURATION_SECONDS = 45;

/**
 * Lấy tốc độ đọc (chữ/giây) dựa theo provider TTS đang dùng
 */
export function getWordsPerSecond() {
  if (process.env.ELEVENLABS_API_KEY) {
    return 4.2; // ElevenLabs đọc nhanh và tự nhiên hơn (~4.2 chữ/giây)
  }
  return 3.0; // Edge TTS (~3.0 chữ/giây)
}

/**
 * Ước tính thời lượng TTS của một đoạn text (giây)
 */
export function estimateSceneDuration(text) {
  const wps = getWordsPerSecond();
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return wordCount / wps + 0.6;
}

/**
 * Pre-flight check toàn bộ kịch bản
 */
export function preflightCheck(scenes) {
  const wps = getWordsPerSecond();
  const sceneReports = scenes.map((scene, idx) => {
    const wordCount = scene.text.trim().split(/\s+/).filter(Boolean).length;
    const estimatedSeconds = wordCount / wps + 0.6;
    return {
      sceneId: scene.id || `scene-${idx + 1}`,
      headline: scene.headline,
      wordCount,
      estimatedSeconds: parseFloat(estimatedSeconds.toFixed(2)),
      ok: estimatedSeconds >= 8
    };
  });

  const totalEstimatedSeconds = sceneReports.reduce((acc, r) => acc + r.estimatedSeconds, 0);
  const totalWords = sceneReports.reduce((acc, r) => acc + r.wordCount, 0);
  const isOk = totalEstimatedSeconds >= TARGET_DURATION_SECONDS;

  return {
    scenes: sceneReports,
    totalWords,
    wps,
    totalEstimatedSeconds: parseFloat(totalEstimatedSeconds.toFixed(2)),
    targetSeconds: TARGET_DURATION_SECONDS,
    isOk,
    deficit: isOk ? 0 : parseFloat((TARGET_DURATION_SECONDS - totalEstimatedSeconds).toFixed(2)),
    surplus: isOk ? parseFloat((totalEstimatedSeconds - TARGET_DURATION_SECONDS).toFixed(2)) : 0
  };
}

/**
 * Tự động mở rộng text các cảnh để đạt TARGET_DURATION_SECONDS
 */
export function expandScenesToMeetTarget(scenes) {
  const check = preflightCheck(scenes);
  if (check.isOk) return scenes;

  const wps = getWordsPerSecond();
  const deficitSeconds = check.deficit;
  const wordsNeeded = Math.ceil(deficitSeconds * wps);

  const sortedByDuration = [...scenes]
    .map((s, originalIdx) => ({ ...s, originalIdx }))
    .sort((a, b) => estimateSceneDuration(a.text) - estimateSceneDuration(b.text));

  const expanded = scenes.map(s => ({ ...s }));
  let remainingWords = wordsNeeded;

  for (const scene of sortedByDuration) {
    if (remainingWords <= 0) break;

    const idx = scene.originalIdx;
    const wordsToAdd = Math.min(remainingWords, 22);
    const expansions = getExpansionSentence(expanded[idx]);

    if (expansions) {
      expanded[idx] = {
        ...expanded[idx],
        text: expanded[idx].text.trimEnd() + ' ' + expansions
      };
      const addedCount = expansions.split(/\s+/).length;
      remainingWords -= addedCount;
    }
  }

  return expanded;
}

/**
 * Tạo câu bổ sung nội dung phù hợp theo chủ đề
 */
function getExpansionSentence(scene) {
  const text = scene.text.toLowerCase();
  const headline = (scene.headline || '').toLowerCase();

  // Bất động sản / Kinh tế / Thuế đất
  if (/đất|thuế|bất động sản|đầu cơ|nhà ở|găm giữ|thị trường|giá/.test(text + headline)) {
    const pool = [
      'Công cụ thuế được kỳ vọng sẽ hạ nhiệt cơn sốt giá và giúp người có nhu cầu thực dễ tiếp cận nhà ở hơn.',
      'Nhiều chuyên gia cho rằng cần có lộ trình áp dụng rõ ràng để thị trường bất động sản phát triển lành mạnh.',
      'Kinh nghiệm quốc tế cho thấy việc đánh thuế tài sản thứ hai giúp giảm thiểu tình trạng bỏ hoang đất đai.',
      'Bộ Tài chính đang tiếp tục lắng nghe ý kiến phản biện từ các hiệp hội và người dân trước khi hoàn thiện luật.'
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Hàng không
  if (/phi công|máy bay|đường băng|cất cánh|hàng không|chuyến bay/.test(text + headline)) {
    const pool = [
      'Toàn bộ diễn biến đã được ghi nhận và tổ bay đã báo cáo đầy đủ cho cơ quan quản lý bay.',
      'Đây là tình huống hiếm gặp nhưng hoàn toàn nằm trong các kịch bản đã được tập huấn kỹ lưỡng.',
      'Cơ quan điều tra hàng không sẽ xem xét kỹ toàn bộ dữ liệu hộp đen của chuyến bay.'
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Công nghệ
  if (/công nghệ|phần mềm|ứng dụng|ai|internet|robot/.test(text + headline)) {
    const pool = [
      'Các chuyên gia đánh giá đây là bước đột phá thực sự, mở ra tiềm năng ứng dụng rộng lớn.',
      'Cộng đồng doanh nghiệp đang theo dõi sát sao để đón đầu làn sóng chuyển đổi số mới này.'
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Mặc định
  const generalPool = [
    'Thông tin chi tiết sẽ tiếp tục được cập nhật khi các bên liên quan công bố báo cáo tiếp theo.',
    'Đây là vấn đề đang nhận được sự quan tâm lớn của dư luận xã hội trong những ngày qua.'
  ];
  return generalPool[Math.floor(Math.random() * generalPool.length)];
}
