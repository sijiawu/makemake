import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Text, Dimensions } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import axios from '../axiosConfig';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(''); // To store selected question
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // To track missing fields
  const [modalVisible, setModalVisible] = useState(false);

  const windowWidth = Dimensions.get('window').width; // Get window width

  // Security questions array
  const securityQuestions = [
    'What is your mother’s maiden name?',
    'What was the name of your first pet?',
    'What was the name of your elementary school?',
    'What is your favorite book?',
    'What is your favorite movie?',
    'What is the name of the town where you were born?',
    'What was your first car?',
    'What was the name of your first employer?',
    'Where did you go on your first vacation?',
    'What was your high school mascot?',
    'What is the name of your best friend from childhood?',
    'What was the first concert you attended?',
    'What is the name of the street you grew up on?',
  ];

  const handleRegister = async () => {
    let errors = {};

    if (!email) errors.email = true;
    if (!password) errors.password = true;
    if (!securityQuestion) errors.securityQuestion = true;
    if (!securityAnswer) errors.securityAnswer = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await axios.post('/api/auth/register', {
        email,
        password,
        securityQuestion,
        securityAnswer,
      });
      navigation.navigate('Login');
    } catch (err) {
      setError('Registration Failed');
      console.log(err.response); // Log the error response from the server
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setFieldErrors((prev) => ({ ...prev, email: false }));
        }}
        style={[styles.input, fieldErrors.email && styles.errorInput]}
        mode="outlined"
        theme={{ colors: { primary: '#304F6D' } }} // Primary color for the input field's border
      />
      {fieldErrors.email && <Text style={styles.errorText}>Email is required</Text>}

      <Text style={styles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setFieldErrors((prev) => ({ ...prev, password: false }));
        }}
        secureTextEntry
        style={[styles.input, fieldErrors.password && styles.errorInput]}
        mode="outlined"
        theme={{ colors: { primary: '#304F6D' } }}
      />
      {fieldErrors.password && <Text style={styles.errorText}>Password is required</Text>}

      <Text style={styles.label}>Security Question</Text>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[styles.dropdown, fieldErrors.securityQuestion && styles.errorInput]}
      >
        <Text style={styles.dropdownText}>
          {securityQuestion || 'Select a Security Question'}
        </Text>
      </TouchableOpacity>
      {fieldErrors.securityQuestion && (
        <Text style={styles.errorText}>Security Question is required</Text>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: windowWidth * 0.9 }]}>
            <Text style={styles.modalTitle}>Choose a Security Question</Text>
            <FlatList
              data={securityQuestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSecurityQuestion(item);
                    setModalVisible(false);
                    setFieldErrors((prev) => ({ ...prev, securityQuestion: false }));
                  }}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <Button
              onPress={() => setModalVisible(false)}
              mode="contained"
              style={styles.closeButton}
              theme={{ colors: { primary: '#E07D54' } }} // Use one of the palette colors
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>

      <Text style={styles.label}>Security Answer</Text>
      <TextInput
        value={securityAnswer}
        onChangeText={(text) => {
          setSecurityAnswer(text);
          setFieldErrors((prev) => ({ ...prev, securityAnswer: false }));
        }}
        style={[styles.input, fieldErrors.securityAnswer && styles.errorInput]}
        mode="outlined"
        theme={{ colors: { primary: '#304F6D' } }}
      />
      {fieldErrors.securityAnswer && (
        <Text style={styles.errorText}>Security Answer is required</Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleRegister}
        style={styles.button}
        theme={{ colors: { primary: '#304F6D' } }}
      >
        Register
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.button}
        theme={{ colors: { primary: '#899481' } }} // Secondary button color
      >
        Already have an account? Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#E2F3FD', // Background color
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#304F6D', // Text color from palette
  },
  input: {
    marginBottom: 10,
  },
  dropdown: {
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#899481', // Dropdown border color
    borderRadius: 8,
    backgroundColor: '#E6E1DD', // Dropdown background color
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#304F6D', // Modal title color
  },
  modalItem: {
    paddingVertical: 10,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 20,
  },
  button: {
    marginTop: 10,
  },
  errorInput: {
    borderColor: '#E07D54', // Error input border color
    borderWidth: 1,
  },
  errorText: {
    color: '#E07D54', // Error text color
    marginBottom: 5,
  },
  error: {
    color: '#E07D54',
    marginBottom: 10,
  },
});

export default RegisterScreen;
