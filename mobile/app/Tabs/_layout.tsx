// app/Tabs/_layout.tsx
import { Tabs } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReportProvider from '../../context/reportcontent';
import ChatbotFAB from '../../components/ChatbotFAB';
import { useToast } from '../../components/ToastContext';
import { useTheme } from '../../context/ThemeContext';

import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (!user) return null;

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
