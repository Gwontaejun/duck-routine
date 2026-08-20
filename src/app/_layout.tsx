import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { UserProvider } from '@/entities/user';
import { colors } from '@/shared/config/theme';
import { NotificationListener } from '@/widgets';
import { ToastProvider } from '@/shared/ui/Toast';
import { RoutineProvider } from '@/entities/routine';
import { ResumeSplash } from '@/features/app-splash';
import { NotificationProvider } from '@/entities/notification';
import { RoutineSheetProvider } from '@/features/routine-sheet';

SystemUI.setBackgroundColorAsync(colors.background);

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    'AtoZ-300': require('../../assets/fonts/에이투지체-3Light.otf'),
    'AtoZ-400': require('../../assets/fonts/에이투지체-4Regular.otf'),
    'AtoZ-500': require('../../assets/fonts/에이투지체-5Medium.otf'),
    'AtoZ-600': require('../../assets/fonts/에이투지체-6SemiBold.otf'),
    'AtoZ-700': require('../../assets/fonts/에이투지체-7Bold.otf'),
    'AtoZ-800': require('../../assets/fonts/에이투지체-8ExtraBold.otf'),
    'AtoZ-900': require('../../assets/fonts/에이투지체-9Black.otf'),
  });

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(colors.background);
    NavigationBar.setButtonStyleAsync('dark');
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <BottomSheetModalProvider>
          <NotificationProvider>
            <NotificationListener />
            <UserProvider>
              <RoutineProvider>
                <RoutineSheetProvider>
                  <SafeAreaView
                    edges={['top', 'bottom']}
                    style={{ flex: 1, backgroundColor: colors.background }}
                  >
                    <StatusBar style="dark" />
                    <Stack
                      screenOptions={{
                        animation: 'none',
                        contentStyle: { backgroundColor: colors.background },
                        headerShown: false,
                      }}
                    >
                      <Stack.Screen name="(tabs)" />
                    </Stack>
                    <ResumeSplash />
                  </SafeAreaView>
                </RoutineSheetProvider>
              </RoutineProvider>
            </UserProvider>
          </NotificationProvider>
        </BottomSheetModalProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
