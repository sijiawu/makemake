import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import AllTasksScreen from './AllTasksScreen';
import CompletedTasksScreen from './CompletedTasksScreen';

const Tab = createMaterialTopTabNavigator();

const TasksTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="ToDo"
      screenOptions={{
        tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#304F6D' },
        tabBarActiveTintColor: '#FFE1A0',
        tabBarInactiveTintColor: '#E2F3FD',
        tabBarIndicatorStyle: { backgroundColor: '#E07D54', height: 3 },
        swipeEnabled: false, // Disable the swipe gesture
      }}
    >
      <Tab.Screen name="ToDo" component={AllTasksScreen} options={{ tabBarLabel: 'To do' }} />
      <Tab.Screen name="Done" component={CompletedTasksScreen} options={{ tabBarLabel: 'Done' }} />
    </Tab.Navigator>
  );
};

export default TasksTabNavigator;
