export const COLORS = {
  black: '#0A0A0A',
  lime: '#C8F53A',
  blue: '#2B5BFF',
  white: '#FFFFFF',
  bg: '#050505',
  muted: '#6B7280',
  cardMuted: '#F3F4F6',
  border: '#E5E7EB',
};

export const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  idea: { bg: '#FFFFFF', text: '#0A0A0A', border: '#0A0A0A' },
  draft: { bg: '#E8EEFF', text: '#0A0A0A', border: '#2B5BFF' },
  ready: { bg: '#2B5BFF', text: '#FFFFFF', border: '#2B5BFF' },
  scheduled: { bg: '#C8F53A', text: '#0A0A0A', border: '#C8F53A' },
  posted: { bg: '#0A0A0A', text: '#FFFFFF', border: '#0A0A0A' },
  archived: { bg: '#9CA3AF', text: '#FFFFFF', border: '#9CA3AF' },
};

export const PLATFORMS = ['instagram', 'linkedin', 'youtube', 'x'] as const;
export const POST_STATUSES = [
  'idea',
  'draft',
  'ready',
  'scheduled',
  'posted',
  'archived',
] as const;

export const ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;
