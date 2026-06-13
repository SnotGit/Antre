//======= CATEGORY =======

export interface RoverCategory {
  id: number;
  title: string;
  parentId: number | null;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

//======= ITEM =======

export interface RoverItem {
  id: number;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

//======= RESPONSES =======

export interface CategoriesResponse {
  categories: RoverCategory[];
}

export interface CategoryWithChildrenResponse {
  category: RoverCategory;
  children: RoverCategory[];
  entries: RoverItem[];
}
