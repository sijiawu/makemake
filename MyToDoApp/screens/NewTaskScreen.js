import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, Button, StyleSheet, SafeAreaView } from 'react-native';
import axios from '../axiosConfig'; // Make sure the path is correct based on your project structure

const NewTaskScreen = ({ route, navigation }) => {
  // States for the task title, description, and reluctance score
  const { parentId } = route.params || {}; // Destructure and default to an empty object if params is undefined
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reluctanceScore, setReluctanceScore] = useState(1);

  // Function to adjust the reluctance score
  const adjustScore = (amount) => {
    const newScore = Math.max(1, Math.min(reluctanceScore + amount, 5)); // Ensure score is between 1 and 5
    setReluctanceScore(newScore);
  };

  const saveTaskOrSubtask = async () => {
    if (!title) {
      Alert.alert("Validation", "Please fill the title field");
      return;
    }

    const taskData = {
      title,
      description,
      reluctanceScore,
    };

    try {
      let response;
      if (parentId) {
        // Save as a subtask under a parent task
        response = await axios.post(`/tasks/${parentId}/saveSubtasks`, { subtasks: [taskData] });
      } else {
        // Save as a new independent task
        response = await axios.post('/tasks/saveTasks', { tasks: [taskData] });
      }
      
      Alert.alert("Success", "Task saved successfully", [
        { text: "OK", onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error) {
      console.error("Failed to save task:", error);
      Alert.alert("Error", "Failed to save task");
    }
  };

  // Cancel and go back to the previous screen
  const cancelNewTask = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Task Title"
      />
      <TextInput
        style={styles.input}
        value={description}
        multiline
        onChangeText={setDescription}
        placeholder="Description"
      />
      <View style={styles.scoreAdjustmentContainer}>
        <TouchableOpacity onPress={() => adjustScore(-1)} style={styles.scoreButton}>
          <Text style={styles.scoreButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.score}>{reluctanceScore}</Text>
        <TouchableOpacity onPress={() => adjustScore(1)} style={styles.scoreButton}>
          <Text style={styles.scoreButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <Button title="Save" onPress={saveTaskOrSubtask} />
      <Button title="Cancel" onPress={cancelNewTask} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2', // Light gray background to soften the overall look
    padding: 10,
    margin: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#ffffff', // White background for the text inputs
  },
  scoreAdjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 40, // Space out the score adjustment buttons
  },
  scoreButton: {
    backgroundColor: '#007bff',
    borderRadius: 50, // Circular buttons
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonText: {
    color: '#ffffff',
    fontSize: 24, // Larger font size for clarity
  },
  score: {
    fontSize: 20,
    width: 60, // Ensure the score text box does not get squished
    textAlign: 'center',
  },
});

export default NewTaskScreen;
