import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Linking, Share, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {WebViewMessageEvent} from 'react-native-webview';
import {TypedWebView, type WebViewInstance, type WebViewNavigation} from '../ui/TypedWebView';
import {PageBar} from '../components/PageBar';
import {PageMenu} from '../components/PageMenu';
import {ScoutFab} from '../components/ScoutFab';
import {ScoutPanel} from '../components/ScoutPanel';
import {ReaderView} from '../components/ReaderView';
import {EXTRACT_JS, detectEntities, domainOf, parseExtractMessage, type ExtractedPage} from '../lib/extract';
import {useTabsStore, type BrowserTab} from '../state/tabs';
import {useMobileStore} from '../state/mobile';
import {useScoutStore, type ScoutAsk} from '../state/scout';
import {useAppContext} from '../state/context';
import {isSportsbookUrl} from '@sideline/config';
import {MockResearchEngine, type ResearchAnswer} from '@sideline/research';
import type {ContextEnvelope} from '@sideline/context';
import {colors, styles} from '../ui/theme';
import type {RootTabs, TabsStackParamList} from '../App';

type Nav = NativeStackNavigationProp<TabsStackParamList>;

interface TabUi {
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  title: string;
  url: string;
  error: string | null;
}

const defaultTabUi = (tab: BrowserTab): TabUi => ({
  canGoBack: false,
  canGoForward: false,
  loading: true,
  title: tab.title,
  url: tab.url,
  error: null,
});

/**
 * Browser: every open tab keeps its WebView mounted so switching preserves
 * exact page + scroll state. Tabs persist across launches. Per-tab controls
 * live in the ^ page menu; Scout floats bottom-right.
 */
