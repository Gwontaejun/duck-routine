import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppText as Text } from '@/shared/ui/AppText';
import { colors } from '@/shared/config/theme';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { FeedbackPressable } from '@/shared/ui/FeedbackPressable';
import UpdateIcon from '@/assets/images/updateIcon.svg';

import { type AppUpdateInfo, checkForAppUpdate, startAppUpdate } from '../model/appUpdate';

const checkDelay = 1200;
const dismissStorageKey = 'app-update-dismissed';
const remindAfter = 24 * 60 * 60 * 1000;

type DismissedUpdate = {
  dismissedAt: number;
  storeVersion: string;
};

export function AppUpdatePrompt() {
  const checkedRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);
  const [update, setUpdate] = useState<AppUpdateInfo | null>(null);

  useEffect(() => {
    if (checkedRef.current) return;

    checkedRef.current = true;
    const timeout = setTimeout(async () => {
      const nextUpdate = await checkForAppUpdate();

      if (!nextUpdate || (await wasRecentlyDismissed(nextUpdate.storeVersion))) return;

      setUpdate(nextUpdate);
    }, checkDelay);

    return () => clearTimeout(timeout);
  }, []);

  const dismissUpdate = async () => {
    if (!update || update.required) return;

    const dismissed: DismissedUpdate = {
      dismissedAt: Date.now(),
      storeVersion: update.storeVersion,
    };

    setUpdate(null);

    try {
      await AsyncStorage.setItem(dismissStorageKey, JSON.stringify(dismissed));
    } catch (error) {
      console.warn('Update reminder save failed:', error);
    }
  };

  const startUpdate = async () => {
    if (!update || isStarting) return;

    setIsStarting(true);

    try {
      const started = await startAppUpdate(update.required);

      if (started && !update.required) setUpdate(null);
    } catch (error) {
      console.warn('App update start failed:', error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <BottomSheet
      dismissible={!update?.required}
      onClose={() => void dismissUpdate()}
      visible={Boolean(update)}
    >
      <View style={styles.content}>
        <View style={styles.icon}>
          <UpdateIcon height={29} width={29} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>
            {update?.required ? '업데이트가 필요해요' : '새 버전이 준비됐어요'}
          </Text>
          <Text style={styles.description}>
            {update?.required
              ? '원활한 사용을 위해 최신 버전으로 업데이트해 주세요.'
              : '작은 개선과 오류 수정을 담았어요. 지금 업데이트하고 더 편하게 사용해 보세요.'}
          </Text>
        </View>
        <View style={styles.actions}>
          {!update?.required && (
            <FeedbackPressable
              disabled={isStarting}
              onPress={() => void dismissUpdate()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>나중에</Text>
            </FeedbackPressable>
          )}
          <FeedbackPressable
            disabled={isStarting}
            onPress={() => void startUpdate()}
            style={[styles.primaryButton, update?.required && styles.fullButton]}
          >
            <Text style={styles.primaryButtonText}>
              {isStarting ? '확인 중...' : '업데이트'}
            </Text>
          </FeedbackPressable>
        </View>
      </View>
    </BottomSheet>
  );
}

async function wasRecentlyDismissed(storeVersion: string) {
  try {
    const stored = await AsyncStorage.getItem(dismissStorageKey);

    if (!stored) return false;

    const dismissed = JSON.parse(stored) as DismissedUpdate;

    return (
      dismissed.storeVersion === storeVersion && Date.now() - dismissed.dismissedAt < remindAfter
    );
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  content: { gap: 20, paddingBottom: 20, paddingHorizontal: 20 },
  copy: { gap: 7 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  fullButton: { flex: 1 },
  icon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.soft,
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flex: 1.35,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#E8E8E4',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryButtonText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 21, fontWeight: '800' },
});
