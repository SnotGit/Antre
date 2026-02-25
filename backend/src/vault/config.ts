//======= VAULT CONTEXT CONFIG =======

export interface VaultContextConfig {
  key: string;
  categoryModel: string;
  entryModel: string;
  entryRelation: string;
  uploadDir: string;
  maxFileSize: number;
}

//======= CONTEXTS =======

export const vaultContexts: Record<string, VaultContextConfig> = {
  marsball: {
    key: 'marsball',
    categoryModel: 'marsballCategory',
    entryModel: 'marsballItem',
    entryRelation: 'items',
    uploadDir: 'uploads/marsball',
    maxFileSize: 500 * 1024
  },
  bestiaire: {
    key: 'bestiaire',
    categoryModel: 'bestiaireCategory',
    entryModel: 'creature',
    entryRelation: 'creatures',
    uploadDir: 'uploads/bestiaire',
    maxFileSize: 1024 * 1024
  },
  rover: {
    key: 'rover',
    categoryModel: 'roverCategory',
    entryModel: 'roverItem',
    entryRelation: 'items',
    uploadDir: 'uploads/rover',
    maxFileSize: 500 * 1024
  }
};
