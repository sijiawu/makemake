import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Text, TextInput, Button, ScrollView, Alert, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useFocusEffect } from '@react-navigation/native';
import axios from '../axiosConfig'; // Make sure the path is correct based on your project structure

const DetailsScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const [taskDetails, setTaskDetails] = useState(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [reluctanceScore, setReluctanceScore] = useState(task.reluctanceScore);
  const [subtasks, setSubtasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrokenDown, setIsBrokenDown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const adjustScore = (adjustment) => {
    const newScore = Math.max(1, Math.min(reluctanceScore + adjustment, 5)); // Ensure score is between 1 and 5
    setReluctanceScore(newScore);
  };

  const generateGoogleCalendarLink = () => {
    const baseURL = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const text = `&text=${encodeURIComponent(title)}`;
    const details = `&details=${encodeURIComponent(description)}`;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
    const formatDateTime = (date) => {
      const pad = (num) => (num < 10 ? '0' + num : num);
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    };
  
    const dates = `&dates=${formatDateTime(startDate)}/${formatDateTime(endDate)}`;
    const link = `${baseURL}${text}${details}${dates}`;
    Linking.openURL(link).catch(err => console.error('Error opening Google Calendar link', err));
  };

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
      navigation.navigate('Home')
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
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Task Title" />
          <TextInput style={styles.input} value={description} multiline onChangeText={setDescription} placeholder="Description" />
          {/* Display and adjust reluctance score in edit mode */}
          <View style={styles.scoreAdjustmentContainer}>
            <TouchableOpacity onPress={() => adjustScore(-1)} style={styles.scoreButton}>
              <Text style={styles.scoreButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.score}>{reluctanceScore}</Text>
            <TouchableOpacity onPress={() => adjustScore(1)} style={styles.scoreButton}>
              <Text style={styles.scoreButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Button title="Save Edits" onPress={saveEdits} />
          <Button title="Cancel" onPress={() => setIsEditMode(false)} />
        </>
      ) : (
        <>
          <View style={styles.taskContainer}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDetail}>Description: {task.description}</Text>
            {task.note && <Text style={styles.taskDetail}>Note: {task.note}</Text>}
            <Text style={styles.taskDetail}>Reluctance Score: {task.reluctanceScore}</Text>
          </View>
          {!isBrokenDown && (
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setIsEditMode(true)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={deleteTask}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Breakdown', { task: task })}>
                <Text style={styles.buttonText}>Break it down!</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={generateGoogleCalendarLink}>
                <Text style={styles.buttonText}>Generate Google Calendar Event</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkmarkButton} onPress={() => markTaskAsCompleted(task._id)}>
                <Text style={styles.checkmarkButtonText}>✔️ Complete Task</Text>
              </TouchableOpacity>
            </View>
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
                <Text style={styles.taskDetail}>Description: {item.description}</Text>
                {item.note && <Text style={styles.taskDetail}>Note: {item.note}</Text>}
                <Text style={styles.taskDetail}>Reluctance Score: {item.reluctanceScore}</Text>
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
                  <Text style={styles.backTextWhite}>Done!</Text>
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
    backgroundColor: '#f2f2f2', // Light gray background to soften the overall look
    padding: 10,
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
  textArea: {
    minHeight: 120, // Provide ample space for description input
    textAlignVertical: 'top', // Align text to the top for multiline input
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
  actionButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 5,
    elevation: 2, // Shadow effect for Android
    shadowOffset: { width: 1, height: 1 }, // Shadow settings for iOS
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  detailLabel: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
    fontSize: 18,
    color: '#333', // Dark grey for contrast
  },
  detailText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333', // Darker text for better readability
    lineHeight: 24, // Increase line height for better readability
  },
  taskContainer: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGroup: {
    marginTop: 30,
  },
  checkmarkButton: {
    backgroundColor: '#28a745', // Green for the "Complete" action
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  checkmarkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  brokenDownTag: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginVertical: 20,
    textAlign: 'center', // Center this tag visually in the screen
  },
  taskItem: {
    backgroundColor: '#ffffff', // White background for task items
    padding: 20,
    borderRadius: 10, // Rounded corners
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  taskTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  taskDetail: {
    fontSize: 14,
    color: '#666666', // A softer color for details
    marginBottom: 5,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end', // Adjust if necessary to ensure visibility
    marginVertical: 5,
    borderRadius: 10, // Matching the front item's border radius
    overflow: 'hidden', // Ensures the background doesn't spill outside the border radius
    height: '100%', // Make sure it covers the height
  },
  backRightBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: 'red',
    right: 75, // Adjust based on your design. This should be the position of the second button.
  },
  backRightBtnLeft: {
    backgroundColor: 'green',
    right: 0, // This is for the delete button, ensuring it's visible
  },  
  backTextWhite: {
    color: '#FFF',
  },
});

export default DetailsScreen;
