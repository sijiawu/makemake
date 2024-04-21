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
      const response = await axios.patch(`/tasks/${task._id}`, { title, description, reluctanceScore });
      
      Alert.alert("Success", "Task updated successfully", [
        {
          text: "OK",
          onPress: () => {
            setIsEditMode(false);
            navigation.navigate('Details', { task: response.data });
          }
        }
      ]);

    } catch (error) {
      console.error("Failed to update task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  const deleteTask = async (taskId = task._id) => {
    try {
      await axios.delete(`/tasks/${taskId}`);
      Alert.alert("Success", "Task deleted successfully");
      if (taskId === task._id) {
        navigation.navigate('Home');
      } else {
        fetchTaskDetails(task._id); // Refresh main task details to update subtask list
      }
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
          <Button title="Save" onPress={saveEdits} />
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
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setIsEditMode(true)}>
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => deleteTask(task._id)}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
            {isBrokenDown ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('New Task', { parentId: task._id })}
              >
                <Text style={styles.buttonText}>Add Subtask</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Breakdown', { task: task })}
              >
                <Text style={styles.buttonText}>Break it down!</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={generateGoogleCalendarLink}>
              <Text style={styles.buttonText}>Add to Google Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkmarkButton} onPress={() => markTaskAsCompleted(task._id)}>
              <Text style={styles.checkmarkButtonText}>✔️ Complete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {isBrokenDown && (
        <>
          <Text style={styles.brokenDownTag}>Broken Down</Text>
          <SwipeListView
            data={subtasks}
            keyExtractor={(item) => item._id.toString()}
            renderItem={({ item }) => (
              <View style={styles.taskItemContainer}>
                <TouchableOpacity
                  style={styles.taskItem}
                  onPress={() => navigation.navigate('Details', { task: item })}
                >
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  <Text style={styles.taskDetail}>Description: {item.description}</Text>
                  {item.note && <Text style={styles.taskDetail}>Note: {item.note}</Text>}
                  <Text style={styles.taskDetail}>Reluctance Score: {item.reluctanceScore}</Text>
                </TouchableOpacity>
                {item.completed_at && (
                  <View style={styles.doneStamp}>
                    <Text style={styles.doneText}>DONE</Text>
                  </View>
                )}
              </View>
            )}
            renderHiddenItem={(data, rowMap) => (
              <View style={styles.rowBack}>
                <TouchableOpacity
                  style={[styles.backRightBtn, styles.backRightBtnRight]}
                  onPress={() => deleteTask(data.item._id)}  // Pass the subtask ID to deleteTask
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
  actionContainer: {
    flexDirection: 'row',  // Align buttons horizontally
    flexWrap: 'wrap',      // Allow buttons to wrap to the next line if not enough space
    justifyContent: 'space-around', // Distribute extra space evenly around items
    padding: 10,           // Padding around the container
  },
  actionButton: {
    backgroundColor: '#007AFF', // iOS blue color for buttons
    paddingHorizontal: 10,  // Horizontal padding within the button
    paddingVertical: 5,     // Vertical padding within the button
    margin: 5,              // Margin between buttons
    borderRadius: 5,        // Rounded corners for aesthetics
    minWidth: 90,           // Minimum width for each button
    justifyContent: 'center', // Center the text inside the button
    alignItems: 'center'
  },
  checkmarkButton: {
    backgroundColor: 'green', // Distinct color for the complete action
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 5,
    borderRadius: 5,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkmarkButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
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
  brokenDownTag: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginVertical: 20,
    textAlign: 'center', // Center this tag visually in the screen
  },
  taskItemContainer: {
    flexDirection: 'row',  // Arrange the task and stamp in a row
    alignItems: 'center',  // Center items vertically
    justifyContent: 'space-between',  // Distribute space between the task and the stamp
  },
  taskItem: {
    flex: 1,
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
  doneStamp: {
    top: 0,
    botton: 0,
    padding: 5,
    backgroundColor: 'green',  // Green background for the "DONE" stamp
    borderRadius: 5,  // Rounded corners
  },
  doneText: {
    color: 'white',  // White text
    fontWeight: 'bold',
  },
});

export default DetailsScreen;
