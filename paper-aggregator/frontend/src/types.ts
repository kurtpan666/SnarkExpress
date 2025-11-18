export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Paper {
  id: number;
  title: string;
  url: string;
  abstract: string | null;
  bib_entry: string | null;
  authors: string | null;
  published_date: string | null;
  submitter_id: number;
  created_at: string;
  updated_at?: string | null;
  submitter_username: string;
  vote_count: number;
  user_vote: number | null;
  tags: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Comment {
  id: number;
  paper_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  deleted?: number;
  created_at: string;
  updated_at?: string | null;
  username: string;
  replies?: Comment[];
  paper_title?: string;
}

export interface Badge {
  badge_type: string;
  earned_at: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserStats {
  submission_count: number;
  comment_count: number;
  vote_count: number;
  total_votes_received: number;
}

export interface UserProfile {
  user: {
    username: string;
    created_at: string;
  };
  stats: UserStats;
  badges: Badge[];
}

export interface Vote {
  vote_type: number;
  created_at: string;
  paper_id: number;
  paper_title: string;
  paper_url: string;
  submitter_username: string;
  tags: string[];
}

export interface NetworkNode {
  id: string;
  label: string;
  url: string;
  tags: string[];
  isTarget: boolean;
}

export interface NetworkEdge {
  from: string;
  to: string;
  label: string;
  weight: number;
}

export interface PaperNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  papers: T[];
  pagination: PaginationInfo;
}
