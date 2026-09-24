import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {privacyStore} from './privacy';

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  at: string;
}

// Tab state moved to state/tabs.ts (persistent multi-tab host with a
// switcher). This store keeps navigation history only.

interface MobileState {
  history: HistoryItem[];
  loadHistory: () => Promise<void>;
  addHistory: (item: HistoryItem) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const HISTORY_KEY = 'sideline.history';

export const useMobileStore = create<MobileState>((set, get) => ({
  history: [],

  async loadHistory() {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    set({history: raw ? (JSON.parse(raw) as HistoryItem[]) : []});
  },

  async addHistory(item) {
    const next = [item, ...get().history.filter(entry => entry.url !== item.url)].slice(0, 50);
    set({history: next});
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  },

  async clearHistory() {
    // Deletion goes through the PrivacyStore so opt-outs and future
    // audit hooks stay in one place.
    await privacyStore.deleteHistory();
    set({history: []});
    await AsyncStorage.removeItem(HISTORY_KEY);
  },
}));
