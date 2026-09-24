import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {TabsStackParamList} from '../App';
import {BrowserScreen} from '../screens/BrowserScreen';
import {TabSwitcherScreen} from '../screens/TabSwitcherScreen';

const Stack = createNativeStackNavigator<TabsStackParamList>();

/** Tabs = the persistent WebView tab host + the card switcher. */
export function TabsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Browser" component={BrowserScreen} />
      <Stack.Screen name="Switcher" component={TabSwitcherScreen} />
    </Stack.Navigator>
  );
}
