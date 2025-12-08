//======= CATEGORY =======

export interface BestiaireCategory {
  id: number;
  title: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

//======= CREATURE =======

export interface Creature {
  id: number;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

//======= RESPONSE TYPES =======

export interface CategoriesResponse {
  categories: BestiaireCategory[];
}

export interface CategoryWithCreatures {
  category: BestiaireCategory;
  children: BestiaireCategory[];
  creatures: Creature[];
}