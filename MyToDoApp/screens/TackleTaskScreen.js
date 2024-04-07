import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from '../axiosConfig';

const TackleTaskScreen = ({ navigation }) => {
  const energyLevels = [
    { label: 'Low Energy', energyLevel: 'low' },
    { label: 'Medium Energy', energyLevel: 'medium' },
    { label: 'High Energy', energyLevel: 'high' },
  ];

  // Adjust this path to your axios config file

  const handleEnergySelection = async (energyLevel) => {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling right now?</Text>
      <View style={styles.buttonContainer}>
        {energyLevels.map((level, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={() => handleEnergySelection(level.energyLevel)}
          >
            <Text style={styles.buttonText}>{level.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 20,
    width: '30%', // Ensure buttons are spaced out evenly
    alignItems: 'center',
    marginHorizontal: 5, // Add horizontal margin for spacing
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TackleTaskScreen;
