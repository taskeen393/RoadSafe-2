// app.tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import Layout from '../Tabs/_layout';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Layout />
    </SafeAreaView>
  );
}
