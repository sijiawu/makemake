import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import axios from '../axiosConfig'; // Ensure this path correctly points to your Axios configuration

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

  // Helper function to format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} at ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={completedTasks}
        keyExtractor={item => item._id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDetail}>Completed: {formatDate(item.completed_at)}</Text>
            <Text style={styles.taskDetail}>Reluctance Score: {item.reluctanceScore}</Text>
          </View>
        )}
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
});

export default CompletedTasksScreen;
