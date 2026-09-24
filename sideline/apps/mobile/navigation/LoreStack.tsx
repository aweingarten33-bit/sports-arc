import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {LoreStackParamList} from '../App';
import {LoreScreen} from '../screens/LoreScreen';

const Stack = createNativeStackNavigator<LoreStackParamList>();

export function LoreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={LoreScreen} options={{title: 'Lore'}} />
    </Stack.Navigator>
  );
}
