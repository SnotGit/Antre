//======= CATEGORY =======

export interface RoverCategory {
  id: number;
  title: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

//======= ITEM =======

export interface RoverItem {
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
  category: RoverCategory;
  children: RoverCategory[];
  items: RoverItem[];
}

export interface CategoriesResponse {
  categories: RoverCategory[];
}
