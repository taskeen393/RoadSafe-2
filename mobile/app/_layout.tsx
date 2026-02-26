import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from '../components/ToastContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="Tabs" />
        </Stack>
      </ToastProvider>
    </AuthProvider>
  );
}