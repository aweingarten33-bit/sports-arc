import React from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../ui/theme';

export interface PageMenuActions {
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  isSportsbook: boolean;
  sportsbookName: string | null;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onShare: () => void;
  onReader: () => void;
  onOpenExternally: () => void;
  onOpenInSportsbookApp: () => void;
  onCloseTab: () => void;
  onDismiss: () => void;
}

/**
 * Page menu bottom sheet (the ^ chevron): per-tab controls live here —
 * back, forward, reload/stop, share, reader mode, external open, and the
 * sportsbook hand-off. Betting hand-off deep-links OUT to the native
 * sportsbook app; no wagers are ever completed in-app.
 */
export function PageMenu(props: PageMenuActions & {visible: boolean}) {
  const {visible, onDismiss} = props;
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}} onPress={onDismiss} activeOpacity={1}>
        <View
          style={{
            marginTop: 'auto',
            backgroundColor: colors.panel,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderTopWidth: 1,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
            paddingTop: 8,
          }}>
          <View style={{alignItems: 'center', paddingVertical: 8}}>
            <View style={{width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border}} />
          </View>
          {props.isSportsbook && (
            <MenuRow
              label={`Open in ${props.sportsbookName ?? 'sportsbook'} app ›`}
              highlight
              onPress={() => {
                onDismiss();
                props.onOpenInSportsbookApp();
              }}
            />
          )}
          <MenuRow label="‹ Back" disabled={!props.canGoBack} onPress={() => {onDismiss(); props.onBack();}} />
          <MenuRow label="Forward ›" disabled={!props.canGoForward} onPress={() => {onDismiss(); props.onForward();}} />
          {props.loading ? (
            <MenuRow label="■ Stop loading" onPress={() => {onDismiss(); props.onStop();}} />
          ) : (
            <MenuRow label="⟳ Reload" onPress={() => {onDismiss(); props.onReload();}} />
          )}
          <MenuRow label="⤴ Share page" onPress={() => {onDismiss(); props.onShare();}} />
          <MenuRow label="☰ Reader mode" onPress={() => {onDismiss(); props.onReader();}} />
          <MenuRow label="↗ Open externally" onPress={() => {onDismiss(); props.onOpenExternally();}} />
          <MenuRow label="✕ Close tab" danger onPress={() => {onDismiss(); props.onCloseTab();}} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function MenuRow({
  label,
  onPress,
  disabled,
  danger,
  highlight,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 14,
        opacity: disabled ? 0.35 : 1,
        backgroundColor: highlight ? '#1d2b1f' : 'transparent',
      }}>
      <Text
        style={{
          color: danger ? colors.danger : highlight ? colors.accent : colors.text,
          fontSize: 17,
          fontWeight: highlight ? '700' : '400',
        }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
