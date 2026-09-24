import React from 'react';
import {ActivityIndicator, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {ResearchAnswer} from '@sideline/research';
import {colors, styles} from '../ui/theme';
import {toParagraphs} from '../lib/extract';

interface ReaderViewProps {
  title: string;
  text: string;
  summary: ResearchAnswer | null;
  summaryLoading: boolean;
  onClose: () => void;
}

/**
 * Arc-style reader/clean-view mode: the page stripped to readable text,
 * with Scout's summary at the top.
 */
export function ReaderView({title, text, summary, summaryLoading, onClose}: ReaderViewProps) {
  const insets = useSafeAreaInsets();
  const paragraphs = toParagraphs(text);
  return (
    <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
        <Text style={{color: colors.muted, fontSize: 13, fontWeight: '700'}}>☰ READER</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{color: colors.accent, fontSize: 16, fontWeight: '600'}}>Done</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 40}}>
        <Text style={[styles.title, {fontSize: 24}]}>{title}</Text>

        <View style={[styles.card, {borderColor: colors.accent}]}>
          <Text style={[styles.muted, {fontWeight: '700', marginBottom: 8}]}>✦ SCOUT SUMMARY</Text>
          {summary ? (
            <Text style={styles.body}>{summary.directAnswer}</Text>
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <ActivityIndicator size="small" color={colors.accent} style={{marginRight: 8}} />
              <Text style={styles.muted}>{summaryLoading ? 'Summarizing…' : 'No summary available.'}</Text>
            </View>
          )}
        </View>

        {paragraphs.length === 0 && !summaryLoading && (
          <Text style={styles.muted}>Couldn't pull readable text from this page.</Text>
        )}
        {paragraphs.map((p, i) => (
          <Text key={i} style={[styles.body, {marginBottom: 14}]}>
            {p}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
