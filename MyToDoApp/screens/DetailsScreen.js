import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from '../axiosConfig'; // Make sure the path is correct based on your project structure

const DetailsScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const [taskDetails, setTaskDetails] = useState(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [subtasks, setSubtasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.get(`/tasks/${taskId}`);
      setTaskDetails(response.data);
      if (response.data.brokenDown) {
        const subtasksResponse = await axios.get(`/tasks/subtasks/${taskId}`);
        setSubtasks(subtasksResponse.data);
      } else {
        setSubtasks([]);
      }
    } catch (error) {
      console.error("Failed to fetch task details:", error);
    }
  };

  useEffect(() => {
    fetchTaskDetails(task._id);
  }, [task._id]);

  // TODO: Refresh back from saving subtasks isn't working. Refresh navigating back isn't working either!
  useFocusEffect(
    React.useCallback(() => {
      // If coming back with a refresh flag, refetch the details
      console.log("We are in here! - route.params?.refresh", route.params?.refresh)
      if (route.params?.refresh) {
        fetchTaskDetails(task._id);
        // Optionally reset the refresh flag to avoid unnecessary refreshes
        navigation.setParams({ refresh: false });
      }
    }, [route.params?.refresh, task._id])
  );

  async function markTaskAsCompleted(taskId) {
    try {
      await axios.patch(`/tasks/${taskId}`, { completed: true, completed_at: new Date() });
      navigation.navigate('CompletedTasks');
    } catch (error) {
      console.error("Failed to mark task as completed:", error);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        value={description}
        multiline
        onChangeText={setDescription}
      />
      {/* Conditional rendering based on whether the task is broken down */}
      {!task.brokenDown && (
        <><Button
          title="Break it down!"
          onPress={() => navigation.navigate('Breakdown', { task: task })} />
          <TouchableOpacity
            style={styles.checkmarkButton}
            onPress={() => markTaskAsCompleted(task._id)}
          >
            <Text>✔️</Text>
          </TouchableOpacity></>
      )}

      {/* Display Subtasks if task is broken down */}
      {task.brokenDown && (
        isLoading ? (
          <Text>Loading Subtasks...</Text>
        ) : (
          <FlatList
            data={subtasks}
            keyExtractor={(item) => item._id.toString()}
            renderItem={({ item }) => (
              <View style={styles.subtaskItem}>
                <Text style={styles.subtaskTitle}>{item.title}</Text>
                {/* Add more subtask details as needed */}
              </View>
            )}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
  },
  checkmarkButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#DDDDDD',
    alignItems: 'center',
    borderRadius: 5,
  },
  subtaskItem: {
    marginTop: 10,
    // Add styles for subtask items
  },
  subtaskTitle: {
    // Add styles for subtask titles
  },
  // Add more styles as needed
});

export default DetailsScreen;
