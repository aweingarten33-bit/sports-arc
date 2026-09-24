import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {TypedWebView, type WebViewInstance, type WebViewNavigation} from '../ui/TypedWebView';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {isSafeUrl} from '@sideline/providers';
import {useAppContext} from '../state/context';
import {HOME_URL, useMobileStore} from '../state/mobile';
import {resolveInput} from '../state/url';
import {colors, styles} from '../ui/theme';
import type {ContentStackParamList, RootTabs} from '../App';

type Nav = NativeStackNavigationProp<ContentStackParamList>;

const DEMO_LINKS: {route: keyof ContentStackParamList; label: string}[] = [
  {route: 'WebSearch', label: 'Search demo'},
  {route: 'Article', label: 'Article demo'},
  {route: 'Player', label: 'Player demo'},
  {route: 'PlayerProp', label: 'Prop demo'},
  {route: 'FantasyMatchup', label: 'Fantasy demo'},
  {route: 'Chirp', label: 'Chirp'},
];

export function BrowserScreen() {
  const navigation = useNavigation<Nav>();
  const ctx = useAppContext();
  const webRef = useRef<WebViewInstance>(null);

  const tab = useMobileStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const setTabUrl = useMobileStore(s => s.setTabUrl);
  const history = useMobileStore(s => s.history);
  const addHistory = useMobileStore(s => s.addHistory);
  const clearHistory = useMobileStore(s => s.clearHistory);

  const [input, setInput] = useState(tab?.url ?? HOME_URL);
  const [pageUrl, setPageUrl] = useState(tab?.url ?? HOME_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const go = (raw: string) => {
    const url = resolveInput(raw);
    if (!isSafeUrl(url)) {
      setLoadError(`Blocked: "${raw.trim()}" is not a safe https URL.`);
      return;
    }
    setLoadError(null);
    setInput(url);
    setPageUrl(url);
  };

  const onNavStateChange = (nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
    setCanGoForward(nav.canGoForward);
    setLoading(nav.loading);
    setPageUrl(nav.url);
    setInput(nav.url);
    if (tab) setTabUrl(tab.id, nav.url, nav.title || nav.url);
    // Finished loading a safe page: persist history and publish the
    // web-page seed so the Research tab knows what "this" is.
    if (!nav.loading && isSafeUrl(nav.url)) {
      setLoadError(null);
      void addHistory({url: nav.url, title: nav.title || undefined, visitedAt: new Date().toISOString()});
      ctx.setSeed({kind: 'web-page', url: nav.url, title: nav.title || undefined}, 'Browser');
    }
  };

  const openResearchTab = () => {
    navigation.getParent<BottomTabNavigationProp<RootTabs>>()?.navigate('Research', {screen: 'Home'});
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* Address bar */}
      <View style={{flexDirection: 'row', padding: 8, gap: 8}}>
        <TextInput
          style={[styles.input, {flex: 1, marginVertical: 0}]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={e => go(e.nativeEvent.text)}
          placeholder="Search or enter URL"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
        />
        <TouchableOpacity onPress={() => go(input)} style={{justifyContent: 'center', paddingHorizontal: 8}}>
          <Text style={styles.button}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {loading && (
        <View style={{height: 3, backgroundColor: colors.border}}>
          <View style={{height: 3, width: `${Math.round(progress * 100)}%`, backgroundColor: colors.accent}} />
        </View>
      )}

      {/* Controls */}
      <View style={{flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border}}>
        <Ctrl label="‹ Back" disabled={!canGoBack} onPress={() => webRef.current?.goBack()} />
        <Ctrl label="Forward ›" disabled={!canGoForward} onPress={() => webRef.current?.goForward()} />
        {loading ? (
          <Ctrl label="■ Stop" onPress={() => webRef.current?.stopLoading()} />
        ) : (
          <Ctrl label="⟳ Reload" onPress={() => webRef.current?.reload()} />
        )}
        <Ctrl label={showHistory ? 'Hide history' : 'History'} onPress={() => setShowHistory(v => !v)} />
        <Ctrl label="Ask AI ›" onPress={openResearchTab} />
      </View>

      {/* Error state */}
      {loadError ? (
        <View style={[styles.root, {justifyContent: 'center', alignItems: 'center'}]}>
          <Text style={styles.title}>Couldn't load that page</Text>
          <Text style={[styles.body, styles.muted, {textAlign: 'center', marginBottom: 16}]}>{loadError}</Text>
          <TouchableOpacity onPress={() => webRef.current?.reload()}>
            <Text style={styles.button}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TypedWebView
          ref={webRef}
          source={{uri: pageUrl}}
          style={{flex: 1}}
          onNavigationStateChange={onNavStateChange}
          onLoadProgress={e => setProgress(e.nativeEvent.progress)}
          onError={e => {
            setLoading(false);
            setLoadError(`The page failed to load (${e.nativeEvent.description}). Check your connection and retry.`);
          }}
          startInLoadingState={false}
        />
      )}

      {/* History drawer */}
      {showHistory && (
        <View style={{maxHeight: 220, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.panel}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10}}>
            <Text style={[styles.body, {fontWeight: '700'}]}>History</Text>
            <TouchableOpacity onPress={() => void clearHistory()}>
              <Text style={[styles.button, {color: colors.danger}]}>Clear history</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{paddingHorizontal: 10}}>
            {history.length === 0 && <Text style={[styles.muted, {paddingBottom: 12}]}>No pages yet.</Text>}
            {history.map(item => (
              <TouchableOpacity key={item.url} onPress={() => {setShowHistory(false); go(item.url);}} style={{paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border}}>
                <Text style={styles.body} numberOfLines={1}>{item.title || item.url}</Text>
                <Text style={styles.muted} numberOfLines={1}>{item.url}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Demo shortcuts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight: 52, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.panel}}>
        <View style={{flexDirection: 'row', padding: 8, gap: 8}}>
          {loading && <ActivityIndicator color={colors.accent} style={{alignSelf: 'center'}} />}
          {DEMO_LINKS.map(d => (
            <TouchableOpacity key={d.route} onPress={() => navigation.navigate(d.route)} style={{paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16}}>
              <Text style={{color: colors.text, fontSize: 13}}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Ctrl({label, onPress, disabled}: {label: string; onPress: () => void; disabled?: boolean}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={{opacity: disabled ? 0.35 : 1, padding: 4}}>
      <Text style={styles.button}>{label}</Text>
    </TouchableOpacity>
  );
}