export function BrowserScreen() {
  const navigation = useNavigation<Nav>();
  const ctx = useAppContext();
  const tabs = useTabsStore(s => s.tabs);
  const activeTabId = useTabsStore(s => s.activeTabId);
  const loaded = useTabsStore(s => s.loaded);
  const updateTab = useTabsStore(s => s.updateTab);
  const closeTab = useTabsStore(s => s.closeTab);
  const addHistory = useMobileStore(s => s.addHistory);
  const scoutOpen = useScoutStore(s => s.open);
  const setScoutOpen = useScoutStore(s => s.setOpen);
  const toggleScout = useScoutStore(s => s.toggle);
  const consumeAsk = useScoutStore(s => s.consumeAsk);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const [tabUi, setTabUi] = useState<Record<string, TabUi>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [askForPanel, setAskForPanel] = useState<ScoutAsk | null>(null);
  const [reader, setReader] = useState<{
    tabId: string; title: string; text: string;
    summary: ResearchAnswer | null; summaryLoading: boolean;
  } | null>(null);

  const webRefs = useRef(new Map<string, WebViewInstance>());
  const pendingExtract = useRef(new Map<string, (page: ExtractedPage) => void>());

  // Capture a pushed question (e.g. from Lore) once per panel open.
  useEffect(() => {
    if (scoutOpen) setAskForPanel(consumeAsk());
    else setAskForPanel(null);
  }, [scoutOpen, consumeAsk]);

  const setUi = useCallback((id: string, patch: Partial<TabUi>) => {
    setTabUi(prev => ({...prev, [id]: {...(prev[id] ?? defaultTabUi({id, url: '', title: ''} as BrowserTab)), ...patch}}));
  }, []);

  const extractPage = useCallback(async (tabId: string): Promise<ExtractedPage | null> => {
    const ref = webRefs.current.get(tabId);
    if (!ref || typeof ref.injectJavaScript !== 'function') return null;
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        pendingExtract.current.delete(tabId);
        resolve(null);
      }, 9000);
      pendingExtract.current.set(tabId, page => {
        clearTimeout(timer);
        pendingExtract.current.delete(tabId);
        resolve(page);
      });
      try {
        ref.injectJavaScript(EXTRACT_JS);
      } catch {
        clearTimeout(timer);
        pendingExtract.current.delete(tabId);
        resolve(null);
      }
    });
  }, []);

  const handleNavState = useCallback(
    (tab: BrowserTab) => (nav: WebViewNavigation) => {
      setUi(tab.id, {canGoBack: nav.canGoBack, canGoForward: nav.canGoForward, title: nav.title || nav.url, url: nav.url, loading: nav.loading});
      if (nav.url && nav.url !== tab.url) {
        updateTab(tab.id, {url: nav.url, title: nav.title || nav.url});
        addHistory({id: `${Date.now()}`, url: nav.url, title: nav.title || nav.url, at: new Date().toISOString()});
        ctx.setSeed({kind: 'web-page', url: nav.url, title: nav.title || nav.url}, 'Browser');
      }
    },
    [addHistory, ctx, setUi, updateTab],
  );

  const handleMessage = useCallback(
    (tabId: string) => (e: WebViewMessageEvent) => {
      const page = parseExtractMessage(e.nativeEvent.data);
      if (page) pendingExtract.current.get(tabId)?.(page);
    },
    [],
  );

  const openReader = useCallback(async () => {
    const tab = activeTab;
    if (!tab) return;
    setMenuOpen(false);
    const page = await extractPage(tab.id);
    const title = page?.title || tab.title;
    const text = page?.text ?? '';
    setReader({tabId: tab.id, title, text, summary: null, summaryLoading: text.length > 0});
    if (text.length === 0) {
      setReader(r => (r && r.tabId === tab.id ? {...r, summaryLoading: false} : r));
      return;
    }
    try {
      const envelope: ContextEnvelope = {
        seed: {kind: 'web-page', url: page?.url ?? tab.url, title},
        screen: 'Reader',
        entities: detectEntities(text),
        capturedAt: new Date().toISOString(),
      };
      const engine = new MockResearchEngine();
      for await (const ev of engine.research(`Summarize this page in a few sentences: ${title}`, envelope)) {
        if (ev.answer) setReader(r => (r && r.tabId === tab.id ? {...r, summary: ev.answer, summaryLoading: false} : r));
      }
    } catch {
      setReader(r => (r && r.tabId === tab.id ? {...r, summaryLoading: false} : r));
    }
  }, [activeTab, extractPage]);

  const ui = activeTab ? tabUi[activeTab.id] : undefined;
  const sportsbook = activeTab ? isSportsbookUrl(activeTab.url) : false;
  const sportsbookName = sportsbook
    ? domainOf(activeTab!.url).includes('draftkings')
      ? 'DraftKings'
      : 'FanDuel'
    : null;

  const webAction = (fn: (ref: WebViewInstance) => void) => {
    const ref = activeTab ? webRefs.current.get(activeTab.id) : undefined;
    if (ref) {
      try {
        fn(ref);
      } catch {
        /* no-op */
      }
    }
  };

  const openExternal = () => {
    if (activeTab) void Linking.openURL(activeTab.url);
  };
  const openInSportsbookApp = () => {
    // Universal link: routes to the native sportsbook app when installed.
    // Wagering always happens there — never in Sideline.
    if (activeTab) void Linking.openURL(activeTab.url);
  };
  const sharePage = () => {
    if (activeTab) void Share.share({message: activeTab.url, title: activeTab.title});
  };
  const goSites = () => navigation.getParent<BottomTabNavigationProp<RootTabs>>()?.navigate('Sites', {screen: 'Tray'});
  const goSwitcher = () => navigation.navigate('Switcher');

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* All tabs stay mounted: exact page/scroll state survives switching. */}
      {tabs.map(tab => (
        <View key={tab.id} style={[StyleSheet.absoluteFillObject, {display: tab.id === activeTabId ? 'flex' : 'none'}]}>
          <TabWebView
            tab={tab}
            onRegister={ref => {
              if (ref) webRefs.current.set(tab.id, ref);
              else webRefs.current.delete(tab.id);
            }}
            onNavState={handleNavState(tab)}
            onMessage={handleMessage(tab.id)}
            onLoadState={loading => setUi(tab.id, {loading})}
            onError={message => setUi(tab.id, {error: message, loading: false})}
          />
          {tabUi[tab.id]?.error && (
            <ErrorFallback
              message={tabUi[tab.id]!.error!}
              onRetry={() => {
                setUi(tab.id, {error: null, loading: true});
                webRefs.current.get(tab.id)?.reload();
              }}
              onOpenExternal={() => void Linking.openURL(tab.url)}
              onClose={() => closeTab(tab.id)}
            />
          )}
        </View>
      ))}

      {loaded && tabs.length === 0 && (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24}}>
          <Text style={[styles.title, {fontSize: 20, textAlign: 'center'}]}>No open sites</Text>
          <Text style={[styles.muted, {textAlign: 'center', marginBottom: 16}]}>
            Open the Sites tray to start browsing — every site gets its own tab.
          </Text>
          <TouchableOpacity
            onPress={goSites}
            style={{backgroundColor: colors.panel, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.border}}>
            <Text style={{color: colors.accent, fontSize: 16, fontWeight: '600'}}>Open the Sites tray ›</Text>
          </TouchableOpacity>
        </View>
      )}

      {reader && reader.tabId === activeTabId && (
        <ReaderView
          title={reader.title}
          text={reader.text}
          summary={reader.summary}
          summaryLoading={reader.summaryLoading}
          onClose={() => setReader(null)}
        />
      )}

      {scoutOpen && activeTab && (
        <ScoutPanel
          key={activeTab.id}
          tab={activeTab}
          extractPage={() => extractPage(activeTab.id)}
          externalAsk={askForPanel}
          onClose={() => setScoutOpen(false)}
        />
      )}

      {activeTab && <ScoutFab panelOpen={scoutOpen} onToggle={toggleScout} />}

      <PageBar
        tabCount={tabs.length}
        onOpenSwitcher={goSwitcher}
        onNewTab={goSites}
        onOpenMenu={() => setMenuOpen(true)}
      />
      <PageMenu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        canGoBack={ui?.canGoBack ?? false}
        canGoForward={ui?.canGoForward ?? false}
        loading={ui?.loading ?? false}
        isSportsbook={sportsbook}
        sportsbookName={sportsbookName}
        onBack={() => webAction(r => r.goBack())}
        onForward={() => webAction(r => r.goForward())}
        onReload={() => webAction(r => r.reload())}
        onStop={() => webAction(r => r.stopLoading())}
        onShare={sharePage}
        onReader={() => void openReader()}
        onOpenExternally={openExternal}
        onOpenInSportsbookApp={openInSportsbookApp}
        onCloseTab={() => activeTab && closeTab(activeTab.id)}
      />
    </View>
  );
}

