export interface WordCaption {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface SceneData {
  id: string;
  sceneIndex: number;
  headline: string;
  text: string;
  durationInFrames: number;
  audioUrl?: string;
  mediaUrl: string;
  mediaList?: string[];  // Danh sách nhiều ảnh minh họa chuyển cảnh trong phân cảnh
  mediaType: 'image' | 'video';
  captions: WordCaption[];
  quoteAuthor?: string;
}

export interface VideoProjectProps {
  title: string;
  category: string;       // Ví dụ: "HÀNG KHÔNG", "CẬP NHẬT", "CÔNG NGHỆ", "KINH TẾ"
  sourceName: string;     // Ví dụ: "VnExpress", "Tuổi Trẻ Online"
  sourceUrl?: string;
  tickerText?: string;
  scenes: SceneData[];
  primaryColor?: string;
  accentColor?: string;
}
