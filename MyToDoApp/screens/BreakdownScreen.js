// BreakdownScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

const BreakdownScreen = ({ route }) => {
  const { taskId } = route.params;
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        // Replace the URL with your actual backend endpoint
        const response = await axios.post(`http://localhost:3000/tasks/${taskId}/breakdown`);
        setBreakdown(response.data);
      } catch (error) {
        console.error("Failed to fetch breakdown:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [taskId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      {/* Display the breakdown data here */}
      <Text style={styles.breakdownText}>Breakdown for Task ID: {taskId}</Text>
      {/* Example: Displaying the breakdown result as text */}
      <Text>{JSON.stringify(breakdown, null, 2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  breakdownText: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default BreakdownScreen;
