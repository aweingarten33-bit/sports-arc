import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../ui/theme';

/**
 * Floating bottom-right pill toggling between the AI answer and the page.
 * Left segment = Scout (AI), right segment = page. Active segment is tinted.
 */
export function ScoutFab({panelOpen, onToggle}: {panelOpen: boolean; onToggle: () => void}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={panelOpen ? 'Back to page' : 'Ask Scout about this page'}
      onPress={onToggle}
      style={{
        position: 'absolute',
        right: 16,
        bottom: 84,
        flexDirection: 'row',
        backgroundColor: colors.panel,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 4,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 2},
        elevation: 6,
      }}>
      <View
        style={{
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: !panelOpen ? colors.accent : 'transparent',
        }}>
        <Text style={{fontSize: 16, fontWeight: '700', color: !panelOpen ? '#0d1512' : colors.muted}}>✦</Text>
      </View>
      <View
        style={{
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: panelOpen ? colors.accent : 'transparent',
        }}>
        <Text style={{fontSize: 16, fontWeight: '700', color: panelOpen ? '#0d1512' : colors.muted}}>▭</Text>
      </View>
    </TouchableOpacity>
  );
}
