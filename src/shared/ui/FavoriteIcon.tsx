import { Path, Svg } from 'react-native-svg';

type FavoriteIconProps = {
  active: boolean;
  size?: number;
};

export function FavoriteIcon({ active, size = 24 }: FavoriteIconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="m12 3.2 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3.2Z"
        fill={active ? '#F5AE28' : 'none'}
        stroke="#F5AE28"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}
