import React from 'react';
import { View, Text } from 'react-native';

const MapView = (props) => (
  <View style={[{ backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }, props.style]}>
    <Text>Map not available on web</Text>
    {props.children}
  </View>
);

export const Marker = () => null;
export const Callout = () => null;
export const Polygon = () => null;
export const Polyline = () => null;
export const Circle = () => null;
export const Heatmap = () => null;

export default MapView;
