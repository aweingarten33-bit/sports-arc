import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {SiteTile} from '@sideline/config';

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  siteId?: string;
  /** ISO timestamp of last activation. Future hook: "Archive Inactive Tabs". */
  lastActiveAt: string;
}

interface TabsState {
  tabs: BrowserTab[];
  activeTabId: string | null;
  loaded: boolean;
  customSites: SiteTile[];
  load: () => Promise<void>;
  /** Open a tab for the URL (activates the existing tab when already open). Returns the tab id. */
  openTab: (url: string, opts?: {title?: string; siteId?: string}) => string;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, patch: Partial<Pick<BrowserTab, 'url' | 'title'>>) => void;
  addCustomSite: (site: SiteTile) => void;
}

const TABS_KEY = 'sideline.tabs.v1';
const SITES_KEY = 'sideline.sites.custom.v1';

interface PersistedTabs {
  tabs: BrowserTab[];
  activeTabId: string | null;
}

let tabCounter = 0;
const newId = () => `tab-${Date.now().toString(36)}-${tabCounter++}`;

const normalize = (url: string) => url.trim().replace(/\/+$/, '').toLowerCase();

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export const useTabsStore = create<TabsState>((set, get) => {
  const persistSoon = () => {
    // Trailing-edge throttle: navigation fires onNavigationStateChange
    // constantly; we don't need a disk write per event.
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      persistNow();
    }, 1500);
  };

  const persistNow = () => {
    const {tabs, activeTabId} = get();
    void AsyncStorage.setItem(TABS_KEY, JSON.stringify({tabs, activeTabId} satisfies PersistedTabs));
  };

  return {
    tabs: [],
    activeTabId: null,
    loaded: false,
    customSites: [],

    async load() {
      if (get().loaded) return;
      const [tabsRaw, sitesRaw] = await Promise.all([
        AsyncStorage.getItem(TABS_KEY),
        AsyncStorage.getItem(SITES_KEY),
      ]);
      let tabs: BrowserTab[] = [];
      let activeTabId: string | null = null;
      try {
        if (tabsRaw) {
          const parsed = JSON.parse(tabsRaw) as PersistedTabs;
          if (Array.isArray(parsed.tabs)) {
            tabs = parsed.tabs.filter(t => typeof t?.url === 'string' && typeof t?.id === 'string');
            activeTabId = tabs.some(t => t.id === parsed.activeTabId) ? parsed.activeTabId : null;
          }
        }
      } catch {
        tabs = [];
        activeTabId = null;
      }
      let customSites: SiteTile[] = [];
      try {
        if (sitesRaw) {
          const parsed = JSON.parse(sitesRaw) as SiteTile[];
          if (Array.isArray(parsed)) customSites = parsed.filter(s => typeof s?.url === 'string');
        }
      } catch {
        customSites = [];
      }
      set({tabs, activeTabId: activeTabId ?? tabs[0]?.id ?? null, customSites, loaded: true});
    },

    openTab(url, opts) {
      const existing = get().tabs.find(t => normalize(t.url) === normalize(url));
      if (existing) {
        set({tabs: get().tabs.map(t => (t.id === existing.id ? {...t, lastActiveAt: new Date().toISOString()} : t)), activeTabId: existing.id});
        persistNow();
        return existing.id;
      }
      const tab: BrowserTab = {
        id: newId(),
        url,
        title: opts?.title ?? url,
        siteId: opts?.siteId,
        lastActiveAt: new Date().toISOString(),
      };
      set({tabs: [...get().tabs, tab], activeTabId: tab.id});
      persistNow();
      return tab.id;
    },

    closeTab(id) {
      const {tabs, activeTabId} = get();
      const idx = tabs.findIndex(t => t.id === id);
      if (idx === -1) return;
      const next = tabs.filter(t => t.id !== id);
      let nextActive = activeTabId;
      if (activeTabId === id) {
        nextActive = next[Math.min(idx, next.length - 1)]?.id ?? null;
      }
      set({tabs: next, activeTabId: nextActive});
      persistNow();
    },

    closeAllTabs() {
      set({tabs: [], activeTabId: null});
      persistNow();
    },

    setActiveTab(id) {
      if (!get().tabs.some(t => t.id === id)) return;
      set({
        activeTabId: id,
        tabs: get().tabs.map(t => (t.id === id ? {...t, lastActiveAt: new Date().toISOString()} : t)),
      });
      persistNow();
    },

    updateTab(id, patch) {
      set({tabs: get().tabs.map(t => (t.id === id ? {...t, ...patch} : t))});
      persistSoon();
    },

    addCustomSite(site) {
      const next = [site, ...get().customSites.filter(s => normalize(s.url) !== normalize(site.url))];
      set({customSites: next});
      void AsyncStorage.setItem(SITES_KEY, JSON.stringify(next));
    },
  };
});

export function getActiveTab(state: TabsState): BrowserTab | undefined {
  return state.tabs.find(t => t.id === state.activeTabId);
}