const TabWebView = React.memo(function TabWebView({
  tab,
  onRegister,
  onNavState,
  onMessage,
  onLoadState,
  onError,
}: {
  tab: BrowserTab;
  onRegister: (ref: WebViewInstance | null) => void;
  onNavState: (nav: WebViewNavigation) => void;
  onMessage: (e: WebViewMessageEvent) => void;
  onLoadState: (loading: boolean) => void;
  onError: (message: string) => void;
}) {
  // Captured once: store URL updates must never re-drive the source (that
  // would reload the page and destroy scroll state).
  const [initialUrl] = useState(tab.url);
  return (
    <TypedWebView
      ref={onRegister}
      source={{uri: initialUrl}}
      style={{flex: 1}}
      onNavigationStateChange={onNavState}
      onLoadStart={() => onLoadState(true)}
      onLoadEnd={() => onLoadState(false)}
      onMessage={onMessage}
      onError={() => onError('The page failed to load. Check your connection — or open it externally instead.')}
      onHttpError={synthetic =>
        onError(
          `This page couldn't load (HTTP ${synthetic.nativeEvent.statusCode}). Some sites block embedding — open it externally instead.`,
        )
      }
      javaScriptEnabled
      domStorageEnabled
    />
  );
});

function ErrorFallback({
  message,
  onRetry,
  onOpenExternal,
  onClose,
}: {
  message: string;
  onRetry: () => void;
  onOpenExternal: () => void;
  onClose: () => void;
}) {
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 28},
      ]}>
      <Text style={{fontSize: 40, marginBottom: 12}}>🛰</Text>
      <Text style={[styles.title, {fontSize: 20, textAlign: 'center'}]}>Couldn't load this page</Text>
      <Text style={[styles.muted, {textAlign: 'center', marginBottom: 20}]}>{message}</Text>
      <TouchableOpacity onPress={onOpenExternal} style={{backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 12, marginBottom: 12}}>
        <Text style={{color: '#0d1512', fontSize: 16, fontWeight: '700'}}>Open externally ↗</Text>
      </TouchableOpacity>
      <View style={{flexDirection: 'row', gap: 20}}>
        <TouchableOpacity onPress={onRetry}>
          <Text style={{color: colors.accent, fontSize: 16}}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={{color: colors.muted, fontSize: 16}}>Close tab</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
