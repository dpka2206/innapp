import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme';

function textOn(bg: string) {
  const hex = (bg || '#000').replace('#', '');
  if (hex.length < 6) return COLORS.white;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? COLORS.black : COLORS.white;
}

export function getInitial(name?: string | null) {
  const t = (name || '').trim();
  return t ? t[0].toUpperCase() : '?';
}

export function InitialAvatar({
  name,
  color = COLORS.lime,
  size = 44,
  style,
}: {
  name?: string | null;
  color?: string;
  size?: number;
  style?: ViewStyle;
}) {
  const bg = color || COLORS.lime;
  const radius = Math.round(size * 0.35);
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: 'DMSans_700Bold',
          fontSize: Math.round(size * 0.42),
          color: textOn(bg),
        }}
      >
        {getInitial(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
