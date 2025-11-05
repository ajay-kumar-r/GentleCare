import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export default function CustomCard({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    // elevation for Android
    elevation: 3,
    // shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
});
