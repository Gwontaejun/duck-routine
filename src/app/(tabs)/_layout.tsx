import { Tabs } from 'expo-router';

import { BottomNavigation } from '@/widgets';
import { colors } from '@/shared/config/theme';

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{
        animation: 'fade',
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        transitionSpec: {
          animation: 'timing',
          config: { duration: 180 },
        },
      }}
      tabBar={(props) => <BottomNavigation {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="routine-management" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
