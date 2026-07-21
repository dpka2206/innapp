export type Project = {
  id: string;
  name: string;
  slug: string;
  color: string;
  logoUrl?: string | null;
  description: string;
  platforms: string[];
  ownerId: string;
  alertEmails: string[];
  categories: string[];
  contentTypes: string[];
  role: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Post = {
  id: string;
  projectId: string;
  title: string;
  platforms: string[];
  contentType: string;
  category: string;
  scheduledAt: string;
  status: string;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; email: string } | null;
  caption: string;
  hashtags: string;
  assetLinks: string[];
  referenceLinks: string[];
  publishedUrl?: string | null;
  insights: Record<string, number>;
  approvalStatus: string;
  notes: string;
  createdBy: string;
};

export type Member = {
  id: string;
  email: string;
  role: string;
  status: string;
  user: { id: string; name: string; email: string } | null;
  inviteUrl?: string | null;
};
