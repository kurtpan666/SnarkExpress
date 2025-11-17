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
  submitter_username: string;
  vote_count: number;
  user_vote: number | null;
  tags: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}
