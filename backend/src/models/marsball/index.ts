//======= CATEGORY =======

export interface MarsballCategory {
  id: number;
  title: string;
  parentId: number | null;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

//======= ITEM =======

export interface MarsballItem {
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
  categories: MarsballCategory[];
}

export interface CategoryWithChildrenResponse {
  category: MarsballCategory;
  children: MarsballCategory[];
  entries: MarsballItem[];
}
