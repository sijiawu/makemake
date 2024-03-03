import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native';
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
      const response = await axios.get('/tasks');
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
      await axios.patch(`/tasks/${taskId}`, { completed: true });
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
        leftOpenValue={75}
        rightOpenValue={-150}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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

export default AllTasksScreen;
