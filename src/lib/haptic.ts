// Haptic feedback utility for mobile devices
export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (!navigator.vibrate) return;

  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [10, 50, 20],
    error: [30, 50, 30, 50, 30],
  };

  navigator.vibrate(patterns[type]);
}
