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
  thumbnailUrl?: string;
  description?: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

//======= RESPONSES =======

export interface CategoriesResponse {
  categories: VaultCategory[];
}

export interface CategoryWithChildrenResponse {
  category: VaultCategory;
  children: VaultCategory[];
  entries: VaultEntry[];
}

//======= FORM DATA =======

export interface CategoryFormData {
  title: string;
  parentId: number | null;
}

export interface EntryFormData {
  title: string;
  categoryId: number;
}
