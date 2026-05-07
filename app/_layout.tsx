import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Login' }} />
        <Stack.Screen name="(tabs)" options={{ title: 'App' }} />
        <Stack.Screen name="admin" options={{ title: 'Admin Panel', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
