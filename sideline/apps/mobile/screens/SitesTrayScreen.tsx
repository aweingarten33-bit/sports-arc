import React, {useMemo, useState} from 'react';
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {defaultSites, rankSites, type SiteTile} from '@sideline/config';
import {isSafeUrl} from '@sideline/providers';
import {useTabsStore} from '../state/tabs';
import {resolveInput} from '../state/url';
import {domainOf} from '../lib/extract';
import {Favicon} from '../components/Favicon';
import {colors, styles} from '../ui/theme';
import type {RootTabs, SitesStackParamList} from '../App';

type Nav = NativeStackNavigationProp<SitesStackParamList>;

/**
 * Sites tray: the launcher that replaces the URL bar. A grid of
 * sports-destination tiles the user taps to open — no typing needed.
 * The "+" tile is the one place typing lives (add your own site).
 */
export function SitesTrayScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const openTab = useTabsStore(s => s.openTab);
  const customSites = useTabsStore(s => s.customSites);
  const addCustomSite = useTabsStore(s => s.addCustomSite);
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const sites = useMemo(() => {
    const now = new Date();
    const ranked = rankSites(defaultSites, {dayOfWeek: now.getDay(), hour: now.getHours()});
    return [...ranked, ...customSites];
  }, [customSites]);

  const openSite = (site: SiteTile) => {
    openTab(site.url, {title: site.name, siteId: site.id});
    navigation.getParent<BottomTabNavigationProp<RootTabs>>()?.navigate('Tabs', {screen: 'Browser'});
  };

  const submitCustom = () => {
    const url = resolveInput(input);
    if (!isSafeUrl(url)) {
      setInputError(`"${input.trim()}" isn't a safe https URL.`);
      return;
    }
    const site: SiteTile = {
      id: `custom-${Date.now().toString(36)}`,
      name: domainOf(url),
      url,
      color: colors.border,
    };
    addCustomSite(site);
    setInput('');
    setInputError(null);
    setAdding(false);
    openSite(site);
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      <View style={{padding: 16, paddingTop: Math.max(insets.top, 12)}}>
        <Text style={styles.title}>Sites</Text>
        <Text style={[styles.muted, {marginBottom: 4}]}>Tap a tile to open it. No URL bar needed.</Text>
      </View>
      <FlatList
        data={sites}
        keyExtractor={s => s.id}
        numColumns={3}
        contentContainerStyle={{padding: 12, paddingBottom: 32}}
        renderItem={({item}) => <SiteCell site={item} onPress={() => openSite(item)} />}
        ListFooterComponent={
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add your own site"
            onPress={() => {
              setInput('');
              setInputError(null);
              setAdding(true);
            }}
            style={{
              flex: 1,
              margin: 6,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 26,
            }}>
            <Text style={{color: colors.accent, fontSize: 28}}>+</Text>
            <Text style={{color: colors.muted, fontSize: 13, marginTop: 4}}>Add site</Text>
          </TouchableOpacity>
        }
      />

      <Modal visible={adding} transparent animationType="fade" onRequestClose={() => setAdding(false)}>
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24}}>
          <View style={{backgroundColor: colors.panel, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border}}>
            <Text style={[styles.body, {fontWeight: '700', marginBottom: 4}]}>Add your own site</Text>
            <Text style={[styles.muted, {marginBottom: 12}]}>Type a URL or a search.</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={t => {
                setInput(t);
                setInputError(null);
              }}
              onSubmitEditing={submitCustom}
              placeholder="espn.com or a search"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="go"
            />
            {inputError && <Text style={{color: colors.danger, marginBottom: 8}}>{inputError}</Text>}
            <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 4}}>
              <TouchableOpacity onPress={() => setAdding(false)}>
                <Text style={[styles.button, {color: colors.muted}]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitCustom}>
                <Text style={styles.button}>Add & open ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SiteCell({site, onPress}: {site: SiteTile; onPress: () => void}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open ${site.name}`}
      onPress={onPress}
      style={{flex: 1, margin: 6}}>
      <View
        style={{
          borderRadius: 16,
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.border,
          borderTopWidth: 3,
          borderTopColor: site.color,
          alignItems: 'center',
          paddingVertical: 22,
          paddingHorizontal: 8,
        }}>
        <Favicon url={site.url} size={32} />
        <Text style={{color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 10, textAlign: 'center'}} numberOfLines={2}>
          {site.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
