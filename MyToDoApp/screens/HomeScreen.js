import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, BottomNavigation } from 'react-native-paper';
import axios from '../axiosConfig';
import Icon from 'react-native-vector-icons/Ionicons';
import TasksTabNavigator from './TasksTabNavigator';
import ResistanceAnalysisScreen from './ResistanceAnalysisScreen';
import DailyInsightScreen from './DailyInsightScreen';
import NewTaskScreen from './NewTaskScreen'; 

const HomeScreen = ({ navigation }) => {
  const levels = [
    { label: 'Low', energyLevel: 'low' },
    { label: 'Medium', energyLevel: 'medium' },
    { label: 'High', energyLevel: 'high' },
  ];

  const handleSelection = async (energyLevel) => {
    try {
      const response = await axios.get(`/tasks/random?energyLevel=${energyLevel}`);
      if (response.status === 200 && response.data) {
        navigation.navigate('Details', { task: response.data });
      } else {
        Alert.alert('No tasks found', 'No tasks match your current energy level.');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        Alert.alert('No tasks found', 'No tasks match your current energy level.');
      } else {
        console.error("Failed to fetch task:", error.message);
        Alert.alert('Error', 'Failed to fetch tasks. Please try again.');
      }
    }
  };

  const [currentScreen, setCurrentScreen] = useState('main'); 

  const [index, setIndex] = useState(1); 
  const [routes] = useState([
    { key: 'action', title: 'Action', icon: 'rocket-outline' },
    { key: 'allTasks', title: 'Tasks', icon: 'list' },
    { key: 'addTask', title: 'New', icon: 'add-circle' },
    { key: 'analysis', title: 'Analysis', icon: 'analytics' },
    { key: 'insight', title: 'Insight', icon: 'bulb' },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'action':
        return (
          <View style={styles.container}>
            <Text style={styles.title}>How's your energy level right now?</Text>
            <View style={styles.buttonContainer}>
              {levels.map((level, idx) => (
                <Button
                  key={idx}
                  mode="contained"
                  onPress={() => handleSelection(level.energyLevel)}
                  style={styles.levelButton}
                  labelStyle={styles.buttonText}
                >
                  {level.label}
                </Button>
              ))}
            </View>
          </View>
        );
      case 'allTasks':
        return <TasksTabNavigator />; // Render TasksTabNavigator here
      case 'addTask':
        setCurrentScreen('newTask');
        return null;
      case 'analysis':
        return <ResistanceAnalysisScreen goBack={() => setIndex(1)} />;
      case 'insight':
        return <DailyInsightScreen goBack={() => setIndex(1)} />;
      default:
        return null;
    }
  };

  if (currentScreen === 'newTask') {
    return <NewTaskScreen goBack={() => setCurrentScreen('main')} />;
  }

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={(newIndex) => {
        const selectedRoute = routes[newIndex];
        if (selectedRoute.key === 'addTask') {
          setCurrentScreen('newTask');
        } else {
          setIndex(newIndex);
        }
      }}
      renderScene={renderScene}
      renderIcon={({ route, color }) => (
        <Icon name={route.icon} size={24} color={color} />
      )}
      labeled={true}
      barStyle={styles.bottomBar}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5', 
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333', 
  },
  buttonContainer: {
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  levelButton: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#E07D54', 
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff', 
  },
  bottomBar: {
    backgroundColor: '#899481', 
  },
});

export default HomeScreen;
