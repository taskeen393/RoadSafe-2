// app/Tabs/_layout.tsx
import { Tabs } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReportProvider from '../context/reportcontent'; // report context

import {
  AntDesign,
  FontAwesome5,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function Layout() {
  const insets = useSafeAreaInsets();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Auth check on focus / mount
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
            Alert.alert('Error', 'Failed to verify login. Please try again.');
            setIsLoggedIn(false);
            setIsAuthChecked(true);
          }
        }
      };

      checkAuth();
      return () => {
        isActive = false;
      };
    }, [])
  );

  // Agar abhi auth check complete nahi hua, kuch render mat karo
  if (!isAuthChecked) return null;

  // Agar login nahi hai, Tabs render mat karo (yahan redirect to login kar sakte ho)
  if (!isLoggedIn) return null; // <-- ya yahan navigation.replace('/auth/login') use kar lo

  return (
    <ReportProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2E8B57',
          tabBarInactiveTintColor: '#777',
          tabBarStyle: {
            backgroundColor: '#fff',
            height: Platform.OS === 'android' ? 70 : 65,
            paddingBottom: insets.bottom + 5,
            marginBottom: 5,
            marginHorizontal: 10,
            borderTopWidth: 0.3,
            borderTopColor: '#ccc',
            borderRadius: 20,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '600',
            marginBottom: Platform.OS === 'android' ? 5 : 3,
          },
          tabBarItemStyle: { paddingVertical: 5 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-multiple-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="weather"
          options={{
            title: 'Weather',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="weather-partly-snowy" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: 'Report',
            tabBarIcon: ({ color, size }) => <AntDesign name="alert" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="track"
          options={{
            title: 'Track',
            tabBarIcon: ({ color, size }) => <Foundation name="map" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="trip"
          options={{
            title: 'Trip',
            tabBarIcon: ({ color, size }) => <FontAwesome5 name="route" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="safetytips"
          options={{
            title: 'Safety Tips',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shield-check" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            title: 'Chatbot',
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="robot" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          }}
        />
      </Tabs>
    </ReportProvider>
  );
}
