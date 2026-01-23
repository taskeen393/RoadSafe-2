import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

// Import auth service and context
import { authService } from '../services';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login: loginContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      console.log(email, password);
      const response = await authService.login({ email, password });

      console.log(response);
      // Transform backend response (id -> _id) to match frontend types
      const user = {
        _id: response.user._id,
        name: response.user.name,
        email: response.user.email,
      };

      // ✅ Save token & user using authService
      await authService.saveAuthCredentials(response.token, user);
      
      // ✅ Update AuthContext
      await loginContext(response.token, user);

      // ✅ Direct to dashboard
      router.replace('/Tabs');

    } catch (error: any) {
      Alert.alert(
        'Login failed',
        error?.msg || error?.message || 'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login</Text>

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

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('./Signup')}>
        <Text style={styles.linkText}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FFF9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E8B57',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    backgroundColor: '#F0FFF0',
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#2E8B57',
    padding: 15,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    marginTop: 15,
    color: '#2E8B57',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
