import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#091338' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 16 },
        tabBarStyle: {
          backgroundColor: '#091338',
          borderTopColor: '#1E293B',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFBC00',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Leader',
          tabBarLabel: 'Pilotage',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👑</Text>,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Protocole',
          tabBarLabel: 'Présences',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👥</Text>,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finances',
          tabBarLabel: 'Finances',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💰</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Compte',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}

