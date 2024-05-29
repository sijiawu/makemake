import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { useFocusEffect } from '@react-navigation/native';
import axios from '../axiosConfig';

const DetailsScreen = ({ route, navigation }) => {
  const { task, isEditMode: initialIsEditMode = false } = route.params;
  const [taskDetails, setTaskDetails] = useState(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [reluctanceScore, setReluctanceScore] = useState(task.reluctanceScore);
  const [subtasks, setSubtasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrokenDown, setIsBrokenDown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(initialIsEditMode);

  const adjustScore = (adjustment) => {
    const newScore = Math.max(1, Math.min(reluctanceScore + adjustment, 5));
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
            navigation.navigate('Details', { task: response.data, isEditMode: false });
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
        fetchTaskDetails(task._id);
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

      const subtasksResponse = await axios.get(`/tasks/subtasks/${taskId}`);
      if (subtasksResponse.data && subtasksResponse.data.length > 0) {
        setSubtasks(subtasksResponse.data);
        setIsBrokenDown(true);
      } else {
        setSubtasks([]);
        setIsBrokenDown(false);
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

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        fetchTaskDetails(task._id);
        navigation.setParams({ refresh: false });
      }
    }, [route.params?.refresh, task._id])
  );

  async function markTaskAsCompleted(taskId) {
    try {
      // Patch the task to mark it as completed
      await axios.patch(`/tasks/${taskId}`, { completed_at: new Date() });
  
      // Check if it's a subtask
      const isSubtask = subtasks.some(subtask => subtask._id === taskId);
  
      if (isSubtask) {
        // Check if all other subtasks are completed
        const allSubtasksCompleted = subtasks.every(subtask => subtask.completed_at || subtask._id === taskId);
  
        if (allSubtasksCompleted) {
          Alert.alert(
            "All Subtasks Completed",
            "Looks like you've completed all the subtasks! Would you like to mark the task as completed?",
            [
              {
                text: "No",
                onPress: () => {
                  // Reload the page to reflect the changes
                  fetchTaskDetails(task._id);
                }
              },
              {
                text: "Yes",
                onPress: () => {
                  // Mark the parent task as completed
                  markTaskAsCompleted(task._id);
                }
              }
            ]
          );
        } else {
          // Reload the page to reflect the changes
          fetchTaskDetails(taskId);
        }
      } else {
        // Navigate to the CompletedTasks screen for the main task
        navigation.navigate('CompletedTasks');
      }
    } catch (error) {
      console.error("Failed to mark task as completed:", error);
    }
  }
  

  const navigateToEditSubtask = (subtask) => {
    navigation.navigate('Details', { task: subtask, isEditMode: true });
  };

  return (
    <View style={styles.container}>
      {isEditMode ? (
        <>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Task Title" />
          <TextInput style={styles.input} value={description} multiline onChangeText={setDescription} placeholder="Description" />
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
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('New Task', { parentId: task._id })}
              >
                <Text style={styles.buttonText}>Add Subtask</Text>
              </TouchableOpacity>
            {!isBrokenDown && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Breakdown', { task })}
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
                  activeOpacity={1}
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
                  style={[styles.backBtn, styles.backBtnEdit]}
                  onPress={() => navigateToEditSubtask(data.item)}
                >
                  <Text style={styles.backTextWhite}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.backBtn, styles.backBtnDone]}
                  onPress={() => markTaskAsCompleted(data.item._id)}
                >
                  <Text style={styles.backTextWhite}>Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.backBtn, styles.backBtnDelete]}
                  onPress={() => deleteTask(data.item._id)}
                >
                  <Text style={styles.backTextWhite}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
            rightOpenValue={-180}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  scoreAdjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  scoreButton: {
    backgroundColor: '#007bff',
    borderRadius: 50,
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonText: {
    color: '#ffffff',
    fontSize: 24,
  },
  score: {
    fontSize: 20,
    width: 60,
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 5,
    borderRadius: 5,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkButton: {
    backgroundColor: 'green',
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 5,
    borderRadius: 5,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
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
  brokenDownTag: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginVertical: 20,
    textAlign: 'center',
  },
  taskItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
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
    color: '#666666',
    marginBottom: 5,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
    height: '100%',
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
  },
  backBtnEdit: {
    backgroundColor: '#3B82F6',
    right: 120,
  },
  backBtnDone: {
    backgroundColor: 'green',
    right: 0,
  },
  backBtnDelete: {
    backgroundColor: 'red',
    right: 60,
  },
  backTextWhite: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  doneStamp: {
    top: 0,
    bottom: 0,
    padding: 5,
    backgroundColor: 'green',
    borderRadius: 5,
  },
  doneText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DetailsScreen;
