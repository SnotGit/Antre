export interface User {
  id: number;
  username: string;
  avatar: string;
  description?: string;
}

export interface Story {
  id: number;
  title: string;
  content: string;
  userId: number;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string;
  updatedAt?: string;
  slug?: string;
  originalStoryId?: number | null;
}

export interface PublicStory {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  likes: number;
  isliked: boolean;
  canLike: boolean;
  user: User;
}

export interface StoryCard {
  id: number;
  title: string;
  slug: string;
  publishDate: string;
  user: User;
}

export interface PrivateStory {
  id: number;
  title: string;
  content?: string;
  originalStoryId?: number | null;
  lastModified: string;
  likes?: number;
}

export interface EditStory extends PrivateStory {}

export interface PublicStoriesResponse {
  stories: StoryCard[];
}

export interface PrivateStoriesResponse {
  stories: PrivateStory[];
}
