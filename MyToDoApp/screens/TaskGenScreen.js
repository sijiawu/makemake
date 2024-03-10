import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Button, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from '../axiosConfig';

const TaskGenScreen = ({ route }) => {
  const { text } = route.params;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBreakdown = async () => {
      console.log("Hello")
      try {
        const response = await axios.post('/voice/tasks', { text })

        const data = response.data; // With axios, the JSON response is automatically parsed

        setTasks(data.message.map((item, index) => ({ ...item, id: index })));
      } catch (error) {
        console.error("Failed to extract tasks:", error);
        Alert.alert("Error", "Failed to extract tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [text]);

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const adjustScore = (id, adjustment) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const newScore = task.reluctanceScore + adjustment;
        return { ...task, reluctanceScore: newScore };
      }
      return task;
    }));
  };

  const saveTasks = async () => {
    try {
      setIsSaving(true); // If you're using a loading state
      console.log("$$$$$$$$$ Saving tasks! ", tasks)
      await axios.post(`/tasks/saveTasks`, { tasks });
      Alert.alert("Success", "Tasks saved successfully");
      navigation.navigate('Home');
    } catch (error) {
      console.error("Failed to save tasks:", error);
      Alert.alert("Error", "Failed to save tasks");
    } finally {
      setIsSaving(false); // If you're using a loading state
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#0000ff" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {tasks.map((task, index) => (
        <View key={index} style={styles.taskContainer}>
          <View style={styles.taskInputContainer}>
            <TextInput
              style={styles.input}
              value={task.title}
              onChangeText={(text) => {
                const newTasks = [...tasks];
                newTasks[index].title = text;
                setTasks(newTasks);
              }}
              multiline
              placeholder="Task title"
            />
          </View>
          <View style={styles.scoreAdjustmentContainer}>
            <TouchableOpacity 
              onPress={() => adjustScore(task.id, -1)} 
              disabled={task.reluctanceScore <= 1}
              style={styles.arrowButton}
            >
              <Text style={[styles.arrow, task.reluctanceScore <= 1 && styles.disabledArrow]}>-</Text>
            </TouchableOpacity>
            <Text style={styles.score}>{task.reluctanceScore}</Text>
            <TouchableOpacity 
              onPress={() => adjustScore(task.id, 1)} 
              disabled={task.reluctanceScore >= 5}
              style={styles.arrowButton}
            >
              <Text style={[styles.arrow, task.reluctanceScore >= 5 && styles.disabledArrow]}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => deleteTask(task.id)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>X</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.saveButtonContainer}>
        <Button
          title="Save Tasks"
          onPress={() => saveTasks()} // Make sure you have implemented this function
          color="#007AFF" // You can customize the button color as needed
        />
        <Button title="Cancel" onPress={() => navigation.goBack()} />
      </View>
    </ScrollView>
  );  
};

const styles = StyleSheet.create({
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the start to accommodate for varying TextInput heights
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
  },
  taskInputContainer: {
    flex: 1, // Allows the text input to grow and fill available space
    borderColor: 'grey',
  },
  input: {
    minHeight: 40, // Minimum height to start with
    textAlignVertical: 'top', // Align text to the top for Android
  },
  scoreAdjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10, // Add some space between the text input and score adjustment
  },
  arrowButton: {
    padding: 5, // Easy to tap
    marginLeft: 5, // Space out the arrows a bit
    marginRight: 5,
  },
  arrow: {
    fontSize: 20,
  },
  disabledArrow: {
    color: 'gray',
  },
  score: {
    minWidth: 20, // Ensure score text doesn't get squished
    textAlign: 'center', // Center the score number
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10, // Space it out from the score adjustment
  },
  deleteButtonText: {
    color: 'black',
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 20, // Add some space at the bottom if needed
  },
});

export default TaskGenScreen;
