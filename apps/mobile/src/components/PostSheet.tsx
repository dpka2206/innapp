import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { format } from 'date-fns';
import { Post } from '../types';
import { COLORS, STATUS_COLORS } from '../theme';
import { Field, PrimaryButton, GhostButton, Chip } from './ui';

type Props = {
  visible: boolean;
  initial?: Partial<Post> | null;
  categories: string[];
  contentTypes: string[];
  platforms: string[];
  canEdit: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function PostSheet({
  visible,
  initial,
  categories,
  contentTypes,
  platforms,
  canEdit,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const { width } = useWindowDimensions();
  const [title, setTitle] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [hashtags, setHashtags] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [publishedUrl, setPublishedUrl] = React.useState('');
  const [status, setStatus] = React.useState('draft');
  const [category, setCategory] = React.useState(categories[0] || 'Educational');
  const [contentType, setContentType] = React.useState(contentTypes[0] || 'Post');
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>(['instagram']);
  const [dateStr, setDateStr] = React.useState('');
  const [timeStr, setTimeStr] = React.useState('10:00');
  const [reach, setReach] = React.useState('0');
  const [likes, setLikes] = React.useState('0');
  const [views, setViews] = React.useState('0');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!visible) return;
    const d = initial?.scheduledAt ? new Date(initial.scheduledAt) : new Date();
    setTitle(initial?.title || '');
    setCaption(initial?.caption || '');
    setHashtags(initial?.hashtags || '');
    setNotes(initial?.notes || '');
    setPublishedUrl(initial?.publishedUrl || '');
    setStatus(initial?.status || 'draft');
    setCategory(initial?.category || categories[0] || 'Educational');
    setContentType(initial?.contentType || contentTypes[0] || 'Post');
    setSelectedPlatforms(initial?.platforms?.length ? initial.platforms : platforms.slice(0, 1));
    setDateStr(format(d, 'yyyy-MM-dd'));
    setTimeStr(format(d, 'HH:mm'));
    setReach(String(initial?.insights?.reach ?? 0));
    setLikes(String(initial?.insights?.likes ?? 0));
    setViews(String(initial?.insights?.views ?? 0));
  }, [visible, initial, categories, contentTypes, platforms]);

  const dateChip = useMemo(() => {
    try {
      const d = new Date(`${dateStr}T${timeStr}:00`);
      return format(d, 'd MMM, EEE').toUpperCase();
    } catch {
      return dateStr;
    }
  }, [dateStr, timeStr]);

  async function handleSave() {
    setSaving(true);
    try {
      const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
      await onSave({
        title: title.trim() || 'Untitled',
        caption,
        hashtags,
        notes,
        publishedUrl: publishedUrl || null,
        status,
        category,
        contentType,
        platforms: selectedPlatforms,
        scheduledAt,
        insights: {
          reach: Number(reach) || 0,
          likes: Number(likes) || 0,
          views: Number(views) || 0,
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { maxWidth: Math.min(480, width - 24) }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>{title || 'New post'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{dateChip}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>
                {timeStr} · {status}
              </Text>
            </View>
          </View>

          {canEdit ? (
            <>
              <Field light label="Title / hook" value={title} onChangeText={setTitle} />
              <Field light label="Date (YYYY-MM-DD)" value={dateStr} onChangeText={setDateStr} />
              <Field light label="Time (HH:mm)" value={timeStr} onChangeText={setTimeStr} />
              <Text style={styles.section}>Platforms</Text>
              <View style={styles.row}>
                {platforms.map((p) => (
                  <Chip
                    tone="onLight"
                    key={p}
                    label={p}
                    active={selectedPlatforms.includes(p)}
                    onPress={() => togglePlatform(p)}
                    color={COLORS.blue}
                  />
                ))}
              </View>
              <Text style={styles.section}>Type</Text>
              <View style={styles.row}>
                {contentTypes.map((t) => (
                  <Chip
                    tone="onLight"
                    key={t}
                    label={t}
                    active={contentType === t}
                    onPress={() => setContentType(t)}
                    color={COLORS.black}
                  />
                ))}
              </View>
              <Text style={styles.section}>Category</Text>
              <View style={styles.row}>
                {categories.map((c) => (
                  <Chip
                    tone="onLight"
                    key={c}
                    label={c}
                    active={category === c}
                    onPress={() => setCategory(c)}
                    color={COLORS.blue}
                  />
                ))}
              </View>
              <Text style={styles.section}>Status</Text>
              <View style={styles.row}>
                {Object.keys(STATUS_COLORS).map((s) => (
                  <Chip
                    tone="onLight"
                    key={s}
                    label={s}
                    active={status === s}
                    onPress={() => setStatus(s)}
                    color={STATUS_COLORS[s].bg === '#FFFFFF' ? COLORS.black : STATUS_COLORS[s].bg}
                  />
                ))}
              </View>
              <Field light label="Caption" value={caption} onChangeText={setCaption} multiline />
              <Field light label="Hashtags" value={hashtags} onChangeText={setHashtags} />
              <Field light label="Published link" value={publishedUrl} onChangeText={setPublishedUrl} />
              <Field light label="Notes" value={notes} onChangeText={setNotes} multiline />
              <Text style={styles.section}>Insights</Text>
              <Field light label="Reach" value={reach} onChangeText={setReach} keyboardType="numeric" />
              <Field light label="Likes" value={likes} onChangeText={setLikes} keyboardType="numeric" />
              <Field light label="Views" value={views} onChangeText={setViews} keyboardType="numeric" />
              <PrimaryButton label="Save post" onPress={handleSave} loading={saving} />
              {initial?.id && onDelete ? (
                <GhostButton
                  light
                  label="Delete post"
                  onPress={async () => {
                    await onDelete();
                    onClose();
                  }}
                />
              ) : (
                <GhostButton light label="Cancel" onPress={onClose} />
              )}
            </>
          ) : (
            <>
              <Text style={styles.readBody}>{caption || 'No caption'}</Text>
              <GhostButton light label="Close" onPress={onClose} />
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 22,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  heading: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    color: COLORS.black,
    letterSpacing: -0.5,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 14 },
  metaChip: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaText: {
    fontFamily: 'DMSans_500Medium',
    color: '#374151',
    fontSize: 12,
  },
  section: {
    fontFamily: 'DMSans_700Bold',
    marginTop: 8,
    marginBottom: 8,
    color: COLORS.black,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  readBody: {
    fontFamily: 'DMSans_400Regular',
    color: COLORS.muted,
    marginBottom: 16,
  },
});
