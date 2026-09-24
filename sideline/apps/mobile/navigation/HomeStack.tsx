import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../App';
import {LoreScreen} from '../screens/LoreScreen';
import {DemoScreen} from '../screens/DemoScreen';
import {ChirpScreen} from '../screens/ChirpScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

/** Home = the Lore feed, plus the existing demo screens. */
export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="LoreHome" component={LoreScreen} />
      <Stack.Screen name="WebSearch">{() => <DemoScreen mode="search" />}</Stack.Screen>
      <Stack.Screen name="Article">{() => <DemoScreen mode="article" />}</Stack.Screen>
      <Stack.Screen name="Player">{() => <DemoScreen mode="player" />}</Stack.Screen>
      <Stack.Screen name="PlayerProp">{() => <DemoScreen mode="prop" />}</Stack.Screen>
      <Stack.Screen name="FantasyMatchup">{() => <DemoScreen mode="fantasy" />}</Stack.Screen>
      <Stack.Screen name="Chirp" component={ChirpScreen} />
    </Stack.Navigator>
  );
}
