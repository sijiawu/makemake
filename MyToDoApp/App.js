import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider, Appbar, Menu } from 'react-native-paper';
import { View } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import RequestResetScreen from './screens/RequestResetScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import DetailsScreen from './screens/DetailsScreen';
import AllTasksScreen from './screens/AllTasksScreen'; 
import BreakdownScreen from './screens/BreakdownScreen';
import CompletedTasksScreen from './screens/CompletedTasksScreen';
import TaskGenScreen from './screens/TaskGenScreen';
import TackleTaskScreen from './screens/TackleTaskScreen';
import NewTaskScreen from './screens/NewTaskScreen';
import DailyInsightScreen from './screens/DailyInsightScreen';
import ResistanceAnalysisScreen from './screens/ResistanceAnalysisScreen';


import 'react-native-gesture-handler';

const Stack = createStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, []);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleLogout = async () => {
    closeMenu();
    await AsyncStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {isAuthenticated ? (
            <>
              <Stack.Screen
                name="MakeMake"
                options={{
                  headerTitleAlign: 'center',
                  headerTitle: 'MakeMake',
                  headerLeft: () => (
                    <Appbar.Action icon="menu" onPress={openMenu} color="#304F6D" />
                  ),
                  headerRight: () => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Menu
                        visible={menuVisible}
                        onDismiss={closeMenu}
                        anchor={
                          <Appbar.Action
                            icon="dots-vertical"
                            onPress={openMenu}
                            color="#304F6D"
                            style={{ marginRight: 10 }} // Ensure the icon is aligned correctly
                          />
                        }
                        contentStyle={{ marginTop: 40 }} // Offset the menu below the dots
                      >
                        <Menu.Item onPress={handleLogout} title="Logout" />
                        {/* Add more menu items here if needed */}
                      </Menu>
                    </View>
                  ),
                  headerStyle: {
                    backgroundColor: 'transparent', // Make it transparent so it blends with the background
                    elevation: 0, // Remove shadow on Android
                    shadowOpacity: 0, // Remove shadow on iOS
                  },
                  headerTitleStyle: {
                    color: '#304F6D',
                    fontSize: 20, // Adjust as needed
                    fontWeight: 'bold',
                  },
                }}
              >
                {props => <HomeScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
              </Stack.Screen>
              {/* Other screens */}
              <Stack.Screen name="Details" component={DetailsScreen} />
              <Stack.Screen name="All Tasks" component={AllTasksScreen} />
              <Stack.Screen name="Breakdown" component={BreakdownScreen} />
              <Stack.Screen name="TaskGen" component={TaskGenScreen} />
              <Stack.Screen name="CompletedTasks" component={CompletedTasksScreen} />
              <Stack.Screen name="Tackle Task" component={TackleTaskScreen} />
              <Stack.Screen name="New Task" component={NewTaskScreen} />
              <Stack.Screen name="Daily Insight" component={DailyInsightScreen} />
              <Stack.Screen name="Resistance Analysis" component={ResistanceAnalysisScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login">
                {props => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
              </Stack.Screen>
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="RequestReset" component={RequestResetScreen} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
