import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import axios from '../axiosConfig'; // Ensure the correct path

const CompletedTasksScreen = () => {
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        const response = await axios.get('/tasks/completed');
        console.log(response)
        setCompletedTasks(response.data);
      } catch (error) {
        console.error("Failed to fetch completed tasks:", error);
      }
    };

    fetchCompletedTasks();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={completedTasks}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            {/* Display other task details */}
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
  },
  taskItem: {
    marginBottom: 10,
    // additional styling
  },
  taskTitle: {
    fontWeight: 'bold',
    // additional styling
  },
  // additional styles
});

export default CompletedTasksScreen;
