import React, {useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useTabsStore, type BrowserTab} from '../state/tabs';
import {domainOf} from '../lib/extract';
import {Favicon} from '../components/Favicon';
import {colors, styles} from '../ui/theme';
import type {RootTabs, TabsStackParamList} from '../App';

type Nav = NativeStackNavigationProp<TabsStackParamList>;

const {width: W} = Dimensions.get('window');
const CARD_W = Math.min(W * 0.76, 340);
const STEP = CARD_W * 0.6;
const EDGE = (W - CARD_W) / 2;

/**
 * Arc-style tab switcher: cards fan out horizontally and overlap, the
 * active card is centered and largest, each card carries a favicon + title
 * label floating above it. Tap to enter, X to close.
 * (True live page thumbnails aren't feasible — cards are styled summaries.)
 */
export function TabSwitcherScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const tabs = useTabsStore(s => s.tabs);
  const activeTabId = useTabsStore(s => s.activeTabId);
  const setActiveTab = useTabsStore(s => s.setActiveTab);
  const closeTab = useTabsStore(s => s.closeTab);
  const loaded = useTabsStore(s => s.loaded);
  const [view, setView] = useState<'fan' | 'list'>('fan');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(() => Math.max(0, tabs.findIndex(t => t.id === activeTabId)));
  const scrollX = useRef(new Animated.Value(activeIdx * STEP)).current;

  const enter = (tab: BrowserTab) => {
    setActiveTab(tab.id);
    navigation.navigate('Browser');
  };

  const goSites = () => navigation.getParent<BottomTabNavigationProp<RootTabs>>()?.navigate('Sites', {screen: 'Tray'});

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      <View style={{padding: 16, paddingTop: Math.max(insets.top, 12)}}>
        <Text style={styles.title}>Tabs</Text>
        <Text style={styles.muted}>{tabs.length} open</Text>
      </View>

      {!loaded ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={styles.muted}>Loading tabs…</Text>
        </View>
      ) : tabs.length === 0 ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24}}>
          <Text style={[styles.title, {fontSize: 20, textAlign: 'center'}]}>No open tabs</Text>
          <Text style={[styles.muted, {textAlign: 'center', marginBottom: 16}]}>Open a site to start browsing.</Text>
          <TouchableOpacity onPress={goSites} style={{backgroundColor: colors.panel, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.border}}>
            <Text style={{color: colors.accent, fontSize: 16, fontWeight: '600'}}>Open the Sites tray ›</Text>
          </TouchableOpacity>
        </View>
      ) : view === 'fan' ? (
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={STEP}
          decelerationRate="fast"
          contentContainerStyle={{paddingHorizontal: EDGE, alignItems: 'center'}}
          style={{flex: 1}}
          onScroll={Animated.event([{nativeEvent: {contentOffset: {x: scrollX}}}], {useNativeDriver: true})}
          scrollEventThrottle={16}
          onMomentumScrollEnd={e => setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / STEP))}>
          {tabs.map((tab, i) => (
            <FanCard
              key={tab.id}
              tab={tab}
              index={i}
              isLast={i === tabs.length - 1}
              scrollX={scrollX}
              activeIdx={activeIdx}
              onEnter={() => enter(tab)}
              onClose={() => closeTab(tab.id)}
            />
          ))}
        </Animated.ScrollView>
      ) : (
        <FlatList
          data={tabs}
          keyExtractor={t => t.id}
          contentContainerStyle={{padding: 12}}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => enter(item)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.panel,
                borderWidth: 1,
                borderColor: item.id === activeTabId ? colors.accent : colors.border,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}>
              <Favicon url={item.url} size={24} />
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={{color: colors.text, fontSize: 15, fontWeight: '600'}} numberOfLines={1}>{item.title}</Text>
                <Text style={{color: colors.muted, fontSize: 13}} numberOfLines={1}>{domainOf(item.url)}</Text>
              </View>
              <TouchableOpacity onPress={() => closeTab(item.id)} hitSlop={12}>
                <Text style={{color: colors.muted, fontSize: 18}}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Switcher bottom bar: view toggle | + new tab | settings stub */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 28,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={view === 'fan' ? 'Switch to list view' : 'Switch to card view'}
          onPress={() => setView(v => (v === 'fan' ? 'list' : 'fan'))}
          style={{width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: colors.text, fontSize: 18}}>{view === 'fan' ? '☰' : '▦'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="New tab"
          onPress={goSites}
          style={{backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 44, paddingVertical: 10}}>
          <Text style={{color: colors.text, fontSize: 22, fontWeight: '600'}}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Tab settings"
          onPress={() => setSettingsOpen(true)}
          style={{width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: colors.text, fontSize: 18}}>⚙</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={settingsOpen} transparent animationType="fade" onRequestClose={() => setSettingsOpen(false)}>
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24}}>
          <View style={{backgroundColor: colors.panel, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border}}>
            <Text style={[styles.body, {fontWeight: '700', marginBottom: 8}]}>Tab settings</Text>
            <Text style={[styles.muted, {marginBottom: 4}]}>• Archive Inactive Tabs — coming soon (tabs already record last-active time for this).</Text>
            <Text style={[styles.muted, {marginBottom: 16}]}>• Full settings screen is future work.</Text>
            <TouchableOpacity onPress={() => setSettingsOpen(false)} style={{alignSelf: 'flex-end'}}>
              <Text style={styles.button}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FanCard({
  tab,
  index,
  isLast,
  scrollX,
  activeIdx,
  onEnter,
  onClose,
}: {
  tab: BrowserTab;
  index: number;
  isLast: boolean;
  scrollX: Animated.Value;
  activeIdx: number;
  onEnter: () => void;
  onClose: () => void;
}) {
  const inputRange = [(index - 1) * STEP, index * STEP, (index + 1) * STEP];
  const scale = scrollX.interpolate({inputRange, outputRange: [0.9, 1, 0.9], extrapolate: 'clamp'});
  const translateY = scrollX.interpolate({inputRange, outputRange: [26, 0, 26], extrapolate: 'clamp'});
  const labelOpacity = scrollX.interpolate({inputRange, outputRange: [0.45, 1, 0.45], extrapolate: 'clamp'});
  return (
    <View style={{width: isLast ? CARD_W : STEP, zIndex: 10 - Math.abs(index - activeIdx)}}>
      {/* Favicon + title label floating above the card */}
      <Animated.View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8, opacity: labelOpacity, width: CARD_W}}>
        <Favicon url={tab.url} size={18} />
        <Text style={{color: colors.text, fontSize: 14, fontWeight: '600', marginLeft: 8}} numberOfLines={1}>
          {tab.title}
        </Text>
      </Animated.View>
      <Animated.View style={{width: CARD_W, transform: [{scale}, {translateY}]}}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onEnter}
          style={{
            height: CARD_W * 1.15,
            backgroundColor: colors.panel,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: index === activeIdx ? colors.accent : colors.border,
            padding: 16,
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: {width: 0, height: 4},
            elevation: 8,
          }}>
          <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
            <TouchableOpacity onPress={onClose} hitSlop={14}>
              <View style={{width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center'}}>
                <Text style={{color: colors.text, fontSize: 14}}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={{alignItems: 'center'}}>
            <Favicon url={tab.url} size={56} />
            <Text style={{color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center'}} numberOfLines={2}>
              {tab.title}
            </Text>
            <Text style={{color: colors.muted, fontSize: 14, marginTop: 6}} numberOfLines={1}>
              {domainOf(tab.url)}
            </Text>
          </View>
          <View style={{alignItems: 'center'}}>
            <Text style={{color: colors.muted, fontSize: 12}}>Tap to enter</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
