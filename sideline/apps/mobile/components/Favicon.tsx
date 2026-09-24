import React, {useState} from 'react';
import {Image, Text, View} from 'react-native';
import {domainOf, faviconUrl} from '../lib/extract';
import {colors} from '../ui/theme';

/** Site favicon via Google's favicon service, with a letter-tile fallback. */
export function Favicon({url, size = 20}: {url: string; size?: number}) {
  const [failed, setFailed] = useState(false);
  const letter = (domainOf(url)[0] ?? '?').toUpperCase();
  if (failed) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{color: colors.text, fontSize: size * 0.55, fontWeight: '700'}}>{letter}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{uri: faviconUrl(url)}}
      style={{width: size, height: size, borderRadius: size / 4}}
      onError={() => setFailed(true)}
    />
  );
}
