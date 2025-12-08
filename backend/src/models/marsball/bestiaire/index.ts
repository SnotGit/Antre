//======= CATEGORY RESPONSES =======

export interface CategoriesResponse {
  categories: BestiaireCategory[];
}

export interface CategoryWithCreaturesResponse {
  category: BestiaireCategory;
  children: BestiaireCategory[];
  creatures: Creature[];
}

//======= CATEGORY ENTITIES =======

export interface BestiaireCategory {
  id: number;
  title: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

//======= CREATURE ENTITIES =======

export interface Creature {
  id: number;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

//======= FORM DATA =======

export interface CategoryFormData {
  title: string;
  parentId: number | null;
}

export interface CreatureFormData {
  title: string;
  categoryId: number;
}