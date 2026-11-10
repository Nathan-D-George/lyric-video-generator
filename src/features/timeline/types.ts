export interface LyricSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface VideoSettings {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  lineHeight: number;
  xPosition: number;
  yPosition: number;
  backgroundImage: string | null;
}

// Firestore Database Document Mapping Schema
export interface UserVideoSession {
  userId: string;
  hasActiveProject: boolean;
  audioSrcFilename: string | null; // Tracks metadata
  settings: VideoSettings;
  slides: LyricSegment[];
  updatedAt: number;
}
