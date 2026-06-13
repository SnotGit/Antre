//======= CATEGORY =======

export interface BestiaireCategory {
  id: number;
  title: string;
  parentId: number | null;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

//======= ITEM =======

export interface BestiaireItem {
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
  categories: BestiaireCategory[];
}

export interface CategoryWithChildrenResponse {
  category: BestiaireCategory;
  children: BestiaireCategory[];
  entries: BestiaireItem[];
}
