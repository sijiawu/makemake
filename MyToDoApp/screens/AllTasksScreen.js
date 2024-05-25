import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import axios from '../axiosConfig';
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
      fetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const markTaskAsCompleted = async (taskId) => {
    try {
      await axios.patch(`/tasks/${taskId}`, { completed_at: new Date() });
      fetchTasks();
    } catch (error) {
      console.error("Failed to mark task as completed:", error);
    }
  };

  const navigateToEdit = (task) => {
    navigation.navigate('Details', { task, isEditMode: true });
  };

  return (
    <View style={styles.container}>
      <SwipeListView
        data={tasks}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => (
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
        )}
        renderHiddenItem={(data, rowMap) => (
          <View style={styles.rowBack}>
            <TouchableOpacity
              style={[styles.backBtn, styles.backBtnEdit]}
              onPress={() => navigateToEdit(data.item)}
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
        rightOpenValue={-180} // Adjust to fit all three buttons
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    padding: 10,
  },
  taskItem: {
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
    width: 60, // Make the buttons narrower
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
});

export default AllTasksScreen;
