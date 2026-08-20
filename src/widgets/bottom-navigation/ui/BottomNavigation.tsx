import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';

import { colors } from '@/shared/config/theme';
import { AppText as Text } from '@/shared/ui/AppText';
import { FeedbackPressable } from '@/shared/ui/FeedbackPressable';
import CreateIcon from '@/shared/ui/icons/CreateIcon.svg';
import HomeIcon from '@/shared/ui/icons/HomeIcon.svg';
import ScheduleIcon from '@/shared/ui/icons/ScheduleIcon.svg';
import ProfileIcon from '@/shared/ui/icons/ProfileIcon.svg';

const items = [
  { href: '/home', label: '홈', Icon: HomeIcon },
  { href: '/schedule', label: '일정', Icon: ScheduleIcon },
  { href: '/routine-management', label: '루틴 관리', Icon: CreateIcon },
  { href: '/profile', label: '내 정보', Icon: ProfileIcon },
] as const;

export function BottomNavigation({ navigation, state }: BottomTabBarProps) {
  return (
    <BlurView
      intensity={28}
      tint="light"
      experimentalBlurMethod="dimezisBlurView"
      style={styles.nav}
    >
      {items.map((item) => {
        const routeIndex = state.routes.findIndex((route) => route.name === item.href.slice(1));
        const route = state.routes[routeIndex];
        const isActive = state.index === routeIndex;

        return (
          <FeedbackPressable
            key={item.href}
            onPress={() => {
              if (!route) return;

              const event = navigation.emit({
                canPreventDefault: true,
                target: route.key,
                type: 'tabPress',
              });

              if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.item}
          >
            <item.Icon
              width={22}
              height={22}
              color={isActive ? colors.primaryDark : colors.muted}
            />
            <Text style={[styles.label, isActive && styles.active]}>{item.label}</Text>
          </FeedbackPressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    bottom: 14,
    left: 64,
    right: 64,
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.7)',
  },
  item: { flex: 1, alignItems: 'center' },
  label: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  active: { color: colors.primaryDark },
});
