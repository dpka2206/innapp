import { Stack } from 'expo-router';
import { COLORS } from '../../src/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg, flex: 1 },
      }}
    />
  );
}
