export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
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
  submitter_username?: string;
  vote_count?: number;
  user_vote?: number;
  tags?: string[];
}

export interface Tag {
  id: number;
  name: string;
  created_at: string;
}

export interface Vote {
  id: number;
  user_id: number;
  paper_id: number;
  vote_type: number;
  created_at: string;
}

export interface Comment {
  id: number;
  paper_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  username?: string;
  replies?: Comment[];
}

export interface PaperMetadata {
  title: string;
  abstract?: string;
  bib_entry?: string;
  authors?: string;
  published_date?: string;
}
