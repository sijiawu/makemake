import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import axios from '../axiosConfig';

const RequestResetScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestReset = async () => {
    try {
      const res = await axios.post('/api/password/request-reset', { email });
      setSecurityQuestion(res.data.securityQuestion);
      setShowQuestion(true);
      setMessage('');
      console.log('Security question displayed');
    } catch (err) {
      setMessage('Error requesting password reset');
    }
  };

  const handleVerifyAnswer = async () => {
    try {
      const res = await axios.post('/api/password/verify-answer', { email, securityAnswer });
      if (res.data.success) {
        setShowNewPassword(true);
        setMessage('');
        console.log('Security answer verified, show new password input');
      } else {
        setMessage('Incorrect security answer');
      }
    } catch (err) {
      setMessage('Error verifying security answer');
    }
  };

  const handleResetPassword = async () => {
    try {
      await axios.post('/api/password/reset-password', { email, newPassword });
      navigation.navigate('Login', { message: 'Password reset successful' });
    } catch (err) {
      console.error('Error resetting password:', err.response ? err.response.data : err.message);  // Log the error for debugging
      setMessage('Error resetting password');
    }
  };

  return (
    <View style={styles.container}>
      {!showQuestion ? (
        <>
          <TextInput
            label="Email"
            value={email}
            onChangeText={text => setEmail(text)}
            style={styles.input}
          />
          <Button mode="contained" onPress={handleRequestReset} style={styles.button}>
            Request Password Reset
          </Button>
        </>
      ) : !showNewPassword ? (
        <>
          <Text style={styles.question}>{securityQuestion}</Text>
          <TextInput
            label="Security Answer"
            value={securityAnswer}
            onChangeText={text => setSecurityAnswer(text)}
            style={styles.input}
          />
          <Button mode="contained" onPress={handleVerifyAnswer} style={styles.button}>
            Submit Answer
          </Button>
        </>
      ) : (
        <>
          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={text => setNewPassword(text)}
            secureTextEntry
            style={styles.input}
          />
          <Button mode="contained" onPress={handleResetPassword} style={styles.button}>
            Reset Password
          </Button>
        </>
      )}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  question: {
    marginTop: 10,
    fontSize: 16,
  },
  message: {
    marginTop: 10,
    color: 'red',
  },
});

export default RequestResetScreen;
