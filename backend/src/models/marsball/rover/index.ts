//======= CATEGORY RESPONSES =======

export interface CategoriesResponse {
  categories: RoverCategory[];
}

export interface CategoryWithChildrenResponse {
  category: RoverCategory;
  children: RoverCategory[];
  items: RoverItem[];
}

//======= CATEGORY ENTITIES =======

export interface RoverCategory {
  id: number;
  title: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

//======= ITEM ENTITIES =======

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

//======= FORM DATA =======

export interface CategoryFormData {
  title: string;
  parentId: number | null;
}

export interface ItemFormData {
  title: string;
  categoryId: number;
}
