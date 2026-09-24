import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../ui/theme';

interface PageBarProps {
  tabCount: number;
  onOpenSwitcher: () => void;
  onNewTab: () => void;
  onOpenMenu: () => void;
}

/**
 * Arc-style page bottom bar. Sits above the app tab bar on webview tabs:
 * left = tab-stack icon (opens the switcher), center = + (new tab via the
 * Sites tray), right = ^ chevron (page menu: back/forward/refresh/share…).
 */
export function PageBar({tabCount, onOpenSwitcher, onNewTab, onOpenMenu}: PageBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 20,
        paddingVertical: 10,
      }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Open tab switcher, ${tabCount} tabs`}
        onPress={onOpenSwitcher}
        style={{width: 64, alignItems: 'flex-start', paddingVertical: 6}}>
        <View style={{width: 30, height: 24}}>
          <View
            style={{
              position: 'absolute', left: 8, top: 0, width: 18, height: 20,
              borderRadius: 4, borderWidth: 1.5, borderColor: colors.muted, opacity: 0.55,
            }}
          />
          <View
            style={{
              position: 'absolute', left: 2, top: 4, width: 18, height: 20,
              borderRadius: 4, borderWidth: 1.5, borderColor: colors.text, backgroundColor: colors.background,
            }}
          />
          {tabCount > 0 && (
            <View
              style={{
                position: 'absolute', right: -6, top: -6, minWidth: 16, height: 16, borderRadius: 8,
                backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
              }}>
              <Text style={{color: '#0d1512', fontSize: 10, fontWeight: '700'}}>{tabCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="New tab"
        onPress={onNewTab}
        style={{
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 999,
          paddingHorizontal: 44,
          paddingVertical: 10,
        }}>
        <Text style={{color: colors.text, fontSize: 22, fontWeight: '600'}}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Page menu"
        onPress={onOpenMenu}
        style={{
          width: 64,
          alignItems: 'flex-end',
          paddingVertical: 6,
        }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.panel,
          }}>
          <Text style={{color: colors.text, fontSize: 18, fontWeight: '700'}}>^</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
