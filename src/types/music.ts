export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  duration?: number;
  file: File;
  url: string;
  createdAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: MusicTrack[];
  createdAt: Date;
}