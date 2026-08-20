import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/shared/ui/AppText';

export function AppSplash() {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Image source={require('../../../../assets/images/app-icon.png')} style={styles.icon} />
      <Text style={styles.name}>Duck Routine</Text>
      <Text style={styles.message}>작은 시작을 함께해요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { borderRadius: 28, height: 128, overflow: 'hidden', width: 128 },
  message: { color: '#817A71', fontSize: 14, fontWeight: '500' },
  name: { color: '#24211D', fontSize: 25, fontWeight: '800', marginTop: 18 },
  screen: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 28,
  },
});
