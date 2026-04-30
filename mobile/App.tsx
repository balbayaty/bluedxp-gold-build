/**
 * BlueDXP Mobile App
 * React Native application for iOS and Android
 */

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Screens
import DashboardScreen from './src/screens/DashboardScreen'
import WMScreen from './src/screens/WMScreen'
import FinanceScreen from './src/screens/FinanceScreen'
import CRMScreen from './src/screens/CRMScreen'
import SettingsScreen from './src/screens/SettingsScreen'

const Tab = createBottomTabNavigator()
const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: '#000000',
              },
              headerTintColor: '#ffffff',
              tabBarStyle: {
                backgroundColor: '#000000',
                borderTopColor: '#333333',
              },
              tabBarActiveTintColor: '#00D9FF',
              tabBarInactiveTintColor: '#666666',
            }}
          >
            <Tab.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                tabBarIcon: ({ color }) => <Icon name="dashboard" color={color} />,
              }}
            />
            <Tab.Screen
              name="WMS"
              component={WMScreen}
              options={{
                tabBarIcon: ({ color }) => <Icon name="warehouse" color={color} />,
              }}
            />
            <Tab.Screen
              name="Finance"
              component={FinanceScreen}
              options={{
                tabBarIcon: ({ color }) => <Icon name="money" color={color} />,
              }}
            />
            <Tab.Screen
              name="CRM"
              component={CRMScreen}
              options={{
                tabBarIcon: ({ color }) => <Icon name="contacts" color={color} />,
              }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                tabBarIcon: ({ color }) => <Icon name="settings" color={color} />,
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

// Simple icon component (would use react-native-vector-icons in production)
function Icon({ name, color }: { name: string; color: string }) {
  return null // Would render actual icon
}

