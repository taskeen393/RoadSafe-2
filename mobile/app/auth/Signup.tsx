import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import auth service and context
import { authService } from '../services';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const router = useRouter();
  const { login: loginContext } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    setLoading(true);

    try {
      const response = await authService.signup({ name, email, password });

      // Transform backend response (id -> _id) to match frontend types
      const user = {
        _id: response.user.id || response.user._id,
        name: response.user.name,
        email: response.user.email,
      };

      // Store token and user using authService
      await authService.saveAuthCredentials(response.token, user);
      
      // Update AuthContext
      await loginContext(response.token, user);

      Alert.alert('Success', 'Account created!');
      router.replace('/Tabs'); // Redirect to dashboard
    } catch (error: any) {
      const message = error?.msg || error?.message || 'Network error';
      Alert.alert('Signup failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#E8F5E9', '#F9FFF9']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="shield-check" size={60} color="#2E8B57" />
          </View>
          <Text style={styles.appName}>RoadSafe</Text>
          <Text style={styles.tagline}>Stay Safe, Stay Connected</Text>
        </View>

        <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('./login')}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#2E8B57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 15,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginTop: 10,
  },
  tagline: {
    fontSize: 14,
    color: '#4E944F',
    marginTop: 5,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E8B57'
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    backgroundColor: '#F0FFF0',
    padding: 12,
    marginBottom: 15,
    borderRadius: 10
  },
  button: {
    backgroundColor: '#2E8B57',
    padding: 15,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  linkText: {
    marginTop: 15,
    color: '#2E8B57',
    textDecorationLine: 'underline',
    fontWeight: '600'
  },
});
