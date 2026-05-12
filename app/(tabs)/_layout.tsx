import { Tabs, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, TouchableOpacity, Alert } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  
  const handleLogout = () => {
    const logoutAction = () => {
      setTimeout(() => {
        router.replace('/');
      }, 100);
    };

    if (Platform.OS === 'web') {
      if (window.confirm("¿Estás seguro de que quieres salir?")) {
        logoutAction();
      }
    } else {
      Alert.alert(
        "Cerrar sesión",
        "¿Estás seguro de que quieres salir?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", style: "destructive", onPress: logoutAction }
        ]
      );
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#111827',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: '#FFFFFF',
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleLogout} 
            style={{ 
              marginRight: 15, 
              backgroundColor: '#EF4444', 
              padding: 8, 
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#374151',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
      }}>
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="storefront-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
