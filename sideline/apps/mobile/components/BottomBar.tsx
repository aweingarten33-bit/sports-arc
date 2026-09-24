import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useTabsStore} from '../state/tabs';
import {useScoutStore} from '../state/scout';
import {colors} from '../ui/theme';
import type {RootTabs} from '../App';

const ITEMS: {route: keyof RootTabs; label: string; glyph: string}[] = [
  {route: 'Home', label: 'Home', glyph: '⌂'},
  {route: 'Sites', label: 'Sites', glyph: '▦'},
  {route: 'Tabs', label: 'Tabs', glyph: '▭'},
  {route: 'Scout', label: 'Scout', glyph: '✦'},
];

/**
 * Persistent bottom bar: Home / Sites / Tabs / Scout. Max 4 items,
 * thumb-reachable, safe-area aware, dark theme. Scout is an action, not a
 * destination: it opens the AI panel over the current page.
 */
export function BottomBar({state, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabCount = useTabsStore(s => s.tabs.length);
  const openTab = useTabsStore(s => s.openTab);
  const activeTabId = useTabsStore(s => s.activeTabId);
  const setScoutOpen = useScoutStore(s => s.setOpen);

  const onPress = (route: keyof RootTabs) => {
    if (route === 'Scout') {
      // Scout toggles the AI panel over the current page — never navigates.
      let id = activeTabId;
      if (!id) {
        id = openTab('https://www.espn.com', {title: 'ESPN', siteId: 'espn'});
      }
      if (id) {
        navigation.navigate('Tabs', {screen: 'Browser'});
        setScoutOpen(true);
      }
      return;
    }
    const target = state.routes.find(r => r.name === route);
    if (!target) return;
    const event = navigation.emit({type: 'tabPress', target: target.key, canPreventDefault: true});
    if (!event.defaultPrevented) {
      navigation.navigate(route);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.panel,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 6,
      }}>
      {ITEMS.map(item => {
        const route = state.routes.find(r => r.name === item.route);
        const focused = route ? state.index === state.routes.indexOf(route) : false;
        const tint = focused ? colors.accent : colors.muted;
        return (
          <TouchableOpacity
            key={item.route}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => onPress(item.route)}
            style={{flex: 1, alignItems: 'center', paddingVertical: 6}}>
            {item.route === 'Tabs' ? (
              <StackGlyph count={tabCount} color={tint} />
            ) : (
              <Text style={{color: tint, fontSize: 22}}>{item.glyph}</Text>
            )}
            <Text style={{color: tint, fontSize: 11, marginTop: 2, fontWeight: focused ? '700' : '400'}}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Two offset rounded rectangles suggesting a fanned tab stack, with a count badge. */
function StackGlyph({count, color}: {count: number; color: string}) {
  return (
    <View style={{width: 30, height: 24}}>
      <View
        style={{
          position: 'absolute', left: 8, top: 0, width: 18, height: 20,
          borderRadius: 4, borderWidth: 1.5, borderColor: color, opacity: 0.55,
        }}
      />
      <View
        style={{
          position: 'absolute', left: 2, top: 4, width: 18, height: 20,
          borderRadius: 4, borderWidth: 1.5, borderColor: color, backgroundColor: colors.panel,
        }}
      />
      {count > 0 && (
        <View
          style={{
            position: 'absolute', right: -4, top: -4, minWidth: 16, height: 16, borderRadius: 8,
            backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
          }}>
          <Text style={{color: '#0d1512', fontSize: 10, fontWeight: '700'}}>{count}</Text>
        </View>
      )}
    </View>
  );
}
