import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { COLORS } from '../theme';

export function Screen({
  children,
  style,
  maxWidth = 1100,
  centered,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
  /** Center content vertically (auth screens) */
  centered?: boolean;
}) {
  const { width } = useWindowDimensions();
  const pad = width < 480 ? 16 : width < 900 ? 24 : 32;

  return (
    <View style={[styles.screenOuter, Platform.OS === 'web' && styles.screenOuterWeb]}>
      <View
        style={[
          styles.screen,
          {
            maxWidth,
            paddingHorizontal: pad,
            paddingTop: width < 720 ? 12 : 24,
            paddingBottom: width < 720 ? 16 : 28,
          },
          centered && styles.screenCentered,
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  color = COLORS.lime,
  textColor = COLORS.black,
  disabled,
  compact,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        { backgroundColor: color, opacity: pressed || disabled ? 0.7 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.btnText, compact && styles.btnTextCompact, { color: textColor }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  light,
  align = 'center',
}: {
  label: string;
  onPress: () => void;
  light?: boolean;
  align?: 'left' | 'center';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.ghost, align === 'left' && styles.ghostLeft]}
    >
      <Text style={[styles.ghostText, light && { color: '#4B5563' }]}>{label}</Text>
    </Pressable>
  );
}

/** Left-aligned back control for page headers */
export function BackButton({
  label = 'Back',
  onPress,
}: {
  label?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.backBtn} hitSlop={8}>
      <Text style={styles.backBtnText}>← {label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  autoCapitalize,
  keyboardType,
  light,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  keyboardType?: 'default' | 'email-address' | 'url' | 'numeric';
  light?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, light && styles.labelLight]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize || 'sentences'}
        keyboardType={keyboardType || 'default'}
        style={[
          styles.input,
          light && styles.inputLight,
          multiline && { minHeight: 88, textAlignVertical: 'top' },
        ]}
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color,
  tone = 'onDark',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  tone?: 'onDark' | 'onLight';
}) {
  const onLight = tone === 'onLight';
  const activeBg = color || COLORS.black;
  const needsDarkText = activeBg === COLORS.lime || activeBg === '#C8F53A' || activeBg === '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        onLight && styles.chipOnLight,
        active && {
          backgroundColor: activeBg,
          borderColor: activeBg,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          onLight && styles.chipTextOnLight,
          active && { color: needsDarkText ? COLORS.black : COLORS.white },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CircleIconButton({
  label,
  onPress,
  size = 40,
}: {
  label: string;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.circleText, { fontSize: Math.round(size * 0.42) }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenOuter: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    width: '100%',
  },
  screenOuterWeb: {
    minHeight: '100%',
  },
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.bg,
  },
  screenCentered: {
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 36,
    color: COLORS.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#A3A3A3',
    marginTop: 8,
    lineHeight: 22,
  },
  btn: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  btnCompact: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  btnTextCompact: {
    fontSize: 13,
  },
  ghost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostLeft: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 4,
  },
  ghostText: {
    fontFamily: 'DMSans_500Medium',
    color: '#A3A3A3',
    fontSize: 15,
  },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 8,
  },
  backBtnText: {
    fontFamily: 'DMSans_500Medium',
    color: '#D1D5DB',
    fontSize: 15,
  },
  field: { marginBottom: 14 },
  label: {
    fontFamily: 'DMSans_500Medium',
    color: '#A3A3A3',
    marginBottom: 8,
    fontSize: 13,
  },
  labelLight: {
    color: '#374151',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputLight: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chip: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipOnLight: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  chipText: {
    fontFamily: 'DMSans_500Medium',
    color: COLORS.white,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  chipTextOnLight: {
    color: '#111827',
  },
  circle: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  circleText: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.black,
  },
});
