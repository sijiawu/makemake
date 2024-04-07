import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import axios from '../axiosConfig'; // Adjust this path to your axios config file
import { useNavigation } from '@react-navigation/native';

const AllTasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks/active');
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`/tasks/${taskId}`);
      fetchTasks(); // Refresh the list after deletion
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const markTaskAsCompleted = async (taskId) => {
    try {
      await axios.patch(`/tasks/${taskId}`, { completed: true, completed_at: new Date() });
      fetchTasks(); // Refresh the list to reflect the task is completed
    } catch (error) {
      console.error("Failed to mark task as completed:", error);
    }
  };

  return (
    <View style={styles.container}>
      <SwipeListView
        data={tasks}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7', // Matches the CompletedTasksScreen background
    padding: 10,
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

export default AllTasksScreen;
