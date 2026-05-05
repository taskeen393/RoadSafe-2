import React from 'react';
import { View, Text } from 'react-native';

const MapView = (props: any) => (
  <View style={[{ backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', minHeight: 200 }, props.style]}>
    <Text style={{ color: '#64748b' }}>Map not available on web</Text>
    <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Please use Android/iOS for map features</Text>
    {/* Do not render children (Markers, etc.) as they might crash if relying on native context */}
  </View>
);

export const Marker = (props: any) => null;
export const Heatmap = (props: any) => null;
export const Polyline = (props: any) => null;

export type MapPressEvent = any;

export default MapView;
