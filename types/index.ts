import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  partnerId?: string | null;
  partnerCode: string;
  pushToken?: string;
  currentSong?: Song;
  isOnline?: boolean;
  lastActive?: Timestamp;
  createdAt: Timestamp | Date;
}

// Song types
export type Platform = 'spotify' | 'youtube';

export interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail?: string;
  url: string;
  platform: Platform;
  spotifyId?: string;
  youtubeId?: string;
  sharedBy: string;
  participants: string[];
  sharedAt: Timestamp | Date;
}

// Alert types
export type AlertType = 'need' | 'song' | 'system';

export interface Alert {
  id: string;
  type: AlertType;
  from: string;
  to: string;
  message?: string;
  songId?: string;
  songTitle?: string;
  songArtist?: string;
  read: boolean;
  createdAt: Timestamp | Date;
}

// Auth types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Navigation types
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'share-song': undefined;
  'modal': undefined;
};

export type AuthStackParamList = {
  'login': undefined;
  'register': undefined;
};

export type TabParamList = {
  'index': undefined;
  'songs': undefined;
  'profile': undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
