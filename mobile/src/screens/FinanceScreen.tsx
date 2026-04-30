/**
 * Finance Screen
 * Financial Management mobile view
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function FinanceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Management</Text>
      <Text style={styles.subtitle}>Mobile view coming soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
  },
})

