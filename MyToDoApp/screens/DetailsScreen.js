import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useFocusEffect } from '@react-navigation/native';
import axios from '../axiosConfig'; // Make sure the path is correct based on your project structure

const DetailsScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const [taskDetails, setTaskDetails] = useState(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [subtasks, setSubtasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrokenDown, setIsBrokenDown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const saveEdits = async () => {
    try {
      await axios.patch(`/tasks/${task._id}`, { title, description });
      setIsEditMode(false);
      Alert.alert("Success", "Task updated successfully");
    } catch (error) {
      console.error("Failed to update task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  const deleteTask = async () => {
    try {
      await axios.delete(`/tasks/${task._id}`);
      Alert.alert("Success", "Task deleted successfully");
      navigation.goBack(); // Or navigate to an appropriate screen
    } catch (error) {
      console.error("Failed to delete task:", error);
      Alert.alert("Error", "Failed to delete task");
    }
  };

  const fetchTaskDetails = async (taskId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/tasks/${taskId}`);
      setTaskDetails(response.data);
      setTitle(response.data.title);
      setDescription(response.data.description);

      // Attempt to fetch subtasks
      const subtasksResponse = await axios.get(`/tasks/subtasks/${taskId}`);
      if (subtasksResponse.data && subtasksResponse.data.length > 0) {
        setSubtasks(subtasksResponse.data);
        setIsBrokenDown(true); // The task has subtasks, hence it's broken down.
      } else {
        setSubtasks([]);
        setIsBrokenDown(false); // The task has no subtasks, not considered broken down.
      }
    } catch (error) {
      console.error("Failed to fetch task details:", error);
    } finally {
      setIsLoading(false);
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
      {isEditMode ? (
        <>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />
          <TextInput style={styles.input} value={description} multiline onChangeText={setDescription} />
          <Button title="Save Edits" onPress={saveEdits} />
          <Button title="Cancel" onPress={() => setIsEditMode(false)} />
        </>
      ) : (
        <>
          <Text>Title: {title}</Text>
          <Text>Description: {description}</Text>
          {!isBrokenDown && (
            <>
              <Button title="Edit" onPress={() => setIsEditMode(true)} />
              <Button title="Delete" onPress={deleteTask} />
              <Button
                title="Break it down!"
                onPress={() => navigation.navigate('Breakdown', { task: task })} />
              <TouchableOpacity
                style={styles.checkmarkButton}
                onPress={() => markTaskAsCompleted(task._id)}
              >
                <Text>✔️</Text>
              </TouchableOpacity>
              </>
          )}
        </>
      )}
      {isBrokenDown && (
        <>
          <Text style={styles.brokenDownTag}>Broken Down</Text>
          <SwipeListView
            data={subtasks}
            keyExtractor={(item) => item._id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.taskItem}
                onPress={() => navigation.navigate('Details', { task: item })}
              >
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Text>Description: {item.description}</Text>
                {item.note ? <Text>Note: {item.note}</Text> : null}
                <Text>Completed: {item.completed ? 'Yes' : 'No'}</Text>
              </TouchableOpacity>
            )}
            renderHiddenItem={(data, rowMap) => (
              <View style={styles.rowBack}>
                <TouchableOpacity
                  style={[styles.backRightBtn, styles.backRightBtnRight]}
                  onPress={() => deleteTask(data.item._id)}
                >
                  <Text style={styles.backTextWhite}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.backRightBtn, styles.backRightBtnLeft]}
                  onPress={() => markTaskAsCompleted(data.item._id)}
                >
                  <Text style={styles.backTextWhite}>This is done!</Text>
                </TouchableOpacity>
              </View>
            )}
            rightOpenValue={-150}
          />
        </>
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
  brokenDownTag: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
    fontWeight: 'bold',
  },  
  taskItem: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    padding: 20,
  },
  taskTitle: {
    fontWeight: 'bold',
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: 'red',
    right: 0,
  },
  backRightBtnLeft: {
    backgroundColor: 'green',
    right: 75,
  },
  backTextWhite: {
    color: '#FFF',
  },
});

export default DetailsScreen;
