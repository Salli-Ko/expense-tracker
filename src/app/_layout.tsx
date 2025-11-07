import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
