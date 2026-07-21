import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Field, PrimaryButton, Screen, BackButton } from '../../src/components/ui';
import { InitialAvatar } from '../../src/components/InitialAvatar';
import { useAuth } from '../../src/store/auth';
import { COLORS } from '../../src/theme';
import { ApiError } from '../../src/api/client';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      if (Platform.OS === 'web') window.alert('Profile saved');
      else Alert.alert('Saved', 'Profile updated');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not save';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <Screen maxWidth={560}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton label="Projects" onPress={() => router.replace('/(app)')} />
        <Text style={styles.title}>Profile</Text>

        <View style={styles.hero}>
          <InitialAvatar name={name || user?.name} color={COLORS.blue} size={88} />
          <Text style={styles.heroName}>{name || user?.name}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <Field label="Display name" value={name} onChangeText={setName} placeholder="Your name" />
          <Text style={styles.emailLabel}>Email</Text>
          <View style={styles.emailBox}>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
          <Text style={styles.hint}>Email can’t be changed here.</Text>

          <View style={styles.actions}>
            <PrimaryButton label="Save profile" onPress={onSave} loading={saving} />
            <View style={styles.spacer} />
            <PrimaryButton
              label="Log out"
              onPress={onLogout}
              color="#EF4444"
              textColor={COLORS.white}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 48,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 36,
    color: COLORS.white,
    letterSpacing: -1,
    marginBottom: 20,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 16,
  },
  heroName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: COLORS.white,
    marginTop: 14,
  },
  heroEmail: {
    fontFamily: 'DMSans_400Regular',
    color: '#A3A3A3',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  emailLabel: {
    fontFamily: 'DMSans_500Medium',
    color: '#A3A3A3',
    marginBottom: 8,
    fontSize: 13,
  },
  emailBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  emailText: {
    fontFamily: 'DMSans_400Regular',
    color: '#D1D5DB',
    fontSize: 16,
  },
  hint: {
    fontFamily: 'DMSans_400Regular',
    color: '#737373',
    fontSize: 12,
    marginBottom: 16,
  },
  actions: {
    width: '100%',
  },
  spacer: {
    height: 12,
  },
});
