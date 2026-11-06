import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileAuth } from '../src/context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useMobileAuth();

  useEffect(() => {
    if (!isLoading) {
      router.replace('/(tabs)');
    }
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFBC00" />
      <Text style={styles.title}>MINISTÈRE ESPRIT & VIE</Text>
      <Text style={styles.subtitle}>Chargement de la plateforme...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#091338',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 2,
    marginTop: 20,
  },
  subtitle: {
    color: '#FFBC00',
    fontSize: 12,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

