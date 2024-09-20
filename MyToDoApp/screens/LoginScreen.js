import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import axios from '../axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation, route, setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (route.params?.message) {
      setSuccessMessage(route.params.message);
    }
  }, [route.params?.message]);

  const handleLogin = async () => {
    // Check if email field is empty
    if (!email) {
      setError('Email cannot be empty.');
      return; // Stop execution if email is empty
    }
  
    // Check if password field is empty
    if (!password) {
      setError('Password cannot be empty.');
      return; // Stop execution if password is empty
    }
  
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      if (res.data.user) {
        await AsyncStorage.setItem('userId', res.data.user._id);  // Store the user ID
        await AsyncStorage.setItem('userEmail', res.data.user.email);  // Store the user email
        setIsAuthenticated(true);  // Update authentication state
      } else {
        throw new Error('User object is missing in the response');
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          setError(err.response.data.msg);  // Show specific error message
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Makemake</Text>
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={text => setEmail(text)}
        style={styles.input}
        mode="outlined"
        theme={{ colors: { primary: '#304F6D' } }} // Apply primary color to input borders
      />
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={text => setPassword(text)}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        theme={{ colors: { primary: '#304F6D' } }} // Apply primary color to input borders
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

      <Button 
        mode="contained" 
        onPress={handleLogin} 
        style={styles.button}
        theme={{ colors: { primary: '#304F6D' } }} // Primary color for button
      >
        Login
      </Button>
      
      <Button 
        mode="text" 
        onPress={() => navigation.navigate('Register')} 
        style={styles.buttonText}
        theme={{ colors: { primary: '#899481' } }} // Secondary button color
      >
        Don't have an account? Register
      </Button>
      
      <Button 
        mode="text" 
        onPress={() => navigation.navigate('RequestReset')} 
        style={styles.buttonText}
        theme={{ colors: { primary: '#899481' } }} // Secondary button color
      >
        Forgot Password?
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#E2F3FD', // Background color from palette
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#E6E1DD', // Input background color
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#304F6D', // Title color from palette
  },
  button: {
    marginTop: 10,
  },
  buttonText: {
    marginTop: 10,
  },
  error: {
    color: '#E07D54', // Error color from palette
    marginBottom: 10,
  },
  success: {
    color: '#4CAF50', // Success color
    marginBottom: 10,
  },
});

export default LoginScreen;
