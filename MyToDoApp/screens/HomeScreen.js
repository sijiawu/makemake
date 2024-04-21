import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Voice from '@react-native-voice/voice';

const HomeScreen = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState(''); // Store the recorded text here

  useEffect(() => {
    Voice.onSpeechResults = (event) => {
      // Continuously update the recordedText state with new speech results
      setRecordedText(event.value.join(' '));
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    setRecordedText(''); // Reset recorded text at the start of a new recording session
    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "There was an error starting the voice recognition.");
      setIsRecording(false); // Ensure recording state is reset on error
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      await Voice.stop();
      // After stopping, you can process the recorded text.
      // Move the processing logic here to use the final recorded text
      processVoiceInput(recordedText);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "There was an error stopping the voice recognition.");
    }
  };

  const processVoiceInput = async (transcribedText) => {
    console.log("I hear: ", transcribedText)
    navigation.navigate('TaskGen', { text: transcribedText })
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Makemake</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('All Tasks')}>
        <Text style={styles.buttonText}>View All Tasks</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Tackle Task')}>
        <Text style={styles.buttonText}>Tackle A Task</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CompletedTasks')}>
        <Text style={styles.buttonText}>View Completed Tasks</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.recordButton, styles.startButton]} onPress={() => navigation.navigate('New Task')}>
        <Text style={styles.buttonText}>New Task: Text</Text>
      </TouchableOpacity>

      {isRecording ? (
        <View style={styles.bottomContainer}>
          <Text style={styles.recordingTag}>Recording In Progress</Text>
          <TouchableOpacity style={[styles.recordButton, styles.stopButton]} onPress={stopRecording}>
            <Text style={styles.recordButtonText}>Stop Recording</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.recordButton, styles.startButton]} onPress={startRecording}>
          <Text style={styles.recordButtonText}>New Task: Voice</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  bottomContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  recordButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    width: '60%',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: 'green',
  },
  stopButton: {
    backgroundColor: 'red',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
  },
  recordingTag: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
    marginVertical: 20,
    textAlign: 'center',
  },
});

export default HomeScreen;
