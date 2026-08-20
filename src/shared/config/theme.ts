import { StyleSheet, type TextStyle } from 'react-native';

export const colors = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  ink: '#24211D',
  muted: '#817A71',
  line: '#81817E',
  soft: '#FFF1E7',
  primary: '#FF7A24',
  primaryDark: '#FF7A24',
};

export const fonts = {
  primary: 'AtoZ-400',
  weights: {
    300: 'AtoZ-300',
    400: 'AtoZ-400',
    500: 'AtoZ-500',
    600: 'AtoZ-600',
    700: 'AtoZ-700',
    800: 'AtoZ-800',
    900: 'AtoZ-900',
  },
};

export function getFontFamily(fontWeight?: TextStyle['fontWeight']) {
  const weight = fontWeight === 'bold' ? 700 : Number(fontWeight) || 400;
  const supportedWeight = Math.min(
    900,
    Math.max(300, Math.round(weight / 100) * 100),
  ) as keyof typeof fonts.weights;

  return fonts.weights[supportedWeight] ?? fonts.primary;
}

export const screenStyles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 112, gap: 14 },
  title: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 5 },
  eyebrow: { color: colors.primaryDark, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 12 },
});
