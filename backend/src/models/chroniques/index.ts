//======= STORY FORMS =======

export interface StoryFormData {
  title: string;
  content: string;
  originalStoryId?: number;
}

//======= STORY RESPONSES =======

export interface StoryResponse {
  story: {
    id: number;
    title: string;
    content: string;
  };
}

export interface StoriesResponse {
  stories: StoryCard[];
}

export interface DraftStoriesResponse {
  stories: DraftStory[];
}

export interface PublishedStoriesResponse {
  stories: PublishedStory[];
}

//======= STORY ENTITIES =======

export interface StoryReader {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  likes: number;
  isliked: boolean;
  user: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

export interface StoryCard {
  id: number;
  title: string;
  publishDate: string;
  user: {
    id: number;
    username: string;
    avatar: string;
  };
}

export interface EditStory {
  id: number;
  title: string;
  content: string;
}

export interface DraftStory {
  id: number;
  title: string;
  lastModified: string;
}

export interface PublishedStory {
  id: number;
  title: string;
  lastModified: string;
  likes: number;
}

export interface UserStories {
  id: number;
  title: string;
}