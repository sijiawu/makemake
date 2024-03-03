import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import AllTasksScreen from './screens/AllTasksScreen'; 
import BreakdownScreen from './screens/BreakdownScreen';
import CompletedTasksScreen from './screens/CompletedTasksScreen';

import 'react-native-gesture-handler';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="All Tasks" component={AllTasksScreen} />
        <Stack.Screen name="Breakdown" component={BreakdownScreen} />
        <Stack.Screen name="CompletedTasks" component={CompletedTasksScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
