import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../components/ToastContext';
import { ProximityAlertProvider } from '../context/ProximityAlertContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ProximityAlertProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="Tabs" />
            </Stack>
          </ProximityAlertProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}