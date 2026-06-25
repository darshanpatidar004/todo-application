import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useAppStore } from '@/store/useAppStore';
import AuthScreen from '@/components/auth-screen';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const token = useAppStore((state) => state.token);

  if (!token) {
    return (
      <ThemeProvider value={DarkTheme}>
        <AuthScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

