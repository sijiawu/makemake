import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Animated,
  ScrollView
} from 'react-native';
import axios from '../axiosConfig';

const ResistanceAnalysisScreen = ({ navigation }) => {
  const [analysis, setAnalysis] = useState('');
  const [displayedAnalysis, setDisplayedAnalysis] = useState('');
  const [highReluctanceTasks, setHighReluctanceTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const analysisAnim = useRef(new Animated.Value(0)).current; // Animation for analysis message

  useEffect(() => {
    fetchResistanceAnalysis();
  }, []);

  const fetchResistanceAnalysis = async () => {
    setLoading(true);
    try {
      // Fetch high reluctance tasks
      const response = await axios.get('/resistanceAnalysis');
      const tasksData = response.data.tasks || [];
      const analysisMessage = response.data.message || '';
  
      setHighReluctanceTasks(tasksData);
      setAnalysis(analysisMessage);
  
      // Animate text with paragraphs
      setLoading(false);
      animateMessages(analysisMessage);
    } catch (error) {
      console.error('Failed to fetch resistance analysis:', error);
      setLoading(false);
    }
  };

  const animateMessages = (analysisMessage) => {
    setDisplayedAnalysis('');
    analysisAnim.setValue(0);

    Animated.timing(analysisAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    setDisplayedAnalysis(analysisMessage);
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      {item.description && <Text style={styles.taskDescription}>{item.description}</Text>}
      {item.note && <Text style={styles.taskNote}>{item.note}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loadingIndicator} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.taskListHeader}>Tasks with High Reluctance</Text>
          {highReluctanceTasks.length > 0 ? (
            <FlatList
              data={highReluctanceTasks}
              keyExtractor={(item) => item._id.toString()}
              renderItem={renderTaskItem}
              style={styles.taskList}
              scrollEnabled={false} // Disable internal scroll
            />
          ) : (
            <Text style={styles.noTasksMessage}>No tasks with high reluctance found.</Text>
          )}
          <Animated.Text style={[styles.analysisText, { opacity: analysisAnim }]}>
            {displayedAnalysis}
          </Animated.Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#512DAB',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  analysisText: {
    color: 'white',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'left',
    width: '100%',
  },
  taskListHeader: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  taskList: {
    width: '100%',
    marginVertical: 10,
  },
  taskItem: {
    backgroundColor: '#7A4BEB',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  taskTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskDescription: {
    color: 'white',
    fontSize: 14,
  },
  taskNote: {
    color: 'white',
    fontSize: 14,
    fontStyle: 'italic',
  },
  noTasksMessage: {
    color: 'white',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
});

export default ResistanceAnalysisScreen;
