import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import Voice from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from '../axiosConfig'; // Adjust this path to your axios config file


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

      <Button
        title="Start Recording"
        onPress={startRecording}
        color="green"
        disabled={isRecording}
      />
      <Button
        title="Stop Recording"
        onPress={stopRecording}
        color="red"
        disabled={!isRecording}
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
});

export default HomeScreen;
