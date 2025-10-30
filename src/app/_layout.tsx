import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import ErrorBoundary from "@/components/ErrorBoundary";

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Optional: Log to error reporting service
        console.error('App Error:', error);
        console.error('Error Info:', errorInfo);

        // TODO: Example: Send to Sentry, Firebase Crashlytics, etc.
        // Sentry.captureException(error, { contexts: { react: errorInfo } });
      }}
    >
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="category-management"
          options={{
            presentation: 'modal',
            title: 'Learned Categories',
            headerStyle: {
              backgroundColor: '#3498db',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
      </ErrorBoundary>
  );
}
