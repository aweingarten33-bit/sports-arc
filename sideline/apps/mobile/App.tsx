import React, {useEffect} from 'react';
import {NavigationContainer, type NavigatorScreenParams} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {HomeStack} from './navigation/HomeStack';
import {SitesStack} from './navigation/SitesStack';
import {TabsStack} from './navigation/TabsStack';
import {AppContextProvider} from './state/context';
import {BottomBar} from './components/BottomBar';
import {useTabsStore} from './state/tabs';
import {useMobileStore} from './state/mobile';

export type RootTabs = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Sites: NavigatorScreenParams<SitesStackParamList>;
  Tabs: NavigatorScreenParams<TabsStackParamList>;
  Scout: undefined;
};
export type HomeStackParamList = {LoreHome: undefined; WebSearch: undefined; Article: undefined; Player: undefined; PlayerProp: undefined; FantasyMatchup: undefined; Chirp: undefined};
export type SitesStackParamList = {Tray: undefined};
export type TabsStackParamList = {Browser: undefined; Switcher: undefined};

/**
 * Parked: the dedicated Research stack is unmounted while the Scout panel
 * (bottom-bar item + floating pill) covers research over the current page.
 * Kept so the existing ResearchScreen/AIHomeScreen still compile.
 */
export type ResearchStackParamList = {Home: undefined; Answer: {question: string}};

const Tabs = createBottomTabNavigator<RootTabs>();

/** Scout is an action in the bottom bar, not a destination — renders nothing. */
function ScoutPlaceholder() {
  return null;
}

function BootLoader({children}: {children: React.ReactNode}) {
  const loadTabs = useTabsStore(s => s.load);
  const loadHistory = useMobileStore(s => s.loadHistory);
  useEffect(() => {
    void loadTabs();
    void loadHistory();
  }, [loadTabs, loadHistory]);
  return <>{children}</>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContextProvider>
        <BootLoader>
          <NavigationContainer>
            <Tabs.Navigator
              initialRouteName="Home"
              tabBar={props => <BottomBar {...props} />}
              screenOptions={{headerShown: false}}>
              <Tabs.Screen name="Home" component={HomeStack} />
              <Tabs.Screen name="Sites" component={SitesStack} />
              <Tabs.Screen name="Tabs" component={TabsStack} />
              <Tabs.Screen name="Scout" component={ScoutPlaceholder} />
            </Tabs.Navigator>
          </NavigationContainer>
        </BootLoader>
      </AppContextProvider>
    </SafeAreaProvider>
  );
}
