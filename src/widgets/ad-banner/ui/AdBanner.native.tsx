import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { colors } from '@/shared/config/theme';
import { initializeMobileAds } from '@/shared/lib';
import { AppText as Text } from '@/shared/ui/AppText';

const adMode = process.env.EXPO_PUBLIC_AD_MODE;
const useTestAd = __DEV__ || (adMode ? adMode !== 'production' : Updates.channel !== 'production');
const bannerUnitId =
  useTestAd
    ? TestIds.BANNER
    : Platform.OS === 'ios'
      ? 'ca-app-pub-6204548244998320/4650961919'
      : 'ca-app-pub-6204548244998320/9839709416';

export function AdBanner() {
  const [adsReady, setAdsReady] = useState(false);
  const [bannerWidth, setBannerWidth] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    void initializeMobileAds().then((ready) => {
      if (mounted) setAdsReady(ready);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const width = Math.round(nativeEvent.layout.width);

    setBannerWidth((currentWidth) => (currentWidth === width ? currentWidth : width));
  };

  return (
    <View onLayout={handleLayout} style={styles.container}>
      <View pointerEvents="none" style={styles.placeholder}>
        <Text style={styles.label}>{loadError ? '광고를 불러오지 못했어요.' : 'AD'}</Text>
      </View>
      {adsReady && bannerWidth > 0 && (
        <View style={styles.bannerLayer}>
          <BannerAd
            onAdFailedToLoad={(error) => {
              console.warn('AdMob banner failed to load:', error);
              setLoadError(true);
            }}
            onAdLoaded={() => setLoadError(false)}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            unitId={bannerUnitId}
            width={bannerWidth}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FAFAF9',
    borderColor: colors.line,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 12,
    width: '100%',
    overflow: 'hidden',
  },
  bannerLayer: { alignSelf: 'center', position: 'absolute', top: 0 },
  label: { color: '#AAA49B', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  placeholder: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
  },
});
