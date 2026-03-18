import { create } from 'zustand';
import { User, Song, Alert } from '@/types';

interface UserState {
  // User data
  user: User | null;
  partner: User | null;
  
  // UI state
  isLoading: boolean;
  isPartnerConnected: boolean;
  
  // Songs
  sharedSongs: Song[];
  
  // Alerts
  alerts: Alert[];
  
  // Actions
  setUser: (user: User | null) => void;
  setPartner: (partner: User | null) => void;
  setLoading: (loading: boolean) => void;
  addSharedSong: (song: Song) => void;
  addAlert: (alert: Alert) => void;
  clearPartner: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  // Initial state
  user: null,
  partner: null,
  isLoading: false,
  isPartnerConnected: false,
  sharedSongs: [],
  alerts: [],
  
  // Actions
  setUser: (user) => set({ user, isPartnerConnected: !!user?.partnerId }),
  
  setPartner: (partner) => set({ 
    partner, 
    isPartnerConnected: !!partner 
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  addSharedSong: (song) => set((state) => ({
    sharedSongs: [song, ...state.sharedSongs],
  })),
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts],
  })),
  
  clearPartner: () => set({ 
    partner: null, 
    isPartnerConnected: false 
  }),
  
  reset: () => set({
    user: null,
    partner: null,
    isLoading: false,
    isPartnerConnected: false,
    sharedSongs: [],
    alerts: [],
  }),
}));
