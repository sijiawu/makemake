import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Button, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from '../axiosConfig';

const BreakdownScreen = ({ route }) => {
  const { task } = route.params;
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        const response = await axios.post(`/tasks/${task._id}/breakdown`);
        setSubtasks(response.data.message.map((item, index) => ({ ...item, id: index })));
      } catch (error) {
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
        const newScore = Math.max(1, Math.min(subtask.reluctanceScore + adjustment, 5));
        return { ...subtask, reluctanceScore: newScore };
      }
      return subtask;
    }));
  };

  const saveSubtasks = async () => {
    try {
      await axios.post(`/tasks/${task._id}/saveSubtasks`, { subtasks });
      Alert.alert("Success", "Subtasks saved successfully");
      navigation.navigate('Details', { task: task, refresh: true });
    } catch (error) {
      Alert.alert("Error", "Failed to save subtasks");
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
            onChangeText={(text) => setSubtasks(subtasks.map((item, i) => i === index ? { ...item, title: text } : item))}
            multiline
            placeholder="Subtask title"
          />
          <View style={styles.scoreAdjustmentContainer}>
            <TouchableOpacity onPress={() => adjustScore(index, -1)} disabled={subtask.reluctanceScore <= 1}>
              <Text style={[styles.arrow, subtask.reluctanceScore <= 1 && styles.disabledArrow]}>-</Text>
            </TouchableOpacity>
            <Text style={styles.score}>{subtask.reluctanceScore}</Text>
            <TouchableOpacity onPress={() => adjustScore(index, 1)} disabled={subtask.reluctanceScore >= 5}>
              <Text style={[styles.arrow, subtask.reluctanceScore >= 5 && styles.disabledArrow]}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => deleteSubtask(subtask.id)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>X</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.buttonContainer}>
        <Button title="Save Subtasks" onPress={saveSubtasks} color="#007AFF" />
        <Button title="Cancel" onPress={() => navigation.goBack()} color="#6c757d" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f2f2f2',
  },
  subtaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 5,
    paddingHorizontal: 5,
    minHeight: 40,
  },
  scoreAdjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowButton: {
    padding: 5,
  },
  arrow: {
    fontSize: 20,
  },
  disabledArrow: {
    color: '#6c757d',
  },
  score: {
    paddingHorizontal: 10,
  },
  deleteButton: {
    backgroundColor: 'red',
    borderRadius: 5,
    padding: 5,
    marginLeft: 5,
  },
  deleteButtonText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BreakdownScreen;
