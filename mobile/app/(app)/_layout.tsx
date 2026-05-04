import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { Icon } from '@src/ui/Icon';
import { useAuthStore } from '@src/stores/auth.store';

export default function AppTabLayout() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7bd0ff',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: {
          backgroundColor: '#121214',
          borderTopColor: '#3f3f46',
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tableau',
          tabBarIcon: ({ color, size }) => <Icon name="grid" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Matières',
          tabBarIcon: ({ color, size }) => <Icon name="book" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin/index"
        options={{
          title: 'Admin',
          href: isAdmin ? '/admin' : null,
          tabBarIcon: ({ color, size }) => (
            <Icon name="shield-checkmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="admin/schools/index" options={{ href: null }} />
      <Tabs.Screen name="admin/schools/[schoolId]" options={{ href: null }} />
      <Tabs.Screen name="admin/users/index" options={{ href: null }} />
      <Tabs.Screen name="admin/articles/index" options={{ href: null }} />
    </Tabs>
  );
}
