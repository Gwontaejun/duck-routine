import { Path, Svg } from 'react-native-svg';

type TrashIconProps = {
  color?: string;
  size?: number;
};

export function TrashIcon({ color = '#E24A4A', size = 22 }: TrashIconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M4 7h16M10 11v6m4-6v6M9 4h6l1 3H8l1-3Zm-3 3 1 13h10l1-13"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}
