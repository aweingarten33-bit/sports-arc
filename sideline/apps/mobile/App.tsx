import React from 'react';
import {NavigationContainer, type NavigatorScreenParams} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ContentStack} from './navigation/ContentStack';
import {ResearchStack} from './navigation/ResearchStack';
import {LoreStack} from './navigation/LoreStack';
import {AppContextProvider} from './state/context';
import {ResearchScreen} from './screens/ResearchScreen';
import {LoreScreen} from './screens/LoreScreen';
import {colors} from './ui/theme';

export type RootTabs = {Content: NavigatorScreenParams<ContentStackParamList>; Research: NavigatorScreenParams<ResearchStackParamList>; Lore: NavigatorScreenParams<LoreStackParamList>};
export type ContentStackParamList = {Browser: undefined; WebSearch: undefined; Article: undefined; Player: undefined; PlayerProp: undefined; FantasyMatchup: undefined; Chirp: undefined};
export type ResearchStackParamList = {Home: undefined; Answer: {question: string}};
export type LoreStackParamList = {Home: undefined};
const Tabs=createBottomTabNavigator<RootTabs>();
export default function App(){return <SafeAreaProvider><AppContextProvider><NavigationContainer><Tabs.Navigator screenOptions={{headerShown:false,tabBarActiveTintColor:colors.accent,tabBarStyle:{backgroundColor:colors.panel,borderTopColor:colors.border}}}><Tabs.Screen name="Content" component={ContentStack}/><Tabs.Screen name="Research" component={ResearchStack}/><Tabs.Screen name="Lore" component={LoreStack}/></Tabs.Navigator></NavigationContainer></AppContextProvider></SafeAreaProvider>}
