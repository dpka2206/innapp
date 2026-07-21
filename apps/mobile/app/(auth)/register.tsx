import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Field, PrimaryButton, Screen, GhostButton } from '../../src/components/ui';
import { useAuth } from '../../src/store/auth';
import { COLORS } from '../../src/theme';
import { ApiError } from '../../src/api/client';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const { isDesktop, width } = useBreakpoint();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const split = isDesktop && width >= 980;

  async function onRegister() {
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Sign up failed';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Sign up failed', msg);
    } finally {
      setLoading(false);
    }
  }

  const brand = (
    <View style={[styles.brandBlock, split && styles.brandBlockSplit]}>
      <View style={styles.mark}>
        <Text style={styles.markLetter}>{name.trim() ? name.trim()[0].toUpperCase() : 'I'}</Text>
      </View>
      <Text style={[styles.brand, width < 400 && { fontSize: 30 }]}>Create account</Text>
      <Text style={styles.tagline}>
        Set up your workspace, then invite editors and clients to the calendar.
      </Text>
    </View>
  );

  const form = (
    <View style={[styles.card, split && styles.cardSplit]}>
      <Field label="Name" value={name} onChangeText={setName} placeholder="Alex" />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@brand.com"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="At least 6 characters"
      />
      <PrimaryButton label="Create account" onPress={onRegister} loading={loading} />
      <GhostButton label="Already have an account? Log in" onPress={() => router.push('/(auth)/login')} />
    </View>
  );

  return (
    <Screen centered maxWidth={split ? 1080 : 480} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, split && styles.scrollSplit]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {split ? (
          <View style={styles.splitRow}>
            {brand}
            {form}
          </View>
        ) : (
          <>
            {brand}
            {form}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
  },
  scrollSplit: { gap: 0 },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
    width: '100%',
  },
  brandBlock: { paddingTop: 8 },
  brandBlockSplit: {
    flex: 1,
    paddingTop: 0,
    paddingRight: 12,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  markLetter: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    color: COLORS.white,
  },
  brand: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 36,
    color: COLORS.white,
    letterSpacing: -1.2,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#A3A3A3',
    marginTop: 8,
    lineHeight: 22,
    maxWidth: 420,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#222',
    width: '100%',
  },
  cardSplit: {
    flex: 1,
    maxWidth: 440,
    padding: 28,
  },
});
