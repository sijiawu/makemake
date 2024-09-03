import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import axios from '../axiosConfig';

const NewTaskScreen = ({ goBack, route }) => {
  const { parentId } = route?.params || {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reluctanceScore, setReluctanceScore] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }

    setLoading(true);
    const taskData = {
      title,
      description,
      reluctanceScore,
    };

    try {
      let response;
      if (parentId) {
        response = await axios.post(`/tasks/${parentId}/saveSubtasks`, { subtasks: [taskData] });
      } else {
        response = await axios.post('/tasks/saveTasks', { tasks: [taskData] });
      }

      if (response.status === 201) {
        Alert.alert('Success', 'Task created successfully.');
        goBack();
      } else {
        Alert.alert('Error', 'Failed to create task.');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      Alert.alert('Error', 'An error occurred while creating the task.');
    } finally {
      setLoading(false);
    }
  };

  const adjustScore = (amount) => {
    setReluctanceScore((prevScore) => Math.max(1, Math.min(prevScore + amount, 5)));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create New Task</Text>
        <TextInput
          label="Task Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          mode="outlined"
          theme={{ colors: { primary: '#304F6D' } }} // Dark blue border
        />
        <TextInput
          label="Task Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={4}
          theme={{ colors: { primary: '#304F6D' } }} // Dark blue border
        />
        <View style={styles.scoreAdjustmentContainer}>
          <Button
            mode="contained"
            onPress={() => adjustScore(-1)}
            style={styles.scoreButton}
            labelStyle={styles.scoreButtonLabel}
            contentStyle={styles.scoreButtonContent}
            compact={true}
          >
            -
          </Button>
          <View style={styles.scoreDisplayContainer}>
            <Text style={styles.scoreLabel}>Reluctance Score</Text>
            <Text style={styles.score}>{reluctanceScore}</Text>
          </View>
          <Button
            mode="contained"
            onPress={() => adjustScore(1)}
            style={styles.scoreButton}
            labelStyle={styles.scoreButtonLabel}
            contentStyle={styles.scoreButtonContent}
            compact={true}
          >
            +
          </Button>
        </View>
        <Button
          mode="contained"
          onPress={handleCreateTask}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Create Task
        </Button>
        <Button mode="text" onPress={goBack} style={styles.backButton} labelStyle={styles.backButtonLabel}>
          Back
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6E1DD', // Light grayish background
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#304F6D', // Dark blue
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#E2F3FD', // Light blue background for inputs
  },
  scoreAdjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scoreButton: {
    backgroundColor: '#E07D54', // Accent color for buttons
    borderRadius: 8, // Softer rounded edges
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonLabel: {
    fontSize: 18, // Slightly smaller for better balance
    color: '#FFFFFF', // White text
  },
  scoreButtonContent: {
    paddingVertical: 0,
  },
  scoreDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#899481', // Neutral color for the label
    marginBottom: 5,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#304F6D', // Dark blue for score number
  },
  button: {
    marginVertical: 10,
    backgroundColor: '#304F6D', // Dark blue for create task button
  },
  backButton: {
    marginTop: 10,
  },
  backButtonLabel: {
    color: '#899481', // Neutral color for back button
  },
});

export default NewTaskScreen;
