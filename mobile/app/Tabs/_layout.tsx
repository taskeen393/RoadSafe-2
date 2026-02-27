// app/Tabs/_layout.tsx
import { Tabs } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReportProvider from '../context/reportcontent';
import ChatbotFAB from '../../components/ChatbotFAB';
import { useToast } from '../../components/ToastContext';
import { useTheme } from '../context/ThemeContext';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function Layout() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const checkAuth = async () => {
        try {
          const token = await SecureStore.getItemAsync('token');
          if (isActive) {
            setIsLoggedIn(!!token);
            setIsAuthChecked(true);
          }
        } catch (err) {
          console.log('Auth check error:', err);
          if (isActive) {
            showToast({ type: 'error', title: 'Auth Error', message: 'Failed to verify login. Please try again.' });
            setIsLoggedIn(false);
            setIsAuthChecked(true);
          }
        }
      };
      checkAuth();
      return () => { isActive = false; };
    }, [])
  );

  if (!isAuthChecked) return null;
  if (!isLoggedIn) return null;

  return (
    <ReportProvider>
      <StatusBar barStyle={colors.statusBar} backgroundColor="transparent" translucent />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.tabBarActive,
            tabBarInactiveTintColor: colors.tabBarInactive,
            tabBarStyle: {
              backgroundColor: colors.tabBarBg,
              height: Platform.OS === 'android' ? 68 : 62,
              paddingBottom: insets.bottom + 4,
              marginBottom: 8,
              marginHorizontal: 14,
              borderTopWidth: 0,
              borderRadius: 28,
              shadowColor: colors.tabBarShadow,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 18,
              elevation: 10,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginBottom: Platform.OS === 'android' ? 6 : 3,
            },
            tabBarItemStyle: { paddingVertical: 4 },
          }}
        >
          {/* ═══ 4 VISIBLE TABS ═══ */}
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="feed"
            options={{
              title: 'Feed',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="newspaper-variant-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="track"
            options={{
              title: 'Map',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="map-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="report"
            options={{
              title: 'Alert',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="warning-outline" color={color} size={size} />
              ),
            }}
          />

          {/* ═══ HIDDEN TABS ═══ */}
          <Tabs.Screen name="weather" options={{ href: null }} />
          <Tabs.Screen name="safetytips" options={{ href: null }} />
          <Tabs.Screen name="chatbot" options={{ href: null }} />
          <Tabs.Screen name="account" options={{ href: null }} />
          <Tabs.Screen name="trip" options={{ href: null }} />
        </Tabs>

        {/* ─── Floating AI Chatbot Button ─── */}
        <ChatbotFAB />
      </View>
    </ReportProvider>
  );
}
