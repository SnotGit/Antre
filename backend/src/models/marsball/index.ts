//======= CATEGORY RESPONSES =======

export interface CategoriesResponse {
  categories: MarsballCategory[];
}

export interface CategoryWithChildrenResponse {
  category: MarsballCategory;
  children: MarsballCategory[];
  items: MarsballItem[];
}

//======= CATEGORY ENTITIES =======

export interface MarsballCategory {
  id: number;
  title: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

//======= ITEM ENTITIES =======

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

//======= FORM DATA =======

export interface CategoryFormData {
  title: string;
  parentId: number | null;
}

export interface ItemFormData {
  title: string;
  categoryId: number;
}