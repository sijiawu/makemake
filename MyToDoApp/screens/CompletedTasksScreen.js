import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import axios from '../axiosConfig';
import { SwipeListView } from 'react-native-swipe-list-view';

const CompletedTasksScreen = () => {
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        const response = await axios.get('/tasks/completed');
        setCompletedTasks(response.data);
      } catch (error) {
        console.error("Failed to fetch completed tasks:", error);
      }
    };

    fetchCompletedTasks();
  }, []);

  const undoTaskCompletion = async (taskId) => {
    try {
      await axios.patch(`/tasks/${taskId}`, { completed: false, completed_at: null });
      const updatedTasks = completedTasks.filter(task => task._id !== taskId);
      setCompletedTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to undo task completion:", error);
    }
  };

  return (
    <View style={styles.container}>
      <SwipeListView
        data={completedTasks}
        keyExtractor={item => item._id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskItem}
            activeOpacity={1}
          >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDetail}>Completed: {item.completed_at}</Text>
            <Text style={styles.taskDetail}>Reluctance Score: {item.reluctanceScore}</Text>
          </TouchableOpacity>
        )}
        renderHiddenItem={(data, rowMap) => (
          <View style={styles.rowBack}>
            <TouchableOpacity
              style={[styles.backRightBtn, styles.backRightBtnLeft]}
              onPress={() => undoTaskCompletion(data.item._id)}
            >
              <Text style={styles.backTextWhite}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}
        rightOpenValue={-75}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f7', // Sets a light background color for the screen
  },
  taskItem: {
    backgroundColor: '#ffffff', // Sets a white background for each task item
    padding: 15,
    borderRadius: 10, // Adds rounded corners for the task items
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4, // Adds shadow for Android
  },
  taskTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  taskDetail: {
    fontSize: 14,
    color: '#666', // Uses a softer color for the details
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
  backRightBtnLeft: {
    backgroundColor: 'orange',
    right: 0, // Adjust the position of the button as needed
  },
  backTextWhite: {
    color: '#FFF',
  },
});

export default CompletedTasksScreen;
