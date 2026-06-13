//======= CATEGORY =======

export interface VaultCategory {
  id: number;
  title: string;
  parentId: number | null;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

//======= ENTRY =======

export interface VaultEntry {
  id: number;
  title: string;
  imageUrl: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

//======= RESPONSES =======

export interface CategoryWithChildren {
  category: VaultCategory;
  children: VaultCategory[];
  entries: VaultEntry[];
}

export interface CategoriesResponse {
  categories: VaultCategory[];
}
