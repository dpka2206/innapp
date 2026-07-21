import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../src/api/client';
import { useAuth } from '../../../src/store/auth';
import { Project } from '../../../src/types';
import { COLORS, PLATFORMS } from '../../../src/theme';
import {
  Chip,
  Field,
  PrimaryButton,
  Screen,
  BackButton,
} from '../../../src/components/ui';
import { InitialAvatar, getInitial } from '../../../src/components/InitialAvatar';

const COLORS_PICK = ['#C8F53A', '#2B5BFF', '#FF5A36', '#A855F7', '#14B8A6', '#0A0A0A'];

export default function NewProjectScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS_PICK[0]);
  const [platforms, setPlatforms] = useState<string[]>(['instagram']);

  const mutation = useMutation({
    mutationFn: () =>
      api<{ project: Project }>('/projects', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, description, color, platforms }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      router.replace(`/(app)/project/${data.project.id}`);
    },
    onError: (e: Error) => {
      if (Platform.OS === 'web') window.alert(e.message);
      else Alert.alert('Error', e.message);
    },
  });

  function togglePlatform(p: string) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  return (
    <Screen maxWidth={640}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <BackButton label="Projects" onPress={() => router.back()} />
        <Text style={styles.kicker}>New brand</Text>
        <Text style={styles.title}>Create project</Text>
        <Text style={styles.sub}>Name it, pick a color, choose platforms.</Text>

        <View style={styles.preview}>
          <InitialAvatar name={name || 'P'} color={color} size={72} />
          <View style={{ flex: 1 }}>
            <Text style={styles.previewName}>{name.trim() || 'Project name'}</Text>
            <Text style={styles.previewMeta}>
              {platforms.join(' · ') || 'platforms'} · preview
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Field
            label="Brand / project name"
            value={name}
            onChangeText={setName}
            placeholder="EditCo Media"
          />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Optional notes about this brand"
          />
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {COLORS_PICK.map((c) => {
              const active = color === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorSwatch, { backgroundColor: c }, active && styles.colorActive]}
                >
                  <Text
                    style={[
                      styles.colorLetter,
                      { color: c === '#C8F53A' || c === '#14B8A6' ? '#0A0A0A' : '#FFFFFF' },
                    ]}
                  >
                    {getInitial(name || 'P')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.label}>Platforms</Text>
          <View style={styles.row}>
            {PLATFORMS.map((p) => (
              <Chip
                key={p}
                label={p}
                active={platforms.includes(p)}
                onPress={() => togglePlatform(p)}
                color={COLORS.blue}
              />
            ))}
          </View>
          <PrimaryButton
            label="Create & open calendar"
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!name.trim() || platforms.length === 0}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.lime,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 34,
    color: COLORS.white,
    letterSpacing: -1,
    marginTop: 6,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    color: '#A3A3A3',
    marginTop: 6,
    marginBottom: 18,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  previewName: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: COLORS.black },
  previewMeta: {
    fontFamily: 'DMSans_400Regular',
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  label: {
    color: '#A3A3A3',
    fontFamily: 'DMSans_500Medium',
    marginBottom: 8,
    marginTop: 4,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorActive: {
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  colorLetter: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
  },
});
