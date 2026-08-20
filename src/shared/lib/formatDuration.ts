export const formatDuration = (durationSec: number) => {
  const minutes = Math.floor(durationSec / 60);
  const formattedMinutes = String(minutes).padStart(2, '0');

  return `${formattedMinutes}:${String(durationSec % 60).padStart(2, '0')}`;
};

export const formatCompactDuration = (durationSec: number) => {
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);

  if (!hours) return `${minutes}분`;

  return `${(hours + minutes / 60).toFixed(1).replace('.0', '')}시간`;
};
