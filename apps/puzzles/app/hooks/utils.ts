export const colorFor = (id: string) => {
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 85%, 65%)`;
};
