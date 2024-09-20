import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { IconButton } from 'react-native-paper';
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
              <IconButton icon="pencil" color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backBtn, styles.backBtnDone]}
              onPress={() => markTaskAsCompleted(data.item._id)}
            >
              <IconButton icon="check" color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backBtn, styles.backBtnDelete]}
              onPress={() => deleteTask(data.item._id)}
            >
              <IconButton icon="delete" color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
        rightOpenValue={-180} // Keep the value to fit all three buttons
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2F3FD',
    padding: 10,
  },
  taskItem: {
    backgroundColor: '#E2F3FD',
    padding: 20,
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    borderColor: 'black',
    borderWidth: 1,
  },
  taskTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'black',
    marginBottom: 5,
  },
  taskDetail: {
    fontSize: 14,
    color: 'black',
    marginBottom: 5,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#E2F3FD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
    height: '100%',
    borderWidth: 1,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60, // Keeping the original width
    height: '100%', // Ensuring full height for the buttons
  },
  backBtnEdit: {
    backgroundColor: 'E2F3FD',
    right: 120,
    borderColor: 'black',
    borderRightWidth: 1,
  },
  backBtnDone: {
    backgroundColor: 'E2F3FD',
    right: 60,
    borderColor: 'black',
    borderRightWidth: 1,
  },
  backBtnDelete: {
    backgroundColor: 'E2F3FD',
    right: 0,
  },
});

export default AllTasksScreen;
