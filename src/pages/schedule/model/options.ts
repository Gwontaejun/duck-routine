export const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

export const repeatOptions = [
  { id: 'once', label: '한 번만' },
  { id: 'weekdays', label: '요일 선택' },
  { id: 'range', label: '특정 기간' },
] as const;

export type RepeatType = (typeof repeatOptions)[number]['id'];
