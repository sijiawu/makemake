import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Appbar } from 'react-native-paper';
import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation, setIsAuthenticated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      setRecordedText(event.value.join(' '));
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email);
    };
    fetchUserEmail();
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    setRecordedText('');
    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "There was an error starting the voice recognition.");
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      await Voice.stop();
      processVoiceInput(recordedText);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "There was an error stopping the voice recognition.");
    }
  };

  const processVoiceInput = async (transcribedText) => {
    console.log("I hear: ", transcribedText);
    navigation.navigate('TaskGen', { text: transcribedText });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('userId');
    setIsAuthenticated(false);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Makemake" />
        <Button onPress={handleLogout} style={styles.logoutButton}>
          Logout
        </Button>
      </Appbar.Header>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome, {userEmail}!</Text>
        <Button mode="contained" onPress={() => navigation.navigate('All Tasks')} style={styles.button}>
          View All Tasks
        </Button>
        <Button mode="contained" onPress={() => navigation.navigate('Tackle Task')} style={styles.button}>
          Tackle A Task
        </Button>
        <Button mode="contained" onPress={() => navigation.navigate('CompletedTasks')} style={styles.button}>
          View Completed Tasks
        </Button>
        <Button mode="contained" onPress={() => navigation.navigate('Daily Insight')} style={styles.button}>
          Praise me!
        </Button>
        <Button mode="contained" onPress={() => navigation.navigate('Resistance Analysis')} style={styles.button}>
          Analyze My Resistance
        </Button>
        <Button mode="contained" onPress={() => navigation.navigate('New Task')} style={styles.button}>
          New Task: Text
        </Button>

        {isRecording ? (
          <View style={styles.recordingContainer}>
            <Text style={styles.recordingText}>Recording In Progress</Text>
            <Button mode="contained" onPress={stopRecording} style={[styles.button, styles.stopButton]}>
              Stop Recording
            </Button>
          </View>
        ) : (
          <Button mode="contained" onPress={startRecording} style={styles.button}>
            New Task: Voice
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    marginVertical: 10,
  },
  recordingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: 'red',
  },
  logoutButton: {
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default HomeScreen;
