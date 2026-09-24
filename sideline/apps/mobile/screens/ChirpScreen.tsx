import React from 'react';
import {ScrollView, Text, View} from 'react-native';
import {chirp, mockChangeEvents, type ChirpNotification} from '@sideline/config';
import {mockUserContext, privacyStore} from '../state/privacy';
import {styles} from '../ui/theme';

// In-app Chirp surface only. No push infrastructure, no scheduler —
// milestone 1 renders example notifications from mock ChangeEvents.
export function ChirpScreen() {
  const notes: ChirpNotification[] = mockChangeEvents
    .map(e => chirp(e, mockUserContext, privacyStore.preferences))
    .filter((n): n is ChirpNotification => n !== null);

  return (
    <ScrollView style={styles.root}>
      <Text style={styles.title}>Chirp</Text>
      <Text style={[styles.muted, {marginBottom: 12}]}>
        Hyper-personal fan notifications, rendered in-app from mock change events. No push yet.
      </Text>
      {notes.length === 0 && (
        <Text style={styles.muted}>Notifications are off — enable them in privacy settings to see Chirps.</Text>
      )}
      {notes.map(n => (
        <View key={n.eventId} style={styles.card}>
          <Text style={[styles.body, {fontWeight: '700', marginBottom: 6}]}>{n.title}</Text>
          <Text style={styles.body}>{n.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
