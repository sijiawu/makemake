import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Button, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from '../axiosConfig';

const BreakdownScreen = ({ route }) => {
  const { task } = route.params;
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        // Replace with your actual fetch logic
        const response = await axios.post(`/tasks/${task._id}/breakdown`);
        const data = response.data; // With axios, the JSON response is automatically parsed

        setSubtasks(data.message.map((item, index) => ({ ...item, id: index })));
      } catch (error) {
        console.error("Failed to fetch breakdown:", error);
        Alert.alert("Error", "Failed to fetch breakdown");
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [task._id]);

  const deleteSubtask = (id) => {
    setSubtasks(subtasks.filter(subtask => subtask.id !== id));
  };

  const adjustScore = (id, adjustment) => {
    setSubtasks(subtasks.map(subtask => {
      if (subtask.id === id) {
        const newScore = subtask.reluctanceScore + adjustment;
        return { ...subtask, reluctanceScore: newScore };
      }
      return subtask;
    }));
  };

  const saveSubtasks = async () => {
    try {
      setIsSaving(true); // If you're using a loading state
      console.log("$$$$$$$$$ Saving subtasks! ", subtasks)
      await axios.post(`/tasks/${task._id}/saveSubtasks`, { subtasks });
      Alert.alert("Success", "Subtasks saved successfully");
      navigation.navigate('Details', { task: task, refresh: true });
    } catch (error) {
      console.error("Failed to save subtasks:", error);
      Alert.alert("Error", "Failed to save subtasks");
    } finally {
      setIsSaving(false); // If you're using a loading state
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#0000ff" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {subtasks.map((subtask, index) => (
        <View key={index} style={styles.subtaskContainer}>
          <TextInput
            style={styles.input}
            value={subtask.title}
            onChangeText={(text) => {
              const newSubtasks = [...subtasks];
              newSubtasks[index].title = text;
              setSubtasks(newSubtasks);
            }}
          />
          <View style={styles.scoreAdjustmentContainer}>
            <TouchableOpacity onPress={() => adjustScore(subtask.id, -1)} disabled={subtask.reluctanceScore <= 1}>
              <Text style={[styles.arrow, subtask.reluctanceScore <= 1 && styles.disabledArrow]}>-</Text>
            </TouchableOpacity>
            <Text>{subtask.reluctanceScore}</Text>
            <TouchableOpacity onPress={() => adjustScore(subtask.id, 1)} disabled={subtask.reluctanceScore >= 5}>
              <Text style={[styles.arrow, subtask.reluctanceScore >= 5 && styles.disabledArrow]}>+</Text>
            </TouchableOpacity>
          </View>
          <Button title="X" onPress={() => deleteSubtask(subtask.id)} color="red" />
        </View>
      ))}
      {/* Add the Save button here */}
      <View style={styles.saveButtonContainer}>
        <Button
          title="Save Subtasks"
          onPress={() => saveSubtasks()} // Make sure you have implemented this function
          color="#007AFF" // You can customize the button color as needed
        />
        <Button title="Cancel" onPress={() => navigation.goBack()} />
      </View>
    </ScrollView>
  );  
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
  },
  subtaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginRight: 10,
  },
  scoreAdjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  arrow: {
    padding: 5,
    fontSize: 20,
  },
  disabledArrow: {
    color: 'gray',
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 20, // Add some space at the bottom if needed
  },
});

export default BreakdownScreen;
