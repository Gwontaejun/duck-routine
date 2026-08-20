const createTimeOptions = (length: number, start = 0) =>
  Array.from({ length }, (_, index) => {
    const value = index + start;

    return { label: String(value).padStart(2, '0'), value };
  });

export const minuteOptions = createTimeOptions(60);
export const twelveHourOptions = createTimeOptions(12, 1);
export const periodOptions = [
  { label: '오전', value: 'AM' },
  { label: '오후', value: 'PM' },
] as const;
