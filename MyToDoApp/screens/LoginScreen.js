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
    console.log('handleLogin called');  // Debugging line
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      console.log('Login successful', res.data);  // Debugging line
      await AsyncStorage.setItem('token', res.data.token);
      if (res.data.user) {
        await AsyncStorage.setItem('userId', res.data.user._id);  // Store the user ID
        await AsyncStorage.setItem('userEmail', res.data.user.email);  // Store the user ID
        setIsAuthenticated(true);  // Update authentication state
      } else {
        throw new Error('User object is missing in the response');
      }
    } catch (err) {
      if (err.response) {
        // Handle known error responses from the backend
        if (err.response.status === 400) {
          setError(err.response.data.msg);  // Show specific error message
        } else {
          setError('An unexpected error occurred. Please try again.');  // General error message
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
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={text => setPassword(text)}
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Login
      </Button>
      <Button mode="text" onPress={() => navigation.navigate('Register')} style={styles.button}>
        Don't have an account? Register
      </Button>
      <Button mode="text" onPress={() => navigation.navigate('RequestReset')} style={styles.button}>
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
  },
  input: {
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  success: {
    color: 'green',
    marginBottom: 10,
  },
});

export default LoginScreen;
