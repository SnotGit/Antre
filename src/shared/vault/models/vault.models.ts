//======= CATEGORY =======

export interface VaultCategory {
  id: number;
  title: string;
  parentId: number | null;
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

//======= CONTEXT CONFIG =======

export interface VaultContextConfig {
  key: string;
  title: string;
  entryLabel: string;
  newEntryTitle: string;
  cropInitSize: number;
  cropInitX: number;
  cropInitY: number;
  cropDefaultSize: number;
  cropDefaultX: number;
  cropDefaultY: number;
  parentRoute: string;
  subSections?: Array<{ title: string; route: string }>;
}

//======= CONTEXT CONFIGS =======

export const VAULT_CONTEXTS: Record<string, VaultContextConfig> = {
  marsball: {
    key: 'marsball',
    title: 'Marsball',
    entryLabel: 'Item',
    newEntryTitle: 'Nouvel Item',
    cropInitSize: 58,
    cropInitX: 29,
    cropInitY: 15,
    cropDefaultSize: 60,
    cropDefaultX: 0,
    cropDefaultY: 0,
    parentRoute: '/marsball',
    subSections: [
      { title: 'Bestiaire', route: '/marsball/bestiaire' },
      { title: 'Rover', route: '/marsball/rover' }
    ]
  },
  bestiaire: {
    key: 'bestiaire',
    title: 'Bestiaire',
    entryLabel: 'Créature',
    newEntryTitle: 'Nouvelle Créature',
    cropInitSize: 200,
    cropInitX: 20,
    cropInitY: 20,
    cropDefaultSize: 200,
    cropDefaultX: 20,
    cropDefaultY: 20,
    parentRoute: '/marsball/bestiaire'
  },
  rover: {
    key: 'rover',
    title: 'Rover',
    entryLabel: 'Item',
    newEntryTitle: 'Nouvel Item',
    cropInitSize: 58,
    cropInitX: 29,
    cropInitY: 15,
    cropDefaultSize: 60,
    cropDefaultX: 0,
    cropDefaultY: 0,
    parentRoute: '/marsball/rover'
  }
};
