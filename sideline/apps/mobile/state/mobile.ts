import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {privacyStore} from './privacy';

export interface HistoryItem {
  url: string;
  title?: string;
  visitedAt: string;
}

// Tab state is structured for a future tab switcher. Milestone 1 ships a
// single tab; adding tabs later means appending to `tabs` and switching
// `activeTabId` — no BrowserScreen rewrite needed.
export interface BrowserTab {
  id: string;
  url: string;
  title: string;
}

export const HOME_URL = 'https://duckduckgo.com/';

interface MobileState {
  history: HistoryItem[];
  tabs: BrowserTab[];
  activeTabId: string;
  loadHistory: () => Promise<void>;
  addHistory: (item: HistoryItem) => Promise<void>;
  clearHistory: () => Promise<void>;
  setTabUrl: (id: string, url: string, title?: string) => void;
  setActiveTab: (id: string) => void;
}

const HISTORY_KEY = 'sideline.history';

export const useMobileStore = create<MobileState>((set, get) => ({
  history: [],
  tabs: [{id: 'tab-1', url: HOME_URL, title: 'New tab'}],
  activeTabId: 'tab-1',

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

  setTabUrl(id, url, title) {
    set({tabs: get().tabs.map(t => (t.id === id ? {...t, url, title: title ?? t.title} : t))});
  },

  setActiveTab(id) {
    set({activeTabId: id});
  },
}));
