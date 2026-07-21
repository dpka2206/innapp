import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../src/api/client';
import { useAuth } from '../../../../src/store/auth';
import { Project } from '../../../../src/types';
import { COLORS, PLATFORMS } from '../../../../src/theme';
import {
  Chip,
  Field,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  BackButton,
} from '../../../../src/components/ui';

export default function SettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api<{ project: Project }>(`/projects/${id}`, { token }),
    enabled: !!token && !!id,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [alertEmails, setAlertEmails] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [categories, setCategories] = useState('');
  const [contentTypes, setContentTypes] = useState('');

  useEffect(() => {
    if (!data?.project) return;
    const p = data.project;
    setName(p.name);
    setDescription(p.description || '');
    setAlertEmails((p.alertEmails || []).join(', '));
    setPlatforms(p.platforms || []);
    setCategories((p.categories || []).join(', '));
    setContentTypes((p.contentTypes || []).join(', '));
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api(`/projects/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          name,
          description,
          platforms,
          alertEmails: alertEmails
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
          categories: categories
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
          contentTypes: contentTypes
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      if (Platform.OS === 'web') window.alert('Saved');
      else Alert.alert('Saved');
    },
    onError: (e: Error) => {
      if (Platform.OS === 'web') window.alert(e.message);
      else Alert.alert('Error', e.message);
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/projects/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      router.replace('/(app)');
    },
  });

  if (isLoading || !data?.project) {
    return (
      <Screen>
        <ActivityIndicator color={COLORS.lime} />
      </Screen>
    );
  }

  const canAdmin = data.project.role === 'owner' || data.project.role === 'admin';
  const isOwner = data.project.role === 'owner';

  return (
    <Screen maxWidth={720}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <BackButton label="Calendar" onPress={() => router.back()} />
        <Title>Settings</Title>
        <Subtitle>Brand details, platforms, and 30-min alert emails.</Subtitle>

        {!canAdmin ? (
          <Text style={styles.readonly}>You can view settings but only admins can edit.</Text>
        ) : null}

        <View style={styles.card}>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field label="Description" value={description} onChangeText={setDescription} multiline />
          <Text style={styles.label}>Platforms</Text>
          <View style={styles.row}>
            {PLATFORMS.map((p) => (
              <Chip
                key={p}
                label={p}
                active={platforms.includes(p)}
                onPress={() =>
                  canAdmin &&
                  setPlatforms((prev) =>
                    prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                  )
                }
                color={COLORS.blue}
              />
            ))}
          </View>
          <Field
            label="Alert emails (comma-separated)"
            value={alertEmails}
            onChangeText={setAlertEmails}
            placeholder="you@brand.com, client@brand.com"
          />
          <Field
            label="Categories (comma-separated)"
            value={categories}
            onChangeText={setCategories}
          />
          <Field
            label="Content types (comma-separated)"
            value={contentTypes}
            onChangeText={setContentTypes}
          />
          {canAdmin ? (
            <PrimaryButton label="Save settings" onPress={() => save.mutate()} loading={save.isPending} />
          ) : null}
          {isOwner ? (
            <PrimaryButton
              label="Delete project"
              onPress={() => {
                if (Platform.OS === 'web') {
                  if (window.confirm('Delete this project and all posts?')) remove.mutate();
                } else {
                  Alert.alert('Delete project?', 'This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
                  ]);
                }
              }}
              color="#EF4444"
              textColor={COLORS.white}
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderRadius: 28,
    padding: 18,
    marginTop: 16,
  },
  label: { color: COLORS.muted, fontFamily: 'DMSans_500Medium', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  readonly: {
    color: COLORS.muted,
    fontFamily: 'DMSans_400Regular',
    marginTop: 12,
  },
});
