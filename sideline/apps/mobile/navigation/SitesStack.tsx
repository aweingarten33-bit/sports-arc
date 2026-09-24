import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {SitesStackParamList} from '../App';
import {SitesTrayScreen} from '../screens/SitesTrayScreen';

const Stack = createNativeStackNavigator<SitesStackParamList>();

/** Sites = the tray launcher that replaces the URL bar. */
export function SitesStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tray" component={SitesTrayScreen} />
    </Stack.Navigator>
  );
}
