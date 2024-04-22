import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import axios from '../axiosConfig';

const InsightScreen = ({ navigation }) => {
  const [insight, setInsight] = useState('');
  const [displayedInsight, setDisplayedInsight] = useState('');

  useEffect(() => {
    fetchInsight();
  }, []);

  const fetchInsight = async () => {
    try {
      const response = await axios.get('/dailyInsight');
      console.log ('Daily insight: ', response);
      setInsight(response.data.message);
      animateText(response.data.message);
    } catch (error) {
      console.error('Failed to fetch daily insight:', error);
    }
  };

  const animateText = (text) => {
    let displayText = '';
    text.split('').forEach((char, index) => {
      setTimeout(() => {
        displayText += char;
        setDisplayedInsight(displayText);
      }, 25 * index);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.insightText}>{displayedInsight}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#512DAB',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto',
  },
  insightText: {
    color: 'white',
    fontSize: 20,
    fontStyle: 'italic',
  }
});

export default InsightScreen;
