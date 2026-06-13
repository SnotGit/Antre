//======= CATEGORY =======

export interface TerraformarsCategory {
  id: number;
  title: string;
  parentId: number | null;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

//======= ITEM =======

export interface TerraformarsItem {
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
  categories: TerraformarsCategory[];
}

export interface CategoryWithChildrenResponse {
  category: TerraformarsCategory;
  children: TerraformarsCategory[];
  entries: TerraformarsItem[];
}
