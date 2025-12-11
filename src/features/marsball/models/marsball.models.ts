//======= CATEGORY =======

export interface MarsballCategory {
  id: number;
  title: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

//======= ITEM =======

export interface MarsballItem {
  id: number;
  title: string;
  imageUrl: string;
  description: string;
  thumbnailUrl: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

//======= RESPONSES =======

export interface CategoryWithChildren {
  category: MarsballCategory;
  children: MarsballCategory[];
  items: MarsballItem[];
}

export interface CategoriesResponse {
  categories: MarsballCategory[];
}
