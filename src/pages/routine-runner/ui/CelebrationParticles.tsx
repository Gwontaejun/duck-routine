import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

type Particle = {
  color: string;
  delay: number;
  left: number;
  shape: 'diamond' | 'dot' | 'spark';
  size: number;
  top: number;
};

const particles: Particle[] = [
  { color: '#FF7A24', delay: 120, left: 8, shape: 'spark', size: 18, top: 56 },
  { color: '#F5AE28', delay: 380, left: 35, shape: 'dot', size: 8, top: 18 },
  { color: '#FFB982', delay: 640, left: 74, shape: 'diamond', size: 9, top: 36 },
  { color: '#F5AE28', delay: 220, left: 112, shape: 'spark', size: 14, top: 4 },
  { color: '#FF7A24', delay: 510, left: 172, shape: 'diamond', size: 8, top: 22 },
  { color: '#F5AE28', delay: 760, left: 220, shape: 'spark', size: 19, top: 48 },
  { color: '#FFB982', delay: 320, left: 250, shape: 'dot', size: 9, top: 96 },
  { color: '#FF7A24', delay: 600, left: 226, shape: 'diamond', size: 8, top: 152 },
  { color: '#F5AE28', delay: 190, left: 180, shape: 'dot', size: 7, top: 178 },
  { color: '#FFB982', delay: 830, left: 118, shape: 'spark', size: 15, top: 188 },
  { color: '#FF7A24', delay: 450, left: 42, shape: 'diamond', size: 9, top: 162 },
  { color: '#F5AE28', delay: 700, left: 12, shape: 'dot', size: 7, top: 118 },
  { color: '#FFB982', delay: 280, left: 22, shape: 'diamond', size: 6, top: 88 },
  { color: '#FF7A24', delay: 940, left: 58, shape: 'spark', size: 12, top: 86 },
  { color: '#F5AE28', delay: 540, left: 84, shape: 'dot', size: 6, top: 8 },
  { color: '#FFB982', delay: 110, left: 144, shape: 'diamond', size: 7, top: 22 },
  { color: '#FF7A24', delay: 690, left: 198, shape: 'spark', size: 13, top: 8 },
  { color: '#F5AE28', delay: 870, left: 242, shape: 'diamond', size: 7, top: 126 },
  { color: '#FFB982', delay: 360, left: 206, shape: 'dot', size: 6, top: 118 },
  { color: '#FF7A24', delay: 1020, left: 164, shape: 'diamond', size: 6, top: 164 },
  { color: '#F5AE28', delay: 430, left: 94, shape: 'spark', size: 12, top: 150 },
  { color: '#FFB982', delay: 970, left: 66, shape: 'dot', size: 7, top: 190 },
  { color: '#FF7A24', delay: 580, left: 6, shape: 'spark', size: 13, top: 146 },
  { color: '#F5AE28', delay: 250, left: 144, shape: 'dot', size: 7, top: 194 },
];

export function CelebrationParticles() {
  return (
    <View pointerEvents="none" style={styles.layer}>
      {particles.map((particle) => (
        <CelebrationParticle key={`${particle.left}-${particle.top}`} {...particle} />
      ))}
    </View>
  );
}

function CelebrationParticle({ color, delay, left, shape, size, top }: Particle) {
  const progress = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + progress.value * 0.55,
    transform: [
      { rotate: `${45 + progress.value * 25}deg` },
      { scale: 0.78 + progress.value * 0.22 },
      { translateY: -progress.value * 9 },
    ],
  }));

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 1000, easing: Easing.in(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        styles.particle,
        shape === 'dot' && styles.dot,
        {
          backgroundColor: shape === 'spark' ? 'transparent' : color,
          height: size,
          left,
          top,
          width: size,
        },
        animatedStyle,
      ]}
    >
      {shape === 'spark' && (
        <Svg height={size} viewBox="0 0 24 24" width={size}>
          <Path d="m12 0 2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0Z" fill={color} />
        </Svg>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: { borderRadius: 99 },
  layer: { height: 204, position: 'absolute', width: 270 },
  particle: {
    alignItems: 'center',
    borderRadius: 3,
    justifyContent: 'center',
    position: 'absolute',
  },
});
