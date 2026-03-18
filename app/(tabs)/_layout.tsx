import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="songs"
        options={{
          title: 'Canciones',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size ?? 24} color={color} />
          ),
          headerRight: () => (
            <Link href="/share-song" asChild>
              <Pressable style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <Ionicons name="add" size={22} color="#007AFF" />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size ?? 24} color={color} />,
        }}
      />
    </Tabs>
  );
}
