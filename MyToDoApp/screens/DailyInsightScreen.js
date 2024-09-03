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

const InsightScreen = ({ navigation }) => {
  const [insight, setInsight] = useState('');
  const [displayedInsight, setDisplayedInsight] = useState('');
  const [congratulatoryMessage, setCongratulatoryMessage] = useState('');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation for congratulatory message
  const insightAnim = useRef(new Animated.Value(0)).current; // Animation for insight message

  useEffect(() => {
    fetchInsightsAndTasks();
  }, []);

  const fetchInsightsAndTasks = async () => {
    setLoading(true);
    try {
      // Fetch completed tasks
      const completedResponse = await axios.get('/completedTasks');
      const completedTasksData = completedResponse.data.tasks;
  
      // Fetch created tasks count
      const createdResponse = await axios.get('/createdTasks');
      const createdTasksData = createdResponse.data.tasks;
  
      // Construct congratulatory message
      const completedTasksCount = completedTasksData.length;
      const createdTasksCount = createdResponse.data.tasks.length;
      let congratsMessage = '';
  
      if (completedTasksCount > 0 || createdTasksCount > 0) {
        congratsMessage = (
          <Text style={styles.congratulatoryMessage}>
            Congratulations! You've completed <Text style={styles.highlight}>{completedTasksCount}</Text> tasks today and created <Text style={styles.highlight}>{createdTasksCount}</Text> new tasks.
          </Text>
        );
      }
  
      setCongratulatoryMessage(congratsMessage);
      setCompletedTasks(completedTasksData);
  
      // Fetch daily insight
      const insightResponse = await axios.get('/dailyInsight');
      setInsight(insightResponse.data.message);
  
      // Animate text with paragraphs
      setLoading(false);
      animateMessages(congratsMessage, insightResponse.data.message);
    } catch (error) {
      console.error('Failed to fetch insights and tasks:', error);
      setLoading(false);
    }
  };
  

  const animateMessages = (congratsMessage, insightMessage) => {
    setDisplayedInsight('');
    fadeAnim.setValue(0);
    insightAnim.setValue(0);

    Animated.sequence([
      // Congratulatory message animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Insight message animation
      Animated.timing(insightAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    setDisplayedInsight(insightMessage);
  };

  const renderTaskItem = ({ item }) => {
    const completedTime = new Date(item.completed_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    return (
      <View style={styles.taskItem}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskScore}>Score: {item.reluctanceScore}</Text>
        <Text style={styles.taskTime}>Time: {completedTime}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loadingIndicator} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.taskListHeader}>Today's Completed Tasks</Text>
          {completedTasks.length > 0 && (
            <FlatList
              data={completedTasks}
              keyExtractor={(item) => item._id.toString()}
              renderItem={renderTaskItem}
              style={styles.taskList}
              scrollEnabled={false} // Disable internal scroll
            />
          )}
          <Animated.Text style={[styles.insightText, { opacity: fadeAnim }]}>
            {congratulatoryMessage}
          </Animated.Text>
          <Animated.Text style={[styles.insightText, { opacity: insightAnim }]}>
            {displayedInsight}
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
    backgroundColor: '#E07D54',
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
  insightText: {
    color: 'white',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'left',
    width: '100%',
  },
  highlight: {
    color: '#FFD700', // Highlight color (e.g., gold)
    fontWeight: 'bold',
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
    backgroundColor: '#FFD1A0',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  taskTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskScore: {
    color: 'white',
    fontSize: 14,
  },
  taskTime: {
    color: 'white',
    fontSize: 14,
  },
});

export default InsightScreen;
