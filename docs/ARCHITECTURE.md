# ARCHITECTURE.md - L'Antre

## Vue d'ensemble

Plateforme roleplay Mars - 5 sections indépendantes, interface terminal sci-fi.

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                     Angular 20 SPA                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Chroniques│ │ Archives │ │ Marsball │ │Terraforms│       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│                   Core Services                              │
│            (Auth, HTTP, Guards, etc.)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────┴───────────────────────────────────┐
│                        BACKEND                               │
│                    Express + Prisma                          │
│                   PORT=3000                                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                     PostgreSQL                               │
│                     antre_db                                 │
└─────────────────────────────────────────────────────────────┘
```

## Structure Frontend détaillée

```
src/
├── app/
│   ├── app.component.html
│   ├── app.component.ts
│   └── app.module.ts
│
├── core/
│   ├── guards/
│   ├── interceptors/
│   └── services/
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   └── auth.ts, auth.html, auth.scss
│   │   └── services/
│   │       ├── auth.service.ts
│   │       ├── login.service.ts
│   │       ├── register.service.ts
│   │       └── token.service.ts
│   │
│   ├── chroniques/
│   │   ├── components/
│   │   │   ├── chroniques.ts, .html, .scss
│   │   │   ├── editors/
│   │   │   │   ├── edit-draft/
│   │   │   │   ├── edit-new/
│   │   │   │   └── edit-published/
│   │   │   ├── stories/
│   │   │   │   ├── draft-list/
│   │   │   │   ├── my-stories/
│   │   │   │   └── published-list/
│   │   │   └── story/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   │       ├── draft-stories.service.ts
│   │       ├── published-stories.service.ts
│   │       ├── save-stories.service.ts
│   │       ├── delete-stories.service.ts
│   │       └── confirmation-dialog.service.ts
│   │
│   ├── marsball/
│   │   ├── components/
│   │   │   ├── marsball-category/
│   │   │   └── new-item/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   │       ├── marsball-get.service.ts
│   │       ├── marsball-create.service.ts
│   │       ├── marsball-delete.service.ts
│   │       ├── marsball-update.service.ts
│   │       ├── new-item.service.ts
│   │       └── edit-item.service.ts
│   │
│   └── user/
│       ├── components/
│       │   └── my-likes/
│       └── services/
│           └── like.service.ts
│
├── shared/
│   ├── menus/
│   ├── services/
│   ├── styles/
│   │   ├── index.scss              # Point d'entrée
│   │   ├── main/
│   │   │   └── main-layout.scss
│   │   ├── navbar/
│   │   │   ├── logo.scss
│   │   │   └── hamburger.scss
│   │   ├── content/
│   │   │   ├── artefacts/
│   │   │   │   ├── buttons/
│   │   │   │   │   ├── _button.scss
│   │   │   │   │   └── credential-button.scss
│   │   │   │   ├── form-field/
│   │   │   │   ├── typing-effect/
│   │   │   │   ├── crop-box/
│   │   │   │   └── delete-cross/
│   │   │   ├── auth/
│   │   │   ├── chroniques/
│   │   │   └── marsball/
│   │   └── panels/
│   │       └── console-menu.scss
│   └── utilities/
│       ├── resolvers/
│       │   ├── chroniques-resolver.ts
│       │   └── home-resolver.ts
│       ├── typing-effect/
│       │   └── typing-effect.service.ts
│       ├── crop-images/
│       │   └── crop.service.ts
│       ├── file-name-formatter/
│       │   └── file-name-formatter.service.ts
│       └── confirmation-dialog/
│           ├── confirmation-dialog.ts
│           ├── confirmation-dialog.html
│           ├── confirmation-dialog.scss
│           └── confirmation-dialog.service.ts
│
└── main.ts
```

## Flux de données Chroniques

### Création histoire
```
[edit-new] → SaveStoriesService.createDraft() → POST /api/stories → brouillon (id)
     │
     └── Publication → SaveStoriesService.publish() → PUT /api/stories/:id
```

### Lecture histoire
```
URL: /chroniques/:username/:title
         │
         ▼
    [ChroniquesResolver] → titre→ID
         │
         ▼
    [story-reader] → affichage + navigation prev/next
```

## Services par feature

### Auth
| Service | Responsabilité |
|---------|---------------|
| `AuthService` | État connexion, isLoggedIn() |
| `LoginService` | POST login |
| `RegisterService` | POST register |
| `TokenService` | Gestion JWT |

### Chroniques
| Service | Responsabilité |
|---------|---------------|
| `DraftStoriesService` | CRUD brouillons |
| `PublishedStoriesService` | CRUD publiées |
| `SaveStoriesService` | Sauvegarde/publication |
| `DeleteStoriesService` | Suppression |
| `ConfirmationDialogService` | Dialogs confirmation |

### Marsball
| Service | Responsabilité |
|---------|---------------|
| `MarsballGetService` | GET catégories/items |
| `MarsballCreateService` | POST création |
| `MarsballDeleteService` | DELETE |
| `MarsballUpdateService` | PUT mise à jour |
| `NewItemService` | État création item |
| `EditItemService` | État édition item |

### Shared
| Service | Responsabilité |
|---------|---------------|
| `TypingEffectService` | Animation terminal |
| `CropService` | Recadrage images |
| `FileNameFormatterService` | Formatage noms fichiers |
| `ChroniquesResolver` | Résolution titre→ID |

## Principes clés

1. **Backend = ID only** : Pas de traitement strings côté serveur
2. **Frontend = URLs lisibles** : Resolvers transforment titre→ID
3. **Signals everywhere** : Pas d'observables sauf interop
4. **Standalone** : Pas de NgModule
5. **Features isolées** : Chaque section indépendante
6. **Mixins SCSS** : Réutilisation via @mixin/@include
