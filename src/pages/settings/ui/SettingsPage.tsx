import { type ReactNode, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Constants from 'expo-constants';

import { BackHeader } from '@/widgets';
import {
  cancelRoutineNotifications,
  requestRoutineNotificationPermission,
  scheduleRoutineNotifications,
  showAdPrivacyOptions,
} from '@/shared/lib';
import { useUser } from '@/entities/user';
import { useToast } from '@/shared/ui/Toast';
import { useRoutineStore } from '@/entities/routine';
import { AppText as Text } from '@/shared/ui/AppText';
import { colors, screenStyles } from '@/shared/config/theme';
import { AppTextInput } from '@/shared/ui/AppTextInput';
import { FeedbackPressable } from '@/shared/ui/FeedbackPressable';

const privacyPolicyUrl =
  'https://foregoing-rule-020.notion.site/3bd733a4048f80f9bd45eaa7fa79c261?pvs=73';
const termsOfServiceUrl =
  'https://foregoing-rule-020.notion.site/3bd733a4048f805c9aaeec5ac16ec45b?pvs=73';
const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export function SettingsPage() {
  const { routines, saveSchedule, scheduleItems } = useRoutineStore();
  const { name, notificationSettings, setName, setNotificationSettings } = useUser();
  const { showToast } = useToast();
  const [draftName, setDraftName] = useState(name);
  const [isUpdatingRoutineReminders, setIsUpdatingRoutineReminders] = useState(false);
  const nameInputRef = useRef<TextInput>(null);
  const isChanged = draftName.trim() !== name;

  useEffect(() => setDraftName(name), [name]);

  const saveName = () => {
    const nextName = draftName.trim();

    if (!nextName) return;

    setName(nextName);
    nameInputRef.current?.blur();
    showToast('이름을 저장했어요.');
  };

  const toggleRoutineReminders = async () => {
    if (isUpdatingRoutineReminders) return;

    const routineReminders = !notificationSettings.routineReminders;

    setIsUpdatingRoutineReminders(true);
    setNotificationSettings({ ...notificationSettings, routineReminders });

    try {
      if (!routineReminders) {
        await Promise.all(
          scheduleItems.map(async (schedule) => {
            await cancelRoutineNotifications(schedule.notificationIds);
            await saveSchedule({
              ...schedule,
              notificationIds: [],
              notificationSyncPending: false,
            });
          }),
        );
        showToast('루틴 시작 알림을 껐어요.');
        return;
      }

      const permissionGranted = await requestRoutineNotificationPermission();

      if (!permissionGranted) {
        setNotificationSettings({ ...notificationSettings, routineReminders: false });
        showToast('기기 설정에서 알림 권한을 허용해 주세요.');
        return;
      }

      await Promise.all(
        scheduleItems.map(async (schedule) => {
          const routine = routines.find((item) => item.id === schedule.routineId);

          if (!routine) return;

          await cancelRoutineNotifications(schedule.notificationIds);
          const { notificationIds } = await scheduleRoutineNotifications(routine, schedule);

          await saveSchedule({ ...schedule, notificationIds, notificationSyncPending: false });
        }),
      );
      showToast('루틴 시작 알림을 켰어요.');
    } finally {
      setIsUpdatingRoutineReminders(false);
    }
  };

  const openAdPrivacyOptions = async () => {
    const optionsShown = await showAdPrivacyOptions();

    if (!optionsShown) showToast('현재 변경할 광고 개인정보 설정이 없어요.');
  };

  return (
    <ScrollView contentContainerStyle={screenStyles.content} keyboardShouldPersistTaps="handled">
      <BackHeader
        accessibilityLabel="내 정보로 돌아가기"
        onBack={() => router.back()}
        title="설정"
      />

      <SettingSection title="닉네임">
        <View style={styles.nameRow}>
          <AppTextInput
            autoCapitalize="none"
            maxLength={20}
            onChangeText={setDraftName}
            placeholder="이름을 입력하세요"
            placeholderTextColor={colors.muted}
            ref={nameInputRef}
            returnKeyType="done"
            style={styles.input}
            value={draftName}
          />
          <FeedbackPressable
            disabled={!draftName.trim() || !isChanged}
            onPress={saveName}
            style={[
              styles.saveButton,
              (!draftName.trim() || !isChanged) && styles.saveButtonDisabled,
            ]}
          >
            <Text style={styles.saveButtonText}>저장</Text>
          </FeedbackPressable>
        </View>
      </SettingSection>

      <SettingSection title="알림">
        <SettingToggle
          description="등록한 일정 시간에 알려드려요."
          disabled={isUpdatingRoutineReminders}
          enabled={notificationSettings.routineReminders}
          label="루틴 시작 알림"
          onPress={toggleRoutineReminders}
        />
      </SettingSection>

      <SettingSection title="약관 및 정책">
        <PolicyLink label="개인정보처리방침" onPress={() => Linking.openURL(privacyPolicyUrl)} />
        <View style={styles.divider} />
        <PolicyLink label="이용약관" onPress={() => Linking.openURL(termsOfServiceUrl)} />
        <View style={styles.divider} />
        <PolicyLink label="광고 개인정보 설정" onPress={openAdPrivacyOptions} />
      </SettingSection>

      <SettingSection>
        <View style={styles.versionRow}>
          <Text style={styles.settingLabel}>앱 버전</Text>
          <Text style={styles.version}>v{appVersion}</Text>
        </View>
      </SettingSection>
    </ScrollView>
  );
}

function PolicyLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <FeedbackPressable onPress={onPress} style={styles.policyLink}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.policyArrow}>›</Text>
    </FeedbackPressable>
  );
}

function SettingSection({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function SettingToggle({
  description,
  disabled = false,
  enabled,
  label,
  onPress,
}: {
  description: string;
  disabled?: boolean;
  enabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <FeedbackPressable
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled, disabled }}
        disabled={disabled}
        onPress={onPress}
        style={styles.toggleButton}
      >
        <View style={[styles.toggle, enabled && styles.toggleActive]}>
          <View style={[styles.toggleThumb, enabled && styles.toggleThumbActive]} />
        </View>
      </FeedbackPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  divider: { backgroundColor: '#EEEDEA', height: 1, marginVertical: 12 },
  input: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '700', paddingHorizontal: 12 },
  nameRow: { flexDirection: 'row', gap: 8, height: 48 },
  policyArrow: { color: colors.muted, fontSize: 26, fontWeight: '300', lineHeight: 26 },
  policyLink: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  saveButtonDisabled: { backgroundColor: '#D8E0E7' },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  section: { gap: 8 },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginLeft: 2 },
  settingCopy: { flex: 1, gap: 4 },
  settingDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  settingLabel: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  settingRow: { alignItems: 'center', flexDirection: 'row', gap: 14, minHeight: 56 },
  toggle: {
    backgroundColor: '#D8D8D3',
    borderRadius: 99,
    height: 30,
    justifyContent: 'center',
    padding: 3,
    width: 50,
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 54 },
  toggleThumb: { backgroundColor: '#FFFFFF', borderRadius: 99, height: 24, width: 24 },
  toggleThumbActive: { alignSelf: 'flex-end' },
  version: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  versionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 32,
  },
});
