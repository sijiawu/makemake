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
  const analysisAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAnalysisAndTasks();
  }, []);

  const fetchAnalysisAndTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/resistanceAnalysis');
      const { tasks, message } = response.data;

      setHighReluctanceTasks(tasks || []);
      setAnalysis(message);
      setLoading(false);

      animateAnalysis(message);
    } catch (error) {
      console.error('Failed to fetch resistance analysis:', error);
      setLoading(false);
    }
  };

  const animateAnalysis = (analysisMessage) => {
    setDisplayedAnalysis('');
    analysisAnim.setValue(0);

    Animated.timing(analysisAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    setDisplayedAnalysis(analysisMessage);
  };

  const renderTaskItem = ({ item }) => {
    return (
      <View style={styles.taskItem}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        {item.description && <Text style={styles.taskDescription}>{item.description}</Text>}
        {item.note && <Text style={styles.taskNote}>{item.note}</Text>}
        <Text style={styles.taskScore}>Reluctance Score: {item.reluctanceScore}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loadingIndicator} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.taskListHeader}>Tasks with High Reluctance</Text>
          {highReluctanceTasks.length > 0 && (
            <FlatList
              data={highReluctanceTasks}
              keyExtractor={(item) => item._id.toString()}
              renderItem={renderTaskItem}
              style={styles.taskList}
              scrollEnabled={false}
            />
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
    backgroundColor: '#304F6D', // Darker shade for the analysis screen
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
    paddingVertical: 20, // Adjust padding to position the text higher
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
    backgroundColor: '#899481', // Complementary shade for tasks
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
  },
  taskScore: {
    color: 'white',
    fontSize: 14,
  },
});


export default ResistanceAnalysisScreen;
