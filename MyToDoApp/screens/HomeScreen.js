import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Manager</Text>
      
      <Button
        title="View All Tasks"
        onPress={() => navigation.navigate('All Tasks')}
      />
      
      <Button
        title="Tasks By Reluctance Score"
        onPress={() => navigation.navigate('TasksByScore')}
      />
      
      <Button
        title="Random Batch of Tasks"
        onPress={() => navigation.navigate('RandomBatch')}
      />
      
      <Button
        title="View Completed Tasks"
        onPress={() => navigation.navigate('CompletedTasks')}
      />
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
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default HomeScreen;
